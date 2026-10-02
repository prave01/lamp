import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { buildMessageHistory } from '../libs/ai';
import { type ChatCompletionMessageParam } from 'openai/resources';
import { OPENAI_CONFIG, type OpenaiConfig } from './openai.module';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private openai: OpenAI;
  private conversationHistory: ChatCompletionMessageParam[];

  constructor(
    @Inject(OPENAI_CONFIG)
    private readonly config: OpenaiConfig,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
    });
  }

  async generateText(input: string) {
    try {
      this.conversationHistory = buildMessageHistory(
        input,
        [],
        this.config.sytemPrompt,
      );

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

      return response.choices[0].message.content;
    } catch (err) { }
  }
}
