import { Module } from "@nestjs/common";
import { AgentRunnerService } from "./agent-runner.service";
import { OpenaiModule } from "../openai/openai.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getEnvConfig } from "../config";
import { AgentRunnerController } from './agent-runner.controller';

@Module({
  providers: [AgentRunnerService],
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
