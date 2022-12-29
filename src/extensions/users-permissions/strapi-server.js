module.exports = (plugin) => {
  plugin.controllers.user.setSettings = async (ctx) => {
    if (!ctx.state.user || !ctx.state.user.id) {
      return (ctx.response.status = 401);
    }

    const { id, contactInfo, locations } = ctx.state.user;
    const { details, detailSlot, location, locationSlot } = ctx.request.body;

    let newInfo = [...contactInfo];
    let newLocations = [...locations];

    if (typeof details !== "undefined" && typeof detailSlot !== "undefined") {
      newInfo[detailSlot] = details;
    }
    if (
      typeof location !== "undefined" &&
      typeof locationSlot !== "undefined"
    ) {
      newLocations[locationSlot] = location;
    }

    const updatedData = {
      contactInfo: newInfo,
      locations: newLocations,
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
