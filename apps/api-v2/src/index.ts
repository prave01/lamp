import { Hono } from "hono";
import { getConfig, validateENVs } from "./config";
import { checkDatabaseConnection } from "./db";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

async function bootStrap() {
  // validate all envs
  validateENVs(process.env);

  // check db connection
  await checkDatabaseConnection();

  // get server config
  const serverConfig = getConfig("server");

  const server = Bun.serve({
    port: serverConfig.PORT,
    fetch: app.fetch,
  });

  console.log("Server is running at", server.port);
}

bootStrap();
