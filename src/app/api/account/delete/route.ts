import { NextResponse } from "next/server";
import { deleteAccount } from "@/lib/account/privacy";
import { readSessionUser, SESSION_COOKIE } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin, sameOriginRedirect, wantsJson } from "@/lib/http";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to delete data.");
  const json = wantsJson(request);
  const form = json ? null : await request.formData();
  const body = json ? ((await request.json().catch(() => null)) as { confirmName?: unknown } | null) : null;
  const confirmName = json ? body?.confirmName : form?.get("confirmName");
  if (typeof confirmName !== "string") {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, "/settings?error=delete"), 303);
    return jsonError(422, "validation", "Type your name exactly. Nothing was deleted.");
  }
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) return jsonError(401, "unauthenticated", "Open Tether in this browser before deleting data.");
  const result = deleteAccount(db, user.id, confirmName);
  if (!result.ok) {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, "/settings?error=delete"), 303);
    return jsonError(result.status, "validation", result.message);
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  if (!json) return NextResponse.redirect(sameOriginRedirect(request, "/?deleted=1"), 303);
  return Response.json({ ok: true });
}
