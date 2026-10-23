import { Injectable, Logger, Inject } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service';
import { db } from '../database';
import { sessionTable } from '../database/schema';
import {
  registerSessionEnv,
  SessionOutputSchemaType,
  type SessionConfig,
} from '../config';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private openaiService: OpenaiService,

    @Inject('session_config')
    private env: SessionConfig,
  ) {
    this.openaiService.createOpenAIInstance(
      'SessionService',
      this.env.SESSION_OPENROUTER_KEY,
      this.env.SESSION_OPENROUTER_BASE_URL,
      this.env.SESSION_SYSTEM_PROMPT,
      this.env.SESSION_MODEL_NAME,
      this.env.SESSION_OUTPUT_SCHEMA,
    );
  }

  async createSession(query: string) {
    try {
      const response = await this.openaiService.streamText(query);

      const parsed_data: SessionOutputSchemaType = JSON.parse(response.text);

      const db_response = await db
        .insert(sessionTable)
        .values({
          title: parsed_data.title,
          description: parsed_data.description,
        })
        .returning();

      this.logger.log({
        inserted: db_response,
      });

      return db_response;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('Error while creating session');
    }
  }
}
