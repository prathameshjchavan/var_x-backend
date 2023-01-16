// path: ./src/api/restaurant/routes/custom-restaurant.js

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
