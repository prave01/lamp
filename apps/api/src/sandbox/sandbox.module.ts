import { Module } from "@nestjs/common";
import { SandBoxService } from "./sandbox.service";
import { OpenaiModule } from "../openai/openai.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getEnvConfig } from "../config";
import { SandBoxController } from "./sandbox.controller";
import { AgentWorkflowService } from "./createAgentWorkflow.service";

@Module({
  providers: [SandBoxService, AgentWorkflowService],
  imports: [
    OpenaiModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const envs = getEnvConfig(configService, "CreateIdea.ENV");
        return {
          apiKey: envs.OPENROUTER_KEY,
          baseURL: envs.OPENROUTER_BASE_URL,
          // modelName: envs.MODEL_NAME,
          // systemPrompt: envs.SYSTEM_PROMPT,
        };
      },
    }),
  ],
  controllers: [SandBoxController],
})
export class SandBoxModule { }
