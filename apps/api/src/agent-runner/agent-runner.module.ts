import { Module } from "@nestjs/common";
import { AgentRunnerService } from "./agent-runner.service";
import { OpenaiModule } from "../openai/openai.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getEnvConfig } from "../config";
import { AgentRunnerController } from "./agent-runner.controller";
import { WrokflowService } from "./createWorkflow.service";

@Module({
  providers: [AgentRunnerService, WrokflowService],
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
  controllers: [AgentRunnerController],
})
export class AgentRunnerModule { }
