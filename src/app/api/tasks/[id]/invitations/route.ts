import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin } from "@/lib/http";
import { consumeRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { createInvitation, isInviteDays } from "@/lib/trust/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to invite someone.");
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { days?: unknown } | null;
  const days = typeof body?.days === "number" ? body.days : Number.NaN;
  if (!isInviteDays(days)) {
    return jsonError(422, "validation", "Choose 1, 7, or 30 days.", { days: "Choose 1, 7, or 30 days." });
  }
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) return jsonError(401, "unauthenticated", "Save your name before inviting someone.");
  if (!consumeRateLimit(db, `invite:${user.id}`, LIMITS.invite.limit, LIMITS.invite.windowMs)) {
    return jsonError(429, "rate_limited", "Too many invitations from this session. Wait an hour and try again.");
  }
  const created = createInvitation(db, user.id, id, days);
  if (!created.ok) return jsonError(created.status, created.code, created.message);
  return Response.json({
    token: created.token,
    expiresAt: created.expiresAt,
    invitationId: created.invitationId,
  });
}
