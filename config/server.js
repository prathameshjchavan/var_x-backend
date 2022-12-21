module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: env("", "https://1794-183-87-49-54.ngrok.io"),
  app: {
    keys: env.array("APP_KEYS"),
  },
});
