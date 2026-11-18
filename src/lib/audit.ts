import { randomUUID } from "node:crypto";
import type { TetherDb } from "@/lib/db/client";
import { auditEvents } from "@/lib/db/schema";
import { redactMetadata } from "@/lib/security/redact";
import { nowIso } from "@/lib/time";

export function recordAudit(
  db: TetherDb,
  event: {
    taskId: string | null;
    actorId: string | null;
    type: string;
    metadata?: Record<string, string | number>;
  },
) {
  const metadata = redactMetadata(event.metadata ?? {});
  db.insert(auditEvents)
    .values({
      id: randomUUID(),
      taskId: event.taskId,
      actorId: event.actorId,
      type: event.type,
      metadataJson: JSON.stringify(metadata),
      occurredAt: nowIso(),
    })
    .run();
  return metadata;
}
