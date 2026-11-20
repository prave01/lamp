import { DynamicModule, Module } from "@nestjs/common";
import { OpenaiService } from "./openai.service";
import { type OpenaiConfig } from "../config";

interface CreateOpenAiModuleAsyncOptions<T> {
  inject: any[];
  imports: any[];
  useFactory: (...args: any[]) => T;
}

@Module({})
export class OpenaiModule {
  static forRootAsync(
    options: CreateOpenAiModuleAsyncOptions<OpenaiConfig>,
  ): DynamicModule {
    return {
      module: OpenaiModule,
      imports: options.imports ?? [],
      providers: [
        OpenaiService,
        {
          provide: "openai_config",
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
      ],
      exports: [OpenaiService],
    };
  }
}
