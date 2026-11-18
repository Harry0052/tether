import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin, sameOriginRedirect, wantsJson } from "@/lib/http";
import { revokeInvitation } from "@/lib/trust/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to cancel an invitation.");
  const { token: invitationId } = await context.params;
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) return jsonError(401, "unauthenticated", "Save your name before canceling an invitation.");
  const result = revokeInvitation(db, user.id, invitationId);
  if (wantsJson(request)) {
    if (!result.ok) return jsonError(result.status, result.code, result.message);
    return Response.json({ ok: true });
  }
  const path = result.ok ? "/people?cancelled=1" : "/people?error=unavailable";
  return NextResponse.redirect(sameOriginRedirect(request, path), 303);
}
