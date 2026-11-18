import { NextResponse } from "next/server";
import { ensureSession } from "@/lib/auth/session";
import { updateDisplayName } from "@/lib/auth/users";
import { getDb } from "@/lib/db/client";
import { jsonError, requestIsSecure, sameOrigin, sameOriginRedirect, wantsJson } from "@/lib/http";
import { profileSchema } from "@/lib/validators/profile";

export const dynamic = "force-dynamic";

async function readName(request: Request) {
  if (wantsJson(request)) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return { ok: false as const, message: "The request was not valid JSON." };
    }
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the name." };
    }
    return { ok: true as const, displayName: parsed.data.displayName };
  }
  const form = await request.formData();
  const parsed = profileSchema.safeParse({ displayName: form.get("displayName") });
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the name." };
  }
  return { ok: true as const, displayName: parsed.data.displayName };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return jsonError(403, "forbidden", "Open Tether in this browser to save a name.");
  }
  const name = await readName(request);
  const json = wantsJson(request);
  if (!name.ok) {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, "/settings?error=name"), 303);
    return jsonError(422, "validation", name.message, { displayName: name.message });
  }
  const user = await ensureSession(getDb(), requestIsSecure(request));
  const saved = updateDisplayName(getDb(), user.id, name.displayName);
  if (!saved.ok) {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, "/settings?error=name"), 303);
    return jsonError(422, "validation", saved.message, { displayName: saved.message });
  }
  if (!json) return NextResponse.redirect(sameOriginRedirect(request, "/settings?saved=1"), 303);
  return Response.json({ user: saved.user });
}
