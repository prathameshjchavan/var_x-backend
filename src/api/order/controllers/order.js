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

    if (ctx.state.user) {
      orderCustomer = ctx.state.user.id;
    } else {
      orderCustomer = GUEST_ID;
    }

    await Promise.all();

    // only executed after everything in Promise.all has completed SUCCESSFULLY
  },
}));
