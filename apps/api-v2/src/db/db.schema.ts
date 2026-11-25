import { Container } from "dockerode";
import { defineRelations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const messageRoleEnum = pgEnum("message_role", [
  "assistant",
  "user",
  "system",
  "developer",
]);

export const messageTypeEnum = pgEnum("message_type", [
  "message",
  "function_call",
  "function_call_output",
]);

export const sessionStatusEnum = pgEnum("session_status", ["active", "idle"]);

export const sandboxStatusEnum = pgEnum("sandbox_status", ["running", "idle"]);

// session table
export const sessionTable = pgTable("sessions", {
  id: uuid().primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: sessionStatusEnum("status").notNull().default("idle"),
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
    .references(() => sessionTable.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  type: messageTypeEnum("type").notNull(),
  content: text("content"),
  name: text("function_call_name"),
  callId: text("function_call_id"),
  arguments: text("function_call_args"),
  status: text("function_call_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// sandbox table
export const sandboxTable = pgTable("sandboxes", {
  id: text().primaryKey().notNull(),
  sessionId: uuid()
    .notNull()
    .references(() => sessionTable.id, { onDelete: "cascade" }),
  status: sandboxStatusEnum("status").notNull().default("idle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// container table
export const agentContainerTable = pgTable("agents", {
  id: uuid().primaryKey().defaultRandom(),
  sandboxId: text()
    .notNull()
    .references(() => sandboxTable.id, { onDelete: "cascade" }),
  agentId: text().notNull().unique(),
  name: text("agent_name").notNull(),
  cmd: text("cmd").array().notNull(),
  status: text("status"),
});

//query relations
export const relations = defineRelations(
  {
    sessionTable,
    messageTable,
    sandboxTable,
    agentContainerTable,
  },
  (r) => ({
    sessionTable: {
      messages: r.many.messageTable({
        from: r.sessionTable.id,
        to: r.messageTable.sessionId,
      }),
    },
    sandboxTable: {
      session: r.one.sessionTable({
        from: r.sandboxTable.sessionId,
        to: r.sessionTable.id,
      }),
      containers: r.many.agentContainerTable({
        from: r.sandboxTable.id,
        to: r.agentContainerTable.sandboxId,
      }),
    },
  }),
);
