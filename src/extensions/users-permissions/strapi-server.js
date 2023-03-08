const utils = require("@strapi/utils");
const { sanitize } = utils;

const sanitizeOutput = (user, ctx) => {
  const schema = strapi.getModel("plugin::users-permissions.user");
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(user, schema, { auth });
};

module.exports = (plugin) => {
  plugin.controllers.user.setSettings = async (ctx) => {
    if (!ctx.state.user || !ctx.state.user.id) {
      return (ctx.response.status = 401);
    }

    const { id, contactInfo, locations, paymentMethods } = ctx.state.user;
    const {
      details,
      detailSlot,
      location,
      locationSlot,
      paymentMethod,
      paymentMethodSlot,
    } = ctx.request.body;

    let newInfo = [...contactInfo];
    let newLocations = [...locations];
    let newPaymentMethods = [...paymentMethods];

    if (typeof details !== "undefined" && typeof detailSlot !== "undefined") {
      newInfo[detailSlot] = details;
    } else if (
      typeof details === "undefined" &&
      typeof detailSlot !== "undefined"
    ) {
      newInfo[detailSlot] = { name: "", email: "", phone: "" };
    }
    if (
      typeof location !== "undefined" &&
      typeof locationSlot !== "undefined"
    ) {
      newLocations[locationSlot] = location;
    } else if (
      typeof location === "undefined" &&
      typeof locationSlot !== "undefined"
    ) {
      newLocations[locationSlot] = { street: "", zip: "", city: "", state: "" };
    }
    if (
      typeof paymentMethod !== "undefined" &&
      typeof paymentMethodSlot !== "undefined"
    ) {
      newPaymentMethods[paymentMethodSlot] = paymentMethod;
    } else if (
      typeof paymentMethod === "undefined" &&
      typeof paymentMethodSlot !== "undefined"
    ) {
      newPaymentMethods[paymentMethodSlot] = { brand: "", last4: "" };
    }

    const updatedData = {
      contactInfo: newInfo,
      locations: newLocations,
      paymentMethods: newPaymentMethods,
    };

    const response = await strapi
      .query("plugin::users-permissions.user")
      .update({
        select: [
          "id",
          "name",
          "username",
          "email",
          "provider",
          "confirmed",
          "blocked",
          "createdAt",
          "updatedAt",
          "paymentMethods",
          "contactInfo",
          "locations",
        ],
        where: { id },
        data: updatedData,
      });

    return response;
  };
  plugin.controllers.user.me = async (ctx) => {
    const authUser = ctx.state.user;
    const { query } = ctx;

    if (!authUser) {
      return ctx.unauthorized();
    }

    let user = await strapi
      .plugin("users-permissions")
      .service("user")
      .fetch(authUser.id, query);
    user = await sanitizeOutput(user, ctx);
    const favorites = await strapi.entityService.findMany(
      "api::favorite.favorite",
      {
        filters: {
          user: authUser.id,
        },
        populate: { variant: true },
      }
    );
    const subscriptions = await strapi.entityService.findMany(
      "api::subscription.subscription",
      {
        filters: {
          user: authUser.id,
        },
        populate: { variant: true },
      }
    );
    user.favorites = favorites.map((favorite) => ({
      id: favorite.id,
      variant: favorite.variant.id,
    }));
    user.subscriptions = subscriptions;

    ctx.body = user;
  };

  plugin.routes["content-api"].routes.push({
    method: "PUT",
    path: "/user/settings",
    handler: "user.setSettings",
    config: {
      prefix: "",
      policies: [],
    },
  });

  return plugin;
};
