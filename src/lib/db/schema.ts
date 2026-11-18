import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  kind: text("kind").notNull(),
  email: text("email"),
  passwordHash: text("password_hash"),
  locale: text("locale").notNull(),
  textScale: text("text_scale").notNull(),
  contrast: text("contrast").notNull(),
  simplified: integer("simplified").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const rateBuckets = sqliteTable("rate_buckets", {
  bucketKey: text("bucket_key").primaryKey(),
  windowStart: text("window_start").notNull(),
  count: integer("count").notNull(),
});

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    templateType: text("template_type").notNull(),
    status: text("status").notNull(),
    dueOn: text("due_on"),
    origin: text("origin").notNull(),
    idempotencyKey: text("idempotency_key"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    completedAt: text("completed_at"),
  },
  (table) => [index("tasks_owner_idx").on(table.ownerId, table.updatedAt)],
);

export const taskSteps = sqliteTable(
  "task_steps",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id),
    ordinal: integer("ordinal").notNull(),
    instruction: text("instruction").notNull(),
    status: text("status").notNull(),
    doneAt: text("done_at"),
  },
  (table) => [index("task_steps_task_idx").on(table.taskId)],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id"),
    actorId: text("actor_id"),
    type: text("type").notNull(),
    metadataJson: text("metadata_json").notNull(),
    occurredAt: text("occurred_at").notNull(),
  },
  (table) => [index("audit_task_idx").on(table.taskId, table.occurredAt)],
);

export const metricEvents = sqliteTable(
  "metric_events",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    taskId: text("task_id"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("metric_owner_idx").on(table.ownerId, table.name)],
);
