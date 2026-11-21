import { Injectable } from "@nestjs/common";
import { SandboxService } from "../../sandbox/sandbox.service";
import { CreateContainerSchema } from "../../sandbox/sandbox.types";
import { type ToolDefinition } from "../tools.types";
import { createTool } from "..";

@Injectable()
export class DockerTools {
  public createContainer: ToolDefinition;

  constructor(private readonly sandboxService: SandboxService) {
    this.createContainer = createTool({
      name: "create_container",
      description: "Create docker container in the sandbox environment",
      inputSchema: CreateContainerSchema,
      execute: async ({ sandboxId, options }) => {
        const id = await this.sandboxService.createExecutableContainer({
          sandboxId,
          options,
        });

        return `Container with id: ${id}, created`;
      },
      usageInstruction: "",
    });
  }
}
