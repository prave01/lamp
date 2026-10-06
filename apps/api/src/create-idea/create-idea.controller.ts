import { Body, Controller, Logger, Post } from '@nestjs/common';
import { CreateIdeaService } from './create-idea.service';
import { type CreateIdeaSchemaType } from './dto/create-idea.dto';

@Controller('idea')
export class CreateIdeaController {
  private readonly logger = new Logger(CreateIdeaController.name);

  constructor(private readonly createIdeaService: CreateIdeaService) { }

  @Post('create-idea')
  async createIdea(
    @Body()
    body: CreateIdeaSchemaType,
  ) {
    try {
      const res = await this.createIdeaService.generateIdea(body);
      return res;
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(err);
        throw new Error(err.message);
      }
      this.logger.error('Internal Server Error: 500');
      throw new Error('Internal Server Error: 500');
    }
  }
}
