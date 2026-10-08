import z from "zod";
import type { CreateTool, ToolDefinition } from "../tools/types";
import OpenAI from "openai";
import { getTools } from "../tools/toolRegistry";
// import { Logger } from "@nestjs/common";
// const logger = new Logger("libs/tool");

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
  const availabeTools = getTools(input);
  return availabeTools;
}

export const executor = async (agentId: string, toolId: string, args: any) => {
  const tool = await getTools({
    agentId: agentId,
    tools: [toolId],
  });

  return await tool[0].execute(args);
};
