/**
 * Sessions: the request-scoped half of authentication.
 *
 * The cookie holds nothing but a 256-bit random token that is looked up in the
 * `sessions` table, so there is no client-readable claim to forge and signing
 * out actually revokes access.
 *
 * Account operations (registration, credential checks) live in `accounts.ts`,
 * which has no request-scoped dependencies.
 */

import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { one, run } from "./db";
import { nowIso } from "./date";
import type { User } from "./types";

const COOKIE = "step365_session";
const SESSION_DAYS = 30;

// Re-exported so callers have one import for "auth", while the implementation
// stays split along the request-scoped boundary.
export {
  authenticate,
  findUserByEmail,
  pruneSessions,
  registerUser,
  validateCredentials,
  type AuthResult,
} from "./accounts";
export { hashPassword, verifyPassword } from "./password";

// -------------------------------------------------------------- sessions ----

export async function createSession(userId: string): Promise<void> {
  const id = randomBytes(32).toString("hex");
  const created = new Date();
  const expires = new Date(created.getTime() + SESSION_DAYS * 86_400_000);

  await run("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)", [
    id,
    userId,
    created.toISOString(),
    expires.toISOString(),
  ]);

  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) await run("DELETE FROM sessions WHERE id = ?", [id]);
  jar.delete(COOKIE);
}

/**
 * The signed-in user, or null. Memoised per request so the many server
 * components on a page share one lookup.
 */
export const currentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;

  const row = await one<Record<string, unknown>>(
    `SELECT u.id, u.email, u.name, u.created_at, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ?`,
    [id],
  );
  if (!row) return null;

  if (String(row.expires_at) < nowIso()) {
    await run("DELETE FROM sessions WHERE id = ?", [id]);
    return null;
  }

  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    createdAt: String(row.created_at),
  };
});

/**
 * The signed-in user, for server actions.
 *
 * If the session has gone — expired, signed out in another tab — this redirects
 * to sign-in rather than throwing. Throwing would surface as an unhandled server
 * action error, which in practice means a button that spins forever with no
 * explanation; a redirect at least tells the user what happened.
 */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/signin");
  return user;
}
