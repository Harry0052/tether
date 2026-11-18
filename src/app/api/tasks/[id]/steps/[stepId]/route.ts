import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin, sameOriginRedirect, wantsJson } from "@/lib/http";
import { setStepDone } from "@/lib/tasks/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; stepId: string }> }) {
  if (!sameOrigin(request)) {
    return jsonError(403, "forbidden", "Open Tether in this browser to update a step.");
  }
  const { id, stepId } = await context.params;
  const user = await readSessionUser(getDb());
  if (!user) {
    if (wantsJson(request)) return jsonError(401, "unauthenticated", "Save your name before changing a step.");
    return NextResponse.redirect(sameOriginRedirect(request, "/tasks/new"), 303);
  }
  let done = false;
  if (wantsJson(request)) {
    const body = (await request.json().catch(() => null)) as { done?: unknown } | null;
    done = body?.done === true;
  } else {
    const form = await request.formData();
    done = form.get("done") === "true";
  }
  const result = setStepDone(getDb(), user.id, id, stepId, done);
  if (!result.ok) {
    if (wantsJson(request)) return jsonError(result.status, result.code, result.message);
    return NextResponse.redirect(sameOriginRedirect(request, "/tasks?error=unavailable"), 303);
  }
  if (wantsJson(request)) {
    return Response.json({
      taskId: result.view.task.id,
      status: result.view.task.status,
      doneCount: result.view.doneCount,
    });
  }
  return NextResponse.redirect(sameOriginRedirect(request, `/tasks/${id}`), 303);
}
