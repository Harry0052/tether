import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { TetherDb } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";
import { displayNameSchema } from "@/lib/validators/profile";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  displayName: string;
  kind: string;
  email: string | null;
  locale: string;
  textScale: string;
  contrast: string;
  simplified: boolean;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiresAt(from = new Date()) {
  return new Date(from.getTime() + THIRTY_DAYS_MS).toISOString();
}

export function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    displayName: row.displayName,
    kind: row.kind,
    email: row.email,
    locale: row.locale,
    textScale: row.textScale,
    contrast: row.contrast,
    simplified: row.simplified === 1,
  };
}

export function createGuest(db: TetherDb) {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const createdAt = nowIso();
  db.insert(users)
    .values({
      id,
      displayName: "Guest",
      kind: "guest",
      email: null,
      passwordHash: null,
      locale: "en",
      textScale: "1",
      contrast: "standard",
      simplified: 0,
      createdAt,
    })
    .run();
  db.insert(sessions)
    .values({
      id: randomUUID(),
      userId: id,
      tokenHash: hashToken(token),
      createdAt,
      expiresAt: expiresAt(),
    })
    .run();
  const row = db.select().from(users).where(eq(users.id, id)).get();
  if (!row) throw new Error("Guest was not stored.");
  return { user: toPublicUser(row), token };
}

export function readUserByToken(db: TetherDb, token: string) {
  const row = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, nowIso())))
    .get();
  if (!row || row.user.kind === "deleted") return null;
  return toPublicUser(row.user);
}

export function updateDisplayName(db: TetherDb, userId: string, displayName: string) {
  const parsed = displayNameSchema.safeParse(displayName);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Enter a name people will recognize.",
    };
  }
  db.update(users).set({ displayName: parsed.data }).where(eq(users.id, userId)).run();
  const row = db.select().from(users).where(eq(users.id, userId)).get();
  if (!row) return { ok: false as const, message: "That session is no longer on this server." };
  return { ok: true as const, user: toPublicUser(row) };
}
