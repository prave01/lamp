import { Hono } from "hono";
import { getConfig, validateENVs } from "./config";
import { checkDatabaseConnection, db } from "./db";
import { Server } from "socket.io";
import { Server as BunEngine, WebSocketData } from "@socket.io/bun-engine";
import {
  createSessionSchema,
  sessionMetaDataSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@repo/shared";
import { generateText, runLoop } from "./llm/llm.openai";
import z, { parse } from "zod";
import { messageTable, sessionTable } from "./db/db.schema";
import { DbContext } from "./llm/context/db.context";
import OpenAI from "openai";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  cors: {
    origin: "*",
  },
});

const engine = new BunEngine({
  path: "/socket.io/",
});

io.bind(engine);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("session:create", async (data) => {
    const {
      success,
      error,
      data: parsedData,
    } = createSessionSchema.safeParse(data);

    if (!success) {
      return socket.emit("session:error", {
        message: "Invalid payload",
        errors: z.flattenError(error).fieldErrors,
      });
    }

    const response = await generateText(
      parsedData.query,
      "Generate proper session metadata, not so many words but easily understandable title and description",
      "openai/gpt-4o-mini",
      sessionMetaDataSchema,
    );

    const [session] = await db
      .insert(sessionTable)
      .values({
        title: response.title,
        description: response.descrption,
      })
      .returning({
        id: sessionTable.id,
      });

    await db.insert(messageTable).values({
      sessionId: session.id,
      type: "message",
      role: "user",
      content: parsedData.query,
    });

    socket.emit("session:created", {
      sessionId: session.id,
      title: response.title,
      descrption: response.descrption,
    });
  });

  socket.on("session:run", async ({ sessionId, query }) => {
    const session = await db.query.sessionTable.findFirst({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new Error(`No session found for ${sessionId}`);
    }

    await runLoop(
      query,
      "Be an helpful assistant",
      "openai/gpt-4o-mini",
      new DbContext(session.id),
      (event: OpenAI.Responses.ResponseStreamEvent) => {
        if (event.type === "response.output_text.delta") {
          socket.emit("session:run:event", {
            text_delta: event.delta,
          });
        }
      },
    );
  });
});

const { websocket, fetch: EngineFetch } = engine.handler();

async function bootStrap() {
  // validate all envs
  validateENVs(process.env);

  // check db connection
  await checkDatabaseConnection();

  // get server config
  const serverConfig = getConfig("server");

  const server = Bun.serve({
    port: serverConfig.PORT,
    idleTimeout: 30,

    fetch(req, server) {
      const { pathname } = new URL(req.url);

      if (pathname.startsWith("/socket.io/")) {
        return EngineFetch(req, server);
      }

      return app.fetch(req, server);
    },

    websocket,
  });

  console.log("Server is running at", server.port);
}

bootStrap();
