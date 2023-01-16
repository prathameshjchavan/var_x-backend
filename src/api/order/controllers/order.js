"use strict";

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

const GUEST_ID = 27;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async place(ctx) {
    const {
      shippingAddress,
      billingAddres,
      shippingInfo,
      billingInfo,
      shippingOption,
      subtotal,
      tax,
      total,
      items,
    } = ctx.request.body;
    let orderCustomer;
    let serverTotal = 0;
    let unavailable = [];
    let invalid = false;

    if (ctx.state.user) {
      orderCustomer = ctx.state.user.id;
    } else {
      orderCustomer = GUEST_ID;
    }

    await Promise.all(
      items.map(async (clientItem) => {
        const serverItem = await strapi
          .service("api::order.order")
          .findOne({ id: clientItem.variant.id });

        if (serverItem.quantity < clientItem.qty) {
          unavailable.push({ id: serverItem.id, qty: serverItem.quantity });
        } else {
          serverTotal += serverItem.price * clientItem.qty;

          await strapi
            .service("api::variant.variant")
            .update(
              { id: clientItem.variant.id },
              { quantity: serverItem.quantity - clientItem.qty }
            );
        }
      })
    );

    // only executed after everything in Promise.all has completed SUCCESSFULLY
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
      // invalid cart
    }
  },
}));
