import { z } from "zod";
import { ConfigService, registerAs } from "@nestjs/config";
import { ConfigType } from "@nestjs/config";

export const CreateIdeaSchema = z.object({
  MODEL_NAME: z.string().default("~deepseek/deepseek-pro-latest"),
  SYSTEM_PROMPT: z
    .string()
    .default(
      "Generate a idea, give the technical requirements for another builder agent to build an agent",
    ),
  OPENROUTER_KEY: z.string().default("https://openrouter.ai/api/v1"),
});

export type CreateIdeaSchemaType = z.infer<typeof CreateIdeaSchema>;

export const registerEnv = registerAs("CreateIdea.ENV", () => {
  return CreateIdeaSchema.parse(process.env);
});

export function getEnvConfig(configService: ConfigService, context: string) {
  return configService.get("CreateIdea.ENV") as CreateIdeaSchemaType;
}

export type ENVConfig = ConfigType<typeof registerEnv>;
