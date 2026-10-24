import type { ResponseInputItem } from "openai/resources/responses/responses.js";
import { ContextManager } from "./index";
import { db } from "../../database";
import { messageTable } from "../../database/schema";
import { eq } from "drizzle-orm";

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
      where: {
        sessionId: this.sessionId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rows.map((row) => ({
      role: row.role,
      content: row.content,
    })) as ResponseInputItem[];
  }

  async append(item: any) {
    let textContent = "";

    // Handle string content (user, system)
    if (typeof item.content === "string") {
      textContent = item.content;
    }
    // Handle array content (assistant)
    else if (Array.isArray(item.content) && item.content[0]?.text) {
      textContent = item.content[0].text;
    }

    if (item.role && textContent) {
      await db.insert(messageTable).values({
        sessionId: this.sessionId,
        role: item.role,
        content: textContent,
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
