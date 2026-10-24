import { z, ZodObject } from "zod";
import { ConfigService, registerAs } from "@nestjs/config";

export const SessionConfigSchema = z.object({
  SESSION_MODEL_NAME: z.string().default("~deepseek/deepseek-pro-latest"),
  SESSION_SYSTEM_PROMPT: z
    .string()
    .default(
      "Generate a idea, give the technical requirements for another builder agent to build an agent",
    ),
  SESSION_OPENROUTER_KEY: z.string(),
  SESSION_OPENROUTER_BASE_URL: z
    .string()
    .default("https://openrouter.ai/api/v1"),
});

export const SandBoxConfigSchema = z.object({
  SANDBOX_NAME: z.string(),
});

export type SandboxConfig = z.infer<typeof SandBoxConfigSchema>;

export type SessionConfig = z.infer<typeof SessionConfigSchema>;

export const registerSessionEnv = registerAs("SessionConfig.ENV", () => {
  return SessionConfigSchema.parse(process.env);
});

export const registerSandboxEnv = registerAs("SandboxConfig.ENV", () => {
  return SandBoxConfigSchema.parse(process.env);
});

export type EnvConfigTypes = {
  "SessionConfig.ENV": SessionConfig;
  "SandboxConfig.ENV": SandboxConfig;
};

export function getEnvConfig<K extends keyof EnvConfigTypes>(
  configService: ConfigService,
  context: K,
): EnvConfigTypes[K] {
  return configService.get(context)!;
}
