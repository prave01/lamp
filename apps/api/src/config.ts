import { z, ZodObject } from "zod";
import { ConfigService, registerAs } from "@nestjs/config";

export const OpenaiConfigSchema = z.object({
  API_KEY: z.string(),
  BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
});

export const SandBoxConfigSchema = z.object({
  SANDBOX_NAME: z.string(),
});

export type SandboxConfig = z.infer<typeof SandBoxConfigSchema>;

export type OpenaiConfig = z.infer<typeof OpenaiConfigSchema>;

export const registerSessionEnv = registerAs("OpenaiConfig.ENV", () => {
  return OpenaiConfigSchema.parse(process.env);
});

export const registerSandboxEnv = registerAs("SandboxConfig.ENV", () => {
  return SandBoxConfigSchema.parse(process.env);
});

export type EnvConfigTypes = {
  "OpenaiConfig.ENV": OpenaiConfig;
  "SandboxConfig.ENV": SandboxConfig;
};

export function getEnvConfig<K extends keyof EnvConfigTypes>(
  configService: ConfigService,
  context: K,
): EnvConfigTypes[K] {
  return configService.get(context)!;
}
