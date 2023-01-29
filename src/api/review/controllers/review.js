"use strict";

/**
 * review service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::review.review", ({ strapi }) => ({
  async create(ctx) {
    const { body } = ctx.request;
    let entity;

    body.user = ctx.state.user.id;
    entity = await strapi.entityService.create("api::review.review", body);

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
  async update(ctx) {
    const { id } = ctx.params;
    let entity;

    const review = await strapi.entityService.find("api::review.review", {
      id,
      user: ctx.state.user.id,
    });

    if (!review) {
      return ctx.unauthorized(`You can't update this entry`);
    }

    entity = await strapi.entityService.update(
      "api::review.review",
      id,
      ctx.request.body
    );

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
  async delete(ctx) {
    const { id } = ctx.params;

    const review = await strapi.entityService.find("api::review.review", {
      id,
      user: ctx.state.user.id,
    });

    if (!review) {
      return ctx.unauthorized(`You can't delete this entry`);
    }

    const response = await super.delete(ctx);

    return response;
  },
}));
