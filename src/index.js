"use strict";

const stripe = require("stripe")(process.env.STRIPE_SK);

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      models: ["plugin::users-permissions.user"],
      beforeCreate: async (event) => {
        const { data } = event.params;

        const customer = await stripe.customers.create({
          name: data.name,
          email: data.email,
        });

        data.stripeID = customer.id;
      },
    });
  },
};
