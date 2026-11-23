import type OpenAI from "openai";
import { z, ZodType } from "zod";

export type ToolDefinition<T extends ZodType> = {
  name: string;
  id: string;
  description: string;
  inputSchema: T;
  execute: (input: z.infer<T>) => Promise<any> | any;
};

export type ExtendedTool<T extends ZodType> = OpenAI.Responses.FunctionTool & {
  inputSchema: T;
  execute: ToolDefinition<T>["execute"];
};
