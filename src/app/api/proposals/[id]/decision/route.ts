import { NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { actionProposals } from "@/lib/db/schema";
import { jsonError, sameOrigin, sameOriginRedirect, wantsJson } from "@/lib/http";
import { decideProposal } from "@/lib/proposals/service";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to decide.");
  const { id } = await context.params;
  const json = wantsJson(request);
  const payload = json ? ((await request.json().catch(() => null)) as { decision?: unknown } | null) : null;
  const form = json ? null : await request.formData();
  const decision = json ? payload?.decision : form?.get("decision");
  const db = getDb();
  const proposal = db.select().from(actionProposals).where(eq(actionProposals.id, id)).get();
  const back = proposal ? `/tasks/${proposal.taskId}` : "/tasks";
  if (decision !== "approved" && decision !== "declined") {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, `${back}?error=decision`), 303);
    return jsonError(422, "validation", "Choose approve or reject.");
  }
  const user = await readSessionUser(db);
  if (!user) return jsonError(401, "unauthenticated", "Save your name before deciding.");
  const result = decideProposal(db, user.id, id, decision);
  if (!result.ok) {
    if (!json) return NextResponse.redirect(sameOriginRedirect(request, `${back}?error=decision`), 303);
    return jsonError(result.status, result.code, result.message);
  }
  if (!json) return NextResponse.redirect(sameOriginRedirect(request, back), 303);
  return Response.json({ status: result.status, reused: result.reused });
}
