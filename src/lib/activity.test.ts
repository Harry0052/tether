import { afterEach, describe, expect, test } from "vitest";
import { createGuest } from "@/lib/auth/users";
import { databaseFrom, openDatabase } from "@/lib/db/client";
import { createProposal, decideProposal } from "@/lib/proposals/service";
import { createTask, viewTask } from "@/lib/tasks/service";
import { acceptInvitation, createInvitation, revokeGrant } from "@/lib/trust/service";
import { capabilityGrants } from "@/lib/db/schema";
import { listVisibleActivity } from "./activity";

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

describe("activity visibility", () => {
  test("a revoked helper no longer sees the checklist record", () => {
    const database = db();
    const owner = createGuest(database);
    const helper = createGuest(database);
    const created = createTask(database, owner.user.id, {
      templateType: "custom",
      title: "Private list",
      dueOn: "",
      customSteps: "One step",
    });
    if (!created.ok) throw new Error(created.message);
    const invite = createInvitation(database, owner.user.id, created.taskId, 1);
    if (!invite.ok) throw new Error("invite");
    acceptInvitation(database, helper.user.id, invite.token);
    const stepId = viewTask(database, owner.user.id, created.taskId)?.steps[0]?.id ?? "";
    const proposal = createProposal(database, helper.user.id, created.taskId, { kind: "complete_step", stepId, body: "Ready" });
    if (!proposal.ok) throw new Error("proposal");
    decideProposal(database, owner.user.id, proposal.proposalId, "approved");
    expect(listVisibleActivity(database, helper.user.id).some((event) => event.taskTitle === "Private list")).toBe(true);
    const grant = database.select().from(capabilityGrants).all()[0];
    revokeGrant(database, owner.user.id, grant.id);
    expect(listVisibleActivity(database, helper.user.id)).toEqual([]);
    expect(listVisibleActivity(database, owner.user.id).length).toBeGreaterThan(0);
  });
});
