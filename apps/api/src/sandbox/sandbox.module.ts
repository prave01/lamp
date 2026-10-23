import { Module } from "@nestjs/common";
import { OpenaiModule } from "../openai/openai.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getEnvConfig } from "../config";
import { AgentWorkflowService } from "./createAgentWorkflow.service";

@Module({
  providers: [AgentWorkflowService],
  imports: [],
})
export class SandBoxModule { }
