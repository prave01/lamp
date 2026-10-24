import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { OpenaiService, SessionEvent } from '../openai/openai.service';
import { DbContextManager } from '../openai/contextManager/dbcontext.manager';
import { type SessionConfig } from '../config';
import { Inject } from '@nestjs/common';

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
      client.emit('session:started', {
        sessionId: data.sessionId,
      });

      await this.openaiService.streamText(data.query, (event) => {
        client.emit('session:event', event);
      });
    } catch (err) {
      console.error('Gateway error:', err);
      console.error('Error message:', err instanceof Error ? err.message : err);
      console.error('Stack:', err instanceof Error ? err.stack : undefined);

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
    this.openaiService.createOpenAIInstance(
      'SessionGateway ',
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
