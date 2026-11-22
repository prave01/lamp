import { defineRelations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const messageRoleEnum = pgEnum("message_role", [
  "assistant",
  "user",
  "system",
]);
export const messageTypeEnum = pgEnum("message_type", [
  "message",
  "function_call",
  "function_call_output",
]);

// session table
export const sessionTable = pgTable("sessions", {
  id: uuid().primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// message table
export const messageTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  sessionId: uuid()
    .notNull()
    .references(() => sessionTable.id),
  role: messageRoleEnum("role").notNull(),
  type: messageTypeEnum("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

//query relations
export const relations = defineRelations(
  {
    sessionTable,
    messageTable,
  },
  (r) => ({
    sessionTable: {
      messages: r.many.messageTable({
        from: r.sessionTable.id,
        to: r.messageTable.sessionId,
      }),
    },
  }),
);
