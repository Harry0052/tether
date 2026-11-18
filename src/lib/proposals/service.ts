import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import type { TetherDb } from "@/lib/db/client";
import { actionProposals, approvalEvents, auditEvents, metricEvents, taskSteps, tasks, users } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";
import { viewTask } from "@/lib/tasks/service";
import { redactText } from "@/lib/security/redact";

export type ProposalRecord = {
  id: string;
  taskId: string;
  stepId: string | null;
  authorId: string;
  authorName: string;
  kind: string;
  body: string;
  status: string;
  createdAt: string;
  stepInstruction: string | null;
};

const unavailable = {
  ok: false as const,
  status: 404,
  code: "not_available",
  message: "This checklist is not available to you.",
};

function proposalRows(db: TetherDb, taskId: string): ProposalRecord[] {
  const rows = db
    .select()
    .from(actionProposals)
    .where(eq(actionProposals.taskId, taskId))
    .orderBy(asc(actionProposals.createdAt))
    .all();
  return rows.map((row) => {
    const author = db.select().from(users).where(eq(users.id, row.authorId)).get();
    const step = row.stepId ? db.select().from(taskSteps).where(eq(taskSteps.id, row.stepId)).get() : null;
    return {
      id: row.id,
      taskId: row.taskId,
      stepId: row.stepId,
      authorId: row.authorId,
      authorName: author?.displayName ?? "Someone",
      kind: row.kind,
      body: row.body,
      status: row.status,
      createdAt: row.createdAt,
      stepInstruction: step?.instruction ?? null,
    };
  });
}

export function listProposals(db: TetherDb, userId: string | null, taskId: string) {
  const view = viewTask(db, userId, taskId);
  if (!view || view.role === "sample") return [];
  return proposalRows(db, taskId);
}

export function createProposal(
  db: TetherDb,
  authorId: string,
  taskId: string,
  input: { kind: "complete_step" | "comment"; stepId?: string; body?: string; idempotencyKey?: string | null },
) {
  const view = viewTask(db, authorId, taskId);
  if (!view || view.role !== "helper") return unavailable;
  const body = (input.body ?? "").trim();
  if (body.length > 500) {
    return { ok: false as const, status: 422, code: "validation", message: "Use 500 characters or fewer." };
  }
  const key = input.idempotencyKey?.trim() || null;
  if (key) {
    const existing = db
      .select()
      .from(actionProposals)
      .where(and(eq(actionProposals.authorId, authorId), eq(actionProposals.idempotencyKey, key)))
      .get();
    if (existing) return { ok: true as const, proposalId: existing.id, reused: true };
  }

  let stepId: string | null = null;
  if (input.kind === "complete_step") {
    const step = view.steps.find((item) => item.id === input.stepId);
    if (!step || step.status !== "pending") {
      return { ok: false as const, status: 422, code: "validation", message: "That step is not waiting for a suggestion." };
    }
    const waiting = db
      .select()
      .from(actionProposals)
      .where(and(eq(actionProposals.stepId, step.id), eq(actionProposals.status, "pending"), eq(actionProposals.kind, "complete_step")))
      .get();
    if (waiting) {
      return { ok: false as const, status: 409, code: "pending", message: "A suggestion for this step is already waiting." };
    }
    stepId = step.id;
  } else if (body.length < 1) {
    return { ok: false as const, status: 422, code: "validation", message: "Write a note before sending it." };
  }

  const id = randomUUID();
  const createdAt = nowIso();
  db.insert(actionProposals)
    .values({
      id,
      taskId,
      stepId,
      authorId,
      kind: input.kind,
      body,
      status: "pending",
      idempotencyKey: key,
      createdAt,
      resolvedAt: null,
    })
    .run();
  recordAudit(db, {
    taskId,
    actorId: authorId,
    type: "proposal_created",
    metadata: { proposalId: id, kind: input.kind, stepId: stepId ?? "", note: redactText(body).slice(0, 80) },
  });
  return { ok: true as const, proposalId: id, reused: false };
}

export function decideProposal(db: TetherDb, ownerId: string, proposalId: string, decision: "approved" | "declined") {
  const proposal = db.select().from(actionProposals).where(eq(actionProposals.id, proposalId)).get();
  if (!proposal) return unavailable;
  const view = viewTask(db, ownerId, proposal.taskId);
  if (!view || view.role !== "owner") return unavailable;
  if (proposal.status !== "pending") {
    const prior = db.select().from(approvalEvents).where(eq(approvalEvents.proposalId, proposal.id)).get();
    if (prior?.decision === decision) return { ok: true as const, status: proposal.status, reused: true };
    return { ok: false as const, status: 409, code: "already_decided", message: "This suggestion already has a decision." };
  }

  const occurredAt = nowIso();
  let applied = false;
  let claimedOk = false;
  db.transaction((tx) => {
    const claimed = tx
      .update(actionProposals)
      .set({ status: decision, resolvedAt: occurredAt })
      .where(and(eq(actionProposals.id, proposal.id), eq(actionProposals.status, "pending")))
      .run();
    if (claimed.changes !== 1) return;
    claimedOk = true;
    tx.insert(approvalEvents)
      .values({
        id: randomUUID(),
        proposalId: proposal.id,
        ownerId,
        decision,
        occurredAt,
      })
      .run();
    if (decision === "approved" && proposal.kind === "complete_step" && proposal.stepId) {
      tx.update(taskSteps)
        .set({ status: "done", doneAt: occurredAt })
        .where(and(eq(taskSteps.id, proposal.stepId), eq(taskSteps.taskId, proposal.taskId), eq(taskSteps.status, "pending")))
        .run();
      const steps = tx.select().from(taskSteps).where(eq(taskSteps.taskId, proposal.taskId)).all();
      const allDone = steps.length > 0 && steps.every((step) => step.status === "done");
      tx.update(tasks)
        .set({
          status: allDone ? "completed" : "open",
          completedAt: allDone ? occurredAt : null,
          updatedAt: occurredAt,
        })
        .where(eq(tasks.id, proposal.taskId))
        .run();
      if (allDone) {
        tx.insert(metricEvents)
          .values({
            id: randomUUID(),
            ownerId,
            name: "task_completed_with_approval",
            taskId: proposal.taskId,
            createdAt: occurredAt,
          })
          .onConflictDoNothing()
          .run();
      }
      applied = true;
    }
  });

  if (!claimedOk) {
    const current = db.select().from(actionProposals).where(eq(actionProposals.id, proposal.id)).get();
    const prior = db.select().from(approvalEvents).where(eq(approvalEvents.proposalId, proposal.id)).get();
    if (current && prior?.decision === decision) return { ok: true as const, status: current.status, reused: true };
    return { ok: false as const, status: 409, code: "already_decided", message: "This suggestion already has a decision." };
  }
  recordAudit(db, {
    taskId: proposal.taskId,
    actorId: ownerId,
    type: decision === "approved" ? "proposal_approved" : "proposal_declined",
    metadata: {
      proposalId: proposal.id,
      kind: proposal.kind,
      stepId: proposal.stepId ?? "",
      note: redactText(proposal.body).slice(0, 80),
    },
  });
  return { ok: true as const, status: decision, reused: false, applied };
}

export function executeProposal(db: TetherDb, proposalId: string) {
  const proposal = db.select().from(actionProposals).where(eq(actionProposals.id, proposalId)).get();
  if (!proposal || proposal.status !== "approved") {
    return { ok: false as const, message: "A declined suggestion cannot be carried out." };
  }
  return { ok: true as const };
}

export function listTaskRecord(db: TetherDb, userId: string | null, taskId: string) {
  const view = viewTask(db, userId, taskId);
  if (!view || view.role === "sample") return [];
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.taskId, taskId))
    .all()
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}
