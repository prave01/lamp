import { Inject, Injectable, Logger } from '@nestjs/common';
import { registerEnv } from '../config';
import { type ConfigType } from '@nestjs/config';
import { OpenaiService } from '../openai/openai.service';
import { CreateIdeaSchema, CreateIdeaSchemaType } from './dto/create-idea.dto';

@Injectable()
export class CreateIdeaService {
  private readonly logger = new Logger(CreateIdeaService.name);

  constructor(
    @Inject(registerEnv.KEY)
    private env: ConfigType<typeof registerEnv>,

    private readonly openaiService: OpenaiService,
  ) { }

  async generateIdea(input: CreateIdeaSchemaType): Promise<string> {
    try {
      const parse = CreateIdeaSchema.safeParse(input);

      if (!parse.success) throw new Error(parse.error.message);

      const response = await this.openaiService.generateText(parse.data.idea);

      this.logger.log(`Generated idea: ${response}`);

      return response;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
      throw new Error('Unkown error');
    }
  }
}
