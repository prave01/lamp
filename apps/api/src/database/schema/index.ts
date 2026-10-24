import { defineRelations } from "drizzle-orm";
import {
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
  json,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
  "developer",
]);

export const sessionTable = pgTable("sessions", {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar().notNull(),
  description: text().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const messageTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  sessionId: uuid().references(() => sessionTable.id),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sandboxTable = pgTable("sandboxes", {
  id: uuid().primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .unique()
    .notNull()
    .references(() => sessionTable.id),
  status: text(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  // metadata: json()  // will see that later
});

export const workflowTable = pgTable("workflows", {
  id: uuid().primaryKey().defaultRandom(),
  sandboxId: uuid("sandbox_id")
    .notNull()
    .references(() => sandboxTable.id),
  name: text().notNull(),
  description: text(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const workflowVersionTable = pgTable("workflow_versions", {
  id: uuid().primaryKey().defaultRandom(),
  workflowId: uuid()
    .notNull()
    .references(() => workflowTable.id),
  name: text().notNull(),
  description: text().notNull(),
  version: integer().notNull(),
  systemPrompt: text().notNull(),
  tools: json().notNull(),
});

// query relations
export const relations = defineRelations(
  {
    sessionTable,
    sandboxTable,
    workflowTable,
    workflowVersionTable,
    messageTable,
  },
  (r) => ({
    sandboxTable: {
      session: r.one.sessionTable({
        from: r.sandboxTable.sessionId,
        to: r.sessionTable.id,
      }),
      workflows: r.many.workflowTable({
        from: r.sandboxTable.id,
        to: r.workflowTable.sandboxId,
      }),
    },
    workflowTable: {
      versions: r.many.workflowVersionTable({
        from: r.workflowTable.id,
        to: r.workflowVersionTable.workflowId,
      }),
    },
    sessionTable: {
      messages: r.many.messageTable({
        from: r.sessionTable.id,
        to: r.messageTable.sessionId,
      }),
    },
  }),
);
