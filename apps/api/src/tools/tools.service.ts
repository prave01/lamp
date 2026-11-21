import z from "zod";
import type {
  AgentToolRequest,
  CreateTool,
  OpenAITool,
  ToolDefinition,
} from "./tools.types";
import { Injectable } from "@nestjs/common";
import { ToolRegistry } from "./tool_registry.service";

@Injectable()
export class ToolsService {
  constructor(private readonly toolRegistry: ToolRegistry) { }

  toLLMTool(
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

        return openaiTool;
      });
    }
    throw new Error(`Provider "${provider}" is not supported`);
  }

  toolResolver(input: AgentToolRequest) {
    const availabeTools = this.toolRegistry.getTools(input);
    return availabeTools;
  }

  async executor(agentId: string, toolId: string, args: any) {
    const tool = this.toolRegistry.getTools({
      agentId: agentId,
      tools: [toolId],
    });

    return await tool[0].execute(args);
  }
}
