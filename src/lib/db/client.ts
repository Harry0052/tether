import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { seedDemo } from "./seed";
import * as schema from "./schema";
import { migrate } from "./migrate";

export type TetherDb = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { tetherSqlite?: Database.Database };

export function databasePath() {
  return process.env.TETHER_DB_PATH ?? path.join(process.cwd(), "data", "tether.db");
}

export function openDatabase(filename: string) {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  const sqlite = new Database(filename);
  sqlite.pragma("foreign_keys = ON");
  if (filename !== ":memory:") {
    sqlite.pragma("journal_mode = WAL");
  }
  sqlite.pragma("busy_timeout = 3000");
  migrate(sqlite);
  return sqlite;
}

export function getSqlite() {
  if (!globalForDb.tetherSqlite) {
    const sqlite = openDatabase(databasePath());
    seedDemo(drizzle(sqlite, { schema }));
    globalForDb.tetherSqlite = sqlite;
  }
  return globalForDb.tetherSqlite;
}

export function getDb() {
  return drizzle(getSqlite(), { schema });
}

export function databaseFrom(sqlite: Database.Database): TetherDb {
  return drizzle(sqlite, { schema });
}
