"use server";

import { redirect } from "next/navigation";

import { authenticate, createSession, destroySession, pruneSessions, registerUser, validateCredentials } from "@/lib/auth";
import { ensureDemo } from "@/lib/demo";

export interface FormState {
  error?: string;
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const invalid = validateCredentials(email, password, name);
  if (invalid) return { error: invalid };

  const result = await registerUser(email, password, name);
  if (!result.ok || !result.userId) return { error: result.error ?? "Не удалось создать аккаунт." };

  await createSession(result.userId);
  // redirect() works by throwing, so it stays outside any try/catch.
  redirect("/start");
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Введи email и пароль." };

  const result = await authenticate(email, password);
  if (!result.ok || !result.userId) return { error: result.error ?? "Не удалось войти." };

  await pruneSessions();
  await createSession(result.userId);
  redirect("/path");
}

export async function demoLoginAction(): Promise<void> {
  const userId = await ensureDemo();
  await createSession(userId);
  redirect("/path");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
