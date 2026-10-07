import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { buildMessageHistory } from '../libs/ai';
import { OPENAI_CONFIG, type OpenaiConfig } from './openai.module';
import { type ResponseInput } from 'openai/resources/responses/responses';
import { getTools } from '../tools/toolRegistry';
import { AgentToolRequest, executor, LLM_TOOL } from '../libs/tool';
import {
  toResponseInputItem,
  toResponseInputItems,
} from 'openai/lib/responses/ResponseInputItems.mjs';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly openai: OpenAI;
  private conversationHistory: ResponseInput;

  constructor(
    @Inject(OPENAI_CONFIG)
    private readonly config: OpenaiConfig,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  async generateText(input: string): Promise<string> {
    try {
      this.conversationHistory = buildMessageHistory(
        input,
        this.conversationHistory ?? [],
        'Act like a conversational bot',
      );

      this.logger.log(this.conversationHistory);

      const tools = getTools({
        tools: ['tool-websearch'],
        agentId: 'all',
      });

      const llmtool = LLM_TOOL(tools, 'openai');

      this.logger.log('LLM tools', llmtool);

      while (true) {
        const response = await this.openai.responses.create({
          input: this.conversationHistory ?? [],
          model: this.config.modelName,
          tools: llmtool,
        });

        const toolCalls = response.output.filter(
          (i) => i.type === 'function_call',
        );

        if (toolCalls.length === 0) {
          this.conversationHistory = [
            ...this.conversationHistory,
            ...toResponseInputItems(response.output),
          ];

          return response.output_text;
        }

        this.conversationHistory = [...this.conversationHistory, ...toolCalls];

        for (const call of toolCalls) {
          this.logger.log('Tool call is happening');
          this.logger.log(call.name);
          const args = JSON.parse(call.arguments);
          const toolResult = await executor('tool-websearch', args);
          this.conversationHistory.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: String(toolResult),
          });
        }
      }
    } catch (err) {
      this.logger.error('Error generating text');
      this.logger.error(err);
      throw new Error('Error generating text', { cause: err });
    }
  }

  getConversationHistory(): ResponseInput {
    return this.conversationHistory;
  }
}
