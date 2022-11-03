module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("DATABASE_HOST_LOCAL"),
      port: env("DATABASE_PORT_LOCAL"),
      database: env("DATABASE_NAME_LOCAL"),
      user: env("DATABASE_USERNAME_LOCAL"),
      password: env("DATABASE_PASSWORD_LOCAL"),
      schema: env("DATABASE_SCHEMA_LOCAL"),
      // ssl: {
      //   rejectUnauthorized: env.bool("DATABASE_SSL_SELF", true),
      // },
    },
    debug: false,
  },
});
