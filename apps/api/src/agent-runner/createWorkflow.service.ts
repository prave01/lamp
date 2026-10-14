import { Injectable } from "@nestjs/common";
import { UuidService } from "nestjs-uuid";
import { OpenaiService } from "../openai/openai.service";

@Injectable()
export class WrokflowService {
  public workflowID: string;
  private readonly uuid: UuidService;

  private openai: OpenaiService;
  private isWorkflowRunning: boolean = false;

  constructor() { }

  createWorkflow(input: {
    name: string; // name-version
    systemPrompt: string; //systemPrompt of this current workflow
    modelName: string; // specific model for this workflow
    tools: string[];
  }) {
    this.workflowID = this.uuid.generate();
    const { name, systemPrompt, modelName } = input;

    //call the openai service generate text here
    this.openai.generateText("", ["websearch"], systemPrompt, modelName);

    this.isWorkflowRunning = true;
  }

  runWorkflow() { }
}
