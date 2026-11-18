import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const LOCAL_FALLBACK = "tether-local-development-invite-secret";

export function inviteSigning() {
  const configured = process.env.TETHER_INVITE_SECRET?.trim();
  if (configured && configured.length >= 16 && configured !== LOCAL_FALLBACK) {
    return { secret: configured, source: "env" as const };
  }
  return { secret: LOCAL_FALLBACK, source: "local-fallback" as const };
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function issueInviteToken(invitationId: string) {
  const nonce = randomBytes(24).toString("base64url");
  const payload = `${invitationId}.${nonce}`;
  const mac = createHmac("sha256", inviteSigning().secret).update(payload).digest("base64url");
  const token = `${payload}.${mac}`;
  return { token, tokenHash: hashInviteToken(token) };
}

export function checkInviteToken(token: string):
  | { ok: true; invitationId: string; tokenHash: string }
  | { ok: false; reason: "malformed" } {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [invitationId, nonce, mac] = parts;
  if (!invitationId || !nonce || !mac) return { ok: false, reason: "malformed" };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invitationId)) {
    return { ok: false, reason: "malformed" };
  }
  if (nonce.length < 16 || mac.length < 20) return { ok: false, reason: "malformed" };
  const expected = createHmac("sha256", inviteSigning().secret)
    .update(`${invitationId}.${nonce}`)
    .digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, reason: "malformed" };
  }
  return { ok: true, invitationId, tokenHash: hashInviteToken(token) };
}
