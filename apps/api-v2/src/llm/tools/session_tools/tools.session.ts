import z from "zod";
import { defineTool } from "../tools.helpers";
import { db } from "../../../db/index";

export const getUserFocusingSession = defineTool({
  name: "getUserFocusingSession",
  description:
    "Get the information about the current focusing session by the user",
  inputSchema: z.object().describe("Don't pass any arguments"),
  execute: async () => {
    return await db.query.sessionTable.findFirst({
      where: {
        focus: "active",
      },
    });
  },
});
