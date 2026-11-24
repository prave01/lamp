import { db } from "../../../db";
import { createSandboxNetwork } from "../../../sandbox/sandbox.docker";
import { defineTool } from "../tools.defineTool";
import z from "zod";

export const createSandbox = defineTool({
  name: "createSandbox",
  description: "Create sandbox",
  inputSchema: z.object({
    sessionId: z
      .string()
      .describe("Pass the sessionId to create the sandbox for that session"),
  }),
  execute: async ({ sessionId }) => {
    return await createSandboxNetwork(sessionId);
  },
});

export const getSandboxDetails = defineTool({
  name: "getSandboxDetails",
  description:
    "Get details about the sandbox like the sandboxId and the status",
  inputSchema: z.object({
    sessionId: z
      .string()
      .describe(
        "Pass the sessionId to get the sandbox details of that active session",
      ),
  }),
  execute: async ({ sessionId }) => {
    const sandbox = await db.query.sandboxTable.findFirst({
      where: {
        sessionId,
      },
    });

    return sandbox;
  },
});
