import { NestFactory } from "@nestjs/core";
import { AppModule, ObserveInstrument } from "./app.module.js";
import { Logger } from "nestjs-pino";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    bufferLogs: true,
  });

  const port = process.env.PORT ?? 3000;

  await app.listen(port);
  console.log(`server running at port: ${port}`);
  app.useLogger(app.get(Logger));
}

bootstrap();
