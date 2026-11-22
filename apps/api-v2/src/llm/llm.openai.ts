import OpenAI, { OpenAIError } from "openai";
import { getConfig } from "../config";
import { DbContext } from "./context/db.context";
import { db } from "../db";

import type { ToolCallMeta } from "./llm.types";

const config = getConfig("openai");

const client = new OpenAI({
  apiKey: config.API_KEY,
  baseURL: config.BASE_URL,
});

export interface GenerateTextResult {
  text: string;
  toolCalls: Array<{ name: string; callId: string; arguments: string }>;
}

export const runLoop = async (
  query: string,
  systemPrompt: string,
  model: string,
  dbCtx: DbContext,
) => {
  const MAX_TURNS = 2;

  // prevent from adding system prompt muiltiple times
  const message = await db.query.messageTable.findFirst({
    where: {
      sessionId: dbCtx.sessionId,
      role: "system",
    },
  });

  if (!message) {
    console.log("Added system prompt");

    await dbCtx.append({
      type: "message",
      role: "system",
      content: systemPrompt,
    });
  }

  await dbCtx.append({
    type: "message",
    content: query,
    role: "user",
  });

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const toolCallSet = new Map<string, ToolCallMeta>();
    const executedTools: GenerateTextResult["toolCalls"] = [];

    try {
      const stream = client.responses.stream({
        input: await dbCtx.load(),
        model: model,
      });

      for await (const event of stream) {
        switch (event.type) {
          case "response.output_text.delta":
            process.stdout.write(event.delta);
            break;

          case "response.output_item.added":
            if (event.item.type === "function_call" && event.item.id) {
              toolCallSet.set(event.item.id, {
                name: event.item.name,
                call_id: event.item.call_id,
              });
            }
            break;

          case "response.function_call_arguments.done":
            const tool = toolCallSet.get(event.item_id);

            if (!tool) {
              console.log(
                `No tool metadata for item_id = ${event.item_id}; skipping.`,
              );
              break;
            }

            await dbCtx.append({
              name: tool.name,
              type: "function_call",
              call_id: tool.call_id,
              arguments: event.arguments,
            });

          // executor goes here
        }
      }
    } catch (err) {
      if (err instanceof OpenAIError) {
        console.error("OpenAIError");
        throw err;
      }

      throw new Error("Error while llm generating");
    }
  }
};
