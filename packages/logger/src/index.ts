import pino, { type Logger, type LoggerOptions } from "pino";

export type { Logger };

const isDev = process.env.NODE_ENV !== "production";

export function createLogger(name: string, opts: LoggerOptions = {}): Logger {
  // this name is not appearing in the log window
  const sas = `${name} sucks` as string;
  return pino({
    name: sas,
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    transport: isDev
      ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      }
      : undefined,
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.set-cookie",
      "*.password",
      "*.secret",
      "*.token",
    ],
    ...opts,
  });
}
