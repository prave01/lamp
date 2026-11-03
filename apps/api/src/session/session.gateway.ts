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
import { Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { getSession } from '../database';
import { ResponseStreamEvent } from 'openai/resources/responses/responses.js';

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
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: RunSessionDto,
  ) {
    try {
      const session = await getSession(data.sessionId);

      await this.openaiService.streamText(
        data.query,
        (event: ResponseStreamEvent) => {
          socket.emit('session:event', event);
        },
      );
    } catch (err) {
      this.logger.error(err);

      socket.emit('session:error', {
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
    try {
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
    } catch (err) {
      if (err instanceof Error) {
        this.handleError(err, client, false);
        throw new Error(err.message, {
          cause: err.cause,
        });
      }

      throw new InternalServerErrorException('Something went wrong');
    }
  }

  @SubscribeMessage('sessionlose')
  async closeSession(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      sessionId: string;
    },
  ) {
    client.emit('session:closed', {
      sessionId: data.sessionId,
    });
  }

  async handleError(error: Error, client: Socket, recoverable: boolean) {
    client.emit('session:error', {
      code: 'OPENAI_INSTANCE_FAILED',
      message: error.message ?? 'Something went wrong',
      recoverable,
    });
  }
}
