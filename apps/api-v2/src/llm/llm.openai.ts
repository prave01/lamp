import OpenAI, { OpenAIError } from "openai";
import { getConfig } from "../config";
import { DbContext } from "./context/db.context";
import { db } from "../db";
import z from "zod";

import type { ToolCallMeta } from "./llm.types";
import { executor, ToolResolver } from "./tools/index";
import { ZodType } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { ToolRegistry } from "./tools/tools.registry";
import { Socket } from "socket.io";

const config = getConfig("openai");

const client = new OpenAI({
  apiKey: config.API_KEY,
  baseURL: config.BASE_URL,
});

export interface GenerateTextResult {
  text: string;
  toolCalls: Array<{ name: string; callId: string; arguments: string }>;
}

export const pending = new Map<
  string,
  { resolve: (ok: boolean) => void; sessionId: string }
>();

export const runLoop = async (
  query: string,
  systemPrompt: string,
  model: string,
  dbCtx: DbContext,
  socket: Socket,
  onEvent?: (event: OpenAI.Responses.ResponseStreamEvent) => void,
) => {
  const MAX_TURNS = 10;

  // prevent from adding system prompt muiltiple times
  const message = await db.query.messageTable.findFirst({
    where: {
      sessionId: dbCtx.sessionId,
      role: "system",
    },
  });

  const tools = ToolResolver([
    "createSandbox",
    "getUserFocusingSession",
    "createAgentContainer",
    "execCommand",
    "listSessionAgents",
  ]);

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

  let finalText: string | undefined;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const toolCallSet = new Map<string, ToolCallMeta>();
    const executedTools: GenerateTextResult["toolCalls"] = [];

    try {
      const stream = client.responses.stream({
        input: await dbCtx.load(),
        model: model,
        tools,
      });

      for await (const event of stream) {
        if (onEvent) {
          onEvent(event);
        }

        switch (event.type) {
          case "response.output_text.delta":
            // process.stdout.write(event.delta);
            break;

          case "response.output_text.done":
            finalText = event.text;
            break;

          case "response.output_item.added":
            if (event.item.type === "function_call" && event.item.id) {
              toolCallSet.set(event.item.id, {
                name: event.item.name,
                call_id: event.item.call_id,
              });
            }
            break;

          case "response.function_call_arguments.done": {
            const tool = toolCallSet.get(event.item_id);

            console.log("Tool call:", tool?.name);
            console.log("Args:", event.arguments);

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
            const result = await executor(
              tool.name as keyof typeof ToolRegistry,
              dbCtx.sessionId,
              socket,
              event.arguments,
              tool.call_id,
            );

            console.log("Tool call output", result);

            await dbCtx.append({
              name: tool.name,
              type: "function_call_output",
              call_id: tool.call_id,
              output: JSON.stringify(result),
            });

            executedTools.push({
              name: tool.name,
              callId: tool.call_id,
              arguments: event.arguments,
            });

            break;
          }

          case "response.incomplete":
            const message =
              event.response.error?.message ??
              "Model response incomplete for unknown reason.";
            throw new Error(message);

          case "response.failed": {
            const message =
              event.response.error?.message ?? "Model response failed.";
            throw new Error(message);
          }

          default:
            break;
        }
      }
    } catch (err) {
      if (err instanceof OpenAIError) {
        console.error("OpenAIError");
        throw err;
      }

      console.error(err);
      throw new Error("Error while llm generating");
    }

    if (toolCallSet.size === 0) {
      if (!finalText) {
        throw new Error("Stream completed with no response");
      }

      await dbCtx.append({
        type: "message",
        role: "assistant",
        content: finalText,
      });

      return {
        finalText,
        executedTools,
      };
    }
  }

  throw new Error(
    `Agent exceeded maximum of ${MAX_TURNS} turns without converging.`,
  );
};

export async function generateText<T extends ZodType>(
  query: string,
  systemPrompt: string,
  model: string,
  outputSchema: T,
): Promise<z.infer<T>> {
  const input: OpenAI.Responses.ResponseInput = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: query,
    },
  ];

  const output = await client.responses.parse({
    input,
    model,
    text: {
      format: zodTextFormat(outputSchema, "output-schema"),
    },
  });

  return output.output_parsed as z.infer<T>;
}
