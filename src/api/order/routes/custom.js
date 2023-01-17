module.exports = {
  routes: [
    {
      method: "POST",
      path: "/orders/place",
      handler: "order.place",
      config: {
        policies: [],
      },
    },
  ],
};
