"use strict";

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const stripe = require("stripe")(process.env.STRIPE_SK);

const GUEST_ID = 27;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async finalize(ctx) {
    const {
      shippingAddress,
      billingAddress,
      shippingInfo,
      billingInfo,
      shippingOption,
      subtotal,
      tax,
      total,
      items,
      transaction,
      paymentMethod,
      saveCard,
      cardSlot,
    } = ctx.request.body;
    let orderCustomer;
    const frequencies = await strapi.service("api::order.order").frequency();

    if (ctx.state.user) {
      orderCustomer = ctx.state.user.id;
    } else {
      orderCustomer = GUEST_ID;
    }

    await Promise.all(
      items.map(async (clientItem) => {
        const serverItem = await strapi.entityService.findOne(
          "api::variant.variant",
          clientItem.variant.strapi_id
        );

        if (clientItem.subscription) {
          const frequency = frequencies.find(
            (option) => option.label === clientItem.subscription
          );
          const data = {
            data: {
              user: orderCustomer,
              variant: clientItem.variant.strapi_id,
              name: clientItem.name,
              frequency: frequency.value,
              status: "active",
              last_delivery: new Date().toISOString().split("T")[0],
              next_delivery: frequency.delivery().toISOString().split("T")[0],
              quantity: clientItem.qty,
              paymentMethod,
              shippingAddress,
              billingAddress,
              shippingInfo,
              billingInfo,
            },
          };
          await strapi.entityService.create(
            "api::subscription.subscription",
            data
          );
        }

        await strapi.entityService.update(
          "api::variant.variant",
          clientItem.variant.strapi_id,
          {
            data: {
              quantity: serverItem.quantity - clientItem.qty,
            },
          }
        );
      })
    );

    if (saveCard && ctx.state.user) {
      let newMethods = [...ctx.state.user.paymentMethods];

      newMethods[cardSlot] = paymentMethod;

      await strapi.query("plugin::users-permissions.user").update({
        where: { id: orderCustomer },
        data: { paymentMethods: newMethods },
      });
    }

    let order = await strapi.entityService.create("api::order.order", {
      data: {
        shippingAddress,
        billingAddress,
        shippingInfo,
        billingInfo,
        shippingOption,
        subtotal,
        tax,
        total,
        items,
        user: orderCustomer,
        transaction,
        paymentMethod,
      },
    });

    const confirmation = await strapi
      .service("api::order.order")
      .confirmationEmail(order);

    await strapi.plugins["email"].services.email.send({
      to: order.billingInfo.email,
      subject: "VAR_X Order Confirmation",
      html: confirmation,
    });

    return this.transformResponse(order);
  },
  async process(ctx) {
    const {
      items,
      total,
      shippingOption,
      idempotencyKey,
      storedIntent,
      email,
      savedCard,
    } = ctx.request.body;
    let serverTotal = 0;
    let unavailable = [];

    await Promise.all(
      items.map(async (clientItem) => {
        const serverItem = await strapi.entityService.findOne(
          "api::variant.variant",
          clientItem.variant.strapi_id
        );
        if (serverItem.quantity < clientItem.qty) {
          unavailable.push({
            id: clientItem.variant.id,
            qty: serverItem.quantity,
          });
        }
        serverTotal += serverItem.price * clientItem.qty;
      })
    );

    const shippingOptions = [
      {
        label: "FREE SHIPPING",
        price: 0,
      },
      {
        label: "2-DAY SHIPPING",
        price: 9.99,
      },
      {
        label: "OVERNIGHT SHIPPING",
        price: 29.99,
      },
    ];
    const shippingValid = shippingOptions.find(
      (option) =>
        option.label === shippingOption.label &&
        option.price === shippingOption.price
    );

    if (
      shippingValid === undefined ||
      ((serverTotal + shippingValid.price) * 1.075).toFixed(2) !== total
    ) {
      return ctx.badRequest("", { error: "Invalid Cart" });
    } else if (unavailable.length > 0) {
      return ctx.conflict("", { unavailable });
    } else {
      if (storedIntent) {
        const update = await stripe.paymentIntents.update(
          storedIntent,
          {
            amount: total * 100,
          },
          { idempotencyKey }
        );

        return this.transformResponse({
          client_secret: update.client_secret,
          intentID: update.id,
        });
      } else {
        let saved;

        if (savedCard) {
          const stripeMethods = await stripe.paymentMethods.list({
            customer: ctx.state.user.stripeID,
            type: "card",
          });

          saved = stripeMethods.data.find(
            (method) => method.card.last4 === savedCard
          );
        }

        const intent = await stripe.paymentIntents.create(
          {
            amount: total * 100,
            currency: "usd",
            customer: ctx.state.user ? ctx.state.user.stripeID : undefined,
            receipt_email: email,
            payment_method: saved ? saved.id : undefined,
          },
          { idempotencyKey }
        );

        return this.transformResponse({
          client_secret: intent.client_secret,
          intentID: intent.id,
          savedMethodID: saved ? saved.id : null,
        });
      }
    }
  },
  async removeCard(ctx) {
    const { card } = ctx.request.body;
    const { stripeID } = ctx.state.user;

    const stripeMethods = await stripe.paymentMethods.list({
      customer: stripeID,
      type: "card",
    });

    const stripeCard = stripeMethods.data.find(
      (method) => method.card.last4 === card
    );

    await stripe.paymentMethods.detach(stripeCard.id);

    let newMethods = [...ctx.state.user.paymentMethods];
    const cardSlot = newMethods.findIndex((method) => method.last4 === card);
    newMethods[cardSlot] = { brand: "", last4: "" };
    const newUser = await strapi
      .query("plugin::users-permissions.user")
      .update({
        select: [
          "id",
          "name",
          "username",
          "email",
          "provider",
          "confirmed",
          "blocked",
          "createdAt",
          "updatedAt",
          "paymentMethods",
          "contactInfo",
          "locations",
        ],
        where: { id: ctx.state.user.id },
        data: { paymentMethods: newMethods },
      });

    return newUser;
  },
  async history(ctx) {
    const orders = await strapi.db.query("api::order.order").findMany({
      where: { user: ctx.state.user.id },
    });

    return this.transformResponse({ orders });
  },
  async savePaymentMethod(ctx) {
    const { paymentMethod, customer } = ctx.request.body;

    const response = await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.stripeID,
    });

    ctx.send(response);
  },
}));
