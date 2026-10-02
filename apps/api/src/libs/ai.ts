import { type ChatCompletionMessageParam } from "openai/resources.mjs";

export const buildMessageHistory = (
  lastUserMessage: string,
  conversationHistory: ChatCompletionMessageParam[] = [],
  systemPrompt: string,
): ChatCompletionMessageParam[] => {
  let updatedHistory: ChatCompletionMessageParam[];

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
