import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { registerEnv } from '../config';
import { type ConfigType } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class CreateIdeaService implements OnModuleInit {
  private openai: OpenAI;
  private readonly logger = new Logger(CreateIdeaService.name);

  constructor(
    @Inject(registerEnv.KEY)
    private env: ConfigType<typeof registerEnv>,
  ) {
    //OpenAI Configuration
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.env.OPENROUTER_KEY,
      defaultHeaders: {
        'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
        'X-OpenRouter-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
      },
    });
  }

  onModuleInit() {
    this.generateIdea(
      'Create a whatsapp messaging agent that can talk to my client behalf of me',
    );
  }

  async generateIdea(input: string) {
    try {
      const res = await this.openai.chat.completions.create({
        model: this.env.MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: this.env.SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: input,
          },
        ],
      });

      this.logger.log(
        `Response from OpenAI: ${res.choices[0].message.content}`,
      );
    } catch (err) {
      this.logger.error(err);
    }
  }
}
