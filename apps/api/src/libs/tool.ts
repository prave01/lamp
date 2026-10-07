import z from "zod";
import type { CreateTool, ToolDefinition } from "../tools/types";
import OpenAI from "openai";
import { getTools, ToolRegistry } from "../tools/toolRegistry";

export function CreateTool<TInputSchema extends z.ZodType>(
  tool: CreateTool<TInputSchema>,
): ToolDefinition {
  return {
    ...tool,
    id: `tool-${tool.name}`,
  };
}

type OpenAITool = OpenAI.Responses.Tool;

export function LLM_TOOL(
  tools: ToolDefinition[],
  provider: "anthropic" | "openai" = "openai",
): OpenAITool[] {
  if (provider === "openai") {
    return tools.map((tool) => {
      const jsonSchema = z.toJSONSchema(tool.inputSchema);

      const openaiTool: OpenAITool = {
        type: "function",
        name: tool.name,
        description: tool.description,
        strict: true,
        parameters: jsonSchema,
      };

      console.log(openaiTool);

      return openaiTool;
    });
  }
  throw new Error(`Provider "${provider}" is not supported`);
}

export type AgentToolRequest = {
  agentId: string;
  tools: Array<string>;
};

export function ToolsResolver(input: AgentToolRequest) {
  const availabeTools = getTools(input); //needs both agentId and the tools
  return availabeTools;
}

export const executor = async (toolId: string, args: any) => {
  const tool = await getTools({
    agentId: "all",
    tools: ["tool-websearch"],
  });

  const res = tool[0].execute(args);

  return res;
};
