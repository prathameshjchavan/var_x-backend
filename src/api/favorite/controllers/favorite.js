"use strict";

/**
 * favorite controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const utils = require("@strapi/utils");
const { sanitize } = utils;

const sanitizeOutput = (review, ctx) => {
  const schema = strapi.getModel("api::favorite.favorite");
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(review, schema, { auth });
};

module.exports = createCoreController(
  "api::favorite.favorite",
  ({ strapi }) => ({
    async create(ctx) {
      const { body } = ctx.request;
      body.user = ctx.state.user.id;

      const entity = await strapi.entityService.create(
        "api::favorite.favorite",
        { data: body }
      );

      const sanitizedData = await sanitizeOutput(entity, ctx);
      ctx.send(sanitizedData);
    },
    async delete(ctx) {
      const { id } = ctx.params;

      const favorite = await strapi.entityService.findOne(
        "api::favorite.favorite",
        id,
        { populate: { user: true } }
      );

      if (!favorite || favorite.user.id !== ctx.state.user.id) {
        return ctx.unauthorized(`You can't delete this entry`);
      }

      await strapi.entityService.delete("api::favorite.favorite", id);

      ctx.send("Deleted");
    },
  })
);
