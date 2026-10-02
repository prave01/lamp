import { DynamicModule, Module } from "@nestjs/common";
import { CreateIdeaController } from "./create-idea.controller";
import { CreateIdeaService } from "./create-idea.service";
import { getEnvConfig, type CreateIdea } from "../config";
import { OpenaiModule } from "../openai/openai.module";
import { ConfigModule, ConfigService } from "@nestjs/config";

interface CreateIdeaModuleAsyncOptions<T> {
  inject: any[];
  imports: any[];
  useFactory: (...args: any[]) => T | Promise<T>;
}

@Module({
  controllers: [CreateIdeaController],
  providers: [CreateIdeaService],
  imports: [
    OpenaiModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configSerivce: ConfigService) => {
        const envs = getEnvConfig(configSerivce);
        return {
          apiKey: envs.OPENROUTER_KEY,
          modelName: envs.MODEL_NAME,
          sytemPrompt: envs.SYSTEM_PROMPT,
        };
      },
    }),
  ],
})
export class CreateIdeaModule {
  static forRootAsync(
    options: CreateIdeaModuleAsyncOptions<CreateIdea>,
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
