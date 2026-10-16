/**
 * Account operations: validation, registration, credential checks.
 *
 * Free of request-scoped dependencies (no next/headers), so scripts such as the
 * seed can create and authenticate users. Sessions and cookies live in auth.ts.
 */

import { randomUUID } from "node:crypto";

import { one, run } from "./db";
import { nowIso } from "./date";
import { hashPassword, verifyPassword } from "./password";

export interface AuthResult {
  ok: boolean;
  error?: string;
  userId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(email: string, password: string, name?: string): string | null {
  if (!EMAIL_RE.test(email.trim())) return "Проверь email — похоже, в нём опечатка.";
  if (password.length < 8) return "Пароль должен быть не короче 8 символов.";
  if (name !== undefined && name.trim().length < 2) return "Как тебя зовут?";
  if (name !== undefined && name.trim().length > 40) return "Имя слишком длинное — до 40 символов.";
  return null;
}

export async function registerUser(email: string, password: string, name: string): Promise<AuthResult> {
  const invalid = validateCredentials(email, password, name);
  if (invalid) return { ok: false, error: invalid };

  const normalised = email.trim().toLowerCase();
  const existing = await one<{ id: string }>("SELECT id FROM users WHERE email = ?", [normalised]);
  if (existing) return { ok: false, error: "Этот email уже зарегистрирован. Попробуй войти." };

  const id = randomUUID();
  await run("INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)", [
    id,
    normalised,
    await hashPassword(password),
    name.trim(),
    nowIso(),
  ]);
  return { ok: true, userId: id };
}

export async function authenticate(email: string, password: string): Promise<AuthResult> {
  const row = await one<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ?",
    [email.trim().toLowerCase()],
  );
  // Same message for both cases, so the form does not reveal which emails exist.
  if (!row || !(await verifyPassword(password, String(row.password_hash)))) {
    return { ok: false, error: "Неверный email или пароль." };
  }
  return { ok: true, userId: String(row.id) };
}

export async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  return one<{ id: string }>("SELECT id FROM users WHERE email = ?", [email.trim().toLowerCase()]);
}

export async function pruneSessions(): Promise<void> {
  await run("DELETE FROM sessions WHERE expires_at < ?", [nowIso()]);
}
