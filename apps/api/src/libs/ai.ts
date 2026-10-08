import OpenAI from "openai";

export type OpenAIInput = OpenAI.Responses.ResponseInput;

export const buildMessageHistory = (
  lastUserMessage: string,
  conversationHistory: OpenAIInput = [],
  systemPrompt: string,
): OpenAIInput => {
  let updatedHistory: OpenAIInput;

  return (updatedHistory = [
    {
      role: "system",
      content: systemPrompt.toString(),
    },
    ...conversationHistory,
    {
      role: "user",
      content: lastUserMessage.toString(),
    },
  ]);
};
