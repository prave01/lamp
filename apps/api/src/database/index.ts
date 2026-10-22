import { drizzle } from "drizzle-orm/node-postgres";
import { loadEnvFile } from "process";
loadEnvFile("./.env.local");

export const db = drizzle(process.env.DATABASE_URL!);
