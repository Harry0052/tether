import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { jsonError, requestIsSecure, sameOrigin, sameOriginRedirect, wantsJson } from "@/lib/http";
import { consumeRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { acceptInvitation } from "@/lib/trust/service";
import { displayNameSchema } from "@/lib/validators/profile";

export const dynamic = "force-dynamic";

async function readName(request: Request) {
  if (wantsJson(request)) {
    const body = (await request.json().catch(() => null)) as { displayName?: unknown } | null;
    return displayNameSchema.safeParse(body?.displayName);
  }
  const form = await request.formData();
  return displayNameSchema.safeParse(form.get("displayName"));
}

function invitePath(token: string, query = "") {
  return `/invite/${encodeURIComponent(token)}${query}`;
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to accept an invitation.");
  const { token } = await context.params;
  const parsed = await readName(request);
  const json = wantsJson(request);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Enter a name people will recognize.";
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, invitePath(token, "?error=name")), 303);
    return jsonError(422, "validation", message, { displayName: message });
  }
  const db = getDb();
  const user = await ensureSession(db, requestIsSecure(request));
  if (!consumeRateLimit(db, `accept:${user.id}`, LIMITS.invite.limit, LIMITS.invite.windowMs)) {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, invitePath(token, "?error=limited")), 303);
    return jsonError(429, "rate_limited", "Too many invitation attempts. Wait an hour and try again.");
  }
  db.update(users).set({ displayName: parsed.data }).where(eq(users.id, user.id)).run();
  const accepted = acceptInvitation(db, user.id, token);
  if (!accepted.ok) {
    if (!json) {
      const path =
        accepted.code === "owner" && accepted.taskId ? `/tasks/${accepted.taskId}` : invitePath(token, "?error=invalid");
      return NextResponse.redirect(sameOriginRedirect(request, path), 303);
    }
    return jsonError(accepted.status, accepted.code, accepted.message);
  }
  if (!json) return NextResponse.redirect(sameOriginRedirect(request, `/tasks/${accepted.taskId}`), 303);
  return Response.json({ taskId: accepted.taskId });
}
