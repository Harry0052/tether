import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { jsonError, sameOrigin } from "@/lib/http";
import { revokeGrant } from "@/lib/trust/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError(403, "forbidden", "Open Tether in this browser to remove access.");
  const { id } = await context.params;
  const db = getDb();
  const user = await readSessionUser(db);
  if (!user) return jsonError(401, "unauthenticated", "Save your name before removing access.");
  const result = revokeGrant(db, user.id, id);
  if (!result.ok) return jsonError(result.status, result.code, result.message);
  return Response.json({ ok: true });
}
