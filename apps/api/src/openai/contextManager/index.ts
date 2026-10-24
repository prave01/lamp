import OpenAI from "openai";

export interface ContextManager {
  load(): Promise<OpenAI.Responses.ResponseInputItem[]>;
  append(item: OpenAI.Responses.ResponseInputItem): Promise<void>;
  clear(): Promise<string>;
}
