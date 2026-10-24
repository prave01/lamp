CREATE TYPE "message_role" AS ENUM('user', 'assistant', 'system', 'developer');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"sessionId" uuid,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sessionId_sessions_id_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id");