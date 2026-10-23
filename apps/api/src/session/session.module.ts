import { DynamicModule, Module } from "@nestjs/common";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";
import { type SessionConfig } from "../config";
import { OpenaiModule } from "../openai/openai.module";

interface CreateIdeaModuleAsyncOptions<T> {
  inject: any[];
  imports: any[];
  useFactory: (...args: any[]) => T;
}

@Module({
  controllers: [SessionController],
  providers: [SessionService],
  imports: [OpenaiModule],
})
export class SessionModule {
  static forRootAsync(
    options: CreateIdeaModuleAsyncOptions<SessionConfig>,
  ): DynamicModule {
    return {
      module: SessionModule,
      imports: options.imports,
      providers: [
        {
          provide: "session_config",
          inject: options.inject,
          useFactory: options.useFactory,
        },
      ],
    };
  }
}
