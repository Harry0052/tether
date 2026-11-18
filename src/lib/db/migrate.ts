import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";

export function migrationsDirectory() {
  return path.join(process.cwd(), "drizzle", "migrations");
}

export function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(
    sqlite
      .prepare("SELECT id FROM schema_migrations")
      .all()
      .map((row) => (row as { id: string }).id),
  );

  const files = fs
    .readdirSync(migrationsDirectory())
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const insert = sqlite.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)");

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDirectory(), file), "utf8");
    const apply = sqlite.transaction(() => {
      sqlite.exec(sql);
      insert.run(file, new Date().toISOString());
    });
    apply();
  }
}
