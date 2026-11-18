import { eq } from "drizzle-orm";
import type { TetherDb } from "@/lib/db/client";
import { taskSteps, tasks, users } from "@/lib/db/schema";
import { SAMPLE_OWNER_ID, SAMPLE_TASK_ID } from "@/lib/tasks/service";

const SEEDED_AT = "2026-11-18T15:00:00.000Z";

const SAMPLE_STEPS = [
  "Write down who you want to see",
  "Pick a day and a time",
  "Open the calling app on your own phone",
  "Check the camera and the sound",
  "End the call when you are both ready",
];

export function seedDemo(db: TetherDb) {
  const existing = db.select().from(tasks).where(eq(tasks.id, SAMPLE_TASK_ID)).get();
  if (existing) return;

  db.insert(users)
    .values({
      id: SAMPLE_OWNER_ID,
      displayName: "Mira Chen (sample)",
      kind: "demo",
      email: null,
      passwordHash: null,
      locale: "en",
      textScale: "1",
      contrast: "standard",
      simplified: 0,
      createdAt: SEEDED_AT,
    })
    .onConflictDoNothing()
    .run();

  db.insert(tasks)
    .values({
      id: SAMPLE_TASK_ID,
      ownerId: SAMPLE_OWNER_ID,
      title: "Set up a video call",
      summary: "A list you follow together. Tether does not open the calling app or join the call.",
      templateType: "video_call",
      status: "open",
      dueOn: "2026-11-20",
      origin: "demo_seed",
      idempotencyKey: null,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      completedAt: null,
    })
    .run();

  SAMPLE_STEPS.forEach((instruction, index) => {
    const done = index < 2;
    db.insert(taskSteps)
      .values({
        id: `00000000-0000-4000-8000-00000000001${index + 1}`,
        taskId: SAMPLE_TASK_ID,
        ordinal: index + 1,
        instruction,
        status: done ? "done" : "pending",
        doneAt: done ? SEEDED_AT : null,
      })
      .run();
  });
}
