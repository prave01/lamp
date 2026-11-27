import { db } from "../../../db";
import { agentContainerTable } from "../../../db/db.schema";
import {
  createContainer,
  execInContainer,
  writeContainerFile,
  readContainerFile,
} from "../../../sandbox/container/container.docker";
import { defineTool } from "../tools.helpers";
import z from "zod";
import { errMessage } from "../../../sandbox/container/container.helpers";

export const createAgentContainer = defineTool({
  name: "createAgentContainer",
  description: "Create agent container inside the sandbox",
  inputSchema: z.object({
    sandboxId: z
      .string()
      .describe(
        "ID of the sandbox (the Docker network) the container will join.",
      ),
    name: z
      .string()
      .describe(
        "Unique container name, e.g. 'agent-<agentId>'. Other containers on the same network reach it by this name.",
      ),
    isAgentLooking: z.boolean().describe("Mark this to true when you "),
  }),
  execute: async ({ name, sandboxId }) => {
    const container = await createContainer(sandboxId, name);

    try {
      await db
        .insert(agentContainerTable)
        .values({ id: container.id, sandboxId, name });

      await container.start();

      return { ok: true, containerId: container.id, name };
    } catch (err) {
      await container.remove({ force: true }).catch(() => { });

      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});

export const execCommand = defineTool({
  name: "execCommand",
  description: "Execute the command that you want to run inside the container",
  inputSchema: z.object({
    containerId: z.string().describe("Id of the container"),
    cmd: z.array(z.string()).describe("Array of command"),
  }),
  execute: async ({ containerId, cmd }, ctx) => {
    try {
      const result = await execInContainer(containerId, cmd, (text) => {
        ctx?.socket.emit("server:tool:exec:log", {
          callId: ctx.callId,
          text,
        });
      });

      console.log("Exec result output", result.output);

      ctx?.socket.emit("server:tool:exec:done", {
        callId: ctx.callId,
        output: result.output,
      });
    } catch (err) {
      return err;
    }
  },
});

export const listSessionAgents = defineTool({
  name: "listSessionAgents",
  description: "Lists all the agent that were created during this session",
  inputSchema: z.object({
    sessionId: z
      .uuid()
      .describe(
        "Pass the sessionId to get the agents that this session contains",
      ),
  }),
  execute: async ({ sessionId }) => {
    const sandbox = await db.query.sandboxTable.findFirst({
      where: {
        sessionId,
      },
    });

    if (!sandbox) {
      return `There is no sandbox for the session: ${sessionId}`;
    }

    const agents = await db.query.agentContainerTable.findMany({
      where: {
        sandboxId: sandbox?.id,
      },
    });

    return agents;
  },
});

export const writeFileInContainer = defineTool({
  name: "writeFileInContainer",
  description: "Write the content to the file",
  inputSchema: z.object({
    containerId: z.string().describe("Id of the container"),
    content: z.string().describe("Content you want to write into that file"),
    path: z
      .string()
      .describe(
        "File path that starts with /workspace/ so it writes the file inside the workspace",
      ),
  }),
  execute: async ({ containerId, content, path }) => {
    try {
      const result = await writeContainerFile(containerId, content, path);

      return {
        ok: true,
        output: result,
      };
    } catch (err) {
      return {
        ok: false,
        error: errMessage(err),
      };
    }
  },
});

export const readFileInContainer = defineTool({
  name: "readFileInContainer",
  description:
    "Read the content of a file inside the container's /workspace. Large files are truncated.",
  inputSchema: z.object({
    containerId: z.string().describe("Id of the container"),
    path: z
      .string()
      .describe(
        "File path that starts with /workspace/ so it reads the file inside the workspace",
      ),
  }),
  execute: async ({ containerId, path }) => {
    try {
      const content = await readContainerFile(containerId, path);

      return {
        ok: true,
        output: content,
      };
    } catch (err) {
      return {
        ok: false,
        error: errMessage(err),
      };
    }
  },
});
