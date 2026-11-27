import type OpenAI from "openai";
import z from "zod";
import { output } from "zod/mini";

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

export const handleHITL = z.object({
  approvalId: z.string(),
  tool: z.object({
    name: z.string(),
    description: z.string(),
    args: z.unknown(),
  }),
});

export const handleHITLConsent = z.object({
  approvalId: z.string(),
  approved: z.boolean(),
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

export const sandboxWatchUnwatch = z.object({
  sandboxId: z.string(),
});

export const changeUserFocusSession = z.object({
  sessionId: z.string(),
});

export const toolRan = z.object({
  name: z.string(),
  sessionId: z.string(),
  callId: z.string(),
});

export const execLog = z.object({
  callId: z.string(),
  text: z.string(),
});

export const execDone = z.object({
  callId: z.string(),
  output: z.string(),
});

export type sessionMetaData = z.infer<typeof sessionMetaDataSchema>;

export interface ClientToServerEvents {
  "client:session:create": (data: z.infer<typeof createSessionSchema>) => void;
  "client:session:run": (data: z.infer<typeof runSessionSchema>) => void;
  "client:session:list": () => void;
  "client:session:messages": (
    data: z.infer<typeof listSesssionMessages>,
  ) => void;
  "client:tool:hitl": (data: z.infer<typeof handleHITLConsent>) => void;
  "client:sandbox:watch": (data: z.infer<typeof sandboxWatchUnwatch>) => void;
  "client:sandbox:unwatch": (data: z.infer<typeof sandboxWatchUnwatch>) => void;
  "client:session:changeFocus": (
    data: z.infer<typeof changeUserFocusSession>,
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
  "server:tool:hitl": (data: z.infer<typeof handleHITL>) => void;
  "server:tool:ran": (data: z.infer<typeof toolRan>) => void;
  "server:tool:exec:log": (data: z.infer<typeof execLog>) => void;
  "server:tool:exec:done": (data: z.infer<typeof execDone>) => void;
}
