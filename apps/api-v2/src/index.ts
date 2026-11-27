import { Hono } from "hono";
import { getConfig, validateENVs } from "./config";
import { checkDatabaseConnection, db } from "./db";
import { Server } from "socket.io";
import { Server as BunEngine } from "@socket.io/bun-engine";
import {
  createSessionSchema,
  sessionMetaDataSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@repo/shared";
import { generateText, pending, runLoop } from "./llm/llm.openai";
import z from "zod";
import { messageTable, sessionTable } from "./db/db.schema";
import { DbContext } from "./llm/context/db.context";
import OpenAI from "openai";
import { getSession, listSessionMessages, listSessions } from "./libs/db";
import { eq } from "drizzle-orm";
import { startDockerEventListener } from "./sandbox/container/container.helpers";
import { ServerOptions } from "node:http";

const app = new Hono();

const SYSTEM_PROMPT = `You are a helpful coding assistant that works inside a sandbox made of Docker containers (agents).

## Setup
- When the user asks you to create a sandbox, first call getActiveSession to get the sessionId, then call createSandbox with it.
- Once the sandbox exists, create agents with createAgentContainer, passing the sandboxId you received and a short, descriptive name based on the agent's job (for example "backend-agent", "test-runner"). Names must be unique.
- Use list_agents to see which agents exist in the current sandbox. Never invent a sandboxId, agent name or container id: use only values returned by tools.

## Working in containers
- Every file and command tool takes an "agent" argument. Choose the agent that matches the task, and call list_agents if you are unsure.
- All files live under /workspace, which is shared by every agent in the sandbox. Use paths relative to /workspace or starting with /workspace/.
- Containers run Alpine Linux with Node 22. Commands run with sh, not bash, so avoid bash-only syntax such as [[ ]] and arrays. Install tools with apk if needed.
- Use read_file before editing, prefer edit_file for small changes, and use write_file for new files. Use run_command for installing packages, running scripts, and tests.

## Behavior
- If a tool returns { ok: false, error }, read the error, fix the cause, and retry with corrected arguments. Do not repeat the same failing call more than once.
- Some actions need the user's approval. If the user rejects an action, do not retry it. Ask what they want instead.
- Keep answers short. After finishing, say what you did and show the relevant output.`;

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  cors: {
    origin: "*",
  },
});

const engine = new BunEngine({
  path: "/socket.io/",
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.bind(engine);

io.on("connection", async (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("client:tool:hitl", ({ approvalId, approved }) => {
    const p = pending.get(approvalId);

    if (!p) return;

    pending.delete(approvalId);
    p.resolve(approved);
  });

  socket.on("client:session:create", async (data) => {
    const {
      success,
      error,
      data: parsedData,
    } = createSessionSchema.safeParse(data);

    if (!success) {
      return socket.emit("server:session:error", {
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
        focus: "active",
      })
      .returning({
        id: sessionTable.id,
      });

    if (!session) {
      throw new Error("No session found");
    }

    await db.insert(messageTable).values({
      sessionId: session.id,
      type: "message",
      role: "user",
      content: parsedData.query,
    });

    socket.emit("server:session:created", {
      sessionId: session.id,
      title: response.title,
      descrption: response.descrption,
    });
  });

  socket.on("client:session:changeFocus", async ({ sessionId }) => {
    await db
      .update(sessionTable)
      .set({
        focus: "idle",
      })
      .where(eq(sessionTable.focus, "active"));

    const [session] = await db
      .update(sessionTable)
      .set({
        focus: "active",
      })
      .where(eq(sessionTable.id, sessionId))
      .returning({
        title: sessionTable.title,
      });

    console.log("User focus changed to session:", session?.title);
  });

  socket.on("client:session:run", async ({ sessionId, query }) => {
    try {
      const session = await getSession(sessionId);

      if (!session) {
        throw new Error(`No session found for ${sessionId}`);
      }

      await runLoop(
        query,
        SYSTEM_PROMPT,
        "openai/gpt-4o-mini",
        new DbContext(session.id),
        socket,
        (event: OpenAI.Responses.ResponseStreamEvent) => {
          socket.emit("server:session:run:event", { event });
        },
      );

      socket.emit("server:session:run:finished", { sessionId });
    } catch (err) {
      console.error("Error while running session", err);
      socket.emit("server:session:error", {
        message:
          err instanceof Error ? err.message : "Error while running session",
        errors: {},
      });
    }
  });

  socket.on("client:session:list", async () => {
    const res = await listSessions();
    socket.emit("server:session:list", {
      sessions: res,
    });
  });

  socket.on("client:session:messages", async ({ sessionId }) => {
    const res = await listSessionMessages(sessionId);

    socket.emit("server:session:messages", {
      messages: res,
    });
  });
});

const { websocket, fetch: EngineFetch } = engine.handler();

async function bootStrap() {
  // validate all envs
  validateENVs(process.env);

  // check db connection
  await checkDatabaseConnection();

  // docker container event stream (once per process, not per client)
  await startDockerEventListener();

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
