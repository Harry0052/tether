import { cookies } from "next/headers";
import { createGuest, readUserByToken, type PublicUser } from "@/lib/auth/users";
import type { TetherDb } from "@/lib/db/client";

export const SESSION_COOKIE = "tether_session";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function readSessionUser(db: TetherDb): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readUserByToken(db, token);
}

export async function ensureSession(db: TetherDb, secure: boolean): Promise<PublicUser> {
  const existing = await readSessionUser(db);
  if (existing) return existing;
  const created = createGuest(db);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, created.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
    secure,
  });
  return created.user;
}
