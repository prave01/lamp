import { Body, Controller, HttpStatus, Logger, Post } from '@nestjs/common';
import { SessionService } from './session.service';
import {
  type CreateSession,
  type RunSessionBody,
  CreateSessionSchema,
  RunSessionSchema,
} from './types';
import { SessionControllerError } from './session.error';
import { getSession } from '../database';

@Controller('idea')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) { }

  @Post('create-session')
  async createSession(
    @Body()
    input: CreateSession,
  ) {
    const { data, success, error } = CreateSessionSchema.safeParse(input);

    if (!success) {
      throw new SessionControllerError(
        'INVALID_INPUT',
        HttpStatus.BAD_REQUEST,
        error.issues,
      );
    }

    const res = await this.sessionService.createSession(data.query);

    return {
      success: true,
      sessionId: res.sessionId,
    };
  }

  @Post('run-session')
  async runSesssion(
    @Body()
    input: RunSessionBody,
  ) {
    const { data, success, error } = RunSessionSchema.safeParse(input);

    if (!success) {
      throw new SessionControllerError(
        'INVALID_INPUT',
        HttpStatus.BAD_REQUEST,
        error.issues,
      );
    }

    const session = getSession(input.sessionId);

    // half ass lol
  }
}
