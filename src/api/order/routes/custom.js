module.exports = {
  routes: [
    {
      method: "GET",
      path: "/orders/history",
      handler: "order.history",
      config: {
        policies: [],
      },
    },
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
