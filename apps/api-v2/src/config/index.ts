import z from "zod";
import { ConfigMap } from "./config.types";
import { OpenaiEnvSchema, ServerEnvSchema } from "./config.zod";

export const EnvSchema = OpenaiEnvSchema.extend(ServerEnvSchema.shape);

export const validateENVs = (env: NodeJS.ProcessEnv) => {
  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    throw new Error(
      `OpenAI environment validation failed:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
};

export function getConfig<T extends keyof ConfigMap>(
  ctx: T,
  env: NodeJS.ProcessEnv = process.env,
): ConfigMap[T] {
  switch (ctx) {
    case "openai": {
      const config = OpenaiEnvSchema.safeParse(env);

      if (!config.success) {
        throw new Error("Invalid OpenAI configuration");
      }

      return {
        API_KEY: config.data.API_KEY,
        BASE_URL: config.data.BASE_URL,
      } as ConfigMap[T];
    }

    case "server": {
      const config = ServerEnvSchema.safeParse(env);

      if (!config.success) {
        throw new Error("Invalid Server configuration");
      }

      return {
        PORT: config.data.PORT,
      } as ConfigMap[T];
    }

    default:
      throw new Error("Unknown configuration");
  }
}
