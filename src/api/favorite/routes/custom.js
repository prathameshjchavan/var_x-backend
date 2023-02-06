module.exports = {
  routes: [
    {
      method: "GET",
      path: "/favorites/userFavorites",
      handler: "favorite.userFavorites",
      config: {
        policies: [],
      },
    },
  ],
};
