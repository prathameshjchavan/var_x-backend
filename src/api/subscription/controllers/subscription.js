"use strict";

/**
 * subscription controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::subscription.subscription",
  ({ strapi }) => ({
    async userSubscriptions(ctx) {
      const subscriptions = await strapi.entityService.findMany(
        "api::subscription.subscription",
        {
          filters: { user: ctx.state.user.id },
          populate: { orders: true, variant: true },
        }
      );

      ctx.send(subscriptions, 200);
    },
  })
);
