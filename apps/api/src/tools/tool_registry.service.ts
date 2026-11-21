import { ToolDefinition, type ToolRegistryType } from "./tools.types";
import { type AgentToolRequest } from "./tools.types";
import { Injectable, Logger } from "@nestjs/common";
import { WebTools } from "./web/web.tools";
import { DockerTools } from "./docker/docker.tools";

const logger = new Logger("ToolRegistry");

@Injectable()
export class ToolRegistry {
  private toolRegistry: ToolRegistryType;

  constructor(
    private readonly dockerTools: DockerTools,
    private readonly webTools: WebTools,
  ) {
    this.toolRegistry = [
      {
        tool: this.webTools.webSearchTool,
        availableFor: ["core", "agent-runner"],
      },
      {
        tool: this.dockerTools.create_container,
        availableFor: ["core"],
      },
    ];
  }

  getTools(input: AgentToolRequest): Array<ToolDefinition> {
    let availableTools: Array<ToolDefinition> = [];

    for (const tool of input.tools) {
      const registeredTool = this.toolRegistry.find((i) => i.tool.id === tool);

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
}
