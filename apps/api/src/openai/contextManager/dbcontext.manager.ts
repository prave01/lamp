import type { ResponseInputItem } from "openai/resources/responses/responses.js";
import { ContextManager } from "./index";
import { db } from "../../database";
import { messageTable } from "../../database/schema";
import { eq } from "drizzle-orm";
import type OpenAI from "openai";

export class DbContextManager implements ContextManager {
  constructor(private readonly sessionId: string) {
    const session = db.query.sessionTable.findFirst({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new Error("No session available");
    }
  }

  async load(): Promise<ResponseInputItem[]> {
    const rows = await db.query.messageTable.findMany({
      where: { sessionId: this.sessionId },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => {
      // If it is a function_call or function_call_output, return the complete structured object
      if (row.type === "function_call") {
        return {
          type: "function_call",
          call_id: row.call_id,
          name: row.name,
          arguments: row.arguments,
        } as ResponseInputItem;
      }

      if (row.type === "function_call_output") {
        return {
          type: "function_call_output",
          name: row.name,
          call_id: row.call_id,
          output: row.content,
        } as ResponseInputItem;
      }

      return {
        type: "message",
        role: row.role,
        content: row.content,
      } as ResponseInputItem;
    });
  }
  async append(item: OpenAI.Responses.ResponseInputItem) {
    if (item.type === "message") {
      await db.insert(messageTable).values({
        sessionId: this.sessionId,
        type: item.type,
        role: item.role,
        content: item.content.toString(),
      });
    }

    if (item.type === "function_call") {
      console.log("function call", item);
      await db.insert(messageTable).values({
        sessionId: this.sessionId,
        type: item.type,
        name: item.name,
        call_id: item.call_id,
        arguments: item.arguments,
      });
    }

    if (item.type === "function_call_output") {
      await db.insert(messageTable).values({
        sessionId: this.sessionId,
        type: item.type,
        call_id: item.call_id,
        name: item.name,
        content: item.output.toString(),
      });
    }
  }

  async clear(): Promise<string> {
    await db
      .delete(messageTable)
      .where(eq(messageTable.sessionId, this.sessionId));

    return `Cleared conversation for ${this.sessionId}`;
  }
}
