import { ensureSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, requestIsSecure, sameOrigin, wantsJson } from "@/lib/http";
import { logEvent } from "@/lib/observability";
import { consumeRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { createTask, rememberDisplayName } from "@/lib/tasks/service";
import { createTaskSchema, fieldErrors } from "@/lib/validators/tasks";

export const dynamic = "force-dynamic";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return jsonError(403, "forbidden", "Open Tether in this browser to create a checklist.");
  }
  if (!wantsJson(request)) {
    return jsonError(415, "unsupported", "Send the checklist as JSON.");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(422, "validation", "The checklist was not valid JSON.");
  }
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    return jsonError(422, "validation", Object.values(fields)[0] ?? "Check the checklist.", fields);
  }
  const key = request.headers.get("idempotency-key");
  if (key && !uuid.test(key)) {
    return jsonError(422, "validation", "The idempotency key was not valid.");
  }

  const db = getDb();
  const user = await ensureSession(db, requestIsSecure(request));
  if (!consumeRateLimit(db, `task:${user.id}`, LIMITS.taskCreate.limit, LIMITS.taskCreate.windowMs)) {
    return jsonError(429, "rate_limited", "Too many checklists were created from this session. Wait an hour and try again.");
  }
  const named = rememberDisplayName(db, user.id, parsed.data.displayName, user.displayName === "Guest");
  if (!named.ok) {
    return jsonError(422, "validation", named.message, { displayName: named.message });
  }
  const created = createTask(db, user.id, {
    templateType: parsed.data.templateType,
    title: parsed.data.title,
    dueOn: parsed.data.dueOn,
    customSteps: parsed.data.customSteps,
    idempotencyKey: key,
  });
  if (!created.ok) return jsonError(created.status, created.code, created.message, created.fields);
  logEvent("info", "task_created", { taskId: created.taskId, reused: created.reused });
  return Response.json({ taskId: created.taskId, reused: created.reused });
}
