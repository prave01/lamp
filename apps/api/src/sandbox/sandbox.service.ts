import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  ModelSpecType,
  type ToolDefinition,
  type AgentSpec,
} from "../tools/types";
import { OpenaiService } from "../openai/openai.service";
import { UuidService } from "nestjs-uuid";
import { LLM_TOOL, ToolsResolver } from "../libs/tool";
import { AgentWorkflowService } from "./createAgentWorkflow.service";

@Injectable()
export class SandBoxService {
  private logger = new Logger(SandBoxService.name);
  private uuid: UuidService;
  private AgentWorkflow: AgentWorkflowService;

  private name: string;
  private id: string;
  private model: ModelSpecType;
  private description: string;
  private systemPrompt: string;
  private tools: ToolDefinition[];

  private sandBox: {
    id: string;
    name: string;
  };

  private readonly openaiService: OpenaiService;

  constructor(private args: AgentSpec) {
    this.tools = ToolsResolver({
      agentId: this.id,
      tools: args.tools,
    });
  }

  async initSandBox() {
    this.sandBox = {
      name: `SandBox - ${this.name}`,
      id: this.uuid.generate(),
    };

    this.logger.log(
      `
        SandBoxName ${this.sandBox.name} \n
        SandBoxId ${this.sandBox.id}
    `,
    );

    const createdWorkflow = this.AgentWorkflow;
  }

  async run() { }
}
