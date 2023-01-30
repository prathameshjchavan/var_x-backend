"use strict";

/**
 * review service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const utils = require("@strapi/utils");
const { sanitize } = utils;

const sanitizeOutput = (review, ctx) => {
  const schema = strapi.getModel("api::review.review");
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(review, schema, { auth });
};

module.exports = createCoreService("api::review.review", ({ strapi }) => ({
  async create(ctx) {
    const { body } = ctx.request;
    let entity;

    body.user = ctx.state.user.id;
    entity = await strapi.entityService.create("api::review.review", {
      data: body,
      populate: {
        product: true,
      },
    });

    await strapi.service("api::review.review").average(entity.product.id);

    const sanitizedData = await sanitizeOutput(entity, ctx);

    ctx.send(sanitizedData);
  },
  async update(ctx) {
    const { id } = ctx.params;
    let entity;

    const review = await strapi.entityService.findOne(
      "api::review.review",
      id,
      { populate: { user: true } }
    );

    if (!review || review.user.id !== ctx.state.user.id) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    entity = await strapi.entityService.update("api::review.review", id, {
      data: ctx.request.body,
      populate: { product: true },
    });

    await strapi.service("api::review.review").average(entity.product.id);

    const sanitizedData = await sanitizeOutput(entity, ctx);

    ctx.send(sanitizedData);
  },
  async delete(ctx) {
    const { id } = ctx.params;

    const review = await strapi.entityService.findOne(
      "api::review.review",
      id,
      { populate: { user: true } }
    );

    if (!review || review.user.id !== ctx.state.user.id) {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    const entity = await strapi.entityService.delete("api::review.review", id, {
      populate: { product: true },
    });

    await strapi.service("api::review.review").average(entity.product.id);

    ctx.send("Deleted");
  },
}));
