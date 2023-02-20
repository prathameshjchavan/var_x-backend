"use strict";

/**
 * subscription controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::subscription.subscription",
  ({ strapi }) => ({
    async userSubscriptions(ctx) {
      let subscriptions = await strapi.entityService.findMany(
        "api::subscription.subscription",
        {
          filters: { user: ctx.state.user.id },
          populate: { orders: true, variant: true },
        }
      );

      subscriptions = await Promise.all(
        subscriptions.map(async (subscription) => {
          const variant = await strapi.entityService.findOne(
            "api::variant.variant",
            subscription.variant.id,
            {
              populate: { images: true },
            }
          );
          variant.images = variant.images.map((image) => ({ url: image.url }));

          return { ...subscription, variant };
        })
      );

      ctx.send(subscriptions, 200);
    },
  })
);
