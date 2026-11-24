import { z, ZodType } from "zod";
import type { ToolDefinition, ExtendedTool } from "./tools.types";
import type OpenAI from "openai";
import { allowedList, ToolRegistry } from "./tools.registry";

export const ToolResolver = (
  list: Array<keyof typeof ToolRegistry>,
): Array<OpenAI.Responses.Tool> => {
  return list
    .filter((i) => allowedList[i] === "core")
    .map((i): OpenAI.Responses.FunctionTool => {
      const tool = ToolRegistry[i];
      return {
        type: "function",
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        strict: true,
      };
    });
};

export const executor = async (
  name: keyof typeof ToolRegistry,
  args: string,
) => {
  const tool = ToolRegistry[name];

  if (!tool) {
    throw new Error(`Tool "${name}" not found in ToolRegistry`);
  }

  const parsedArgs = tool.inputSchema.safeParse(JSON.parse(args));

  if (!parsedArgs.success) {
    throw new Error(`Invalid arguments: ${parsedArgs.error.message}`);
  }

  if (!tool.execute) {
    throw new Error(`Tool "${name}" has no execute function`);
  }

  const res = await tool.execute(parsedArgs.data as never);

  return res;
};
