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

  constructor() { }
}
