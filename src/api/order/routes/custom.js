module.exports = {
  routes: [
    {
      method: "POST",
      path: "/orders/removeCard",
      handler: "order.removeCard",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/orders/finalize",
      handler: "order.finalize",
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
