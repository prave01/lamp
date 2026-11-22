import z from "zod";

export const OpenaiEnvSchema = z.object({
  API_KEY: z.string().min(1),
  BASE_URL: z.string().url(),
});

export const ServerEnvSchema = z.object({
  PORT: z.string().min(2).max(4).default("4001"),
});
