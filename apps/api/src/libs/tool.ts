import z from "zod";
import type { CreateTool } from "../tools/types";
import {
  ChatCompletionFunctionTool,
  type ChatCompletionTool,
} from "openai/resources";

export function CreateTool<TInputSchema extends z.ZodType>(
  tool: CreateTool<TInputSchema>,
) {
  return tool;
}

// {
//   type: "function",
//   name: "websearch",
//   description: "Searches the web",
//   strict: true,
//   parameters: {
//     type: "object",
//     properties: {
//       query: {
//         type: "string",
//         description: "The query that user is passing"
//       }
//     },
//     required: ["query"],
//     additionalProperties: false
//   }
// }

export function LLM_TOOL(
  tools: CreateTool,
  provider: "anthropic" | "openai" = "openai",
) {
  if (provider === "openai") {
  }
}
