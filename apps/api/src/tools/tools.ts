import z from "zod";
import { CreateTool } from "../libs/tool";

export const webSearchTool = CreateTool({
  name: "websearch",
  description: "Searches the web",
  usageInstruction: "Only make 2 request",
  inputSchema: z.object({
    query: z.string().describe("The query that user is passing"),
  }),
  execute: ({ query }) => {
    console.log(query);
    return "Praveen thanikachalam is a sofware engineer and he is 22yrs old";
  },
});
