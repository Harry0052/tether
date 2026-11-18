import { desc, inArray } from "drizzle-orm";
import type { TetherDb } from "@/lib/db/client";
import { auditEvents, tasks } from "@/lib/db/schema";
import { listHelpedTasks, listOwnedTasks } from "@/lib/tasks/service";

export function listVisibleActivity(db: TetherDb, userId: string) {
  const visible = [...listOwnedTasks(db, userId), ...listHelpedTasks(db, userId)];
  const ids = visible.map((item) => item.task.id);
  if (ids.length === 0) return [];
  const titles = new Map(visible.map((item) => [item.task.id, item.task.title]));
  const events = db
    .select()
    .from(auditEvents)
    .where(inArray(auditEvents.taskId, ids))
    .orderBy(desc(auditEvents.occurredAt))
    .limit(100)
    .all();
  return events.flatMap((event) => {
    if (!event.taskId) return [];
    const title = titles.get(event.taskId) ?? db.select().from(tasks).where(inArray(tasks.id, [event.taskId])).get()?.title;
    if (!title) return [];
    return [{ id: event.id, taskId: event.taskId, taskTitle: title, type: event.type, metadataJson: event.metadataJson, occurredAt: event.occurredAt }];
  });
}
