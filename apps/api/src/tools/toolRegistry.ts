import { ToolDefinition, type ToolRegistryType } from "./types";
import { Tools } from "./index";
import { type AgentToolRequest } from "../libs/tool";

import { Logger } from "@nestjs/common";
const logger = new Logger("ToolRegistry");

export const ToolRegistry: ToolRegistryType = [
  {
    tool: Tools.webSearchTool,
    availableFor: ["core"],
  },
];

export function getTools(input: AgentToolRequest): Array<ToolDefinition> {
  let availableTools: Array<ToolDefinition> = [];

  for (const tool of input.tools) {
    const registeredTool = ToolRegistry.find((i) => i.tool.id === tool);

    if (!registeredTool) {
      logger.error(`No tool found for ${tool}`);
      continue;
    }

    if (
      !registeredTool.availableFor.includes(input.agentId) ||
      !registeredTool.availableFor.includes("core")
    ) {
      continue;
    }

    if (!registeredTool?.availableFor.includes(input.agentId)) {
      logger.error(
        `Agent not allowed to use this tool ${tool} for agent ${input.agentId}`,
      );
      continue;
    }

    availableTools.push(registeredTool?.tool);
  }

  return availableTools;
}
