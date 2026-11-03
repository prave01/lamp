import z from "zod";

export const CreateSessionSchema = z.object({
  query: z.string(),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;

export const RunSessionSchema = z.object({
  query: z.string(),
  sessionId: z.string(),
});

export type RunSessionBody = z.infer<typeof RunSessionSchema>;
