import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SessionService } from './session.service';
import { input } from 'zod';

@Controller('idea')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) { }

  @Post('create-session')
  async createSession(
    @Body()
    input: {
      query: string;
    },
  ) {
    try {
      const res = await this.sessionService.createSession(input.query);
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

  @Post('run-session')
  async runSesssion(
    @Body()
    input: {
      query: string;
      sessionId: string;
    },
  ) {
    try {
      const response = await this.sessionService.runSession(
        input.query,
        input.sessionId,
      );

      this.logger.log(response);

      return response;
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
