module.exports = ({ env }) => ({
  // ...
  email: {
    config: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"),
      },
      settings: {
        defaultFrom: "prathamesh.chavan216@gmail.com",
        defaultReplyTo: "prathamesh.chavan216@gmail.com",
        testAddress: "prathamesh.chavan216@gmail.com",
      },
    },
  },
  // ...
});
