"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requestFight, respondToFightRequest, saveLook, upgradeGear, type Result, type UpgradeResult } from "@/lib/arena";
import type { Look } from "@/lib/arena-rules";
import { requireUser } from "@/lib/auth";

function revalidate(): void {
  revalidatePath("/", "layout");
}

export async function saveLookAction(look: Look): Promise<Result> {
  const user = await requireUser();
  const result = await saveLook(user.id, look);
  if (result.ok) revalidatePath("/arena");
  return { ok: result.ok, error: result.error };
}

export async function upgradeGearAction(slot: string, fromLevel: number): Promise<UpgradeResult> {
  const user = await requireUser();
  const result = await upgradeGear(user.id, slot, fromLevel);
  // The balance in the header changes too.
  if (result.ok) revalidate();
  return result;
}

export async function requestFightAction(opponentId: string): Promise<Result> {
  const user = await requireUser();
  const result = await requestFight(user.id, opponentId);
  if (result.ok) revalidate();
  return result;
}

export async function respondToFightAction(requestId: string, response: "accept" | "decline" | "cancel"): Promise<Result> {
  const user = await requireUser();
  const result = await respondToFightRequest(user.id, requestId, response);
  if (!result.ok) return result;
  revalidate();
  if (result.duelId) redirect(`/arena/duel/${result.duelId}`);
  return { ok: true };
}
