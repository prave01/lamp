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
  sessionId: integer("session_id").references(() => sessionTable.id),
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
  sandboxId: integer("sandbox_id").references(() => sandboxTable.id),
  name: text().notNull(),
  description: text(),
});

// realtional queries
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
export const sandbox_workkflow_relation = defineRelations(
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
