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
    } = ctx.request.body;
    let orderCustomer;

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
      },
      populate: "user",
    });

    order = await this.sanitizeOutput(order, ctx);

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
      (serverTotal * 1.075 + shippingValid.price).toFixed(2) !== total
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
        const intent = await stripe.paymentIntents.create(
          {
            amount: total * 100,
            currency: "usd",
            customer: ctx.state.user ? ctx.state.user.stripeID : undefined,
            receipt_email: email,
          },
          { idempotencyKey }
        );

        return this.transformResponse({
          client_secret: intent.client_secret,
          intentID: intent.id,
        });
      }
    }
  },
}));
