import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin, sameOriginRedirect, wantsJson } from "@/lib/http";
import { revokeHelper } from "@/lib/trust/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ helperId: string }> }) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to remove access.");
  const { helperId } = await context.params;
  const form = wantsJson(request) ? null : await request.formData();
  const body = form ? null : ((await request.json().catch(() => null)) as { confirm?: unknown } | null);
  const confirmed = form ? form.get("confirm") === "yes" : body?.confirm === true;
  if (!confirmed) {
    if (form) return NextResponse.redirect(sameOriginRedirect(request, "/people?error=confirm"), 303);
    return jsonError(422, "validation", "Confirm that this person should lose access immediately.");
  }
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) return jsonError(401, "unauthenticated", "Save your name before removing access.");
  const result = revokeHelper(db, user.id, helperId);
  if (!form) {
    if (!result.ok) return jsonError(result.status, result.code, result.message);
    return Response.json({ ok: true });
  }
  return NextResponse.redirect(sameOriginRedirect(request, result.ok ? "/people?removed=1" : "/people?error=unavailable"), 303);
}
