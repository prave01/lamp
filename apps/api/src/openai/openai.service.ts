import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ServiceUnavailableException,
  Scope,
} from "@nestjs/common";
import OpenAI from "openai";
import { executor } from "../libs/tool";
import { OpenAIInput } from "../libs/ai";
import { zodTextFormat } from "openai/helpers/zod";
import { ZodObject, z } from "zod";
import pc from "picocolors";
import { ContextManager } from "./contextManager";
import { db } from "../database";

/** Shape returned to the caller on success. */
export interface GenerateTextResult {
  text: string;
  /** Populated when the model invoked tools during the turn. */
  toolCalls: Array<{ name: string; callId: string; arguments: string }>;
}

/** Internal record used to correlate streamed function-call events. */
interface ToolCallMeta {
  name: string;
  call_id: string;
}

export type SessionEvent =
  | { type: "text-delta"; delta: string }
  | { type: "tool-start"; toolName: string }
  | { type: "tool-complete"; toolName: string }
  | { type: "status"; status: string };

@Injectable({
  scope: Scope.TRANSIENT,
})
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private conversationHistory: OpenAI.Responses.ResponseInputItem[] = [];

  private openai: OpenAI;

  public isInstanceCreated: boolean;

  private agentID: string;
  private llmTool: OpenAI.Responses.Tool[];
  private model: string;
  private name: string;

  private apiKey: string;
  private baseUrl: string;
  private systemPrompt: string;
  private outputSchema: ZodObject;
  private serviceName: string;
  private context: ContextManager;

  constructor() { }

  async createOpenAIInstance(
    serviceName: string,
    apiKey: string,
    baseUrl: string,
    systemPrompt: string,
    modelName: string,
    context: ContextManager,
  ) {
    if (apiKey && baseUrl && systemPrompt && serviceName) {
      this.apiKey = apiKey;
      this.baseUrl = baseUrl;
      this.systemPrompt = systemPrompt;
      this.model = modelName;
      this.serviceName = serviceName;

      this.context = context;

      this.openai = new OpenAI({
        baseURL: this.baseUrl,
        apiKey: this.apiKey,
      });

      await this.context.append({
        role: "system",
        content: this.systemPrompt,
      });

      this.isInstanceCreated = true;

      this.logger.log(
        `OpenAI instance created for ${pc.bgBlue(pc.black(serviceName))}`,
      );

      return;
    }
  }

  async streamText(
    query: string,
    onEvent?: (event: SessionEvent) => void,
  ): Promise<GenerateTextResult> {
    if (!this.isInstanceCreated) {
      throw new Error("Please create an OpenAI instance");
    }

    await this.context.append({
      role: "user",
      content: query,
    });

    const MAX_TURNS = 10;

    this.logger.log(
      `conversationHistory of ${this.serviceName}:\n` +
      JSON.stringify(await this.context.load(), null, 2),
    );

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const toolCallSet = new Map<string, ToolCallMeta>();
      const executedTools: GenerateTextResult["toolCalls"] = [];
      let finalText: string | undefined;

      try {
        const stream = await this.openai.responses.stream({
          input: await this.context.load(),
          model: this.model,
          tools: this.llmTool,
          stream: true,
        });

        for await (const event of stream) {
          switch (event.type) {
            case "response.output_text.delta":
              process.stdout.write(pc.cyan(event.delta));
              if (onEvent) {
                onEvent({
                  type: "text-delta",
                  delta: event.delta,
                });
              }
              break;

            case "response.output_text.done":
              console.log("\n");
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
              if (!tool) {
                this.logger.warn(
                  `No tool metadata for item_id = ${event.item_id}; skipping.`,
                );
                break;
              }

              await this.context.append({
                type: "function_call",
                id: event.item_id,
                call_id: tool.call_id,
                name: tool.name,
                arguments: event.arguments,
              });

              const output = await this.executeToolSafely(
                tool.name,
                event.arguments,
              );

              await this.context.append({
                type: "function_call_output",
                call_id: tool.call_id,
                output,
              });

              executedTools.push({
                name: tool.name,
                callId: tool.call_id,
                arguments: event.arguments,
              });
              break;
            }

            case "response.incomplete": {
              const message =
                event.response.error?.message ??
                "Model response incomplete for unknown reason.";
              this.logger.error(`Stream incomplete: ${message} `);
              throw new ServiceUnavailableException(message);
            }

            case "response.failed": {
              const message =
                event.response.error?.message ?? "Model response failed.";
              this.logger.error(`Stream failed: ${message} `);
              throw new InternalServerErrorException(message);
            }

            default:
              break;
          }
        }
      } catch (err) {
        // Re-throw Nest exceptions untouched so the filter can format them.
        if (err instanceof ServiceUnavailableException) throw err;
        if (err instanceof InternalServerErrorException) throw err;

        this.logger.error(
          `Error while streaming from OpenAI: ${(err as Error).message} `,
          (err as Error).stack,
        );
        throw new InternalServerErrorException(
          "Failed to generate response from model.",
          { cause: err },
        );
      }

      // No tools invoked this turn → we have the final answer.
      if (toolCallSet.size === 0) {
        if (!finalText) {
          this.logger.warn("Stream completed with no text and no tool calls.");
          throw new InternalServerErrorException("Model produced no output.");
        }

        this.logger.log(`Final text ${finalText}`);

        await this.context.append({
          type: "message",
          role: "assistant",
          id: `msg_${Date.now()} `,
          status: "completed",
          content: [{ type: "output_text", text: finalText, annotations: [] }],
        });

        this.logger.log(await this.context.load());

        return { text: finalText, toolCalls: executedTools };
      }

      // Otherwise: loop again with tool outputs appended to history.
      this.logger.debug(
        `Turn ${turn + 1} produced ${toolCallSet.size} tool call(s); continuing.`,
      );
    }

    this.logger.error(`Exceeded ${MAX_TURNS} turns without final answer.`);
    throw new InternalServerErrorException(
      `Agent exceeded maximum of ${MAX_TURNS} turns without converging.`,
    );
  }

  async generateText(
    input: string,
    systemPrompt: string,
    outputSchema: ZodObject,
    model: string,
  ) {
    try {
      const messages: OpenAIInput = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: input,
        },
      ];

      const responses = await this.openai.responses.parse({
        input: messages,
        model: model,
        text: {
          format: zodTextFormat(outputSchema, "generate-session"),
        },
      });

      return responses.output_parsed;
    } catch (err) {
      throw new Error(err as string);
    }
  }

  /** Executes a tool and normalizes failures into a JSON error payload. */
  private async executeToolSafely(
    toolName: string,
    args: string,
  ): Promise<string> {
    try {
      const result = await executor("core", `tool - ${toolName} `, args);
      return typeof result === "string" ? result : JSON.stringify(result);
    } catch (err) {
      this.logger.error(
        `Tool "${toolName}" failed: ${(err as Error).message} `,
        (err as Error).stack,
      );
      return JSON.stringify({ error: (err as Error).message });
    }
  }

  getConversationHistory(): OpenAI.Responses.ResponseInputItem[] {
    return this.conversationHistory;
  }
}
