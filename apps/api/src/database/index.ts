import { drizzle } from "drizzle-orm/node-postgres";
import { loadEnvFile } from "process";
import { relations } from "./schema/index";

loadEnvFile("./.env.local");

export const db = drizzle(process.env.DATABASE_URL!, { relations });
