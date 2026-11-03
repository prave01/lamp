import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { OpenaiService } from '../openai/openai.service';
import { DbContextManager } from '../openai/contextManager/dbcontext.manager';
import { type SessionConfig } from '../config';
import {
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { getSession } from '../database';
import { ResponseStreamEvent } from 'openai/resources/responses/responses.js';
import { WebSocketError } from './session.error';
import { type CreateSession } from './types';
import { SessionService } from './session.service';

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
    private readonly sessionService: SessionService,

    @Inject('session_config')
    private env: SessionConfig,
  ) { }

  @SubscribeMessage('session:create-session')
  async createSession(
    @ConnectedSocket() socket: Socket,
    @MessageBody() event: CreateSession,
  ) {
    try {
      console.log(this.openaiService.isInstanceCreated);

      const session = await this.sessionService.createSession(event.query);

      if (!session) {
        throw new WebSocketError({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Session not created ',
          recoverable: true,
        });
      }

      socket.emit('session:created', {
        sessionId: session.sessionId,
        title: session.title,
        description: session.description,
      });
    } catch (err) {
      if (err instanceof WebSocketError) {
        this.logger.error({
          err,
        });

        throw err;
      }

      this.logger.error({
        message: 'Error while creating session',
        err,
      });

      throw new WebSocketError({
        message: 'Error while creating session',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        recoverable: true,
      });
    }
  }

  @SubscribeMessage('session:run')
  async runSession(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: RunSessionDto,
  ) {
    try {
      const session = await getSession(data.sessionId);

      if (!session)
        throw new WebSocketError({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,

          message: `Session not found for ${data.sessionId}`,
        });

      await this.openaiService.streamText(
        data.query,
        (event: ResponseStreamEvent) => {
          socket.emit('session:event', event);
        },
      );
    } catch (err) {
      if (err instanceof WebSocketError) {
        throw new Error(err.message, {
          cause: err.cause,
        });
      }

      if (err instanceof Error) {
        throw new Error(err.message, {
          cause: err.cause,
        });
      }

      throw new InternalServerErrorException('Unknown Error');
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
      if (err instanceof WebSocketError) {
        throw new Error(err.message);
      }

      if (err instanceof Error) {
        throw new Error(err.message);
      }

      throw new InternalServerErrorException('Unknown Error');
    }
  }

  @SubscribeMessage('session:close')
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
}
