import z from "zod";

export const sessionMetaDataSchema = z.object({
  sessionId: z.uuid(),
  title: z.string().describe("Title for the session out of the query"),
  descrption: z
    .string()
    .describe("A clear concise descrption out of the query"),
});

export const createSessionSchema = z.object({
  query: z.string().min(5),
});

export const socketErrorSchema = z.object({
  message: z.string(),
  errors: z.record(z.string(), z.array(z.string())),
});

export const runSessionSchema = z.object({
  sessionId: z.uuid(),
  query: z.string(),
});

export const runSessionEventSchema = z.object({
  text_delta: z.string(),
});

export type sessionMetaData = z.infer<typeof sessionMetaDataSchema>;

export interface ClientToServerEvents {
  "session:create": (data: z.infer<typeof createSessionSchema>) => void;
  "session:run": (data: z.infer<typeof runSessionSchema>) => void;
}

export interface ServerToClientEvents {
  "session:created": (data: sessionMetaData) => void;
  "session:error": (data: z.infer<typeof socketErrorSchema>) => void;
  "session:run:event": (data: z.infer<typeof runSessionEventSchema>) => void;
}
