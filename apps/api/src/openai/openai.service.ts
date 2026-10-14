import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { buildMessageHistory, type OpenAIInput } from '../libs/ai';
import { OPENAI_CONFIG, type OpenaiConfig } from './openai.module';
import { getTools } from '../tools/toolRegistry';
import { executor, LLM_TOOL } from '../libs/tool';
import {
  toResponseInputItem,
  toResponseInputItems,
} from 'openai/lib/responses/ResponseInputItems';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly openai: OpenAI;
  private conversationHistory: OpenAIInput;

  constructor(
    @Inject(OPENAI_CONFIG)
    private readonly config: OpenaiConfig,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  async generateText(
    input: string,
    tools: Array<string>,
    systemPrompt: string = this.config.systemPrompt ||
      'You are a helpful assistant.',
    modelName: string = this.config.modelName || 'gpt-4o-mini',
  ): Promise<string> {
    try {
      this.logger.log(`Generating text with model: ${modelName}`);
      this.logger.log(`Input ${input}`);

      this.conversationHistory = buildMessageHistory(
        'find how is praveen thanikachalam by using thr websearch tool',
        this.conversationHistory ?? [],
        `System prompt: ${systemPrompt} \n and never forget to use the tools you got, on the first response you are generating you should tell the user that you have this tool`,
      );

      this.logger.log(this.conversationHistory);

      const agentTools = getTools({
        agentId: 'core',
        tools: ['tool-websearch'],
      });

      const llmtool = LLM_TOOL(agentTools, 'openai');

      this.logger.log('LLM tools');
      this.logger.log(llmtool);

      while (true) {
        const stream = await this.openai.responses.create({
          input: this.conversationHistory ?? [],
          model: modelName,
          tools: llmtool,
          stream: true,
        });

        const toolCallSet = new Map<
          string,
          { name: string; call_id: string }
        >();
        let finalText = '';

        for await (const event of stream) {
          if (event.type === 'response.output_text.delta') {
            process.stdout.write(event.delta);
          }

          if (event.type === 'response.output_text.done') {
            finalText = event.text;
          }

          if (event.type === 'response.output_item.added') {
            if (
              event.item.type === 'function_call' &&
              event.item.name &&
              event.item.call_id
            ) {
              toolCallSet.set(event.item.id as string, {
                name: event.item.name,
                call_id: event.item.call_id,
              });
            }
          }

          if (event.type === 'response.function_call_arguments.done') {
            const tool = toolCallSet.get(event.item_id);
            if (!tool) continue;

            // 1. Append the completed function_call
            this.conversationHistory.push({
              type: 'function_call',
              id: event.item_id,
              call_id: tool.call_id,
              name: tool.name,
              arguments: event.arguments,
            });

            // 2. Execute tool
            let output: string;
            try {
              const result = await executor(
                'core',
                `tool-${tool.name}`,
                event.arguments,
              );
              output =
                typeof result === 'string' ? result : JSON.stringify(result);
            } catch (err) {
              output = JSON.stringify({ error: String(err) });
            }

            // 3. Append the output
            this.conversationHistory.push({
              type: 'function_call_output',
              call_id: tool.call_id,
              output,
            });
          }
        }

        // If no tools were called this turn, we're done
        if (toolCallSet.size === 0) {
          return finalText;
        }
      }
    } catch (err) {
      this.logger.error('Error generating text');
      this.logger.error(err);
      throw new Error('Error generating text', { cause: err });
    }
  }

  getConversationHistory(): OpenAIInput {
    return this.conversationHistory;
  }
}
