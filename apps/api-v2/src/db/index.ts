import { sql } from "drizzle-orm/sql";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DATABASE_URL!);

export async function checkDatabaseConnection() {
  try {
    await db.execute(sql`SELECT 1`);

    console.log("PostgreSQL connection established");
  } catch (error) {
    throw new Error("Unable to connect to PostgreSQL", {
      cause: error,
    });
  }
}
