const stripe = require("stripe")(process.env.STRIPE_SK);

module.exports = {
  "0 8 * * *": async ({ strapi }) => {
    let subscriptions = await strapi.entityService.findMany(
      "api::subscription.subscription",
      {
        filters: {
          next_delivery: new Date().toISOString(),
        },
        populate: { user: true, variant: true },
      }
    );
    subscriptions = subscriptions.map(async (subscription) => {
      const variant = await strapi.entityService.findOne(
        "api::variant.variant",
        subscription.variant.id,
        {
          populate: { product: true },
        }
      );

      subscription.variant = variant;

      return subscription;
    });

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

          const order = await strapi.entityService.create("api::order.order", {
            data: {
              shippingAddress: subscription.shippingAddress,
              billingAddress: subscription.billingAddress,
              shippingInfo: subscription.shippingInfo,
              billingInfo: subscription.billingInfo,
              shippingOption: { label: "subscription", price: 0 },
              subtotal: subscription.variant.price,
              tax: subscription.variant.price * 0.075,
              items: [
                {
                  variant: subscription.variant,
                  name: subscription.name,
                  qty: subscription.quantity,
                  stock: subscription.variant.quantity,
                  product: subscription.variant.product,
                },
              ],
              transaction: paymentIntent.id,
              paymentMethod: subscription.paymentMethod,
              user: subscription.user.id,
              subscription: subscription.id,
            },
          });
          const confirmation = await strapi
            .service("api::order.order")
            .confirmationEmail(order);
          const frequencies = await strapi
            .service("api::order.order")
            .frequency();

          await strapi.plugins["email"].services.email.send({
            to: subscription.billingInfo.email,
            subject: "VAR_X Order Confirmation",
            html: confirmation,
          });

          const frequency = frequencies.find(
            (option) => option.value === subscription.frequency
          );

          await strapi.entityService.update(
            "api::subscription.subscription",
            subscription.id,
            {
              data: { next_delivery: frequency.delivery() },
            }
          );
        } catch (error) {
          // Notify customer payment failed, and prompt them to enter new information
          console.log(error);
        }
      })
    );
  },
};
