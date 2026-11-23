import { ZodType, toJSONSchema } from "zod";
import type { ExtendedTool, ToolDefinition } from "./tools.types";

export const defineTool = <T extends ZodType>(
  definition: ToolDefinition<T>,
): ExtendedTool<T> => {
  return {
    name: definition.name,
    type: "function",
    description: definition.description,
    parameters: toJSONSchema(definition.inputSchema),
    inputSchema: definition.inputSchema,
    execute: definition.execute,
    strict: false,
  };
};
