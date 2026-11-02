import { drizzle } from "drizzle-orm/node-postgres";
import { loadEnvFile } from "process";
import { relations } from "./schema/index";

loadEnvFile("./.env.local");

export const db = drizzle(process.env.DATABASE_URL!, { relations });

// get session  by id
export async function getSession(sessionId: string) {
  try {
    const response = await db.query.sessionTable.findFirst({
      where: {
        id: sessionId,
      },
    });

    if (response === undefined) {
      throw new Error("Session not found");
    }

    console.log(`Get session response`, response);

    return response;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message as string);
    }

    throw new Error("Error while getting session");
  }
}
