const stripe = require("stripe")(process.env.STRIPE_SK);

module.exports = {
  "0 8 * * *": async ({ strapi }) => {
    const subscriptions = await strapi.entityService.findMany(
      "api::subscription.subscription",
      {
        filters: {
          next_delivery: new Date().toISOString(),
        },
        populate: { user: true, variant: true },
      }
    );

    await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: subscription.user.stripeID,
          type: "card",
        });
        const paymentMethod = paymentMethods.data.find(
          (method) => method.card.last4 === subscription.paymentMethod.last4
        );

        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(subscription.variant.price * 1.075 * 100),
            currency: "usd",
            customer: subscription.user.stripeID,
            payment_method: paymentMethod.id,
            off_session: true,
            confirm: true,
          });
        } catch (error) {
          // Notify customer payment failed, and prompt them to enter new information
          console.log(error);
        }
      })
    );
  },
};
