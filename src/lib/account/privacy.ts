import { and, eq, inArray } from "drizzle-orm";
import type { TetherDb } from "@/lib/db/client";
import {
  actionProposals,
  approvalEvents,
  auditEvents,
  capabilityGrants,
  invitations,
  metricEvents,
  sessions,
  taskSteps,
  tasks,
  trustedRelations,
  users,
} from "@/lib/db/schema";
import { listVisibleActivity } from "@/lib/activity";
import { nowIso } from "@/lib/time";

export function approvalCompletionCount(db: TetherDb, ownerId: string) {
  return db
    .select({ id: metricEvents.id })
    .from(metricEvents)
    .where(and(eq(metricEvents.ownerId, ownerId), eq(metricEvents.name, "task_completed_with_approval")))
    .all().length;
}

export function exportAccount(db: TetherDb, userId: string) {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || user.kind === "deleted") return null;
  const owned = db.select().from(tasks).where(and(eq(tasks.ownerId, userId), eq(tasks.origin, "user"))).all();
  const taskIds = owned.map((task) => task.id);
  const steps = taskIds.length ? db.select().from(taskSteps).where(inArray(taskSteps.taskId, taskIds)).all() : [];
  const proposals = taskIds.length
    ? db.select().from(actionProposals).where(inArray(actionProposals.taskId, taskIds)).all()
    : [];
  return {
    exportedAt: nowIso(),
    person: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      locale: user.locale,
      textScale: user.textScale,
      contrast: user.contrast,
      simplified: user.simplified === 1,
    },
    checklists: owned.map((task) => ({
      id: task.id,
      title: task.title,
      summary: task.summary,
      status: task.status,
      dueOn: task.dueOn,
      createdAt: task.createdAt,
      steps: steps
        .filter((step) => step.taskId === task.id)
        .map((step) => ({ id: step.id, ordinal: step.ordinal, instruction: step.instruction, status: step.status })),
    })),
    suggestions: proposals.map((proposal) => ({
      id: proposal.id,
      taskId: proposal.taskId,
      kind: proposal.kind,
      body: proposal.body,
      status: proposal.status,
      createdAt: proposal.createdAt,
    })),
    activity: listVisibleActivity(db, userId).map((event) => ({
      id: event.id,
      taskId: event.taskId,
      taskTitle: event.taskTitle,
      type: event.type,
      occurredAt: event.occurredAt,
      metadata: JSON.parse(event.metadataJson) as unknown,
    })),
  };
}

export function deleteAccount(db: TetherDb, userId: string, confirmationName: string) {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || user.kind === "deleted") {
    return { ok: false as const, status: 404, message: "This browser does not have data to delete." };
  }
  if (confirmationName.trim() !== user.displayName) {
    return { ok: false as const, status: 422, message: "Type your name exactly. Nothing was deleted." };
  }
  const owned = db.select().from(tasks).where(eq(tasks.ownerId, userId)).all().map((task) => task.id);
  db.transaction((tx) => {
    if (owned.length) {
      const proposalIds = tx
        .select()
        .from(actionProposals)
        .where(inArray(actionProposals.taskId, owned))
        .all()
        .map((row) => row.id);
      if (proposalIds.length) {
        tx.delete(approvalEvents).where(inArray(approvalEvents.proposalId, proposalIds)).run();
        tx.delete(actionProposals).where(inArray(actionProposals.id, proposalIds)).run();
      }
      tx.delete(taskSteps).where(inArray(taskSteps.taskId, owned)).run();
      tx.delete(invitations).where(inArray(invitations.taskId, owned)).run();
      tx.delete(capabilityGrants).where(inArray(capabilityGrants.taskId, owned)).run();
      tx.delete(auditEvents).where(inArray(auditEvents.taskId, owned)).run();
      tx.delete(metricEvents).where(inArray(metricEvents.taskId, owned)).run();
      tx.delete(tasks).where(inArray(tasks.id, owned)).run();
    }
    tx.delete(capabilityGrants).where(eq(capabilityGrants.helperId, userId)).run();
    tx.delete(capabilityGrants).where(eq(capabilityGrants.ownerId, userId)).run();
    tx.delete(trustedRelations).where(eq(trustedRelations.helperId, userId)).run();
    tx.delete(trustedRelations).where(eq(trustedRelations.ownerId, userId)).run();
    tx.delete(invitations).where(eq(invitations.ownerId, userId)).run();
    tx.delete(sessions).where(eq(sessions.userId, userId)).run();
    tx.update(auditEvents).set({ actorId: null }).where(eq(auditEvents.actorId, userId)).run();
    tx.update(users)
      .set({ displayName: "Deleted person", email: null, passwordHash: null, kind: "deleted" })
      .where(eq(users.id, userId))
      .run();
  });
  return { ok: true as const };
}
