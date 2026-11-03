import pc from "picocolors";
import { HttpException, type HttpStatus } from "@nestjs/common";

import { Logger } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";

const logger = new Logger("SessionError");

export type SocketError = {
  statusCode: HttpStatus;
  message: string;
  recoverable?: boolean;
};

export class WebSocketError extends WsException {
  constructor(input: SocketError) {
    super({
      statusCode: input.statusCode,
      message: input.message,
      recoverable: input.recoverable,
    });

    this.name = "WebSocketError";
  }
}

export class SessionControllerError extends HttpException {
  constructor(message: "INVALID_INPUT", statusCode: number, details?: unknown) {
    super(
      {
        statusCode,
        message,
        details,
      },
      statusCode,
    );

    console.log(pc.bgBlack(pc.redBright("Ah fuck its " + statusCode)));
    logger.error({
      message,
      details,
    });
  }
}

export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);

    console.log(
      "\n" +
      pc.bgBlack(pc.redBright("Damn!!, An error while the AI is cooking :(")),
    );

    this.name = "AiServiceError";
  }
}

export class PersistenceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PersistenceError";
  }
}
