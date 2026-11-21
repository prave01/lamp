import { Injectable, Logger } from "@nestjs/common";
import { OpenaiService } from "../openai/openai.service";
import { db } from "../database";
import { messageTable, sessionTable } from "../database/schema";
import z from "zod";
import { OpenAIError } from "openai";
import { desc, DrizzleError, eq } from "drizzle-orm";
import { AiServiceError, PersistenceError } from "./session.error";
import { SandboxService } from "../sandbox/sandbox.service";

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly sandboxService: SandboxService,
  ) { }

  async listAllSessions() {
    const sessions = await db.query.sessionTable.findMany();

    return sessions;
  }

  async getMessagesForSession(sessionId: string) {
    const session = await db.query.sessionTable.findFirst({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    const messages = await db.query.messageTable.findMany({
      where: {
        sessionId: sessionId,
      },
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    });

    return messages;
  }

  async getSessionDetails(sessionId: string) {
    const session = await db.query.sessionTable.findFirst({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    return session;
  }

  async createSession(query: string) {
    try {
      const response = await this.openaiService.generateText(
        "Generate session metadata",
        z.object({
          title: z.string().describe("Title for the session"),
          description: z.string().describe("Description about the session"),
        }),
        "qwen/qwen3.7-flash",
        query,
      );

      const [session] = await db
        .insert(sessionTable)
        .values({
          title: response?.title as string,
          description: response?.description as string,
        })
        .returning();

      const sandbox = await this.sandboxService.createSandbox(session.id);

      this.logger.log({
        inserted: session,
      });

      return {
        sessionId: session.id,
        sandboxId: sandbox.id,
        title: session.title,
        description: session.description,
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

  async deleteSession(sessionId: string) {
    console.log("input", sessionId);
    const session = await db
      .delete(sessionTable)
      .where(eq(sessionTable.id, sessionId))
      .returning({
        sessionId: sessionTable.id,
      });

    if (!session[0].sessionId) {
      throw new Error("Session not found");
    }

    return session[0].sessionId;
  }
}
("");
