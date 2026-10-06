import { Module } from "@nestjs/common";
import { createObserveModule } from "@nestjs/observe";
import { AppController } from "./app.controller";
import { AppService } from "./app.service.js";
import { CreateIdeaModule } from "./create-idea/create-idea.module";
import { createLogger } from "@repo/logger";
import { LoggerModule } from "nestjs-pino";
import { getEnvConfig, registerEnv } from "./config.js";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OpenaiModule } from "./openai/openai.module";

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        logger: createLogger("api"),
        autoLogging: false,
        quietReqLogger: true,
      },
    }),
    ConfigModule.forRoot({
      load: [registerEnv],
      isGlobal: true,
      envFilePath: ".env.local",
      ignoreEnvVars: true,
    }),
    CreateIdeaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getEnvConfig(configService, "CreateIdea.ENV"),
      inject: [ConfigService],
    }),
    OpenaiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
