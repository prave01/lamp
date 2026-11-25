import { db } from "../../../db";
import { agentContainerTable } from "../../../db/db.schema";
import { createContainer } from "../../../sandbox/container/container.docker";
import { defineTool } from "../tools.defineTool";
import z from "zod";

export const createAgentContainer = defineTool({
  name: "createAgentContainer",
  description: "Create agent container inside the sandbox",
  inputSchema: z.object({
    sandboxId: z
      .string()
      .describe(
        "ID of the sandbox (the Docker network) the container will join.",
      ),
    agentId: z
      .string()
      .describe(
        "ID of the agent this container runs. Stored as a label so Docker events map back to the agent.",
      ),
    name: z
      .string()
      .describe(
        "Unique container name, e.g. 'agent-<agentId>'. Other containers on the same network reach it by this name.",
      ),
    cmd: z
      .array(z.string())
      .describe(
        "Command to run, as an argument array, e.g. ['sh', '-c', 'echo hello']. The first item is the program and the rest are its arguments.",
      ),
  }),

  execute: async ({ name, sandboxId, agentId, cmd }) => {
    const container = await createContainer(sandboxId, agentId, name, cmd);

    await db.insert(agentContainerTable).values({
      sandboxId,
      agentId,
      name,
      cmd,
    });

    await container.start();

    await container.stats({
      stream: true,
    });

    await container.wait(); // wait until the command finishes

    const buf = await container.logs({
      stdout: true,
      stderr: true,
      follow: false,
    });

    const output = buf.toString("utf-8");

    return {
      ok: true,
      output,
    };
  },
});
