import { defineRelations } from "drizzle-orm";
import {
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
  json,
} from "drizzle-orm/pg-core";

export const sessionTable = pgTable("sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const sandboxTable = pgTable("sandboxes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id")
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
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sandboxId: integer("sandbox_id")
    .notNull()
    .references(() => sandboxTable.id),
  name: text().notNull(),
  description: text(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const workflowVersionTable = pgTable("workflow_versions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  workflowId: integer()
    .notNull()
    .references(() => workflowTable.id),
  name: text().notNull(),
  description: text().notNull(),
  version: integer().notNull(),
  systemPrompt: text().notNull(),
  tools: json().notNull(),
});

// query relations
// one session can have one sandbox ==> one-to-one relationship
export const session_sandbox_relation = defineRelations(
  { sessionTable, sandboxTable },
  (r) => ({
    sandboxTable: {
      session: r.one.sessionTable({
        from: r.sandboxTable.sessionId,
        to: r.sessionTable.id,
      }),
    },
  }),
);

// one sandbox can have many workflows ==> one-to-many relationship
export const sandbox_workflow_relation = defineRelations(
  {
    sandboxTable,
    workflowTable,
  },
  (r) => ({
    sandboxTable: {
      // one sandbox can have many workflows
      workflows: r.many.workflowTable({
        from: r.sandboxTable.id, // PK on sandboxes
        to: r.workflowTable.sandboxId, // FK column on workflows
      }),
    },
  }),
);

// one workflow can have many different versions of the agent ==> one-to-many relationship
export const workflow_workflow_version_relation = defineRelations(
  {
    workflowTable,
    workflowVersionTable,
  },
  (r) => ({
    workflowTable: {
      // one workflow can have many versions
      versions: r.many.workflowVersionTable({
        from: r.workflowTable.id,
        to: r.workflowVersionTable.workflowId,
      }),
    },
  }),
);
