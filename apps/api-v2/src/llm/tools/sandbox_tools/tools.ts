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
