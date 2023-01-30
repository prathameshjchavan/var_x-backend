"use strict";

/**
 * review service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::review.review", ({ strapi }) => ({
  async average(id) {
    const product = await strapi.entityService.findOne(
      "api::product.product",
      id,
      { populate: { reviews: true } }
    );
    const total = product.reviews.reduce(
      (total, review) => total + review.rating,
      0
    );
    const average = !!product.reviews.length
      ? total / product.reviews.length
      : 0;

    await strapi.entityService.update("api::product.product", id, {
      data: { rating: Math.round(average * 2) / 2 },
    });
  },
}));
