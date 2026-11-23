import { z, ZodType } from "zod";
import type { ToolDefinition, ExtendedTool } from "./tools.types";

export const defineTool = <T extends ZodType>(
  definition: ToolDefinition<T>,
): ExtendedTool<T> => {
  return {
    name: definition.name,
    type: "function",
    description: definition.description,
    parameters: z.toJSONSchema(definition.inputSchema),
    inputSchema: definition.inputSchema,
    execute: definition.execute,
    strict: false,
  };
};
