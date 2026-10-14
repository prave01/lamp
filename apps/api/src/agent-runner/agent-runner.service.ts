import { Injectable, Logger } from "@nestjs/common";
import { ModelSpecType, type AgentSpec } from "../tools/types";
import { OpenaiService } from "../openai/openai.service";
import { UuidService } from "nestjs-uuid";
import { WrokflowService } from "./createWorkflow.service";

@Injectable()
export class AgentRunnerService {
  private logger = new Logger(AgentRunnerService.name);
  private uuid: UuidService;
  private workflow: WrokflowService;

  private name: string;
  private id: string;
  private model: ModelSpecType;
  private description: string;
  private systemPrompt: string;

  private sandBoxId: string;

  constructor(private readonly openaiService: OpenaiService) { }

  // constructor(private readonly args: AgentSpec) {
  //   //about the current instance
  //   this.id = args.identity.id;
  //   this.name = args.identity.name;
  //   this.description = args.identity.description;
  //   this.model = args.model;
  //   this.systemPrompt = args.instructions.systemPrompt;
  // }

  async initSandBox() {
    this.sandBoxId = this.uuid.generate();
    this.logger.log(`SandBoxId ${this.sandBoxId}`);

    const createdWorkflow = this.workflow;
  }

  async run() {
    const res = await this.openaiService.generateText(
      "Start the agent",
      [""],
      this.systemPrompt ?? "You are a helpful assistant.",
      "gpt-4o-mini",
    );

    this.logger.log(`Response: ${res}`);
    return res;
  }
}
