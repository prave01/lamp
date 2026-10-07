import { ToolDefinition, type ToolRegistryType } from "./types";
import { Tools } from "./index";
import { type AgentToolRequest } from "../libs/tool";

export const ToolRegistry: ToolRegistryType = [
  {
    tool: Tools.webSearchTool,
    availableFor: ["all"],
  },
];

export function getTools(input: AgentToolRequest): Array<ToolDefinition> {
  let availableTools: Array<ToolDefinition> = [];

  for (const tool of input.tools) {
    const registeredTool = ToolRegistry.find((i) => i.tool.id === tool);

    if (!registeredTool) {
      console.error("No tool found", tool);
      continue;
    }

    if (!registeredTool.availableFor.includes("all")) {
      continue;
    }

    if (!registeredTool?.availableFor.includes(input.agentId)) {
      console.error(
        "Agent not allowed to use this tool",
        registeredTool?.tool.name,
      );
      continue;
    }

    availableTools.push(registeredTool?.tool);
  }

  return availableTools;
}
