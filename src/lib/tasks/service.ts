import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import type { TetherDb } from "@/lib/db/client";
import { capabilityGrants, metricEvents, taskSteps, tasks, users } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";
import { parseCustomSteps, templateById, type TemplateId } from "@/lib/tasks/templates";
import { displayNameSchema } from "@/lib/validators/profile";

export const SAMPLE_OWNER_ID = "00000000-0000-4000-8000-000000000001";
export const SAMPLE_TASK_ID = "00000000-0000-4000-8000-000000000010";

type TaskRow = typeof tasks.$inferSelect;
type StepRow = typeof taskSteps.$inferSelect;

export type TaskRole = "owner" | "sample" | "helper";

export type TaskView = {
  task: TaskRow;
  steps: StepRow[];
  role: TaskRole;
  doneCount: number;
};

export type ServiceFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
};

function stepsFor(db: TetherDb, taskId: string) {
  return db.select().from(taskSteps).where(eq(taskSteps.taskId, taskId)).all().sort((a, b) => a.ordinal - b.ordinal);
}

function viewFrom(task: TaskRow, steps: StepRow[], role: TaskRole): TaskView {
  return {
    task,
    steps,
    role,
    doneCount: steps.filter((step) => step.status === "done").length,
  };
}

function activeGrant(db: TetherDb, userId: string, taskId: string) {
  return db
    .select()
    .from(capabilityGrants)
    .where(
      and(
        eq(capabilityGrants.helperId, userId),
        eq(capabilityGrants.taskId, taskId),
        isNull(capabilityGrants.revokedAt),
        gt(capabilityGrants.expiresAt, nowIso()),
      ),
    )
    .get();
}

export function viewTask(db: TetherDb, userId: string | null, taskId: string): TaskView | null {
  const task = db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task) return null;
  const steps = stepsFor(db, task.id);
  if (task.origin === "demo_seed") return viewFrom(task, steps, "sample");
  if (userId && task.ownerId === userId) return viewFrom(task, steps, "owner");
  if (userId && activeGrant(db, userId, task.id)) return viewFrom(task, steps, "helper");
  return null;
}

export function listHelpedTasks(db: TetherDb, helperId: string) {
  const grants = db
    .select()
    .from(capabilityGrants)
    .where(
      and(
        eq(capabilityGrants.helperId, helperId),
        isNull(capabilityGrants.revokedAt),
        gt(capabilityGrants.expiresAt, nowIso()),
      ),
    )
    .all();
  const seen = new Set<string>();
  const views: TaskView[] = [];
  for (const grant of grants) {
    if (seen.has(grant.taskId)) continue;
    seen.add(grant.taskId);
    const view = viewTask(db, helperId, grant.taskId);
    if (view?.role === "helper") views.push(view);
  }
  return views;
}

export function listOwnedTasks(db: TetherDb, ownerId: string) {
  const rows = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), eq(tasks.origin, "user")))
    .orderBy(desc(tasks.updatedAt))
    .all();
  if (rows.length === 0) return [];
  const steps = db
    .select()
    .from(taskSteps)
    .where(inArray(taskSteps.taskId, rows.map((row) => row.id)))
    .all();
  return rows.map((task) => {
    const mine = steps.filter((step) => step.taskId === task.id);
    return viewFrom(task, mine, "owner");
  });
}

function syncCompletion(db: TetherDb, task: TaskRow, steps: StepRow[]) {
  const allDone = steps.length > 0 && steps.every((step) => step.status === "done");
  const completedAt = allDone ? task.completedAt ?? nowIso() : null;
  db.update(tasks)
    .set({
      status: allDone ? "completed" : "open",
      completedAt,
      updatedAt: nowIso(),
    })
    .where(eq(tasks.id, task.id))
    .run();
  if (allDone) {
    db.insert(metricEvents)
      .values({
        id: randomUUID(),
        ownerId: task.ownerId,
        name: "task_completed",
        taskId: task.id,
        createdAt: completedAt ?? nowIso(),
      })
      .onConflictDoNothing()
      .run();
  } else {
    db.delete(metricEvents)
      .where(and(eq(metricEvents.taskId, task.id), eq(metricEvents.name, "task_completed")))
      .run();
  }
}

export function createTask(
  db: TetherDb,
  ownerId: string,
  input: {
    templateType: TemplateId;
    title: string;
    dueOn: string;
    customSteps?: string;
    idempotencyKey?: string | null;
  },
): { ok: true; taskId: string; reused: boolean } | ServiceFailure {
  const template = templateById(input.templateType);
  if (!template) {
    return { ok: false, status: 422, code: "validation", message: "Choose a checklist type.", fields: { templateType: "Choose a checklist type." } };
  }
  const instructions =
    template.id === "custom" ? parseCustomSteps(input.customSteps ?? "") : { ok: true as const, steps: template.steps };
  if (!instructions.ok) {
    return { ok: false, status: 422, code: "validation", message: instructions.message, fields: { customSteps: instructions.message } };
  }

  const key = input.idempotencyKey?.trim() || null;
  if (key) {
    const existing = db
      .select()
      .from(tasks)
      .where(and(eq(tasks.ownerId, ownerId), eq(tasks.idempotencyKey, key)))
      .get();
    if (existing) return { ok: true, taskId: existing.id, reused: true };
  }

  const taskId = randomUUID();
  const timestamp = nowIso();
  const summary = template.summary;
  db.transaction((tx) => {
    tx.insert(tasks)
      .values({
        id: taskId,
        ownerId,
        title: input.title.trim(),
        summary,
        templateType: template.id,
        status: "open",
        dueOn: input.dueOn || null,
        origin: "user",
        idempotencyKey: key,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
      })
      .run();
    instructions.steps.forEach((instruction, index) => {
      tx.insert(taskSteps)
        .values({
          id: randomUUID(),
          taskId,
          ordinal: index + 1,
          instruction,
          status: "pending",
          doneAt: null,
        })
        .run();
    });
  });
  recordAudit(db, {
    taskId,
    actorId: ownerId,
    type: "task_created",
    metadata: { templateType: template.id, stepCount: instructions.steps.length, title: input.title.trim() },
  });
  return { ok: true, taskId, reused: false };
}

export function rememberDisplayName(db: TetherDb, userId: string, displayName: string | undefined, required: boolean) {
  if (!displayName || displayName.trim() === "") {
    if (!required) return { ok: true as const };
    return { ok: false as const, message: "Enter a name people will recognize." };
  }
  const parsed = displayNameSchema.safeParse(displayName);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Enter a name people will recognize." };
  }
  db.update(users).set({ displayName: parsed.data }).where(eq(users.id, userId)).run();
  return { ok: true as const };
}

export function setStepDone(
  db: TetherDb,
  userId: string,
  taskId: string,
  stepId: string,
  done: boolean,
): { ok: true; view: TaskView } | ServiceFailure {
  const view = viewTask(db, userId, taskId);
  if (!view || view.role !== "owner") {
    return { ok: false, status: 404, code: "not_available", message: "This checklist is not available to you." };
  }
  const step = view.steps.find((item) => item.id === stepId);
  if (!step) {
    return { ok: false, status: 404, code: "not_available", message: "This checklist is not available to you." };
  }
  const nextStatus = done ? "done" : "pending";
  if (step.status !== nextStatus) {
    db.update(taskSteps)
      .set({ status: nextStatus, doneAt: done ? nowIso() : null })
      .where(and(eq(taskSteps.id, stepId), eq(taskSteps.taskId, taskId)))
      .run();
    const refreshed = stepsFor(db, taskId);
    syncCompletion(db, view.task, refreshed);
    recordAudit(db, {
      taskId,
      actorId: userId,
      type: done ? "step_done" : "step_reopened",
      metadata: { stepId, ordinal: step.ordinal },
    });
  }
  const updated = viewTask(db, userId, taskId);
  if (!updated) {
    return { ok: false, status: 404, code: "not_available", message: "This checklist is not available to you." };
  }
  return { ok: true, view: updated };
}
