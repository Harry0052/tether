import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";
import { createGuest } from "@/lib/auth/users";
import { databaseFrom, openDatabase } from "@/lib/db/client";
import { auditEvents, capabilityGrants, invitations, users } from "@/lib/db/schema";
import { createTask, setStepDone, viewTask } from "@/lib/tasks/service";
import { issueInviteToken } from "@/lib/trust/tokens";
import {
  INVITE_INVALID,
  acceptInvitation,
  createInvitation,
  previewInvitation,
  revokeGrant,
} from "./service";

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

function checklist(database: ReturnType<typeof db>, ownerId: string, title: string) {
  const created = createTask(database, ownerId, {
    templateType: "custom",
    title,
    dueOn: "",
    customSteps: "Read it back",
  });
  if (!created.ok) throw new Error(created.message);
  return created.taskId;
}

describe("invitations", () => {
  test("an uninvited person sees nothing, and a revoked helper loses access immediately", () => {
    const database = db();
    const owner = createGuest(database);
    const helper = createGuest(database);
    const stranger = createGuest(database);
    const taskId = checklist(database, owner.user.id, "Hidden checklist");
    expect(viewTask(database, stranger.user.id, taskId)).toBeNull();

    const invite = createInvitation(database, owner.user.id, taskId, 7);
    expect(invite.ok).toBe(true);
    if (!invite.ok) return;
    expect(acceptInvitation(database, helper.user.id, invite.token).ok).toBe(true);
    expect(viewTask(database, helper.user.id, taskId)?.role).toBe("helper");
    const stepId = viewTask(database, owner.user.id, taskId)?.steps[0]?.id ?? "";
    expect(setStepDone(database, helper.user.id, taskId, stepId, true).ok).toBe(false);
    expect(viewTask(database, owner.user.id, taskId)?.doneCount).toBe(0);
    expect(JSON.stringify(database.select().from(auditEvents).all())).not.toContain(invite.token);

    const grant = database.select().from(capabilityGrants).all()[0];
    expect(grant).toBeTruthy();
    expect(revokeGrant(database, owner.user.id, grant.id).ok).toBe(true);
    expect(viewTask(database, helper.user.id, taskId)).toBeNull();
    expect(setStepDone(database, helper.user.id, taskId, stepId, true).ok).toBe(false);
    expect(viewTask(database, owner.user.id, taskId)?.role).toBe("owner");
  });

  test("a link can be used once, and an expired or malformed link leaks nothing", () => {
    const database = db();
    const owner = createGuest(database);
    database.update(users).set({ displayName: "Secret Owner Name" }).where(eq(users.id, owner.user.id)).run();
    const taskId = checklist(database, owner.user.id, "Hidden task title");
    const invite = createInvitation(database, owner.user.id, taskId, 1);
    if (!invite.ok) throw new Error("invite");
    const helper = createGuest(database);
    const other = createGuest(database);
    expect(acceptInvitation(database, helper.user.id, invite.token).ok).toBe(true);
    const second = acceptInvitation(database, other.user.id, invite.token);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.message).toBe(INVITE_INVALID);
      expect(JSON.stringify(second)).not.toContain("Secret Owner Name");
      expect(JSON.stringify(second)).not.toContain("Hidden task title");
    }

    const expired = createInvitation(database, owner.user.id, taskId, 1);
    if (!expired.ok) throw new Error("expired");
    database
      .update(invitations)
      .set({ expiresAt: "2020-01-01T00:00:00.000Z" })
      .where(eq(invitations.id, expired.invitationId))
      .run();
    const preview = previewInvitation(database, expired.token);
    expect(preview).toEqual({ ok: false, message: INVITE_INVALID });
    expect(JSON.stringify(preview)).not.toContain("Hidden task title");

    const forged = issueInviteToken("22222222-2222-4222-8222-222222222222");
    const malformed = previewInvitation(database, "nope");
    const missing = previewInvitation(database, forged.token);
    expect(malformed).toEqual({ ok: false, message: INVITE_INVALID });
    expect(missing).toEqual({ ok: false, message: INVITE_INVALID });
    expect(JSON.stringify({ malformed, missing })).not.toContain("Secret Owner Name");
  });
});
