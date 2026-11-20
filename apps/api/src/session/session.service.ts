import { Injectable, Logger } from "@nestjs/common";
import { OpenaiService } from "../openai/openai.service";
import { db } from "../database";
import { sessionTable } from "../database/schema";
import z from "zod";
import { OpenAIError } from "openai";
import { DrizzleError, eq } from "drizzle-orm";
import { AiServiceError, PersistenceError } from "./session.error";

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly openaiService: OpenaiService) { }

  async createSession(query: string) {
    try {
      const response = await this.openaiService.generateText(
        "Generate session metadata",
        z.object({
          title: z.string().describe("Title for the session"),
          description: z.string().describe("Description about the session"),
        }),
        "mistralai/mistral-nemo",
        query,
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
