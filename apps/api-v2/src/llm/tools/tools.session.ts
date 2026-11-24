import { db } from "../../db";
import { defineTool } from "./tools.defineTool";
import z from "zod";

export const getCurrentActiveSession = defineTool({
  name: "getActiveSession",
  description: "Get the information about the current active session",
  inputSchema: z.object().describe("Don't pass any arguments"),
  execute: async () => {
    return await db.query.sessionTable.findFirst({
      where: {
        status: "active",
      },
    });
  },
});
