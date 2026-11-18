import { NextResponse } from "next/server";
import { ensureSession } from "@/lib/auth/session";
import { updatePreferences } from "@/lib/auth/users";
import { getDb } from "@/lib/db/client";
import { jsonError, requestIsSecure, sameOrigin, sameOriginRedirect } from "@/lib/http";

export const dynamic = "force-dynamic";

const scales = new Set(["1", "1.15", "1.3", "1.5"]);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to save preferences.");
  const form = await request.formData();
  const locale = form.get("locale") === "es" ? "es" : form.get("locale") === "en" ? "en" : null;
  const textScale = String(form.get("textScale") ?? "");
  const contrast = form.get("contrast") === "high" ? "high" : form.get("contrast") === "standard" ? "standard" : null;
  if (!locale || !contrast || !scales.has(textScale)) {
    return NextResponse.redirect(sameOriginRedirect(request, "/settings?error=prefs"), 303);
  }
  const db = getDb();
  const user = await ensureSession(db, requestIsSecure(request));
  updatePreferences(db, user.id, {
    locale,
    textScale,
    contrast,
    simplified: form.get("simplified") === "yes",
  });
  return NextResponse.redirect(sameOriginRedirect(request, "/settings?prefs=1"), 303);
}
