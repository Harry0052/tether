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
