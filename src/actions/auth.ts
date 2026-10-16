"use server";

import { redirect } from "next/navigation";

import {
  authenticate,
  createSession,
  destroySession,
  hasOnboarded,
  pruneSessions,
  registerUser,
  validateCredentials,
} from "@/lib/auth";
import { ensureDemoUser, type DemoPersona } from "@/lib/demo";

export interface FormState {
  error?: string;
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const invalid = validateCredentials(email, password, name);
  if (invalid) return { error: invalid };

  const result = await registerUser(email, password, name);
  if (!result.ok || !result.userId) return { error: result.error ?? "Could not create account." };

  await createSession(result.userId);

  // `redirect` signals by throwing, so it must sit outside any try/catch.
  redirect("/onboarding");
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const result = await authenticate(email, password);
  if (!result.ok || !result.userId) return { error: result.error ?? "Could not sign in." };

  await pruneSessions();
  await createSession(result.userId);

  redirect((await hasOnboarded(result.userId)) ? "/dashboard" : "/onboarding");
}

/**
 * Signs into one of the demo accounts: school, university or graduate.
 *
 * Present so a first-time visitor — or a judge with two minutes — can see a
 * populated product immediately instead of an empty new account.
 */
export async function demoLoginAction(persona: DemoPersona = "school"): Promise<FormState> {
  if (process.env.ENABLE_DEMO !== "true") return { error: "Демо-режим выключен. Создайте свой аккаунт." };
  const userId = await ensureDemoUser(persona);
  if (!userId) return { error: "Unknown demo scenario." };

  await createSession(userId);
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
