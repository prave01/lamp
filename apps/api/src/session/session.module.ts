import { Module } from "@nestjs/common";
import { OpenaiModule } from "../openai/openai.module";
import { SessionService } from "./session.service";
import { SessionGateway } from "./session.gateway";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { getEnvConfig } from "../config";
import { SandBoxModule } from "../sandbox/sandbox.module";

@Module({
  imports: [
    OpenaiModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getEnvConfig(configService, "OpenaiConfig.ENV"),
    }),
    SandBoxModule,
  ],
  providers: [SessionService, SessionGateway],
  exports: [SessionService],
})
export class SessionModule { }
