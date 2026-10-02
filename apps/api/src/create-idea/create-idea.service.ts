import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { registerEnv } from '../config';
import { type ConfigType } from '@nestjs/config';
import { OpenaiService } from '../openai/openai.service';

@Injectable()
export class CreateIdeaService implements OnModuleInit {
  private readonly logger = new Logger(CreateIdeaService.name);

  constructor(
    @Inject(registerEnv.KEY)
    private env: ConfigType<typeof registerEnv>,

    private readonly openaiService: OpenaiService,
  ) { }

  async onModuleInit() {
    this.logger.log('Generating some shit for testing');

    const response = await this.openaiService.generateText(
      'Create a whatsapp agent that can send messages to a user and respond to them',
    );

    this.logger.log('Done generating some shit for testing');

    this.logger.log('Here is the shitty response LOL', response);
  }
}
