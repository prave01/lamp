import { Inject, Injectable, Logger } from '@nestjs/common';
import { registerEnv } from '../config';
import { type ConfigType } from '@nestjs/config';
import { OpenaiService } from '../openai/openai.service';

@Injectable()
export class CreateIdeaService {
  private readonly logger = new Logger(CreateIdeaService.name);

  constructor(
    @Inject(registerEnv.KEY)
    private env: ConfigType<typeof registerEnv>,

    private readonly openaiService: OpenaiService,
  ) { }
}
