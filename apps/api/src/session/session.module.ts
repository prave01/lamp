import { DynamicModule, Module } from "@nestjs/common";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";
import { getEnvConfig, type SessionConfig } from "../config";
import { OpenaiModule } from "../openai/openai.module";
import { ConfigModule, ConfigService } from "@nestjs/config";

interface CreateIdeaModuleAsyncOptions<T> {
  inject: any[];
  imports: any[];
  useFactory: (...args: any[]) => T | Promise<T>;
}

@Module({
  controllers: [SessionController],
  providers: [SessionService],
  imports: [
    OpenaiModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configSerivce: ConfigService) => {
        const envs = getEnvConfig(configSerivce, "CreateIdea.ENV");
        return {
          apiKey: envs.OPENROUTER_KEY,
          modelName: envs.MODEL_NAME,
          systemPrompt: envs.SYSTEM_PROMPT,
          baseURL: envs.OPENROUTER_BASE_URL,
        };
      },
    }),
  ],
})
export class CreateIdeaModule {
  static forRootAsync(
    options: CreateIdeaModuleAsyncOptions<SessionConfig>,
  ): DynamicModule {
    return {
      module: CreateIdeaModule,
      imports: options.imports,
      providers: [
        {
          provide: "CREATE_IDEA_CONFIG",
          inject: options.inject,
          useFactory: options.useFactory,
        },
      ],
    };
  }
}
