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

    await strapi
      .query("plugin::users-permissions.user")
      .update({
        where: { id },
        data: updatedData,
      })
      .then((res) => {
        ctx.response.status = 200;
      });
  };

  plugin.routes["content-api"].routes.push({
    method: "PUT",
    path: "/user/set-settings",
    handler: "user.setSettings",
    config: {
      prefix: "",
      policies: [],
    },
  });

  return plugin;
};
