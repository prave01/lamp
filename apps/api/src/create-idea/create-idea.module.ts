import { DynamicModule, Module } from "@nestjs/common";
import { CreateIdeaController } from "./create-idea.controller.js";
import { CreateIdeaService } from "./create-idea.service.js";
import { ConfigService } from "@nestjs/config";
import { type CreateIdea } from "../config";
import { CreateIdeaSchema } from "../config";

interface CreateIdeaModuleAsyncOptions<T> {
  inject: any[];
  imports: any[];
  useFactory: (...args: any[]) => T | Promise<T>;
}

@Module({
  controllers: [CreateIdeaController],
  providers: [CreateIdeaService],
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

  generateIdea() {
    return "This is a generated idea!";
  }
}
