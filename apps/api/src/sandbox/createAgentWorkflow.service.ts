import { Injectable, Logger } from "@nestjs/common";
import { UuidService } from "nestjs-uuid";
import { OpenaiService } from "../openai/openai.service";
import type { AgentSpec, ModelSpecType, ToolDefinition } from "../tools/types";
import { LLM_TOOL, ToolsResolver } from "../libs/tool";

@Injectable()
export class AgentWorkflowService {
  private readonly logger = new Logger(AgentWorkflowService.name);

  public workflow: {
    id: string;
    name: string;
  };
  private readonly uuid: UuidService;

  private name: string;
  private id: string;
  private model: ModelSpecType;
  private description: string;
  private systemPrompt: string;
  private tools: ToolDefinition[];

  private openaiService: OpenaiService;
  private isWorkflowRunning: boolean = false;

  constructor(private args: AgentSpec) {
    this.id = args.identity.id;
    this.name = args.identity.name;
    this.model = args.model;
    this.description = args.identity.description;
    this.systemPrompt = args.instructions.systemPrompt;

    this.tools = ToolsResolver({
      agentId: this.id,
      tools: args.tools,
    });

    this.openaiService = new OpenaiService({
      agentID: this.id,
      name: this.name,
      sysPrompt: this.systemPrompt,
      tools: LLM_TOOL(this.tools),
      model: this.model.modelName,
    });
  }

  async createWorkflow() {
    const id = this.uuid.generate();

    this.workflow = {
      id,
      name: `workflow-${this.name}-${id}`,
    };

    this.isWorkflowRunning = true;

    const response = await this.openaiService.generateText();

    this.logger.log(
      `Response for workflow ${this.workflow.name} \n ${response.text}`,
    );

    this.isWorkflowRunning = true;
  }

  runWorkflow() { }
}
