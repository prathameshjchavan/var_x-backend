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
    {
      method: "POST",
      path: "/orders/process",
      handler: "order.process",
      config: {
        policies: [],
      },
    },
  ],
};
