import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('idea')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) { }

  @Post('create-session')
  async createIdea(
    @Body()
    input: {
      query: string;
    },
  ) {
    try {
      const res = await this.sessionService.createSession(
        'I wanna create a whatsapp agent that can automate my customer care message',
      );

      this.logger.log({ input });

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
