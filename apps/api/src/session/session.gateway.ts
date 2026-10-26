import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { OpenaiService } from '../openai/openai.service';
import { DbContextManager } from '../openai/contextManager/dbcontext.manager';
import { type SessionConfig } from '../config';
import { Inject, Logger } from '@nestjs/common';
import { getSession } from '../database';

type RunSessionDto = {
  sessionId: string;
  query: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SessionGateway {
  private readonly logger = new Logger(SessionGateway.name);

  constructor(
    private readonly openaiService: OpenaiService,

    @Inject('session_config')
    private env: SessionConfig,
  ) { }

  @SubscribeMessage('session:run')
  async runSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RunSessionDto,
  ) {
    try {
      const session = await getSession(data.sessionId);

      await client.emit('session:started', {
        sessionId: data.sessionId,
      });

      await this.openaiService.streamText(data.query, (event) => {
        client.emit('session:event', event);
      });
    } catch (err) {
      this.logger.error(err);

      client.emit('session:error', {
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('session:create_instance')
  async initSession(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      sessionId: string;
    },
  ) {
    await this.openaiService.createOpenAIInstance(
      'SessionGateway',
      this.env.SESSION_OPENROUTER_KEY,
      this.env.SESSION_OPENROUTER_BASE_URL,
      this.env.SESSION_SYSTEM_PROMPT,
      this.env.SESSION_MODEL_NAME,
      new DbContextManager(data.sessionId),
    );

    client.emit('session:initiated', {
      sessionId: data.sessionId,
    });
  }
}
