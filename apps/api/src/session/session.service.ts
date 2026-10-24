import { Injectable, Logger, Inject } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service';
import { db } from '../database';
import { messageTable, sessionTable } from '../database/schema';
import z from 'zod';
import { type SessionConfig } from '../config';
import { DbContextManager } from '../openai/contextManager/dbcontext.manager';
import { eq } from 'drizzle-orm';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private openaiService = new OpenaiService();

  private sessionId: string;

  constructor(
    @Inject('session_config')
    private env: SessionConfig,
  ) { }

  async createSession(query: string) {
    try {
      const response = await this.openaiService.generateText(
        query,
        'Generate session metadata',
        z.object({
          title: z.string().describe('Title for the session'),
          description: z.string().describe('Description about the session'),
        }),
        'gpt-4o-mini',
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
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('Error while creating session');
    }
  }

  async runSession(query: string, sessionId: string) {
    const session = await db.query.sessionTable.findFirst({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new Error('Please create a session first');
    }

    const res = await db.query.sessionTable.findFirst();

    const response = await this.openaiService.streamText(query);

    return response;
  }
}
