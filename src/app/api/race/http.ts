import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import type { User } from "@/lib/types";

/** JSON responses for the race endpoints: never cached, 401 without a session. */
export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function signedIn(): Promise<User | NextResponse> {
  const user = await currentUser();
  return user ?? json({ ok: false, error: "Войди в аккаунт." }, 401);
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const data = await request.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
