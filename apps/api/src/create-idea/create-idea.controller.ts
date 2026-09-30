import { Body, Controller, Logger, Post } from '@nestjs/common';
import { CreateIdeaService } from './create-idea.service';

@Controller('ideas')
export class CreateIdeaController {
  private readonly logger = new Logger(CreateIdeaController.name);

  constructor(private readonly createIdeaService: CreateIdeaService) { }

  @Post('generateIdea')
  getIdea(@Body() input: string): string {
    const res = this.createIdeaService.generateIdea(input);
    this.logger.log('Generated idea: ' + res);
    return `${res}`;
  }
}
