import { DynamicModule, Module } from "@nestjs/common";
import { OpenaiService } from "./openai.service";

export type OpenaiConfig = {
  apiKey: string;
  modelName: string;
  systemPrompt: string;
  baseURL: string;
};

export const OPENAI_CONFIG = "OPENAI_CONFIG";

interface OpenaiModuleAsyncOptions {
  inject?: any[];
  imports?: any[];
  useFactory: (...args: any[]) => OpenaiConfig | Promise<OpenaiConfig>;
}

@Module({})
export class OpenaiModule {
  static forRootAsync(options: OpenaiModuleAsyncOptions): DynamicModule {
    return {
      module: OpenaiModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: "OPENAI_CONFIG",
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
        OpenaiService,
      ],
      exports: [OpenaiService],
    };
  }
}
