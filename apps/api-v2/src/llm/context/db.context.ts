import OpenAI from "openai";
import { db } from "../../db";
import { messageTable } from "../../db/db.schema";

export class DbContext {
  constructor(public readonly sessionId: string) {
    const session = db.query.sessionTable.findFirst({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new Error("No session available");
    }
  }

  async append(input: OpenAI.Responses.ResponseInputItem) {
    if (input.type === "message") {
      await db.insert(messageTable).values({
        type: input.type,
        role: input.role,
        sessionId: this.sessionId,
        content: input.content as string,
      });
    }

    if (input.type === "function_call") {
      await db.insert(messageTable).values({
        type: input.type,
        role: "assistant",
        sessionId: this.sessionId,
        name: input.name,
        callId: input.call_id,
        arguments: input.arguments,
      });
    }

    if (input.type === "function_call_output") {
      await db.insert(messageTable).values({
        type: input.type,
        role: "assistant",
        content: JSON.stringify(input.output),
        name: input.name,
        callId: input.call_id,
        status: input.status,
        sessionId: this.sessionId,
      });
    }
  }

  async load() {
    const rows = await db.query.messageTable.findMany({
      where: {
        sessionId: this.sessionId,
      },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => {
      if (row.type === "function_call") {
        return {
          type: row.type,
          name: row.name,
          arguments: row.arguments,
          call_id: row.callId,
        } as OpenAI.Responses.ResponseInputItem;
      }

      if (row.type === "function_call_output") {
        return {
          type: "function_call_output",
          name: row.name,
          call_id: row.callId,
          output: row.content,
        } as OpenAI.Responses.ResponseInputItem;
      }

      return {
        type: "message",
        role: row.role,
        content: row.content,
      } as OpenAI.Responses.ResponseInputItem;
    });
  }
}
