import OpenAI from "openai";
import { ZodType, toJSONSchema } from "zod";

export function toOpenAITool(definition: {
  name: string;
  description: string;
  schema: ZodType;
}): OpenAI.Responses.Tool {
  return {
    name: definition.name,
    type: "function" as const,
    description: definition.description,
    parameters: toJSONSchema(definition.schema),
    strict: false,
  };
}
