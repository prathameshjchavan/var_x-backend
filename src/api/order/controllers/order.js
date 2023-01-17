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
      billingAddress,
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
        if (serverItem.quantity < clientItem.qty) {
          unavailable.push({
            id: clientItem.variant.id,
            qty: serverItem.quantity,
          });
        }
        serverTotal += serverItem.price * clientItem.qty;

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
      return ctx.badRequest("", { error: "Invalid Cart" });
    } else if (unavailable.length > 0) {
      return ctx.conflict("", { unavailable });
    } else {
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
        },
        populate: "user",
      });

      order = await this.sanitizeOutput(order, ctx);

      return this.transformResponse(order);
    }
  },
}));
