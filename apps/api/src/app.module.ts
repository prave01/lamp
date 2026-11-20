import { Module } from "@nestjs/common";
import { createObserveModule } from "@nestjs/observe";
import { AppController } from "./app.controller";
import { AppService } from "./app.service.js";
import { SessionModule } from "./session/session.module";
import { createLogger } from "@repo/logger";
import { LoggerModule } from "nestjs-pino";
import { getEnvConfig, registerSandboxEnv, registerSessionEnv } from "./config";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OpenaiModule } from "./openai/openai.module";
import { SandBoxModule } from "./sandbox/sandbox.module";
import { UuidModule } from "nestjs-uuid";

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    UuidModule,
    LoggerModule.forRoot({
      pinoHttp: {
        logger: createLogger("api"),
        autoLogging: false,
        quietReqLogger: true,
      },
    }),
    ConfigModule.forRoot({
      load: [registerSessionEnv, registerSandboxEnv],
      isGlobal: true,
      envFilePath: ".env.local",
      ignoreEnvVars: true,
    }),
    OpenaiModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getEnvConfig(configService, "OpenaiConfig.ENV"),
      inject: [ConfigService],
    }),
    SessionModule,
    SandBoxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
