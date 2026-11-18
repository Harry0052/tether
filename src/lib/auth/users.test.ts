import { afterEach, describe, expect, test } from "vitest";
import { databaseFrom, openDatabase } from "@/lib/db/client";
import { createGuest, readUserByToken, updateDisplayName } from "./users";

const opened: Array<{ close: () => void }> = [];

function db() {
  const sqlite = openDatabase(":memory:");
  opened.push(sqlite);
  return databaseFrom(sqlite);
}

afterEach(() => {
  for (const sqlite of opened) sqlite.close();
  opened.length = 0;
});

describe("guest profile", () => {
  test("a saved name is still there when the same session token is read", () => {
    const database = db();
    const created = createGuest(database);
    expect(created.user.displayName).toBe("Guest");
    const saved = updateDisplayName(database, created.user.id, "  Nora Alvarez  ");
    expect(saved.ok).toBe(true);
    const again = readUserByToken(database, created.token);
    expect(again?.displayName).toBe("Nora Alvarez");
    expect(again?.kind).toBe("guest");
  });

  test("a blank name is rejected and the stored name stays the same", () => {
    const database = db();
    const created = createGuest(database);
    const saved = updateDisplayName(database, created.user.id, "   ");
    expect(saved.ok).toBe(false);
    expect(readUserByToken(database, created.token)?.displayName).toBe("Guest");
  });

  test("an unknown token reads nothing", () => {
    const database = db();
    createGuest(database);
    expect(readUserByToken(database, "not-a-session")).toBeNull();
  });
});
