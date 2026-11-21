import z from "zod";
import type { CreateTool, ToolDefinition } from "./tools.types";

export function createTool<TInputSchema extends z.ZodType>(
  tool: CreateTool<TInputSchema>,
): ToolDefinition {
  return {
    id: `tool-${tool.name}`,
    ...tool,
  };
}
