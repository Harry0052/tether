import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";
import { databaseFrom, openDatabase } from "@/lib/db/client";
import { auditEvents } from "@/lib/db/schema";
import { seedDemo } from "@/lib/db/seed";
import { createGuest } from "@/lib/auth/users";
import { createTask, listOwnedTasks, SAMPLE_TASK_ID, setStepDone, viewTask } from "./service";

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

describe("checklists", () => {
  test("an owner creates a checklist, completes it, and reads the same state back", () => {
    const database = db();
    const owner = createGuest(database);
    const created = createTask(database, owner.user.id, {
      templateType: "video_call",
      title: "Call Sunday",
      dueOn: "2026-11-22",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const first = viewTask(database, owner.user.id, created.taskId);
    expect(first?.steps).toHaveLength(5);
    expect(first?.task.status).toBe("open");

    for (const step of first?.steps ?? []) {
      const saved = setStepDone(database, owner.user.id, created.taskId, step.id, true);
      expect(saved.ok).toBe(true);
    }
    const done = viewTask(database, owner.user.id, created.taskId);
    expect(done?.task.status).toBe("completed");
    expect(done?.doneCount).toBe(5);

    const again = listOwnedTasks(database, owner.user.id);
    expect(again).toHaveLength(1);
    expect(again[0]?.task.title).toBe("Call Sunday");
    expect(again[0]?.task.status).toBe("completed");
  });

  test("another person cannot read or complete the checklist", () => {
    const database = db();
    const owner = createGuest(database);
    const stranger = createGuest(database);
    const created = createTask(database, owner.user.id, {
      templateType: "learn_app",
      title: "Try the photos app",
      dueOn: "",
    });
    if (!created.ok) throw new Error(created.message);
    expect(viewTask(database, stranger.user.id, created.taskId)).toBeNull();
    const stepId = viewTask(database, owner.user.id, created.taskId)?.steps[0]?.id ?? "";
    const denied = setStepDone(database, stranger.user.id, created.taskId, stepId, true);
    expect(denied.ok).toBe(false);
    expect(viewTask(database, owner.user.id, created.taskId)?.doneCount).toBe(0);
  });

  test("the same idempotency key does not create a second checklist", () => {
    const database = db();
    const owner = createGuest(database);
    const first = createTask(database, owner.user.id, {
      templateType: "custom",
      title: "First",
      dueOn: "",
      customSteps: "One\nTwo",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    });
    const second = createTask(database, owner.user.id, {
      templateType: "custom",
      title: "Second",
      dueOn: "",
      customSteps: "Only",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    });
    expect(first.ok && second.ok && first.taskId === second.taskId).toBe(true);
    expect(listOwnedTasks(database, owner.user.id)).toHaveLength(1);
    expect(listOwnedTasks(database, owner.user.id)[0]?.task.title).toBe("First");
  });

  test("a reopened step returns the checklist to open", () => {
    const database = db();
    const owner = createGuest(database);
    const created = createTask(database, owner.user.id, {
      templateType: "custom",
      title: "Short",
      dueOn: "",
      customSteps: "Only step",
    });
    if (!created.ok) throw new Error(created.message);
    const stepId = viewTask(database, owner.user.id, created.taskId)?.steps[0]?.id ?? "";
    setStepDone(database, owner.user.id, created.taskId, stepId, true);
    expect(viewTask(database, owner.user.id, created.taskId)?.task.status).toBe("completed");
    setStepDone(database, owner.user.id, created.taskId, stepId, false);
    expect(viewTask(database, owner.user.id, created.taskId)?.task.status).toBe("open");
  });

  test("the activity row redacts a password typed into the title", () => {
    const database = db();
    const owner = createGuest(database);
    const created = createTask(database, owner.user.id, {
      templateType: "custom",
      title: "password: hunter2",
      dueOn: "",
      customSteps: "Look in the drawer",
    });
    if (!created.ok) throw new Error(created.message);
    const rows = database.select().from(auditEvents).where(eq(auditEvents.taskId, created.taskId)).all();
    expect(JSON.stringify(rows)).not.toContain("hunter2");
    expect(viewTask(database, owner.user.id, created.taskId)?.task.title).toBe("password: hunter2");
  });

  test("the sample checklist is visible, labeled by origin, and read-only", () => {
    const database = db();
    seedDemo(database);
    seedDemo(database);
    const visitor = createGuest(database);
    const sample = viewTask(database, null, SAMPLE_TASK_ID);
    expect(sample?.role).toBe("sample");
    expect(sample?.task.origin).toBe("demo_seed");
    expect(sample?.doneCount).toBe(2);
    const stepId = sample?.steps[2]?.id ?? "";
    const denied = setStepDone(database, visitor.user.id, SAMPLE_TASK_ID, stepId, true);
    expect(denied.ok).toBe(false);
    expect(listOwnedTasks(database, visitor.user.id)).toHaveLength(0);
  });
});
