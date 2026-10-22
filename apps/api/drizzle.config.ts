import { defineConfig } from "drizzle-kit";
import { loadEnvFile } from "process";
loadEnvFile("./.env.local");

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
