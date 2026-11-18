import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";
import { createGuest, readUserByToken } from "@/lib/auth/users";
import { databaseFrom, openDatabase } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { createTask } from "@/lib/tasks/service";
import { createInvitation } from "@/lib/trust/service";
import { deleteAccount, exportAccount } from "./privacy";

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

describe("privacy", () => {
  test("an export has the owner’s checklist and none of the secrets", () => {
    const database = db();
    const owner = createGuest(database);
    const other = createGuest(database);
    const first = createTask(database, owner.user.id, {
      templateType: "custom",
      title: "Nora list",
      dueOn: "",
      customSteps: "One",
    });
    createTask(database, other.user.id, {
      templateType: "custom",
      title: "Secret other list",
      dueOn: "",
      customSteps: "Hidden",
    });
    if (!first.ok) throw new Error(first.message);
    const invite = createInvitation(database, owner.user.id, first.taskId, 1);
    const exported = exportAccount(database, owner.user.id);
    const text = JSON.stringify(exported);
    expect(text).toContain("Nora list");
    expect(text).not.toContain("Secret other list");
    expect(text).not.toContain("passwordHash");
    expect(text).not.toContain("tokenHash");
    expect(text).not.toContain(owner.token);
    if (invite.ok) expect(text).not.toContain(invite.token);
  });

  test("deletion requires the exact name and then the session is gone", () => {
    const database = db();
    const owner = createGuest(database);
    database.update(users).set({ displayName: "Nora Alvarez" }).where(eq(users.id, owner.user.id)).run();
    expect(deleteAccount(database, owner.user.id, "nope").ok).toBe(false);
    expect(readUserByToken(database, owner.token)?.displayName).toBe("Nora Alvarez");
    expect(deleteAccount(database, owner.user.id, "Nora Alvarez").ok).toBe(true);
    expect(readUserByToken(database, owner.token)).toBeNull();
    expect(exportAccount(database, owner.user.id)).toBeNull();
  });
});
