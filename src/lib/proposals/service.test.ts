import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";
import { createGuest } from "@/lib/auth/users";
import { databaseFrom, openDatabase } from "@/lib/db/client";
import { auditEvents } from "@/lib/db/schema";
import { createTask, viewTask } from "@/lib/tasks/service";
import { acceptInvitation, createInvitation } from "@/lib/trust/service";
import { createProposal, decideProposal, executeProposal } from "./service";

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

function pair() {
  const database = db();
  const owner = createGuest(database);
  const helper = createGuest(database);
  const created = createTask(database, owner.user.id, {
    templateType: "custom",
    title: "Sunday call",
    dueOn: "",
    customSteps: "Pick a time\nPlace the call",
  });
  if (!created.ok) throw new Error(created.message);
  const invite = createInvitation(database, owner.user.id, created.taskId, 7);
  if (!invite.ok) throw new Error("invite");
  expect(acceptInvitation(database, helper.user.id, invite.token).ok).toBe(true);
  const stepId = viewTask(database, owner.user.id, created.taskId)?.steps[0]?.id ?? "";
  return { database, owner, helper, taskId: created.taskId, stepId };
}

describe("suggestions", () => {
  test("approval marks the step done and a declined suggestion cannot be carried out", () => {
    const { database, owner, helper, taskId, stepId } = pair();
    const stranger = createGuest(database);
    const proposal = createProposal(database, helper.user.id, taskId, {
      kind: "complete_step",
      stepId,
      body: "password: hunter2",
    });
    expect(proposal.ok).toBe(true);
    if (!proposal.ok) return;
    expect(createProposal(database, stranger.user.id, taskId, { kind: "complete_step", stepId }).ok).toBe(false);
    expect(decideProposal(database, helper.user.id, proposal.proposalId, "approved").ok).toBe(false);
    expect(viewTask(database, owner.user.id, taskId)?.doneCount).toBe(0);

    const approved = decideProposal(database, owner.user.id, proposal.proposalId, "approved");
    expect(approved.ok).toBe(true);
    expect(viewTask(database, owner.user.id, taskId)?.steps[0]?.status).toBe("done");
    const audit = JSON.stringify(database.select().from(auditEvents).where(eq(auditEvents.taskId, taskId)).all());
    expect(audit).not.toContain("hunter2");
    expect(audit).toContain("proposal_approved");

    const secondStep = viewTask(database, owner.user.id, taskId)?.steps[1]?.id ?? "";
    const comment = createProposal(database, helper.user.id, taskId, { kind: "complete_step", stepId: secondStep, body: "Not yet" });
    if (!comment.ok) throw new Error("second");
    expect(decideProposal(database, owner.user.id, comment.proposalId, "declined").ok).toBe(true);
    expect(viewTask(database, owner.user.id, taskId)?.steps[1]?.status).toBe("pending");
    expect(executeProposal(database, comment.proposalId)).toEqual({
      ok: false,
      message: "A declined suggestion cannot be carried out.",
    });
    expect(decideProposal(database, owner.user.id, comment.proposalId, "approved").ok).toBe(false);
  });
});
