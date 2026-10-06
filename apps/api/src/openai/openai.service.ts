import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { buildMessageHistory } from '../libs/ai';
import { type ChatCompletionMessageParam } from 'openai/resources';
import { OPENAI_CONFIG, type OpenaiConfig } from './openai.module';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private readonly openai: OpenAI;
  private conversationHistory: ChatCompletionMessageParam[];

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

      // should remove the chat completions and move to responses api
      const response = await this.openai.chat.completions.create({
        messages: this.conversationHistory,
        model: this.config.modelName,
      });

      this.conversationHistory = [
        ...this.conversationHistory,
        {
          role: response.choices[0].message.role,
          content: response.choices[0].message.content,
        },
      ];

      const data = response.choices[0];

      if (!data.message.content) {
        throw new Error('No response generated');
      }

      return data.message.content;
    } catch (err) {
      this.logger.error('Error generating text');
      this.logger.error(err);
      throw new Error('Error generating text', { cause: err });
    }
  }

  getConversationHistory(): ChatCompletionMessageParam[] {
    return this.conversationHistory;
  }
}
