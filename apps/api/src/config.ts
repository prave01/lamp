import { z } from "zod";
import { ConfigService, registerAs } from "@nestjs/config";
import { ConfigType } from "@nestjs/config";

export const CreateIdeaConfig = z.object({
  MODEL_NAME: z.string().default("~deepseek/deepseek-pro-latest"),
  SYSTEM_PROMPT: z
    .string()
    .default(
      "Generate a idea, give the technical requirements for another builder agent to build an agent",
    ),
  OPENROUTER_KEY: z.string(),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
});

export type CreateIdeaConfigType = z.infer<typeof CreateIdeaConfig>;

export const registerEnv = registerAs("CreateIdea.ENV", () => {
  return CreateIdeaConfig.parse(process.env);
});

export function getEnvConfig(configService: ConfigService, context: string) {
  return configService.get("CreateIdea.ENV") as CreateIdeaConfigType;
}

export type ENVConfig = ConfigType<typeof registerEnv>;
