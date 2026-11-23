import type OpenAI from "openai";
import z from "zod";

export const sessionMetaDataSchema = z.object({
  sessionId: z.uuid(),
  title: z.string().describe("Title for the session out of the query"),
  descrption: z
    .string()
    .describe("A clear concise descrption out of the query"),
});

export const createSessionSchema = z.object({
  query: z.string().min(2),
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
  event: z.custom<OpenAI.Responses.ResponseStreamEvent>(),
});

export const runSessionFinishedSchema = z.object({
  sessionId: z.uuid(),
});

export const sessionsSchema = z.object({
  sessions: z.array(
    z.object({
      id: z.uuid(),
      title: z.string(),
      description: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
});

export const sessionMessagesSchema = z.object({
  messages: z.array(
    z.object({
      id: z.uuid(),
      sessionId: z.uuid(),
      role: z.enum(["system", "user", "assistant", "developer"]),
      type: z.enum(["message", "function_call", "function_call_output"]),
      content: z.string().nullable(),
      name: z.string().nullable(),
      callId: z.string().nullable(),
      arguments: z.string().nullable(),
      status: z.string().nullable(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    }),
  ),
});

export const listSesssionMessages = z.object({
  sessionId: z.uuid(),
});

export type sessionMetaData = z.infer<typeof sessionMetaDataSchema>;

export interface ClientToServerEvents {
  "client:session:create": (data: z.infer<typeof createSessionSchema>) => void;
  "client:session:run": (data: z.infer<typeof runSessionSchema>) => void;
  "client:session:list": () => void;
  "client:session:messages": (
    data: z.infer<typeof listSesssionMessages>,
  ) => void;
}

export interface ServerToClientEvents {
  "server:session:created": (data: sessionMetaData) => void;
  "server:session:error": (data: z.infer<typeof socketErrorSchema>) => void;
  "server:session:run:event": (
    data: z.infer<typeof runSessionEventSchema>,
  ) => void;
  "server:session:run:finished": (
    data: z.infer<typeof runSessionFinishedSchema>,
  ) => void;
  "server:session:list": (data: z.infer<typeof sessionsSchema>) => void;
  "server:session:messages": (
    data: z.infer<typeof sessionMessagesSchema>,
  ) => void;
}
