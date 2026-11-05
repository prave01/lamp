import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service';
import { db } from '../database';
import { sessionTable } from '../database/schema';
import z from 'zod';
import { OpenAIError } from 'openai';
import { DrizzleError } from 'drizzle-orm';
import { type SessionConfig } from '../config';
import { AiServiceError, PersistenceError } from './session.error';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private openaiService = new OpenaiService();

  constructor(
    @Inject('session_config')
    private env: SessionConfig,
  ) {
    this.openaiService.createOpenAIInstance(
      'SessionService',
      this.env.SESSION_OPENROUTER_KEY,
      this.env.SESSION_OPENROUTER_BASE_URL,
      this.env.SESSION_SYSTEM_PROMPT,
      this.env.SESSION_MODEL_NAME,
    );
  }

  async createSession(query: string) {
    try {
      const response = await this.openaiService.generateText(
        query,
        'Generate session metadata',
        z.object({
          title: z.string().describe('Title for the session'),
          description: z.string().describe('Description about the session'),
        }),
        this.env.SESSION_MODEL_NAME,
      );

      const db_response = await db
        .insert(sessionTable)
        .values({
          title: response?.title as string,
          description: response?.description as string,
        })
        .returning();

      this.logger.log({
        inserted: db_response,
      });

      return {
        sessionId: db_response[0].id,
        title: db_response[0].title,
        description: db_response[0].description,
      };
    } catch (err) {
      if (err instanceof OpenAIError) {
        throw new AiServiceError(err.message, err.cause);
      }

      if (err instanceof DrizzleError) {
        throw new PersistenceError(err.message, err.cause);
      }

      throw err;
    }
  }
}
('');
