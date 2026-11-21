import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ZodObject } from 'zod';
import pc from 'picocolors';
import { ContextManager } from './contextManager';
import { ResponseStreamEvent } from 'openai/resources/responses/responses.js';
import { db } from '../database';
import { type OpenaiConfig } from '../config';
import { ToolsService } from '../tools/tools.service';

export interface GenerateTextResult {
  text: string;
  toolCalls: Array<{ name: string; callId: string; arguments: string }>;
}

interface ToolCallMeta {
  name: string;
  call_id: string;
}

export type SessionEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'tool-start'; toolName: string }
  | { type: 'tool-complete'; toolName: string }
  | { type: 'status'; status: string };

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);

  private openai: OpenAI;

  private llmTool: OpenAI.Responses.Tool[];

  constructor(
    @Inject('openai_config')
    private readonly env: OpenaiConfig,

    private readonly toolService: ToolsService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.env.API_KEY,
      baseURL: this.env.BASE_URL,
    });

    const tool = this.toolService.toolResolver({
      agentId: 'core',
      tools: ['tool-websearch', 'tool-create_container'],
    });

    this.llmTool = this.toolService.toLLMTool(tool);
  }

  async streamText(
    context: ContextManager,
    query: string,
    model: string,
    systemPrompt: string,
    onEvent?: (event: ResponseStreamEvent) => void,
  ): Promise<GenerateTextResult> {
    console.log('Started run!!');

    const message = await db.query.messageTable.findFirst({
      where: {
        role: 'system',
      },
    });

    if (!message) {
      console.log('Added system message');

      context.append({
        type: 'message',
        role: 'system',
        content: systemPrompt,
      });
    }

    await context.append({
      type: 'message',
      role: 'user',
      content: query,
    });

    const MAX_TURNS = 2;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const toolCallSet = new Map<string, ToolCallMeta>();

      const executedTools: GenerateTextResult['toolCalls'] = [];

      let finalText: string | undefined;

      const input = await context.load();

      try {
        const stream = this.openai.responses.stream({
          input,
          model,
          tools: this.llmTool,
          stream: true,
        });

        for await (const event of stream) {
          if (onEvent) {
            onEvent(event);
          }

          switch (event.type) {
            case 'response.output_text.delta':
              process.stdout.write(pc.cyan(event.delta));
              break;

            case 'response.output_text.done':
              console.log('Fineal response', event.text);
              finalText = event.text;
              break;

            case 'response.output_item.added':
              if (event.item.type === 'function_call' && event.item.id) {
                toolCallSet.set(event.item.id, {
                  name: event.item.name,
                  call_id: event.item.call_id,
                });
              }
              break;

            case 'response.function_call_arguments.done': {
              const tool = toolCallSet.get(event.item_id);

              if (!tool) {
                this.logger.warn(
                  `No tool metadata for item_id = ${event.item_id}; skipping.`,
                );
                break;
              }

              await context.append({
                type: 'function_call',
                name: tool.name,
                arguments: event.arguments,
                call_id: tool.call_id,
              });

              const output = await this.executeToolSafely(
                tool.name,
                event.arguments,
              );

              await context.append({
                type: 'function_call_output',
                call_id: tool.call_id,
                name: tool.name,
                output: output.toString(),
              });

              executedTools.push({
                name: tool.name,
                callId: tool.call_id,
                arguments: event.arguments,
              });
              break;
            }

            case 'response.incomplete': {
              const message =
                event.response.error?.message ??
                'Model response incomplete for unknown reason.';
              this.logger.error(`Stream incomplete: ${message} `);
              throw new ServiceUnavailableException(message);
            }

            case 'response.failed': {
              const message =
                event.response.error?.message ?? 'Model response failed.';
              this.logger.error(`Stream failed: ${message} `);
              throw new InternalServerErrorException(message);
            }

            default:
              break;
          }
        }
      } catch (err) {
        if (err instanceof ServiceUnavailableException) throw err;
        if (err instanceof InternalServerErrorException) throw err;

        throw new InternalServerErrorException(
          'Failed to generate response from model.',
          { cause: err },
        );
      }

      // No tools invoked this turn → we have the final answer.
      if (toolCallSet.size === 0) {
        if (!finalText) {
          this.logger.warn('Stream completed with no text and no tool calls.');
          throw new InternalServerErrorException('Model produced no output.');
        }

        await context.append({
          type: 'message',
          role: 'assistant',
          id: `msg_${Date.now()} `,
          status: 'completed',
          content: finalText,
        });

        return { text: finalText, toolCalls: executedTools };
      }
    }

    throw new InternalServerErrorException(
      `Agent exceeded maximum of ${MAX_TURNS} turns without converging.`,
    );
  }

  async generateText(
    systemPrompt: string,
    outputSchema: ZodObject,
    model: string,
    query: string,
  ) {
    try {
      const messages: any = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: query,
        },
      ];

      const responses = await this.openai.responses.parse({
        input: messages,
        model: model,
        text: {
          format: zodTextFormat(outputSchema, 'generate-session'),
        },
      });

      return responses.output_parsed;
    } catch (err) {
      throw err;
    }
  }

  /** Executes a tool and normalizes failures into a JSON error payload. */
  private async executeToolSafely(
    toolName: string,
    args: string,
  ): Promise<string> {
    try {
      const result = await this.toolService.executor(
        'core',
        `tool-${toolName}`,
        args,
      );
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (err) {
      this.logger.error(
        `Tool "${toolName}" failed: ${(err as Error).message} `,
        (err as Error).stack,
      );
      return JSON.stringify({ error: (err as Error).message });
    }
  }
}
