import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin, sameOriginRedirect, wantsJson } from "@/lib/http";
import { createProposal } from "@/lib/proposals/service";
import { consumeRateLimit, LIMITS } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to send a suggestion.");
  const { id } = await context.params;
  const json = wantsJson(request);
  const payload = json
    ? ((await request.json().catch(() => null)) as { kind?: unknown; stepId?: unknown; body?: unknown } | null)
    : null;
  const form = json ? null : await request.formData();
  const kind = json ? payload?.kind : form?.get("kind");
  const stepId = json ? payload?.stepId : form?.get("stepId");
  const body = json ? payload?.body : form?.get("body");
  if (kind !== "complete_step" && kind !== "comment") {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, `/tasks/${id}?error=suggestion`), 303);
    return jsonError(422, "validation", "Choose a suggestion type.");
  }
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, "/tasks"), 303);
    return jsonError(401, "unauthenticated", "Open your invitation before sending a suggestion.");
  }
  if (!consumeRateLimit(db, `proposal:${user.id}`, LIMITS.proposal.limit, LIMITS.proposal.windowMs)) {
    return jsonError(429, "rate_limited", "Too many suggestions. Wait an hour and try again.");
  }
  const key = request.headers.get("idempotency-key");
  const created = createProposal(db, user.id, id, {
    kind,
    stepId: typeof stepId === "string" ? stepId : undefined,
    body: typeof body === "string" ? body : "",
    idempotencyKey: key,
  });
  if (!created.ok) {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, `/tasks/${id}?error=suggestion`), 303);
    return jsonError(created.status, created.code, created.message);
  }
  if (!json) return NextResponse.redirect(sameOriginRedirect(request, `/tasks/${id}`), 303);
  return Response.json({ proposalId: created.proposalId, reused: created.reused });
}
