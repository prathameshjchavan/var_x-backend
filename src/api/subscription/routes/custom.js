module.exports = {
  routes: [
    {
      method: "GET",
      path: "/subscriptions/me",
      handler: "subscription.userSubscriptions",
      config: {
        policies: [],
      },
    },
  ],
};
