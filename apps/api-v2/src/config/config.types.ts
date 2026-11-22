import { validateENVs } from ".";

export type AppConfig = ReturnType<typeof validateENVs>;

export type OpenAIConfig = Pick<AppConfig, "API_KEY" | "BASE_URL">;

export type ServerConfig = Pick<AppConfig, "PORT">;

export type ConfigMap = {
  openai: OpenAIConfig;
  server: ServerConfig;
};
