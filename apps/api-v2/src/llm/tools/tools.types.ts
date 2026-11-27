import { Socket } from "socket.io";
import type OpenAI from "openai";
import { z, ZodType } from "zod";
import { ClientToServerEvents, ServerToClientEvents } from "@repo/shared";

export type ToolDefinition<T extends ZodType> = {
  name: string;
  description: string;
  inputSchema: T;
  execute: (
    input: z.infer<T>,
    ctx?: {
      socket: Socket<ClientToServerEvents, ServerToClientEvents>;
      callId: string;
    },
  ) => Promise<any> | any;
};

export type ExtendedTool<T extends ZodType> = OpenAI.Responses.FunctionTool & {
  inputSchema: T;
  execute: ToolDefinition<T>["execute"];
};
