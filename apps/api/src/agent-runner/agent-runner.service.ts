import { Injectable, Logger } from "@nestjs/common";
import { ModelSpecType, type AgentSpec } from "../tools/types";
import { OpenaiService } from "../openai/openai.service";

@Injectable()
export class AgentRunnerService {
  private logger = new Logger(AgentRunnerService.name);

  private name: string;
  private id: string;
  private model: ModelSpecType;
  private description: string;
  private systemPrompt: string;

  constructor(
    // private readonly args: AgentSpec?= {},
    private readonly openaiService: OpenaiService,
  ) {
    //about the current instance
    // this.id = args.identity.id;
    // this.name = args.identity.name;
    // this.description = args.identity.description;
    // this.model = args.model;
    // this.systemPrompt = args.instructions.systemPrompt;
  }

  async run() {
    const res = await this.openaiService.generateText(
      "what is your name",
      "Your name is jiya, a friendly and helpful assistant. You are a large language model trained by OpenAI. You are capable of answering questions, providing explanations, and assisting with a wide range of tasks.",
      "gpt-4o-mini",
    );

    this.logger.log(`Response: ${res}`);
    return res;
  }
}
