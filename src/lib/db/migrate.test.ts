import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";
import { databaseFrom, openDatabase } from "./client";
import { migrate } from "./migrate";
import { users } from "./schema";

const opened: Array<{ close: () => void }> = [];

afterEach(() => {
  for (const db of opened) db.close();
  opened.length = 0;
});

describe("migrations", () => {
  test("applies the foundation tables once", () => {
    const sqlite = openDatabase(":memory:");
    opened.push(sqlite);
    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name);
    expect(tables).toEqual(
      expect.arrayContaining(["users", "sessions", "rate_buckets", "schema_migrations"]),
    );

    migrate(sqlite);
    const applied = sqlite.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get() as {
      count: number;
    };
    expect(applied.count).toBe(1);
  });

  test("stores a display name and reads it back", () => {
    const sqlite = openDatabase(":memory:");
    opened.push(sqlite);
    const db = databaseFrom(sqlite);
    db.insert(users)
      .values({
        id: "user-1",
        displayName: "Nora Alvarez",
        kind: "guest",
        email: null,
        passwordHash: null,
        locale: "en",
        textScale: "1",
        contrast: "standard",
        simplified: 0,
        createdAt: "2026-11-18T00:00:00.000Z",
      })
      .run();
    const row = db.select().from(users).where(eq(users.id, "user-1")).get();
    expect(row?.displayName).toBe("Nora Alvarez");
  });
});
