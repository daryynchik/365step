"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buyItem, equipItem, setColor, requestFight, respondToFightRequest, type Result } from "@/lib/arena";
import { requireUser } from "@/lib/auth";

function revalidate(): void {
  revalidatePath("/", "layout");
}

export async function buyItemAction(itemId: string): Promise<Result> {
  const user = await requireUser();
  const result = await buyItem(user.id, itemId);
  if (result.ok) revalidate();
  return result;
}

export async function equipItemAction(itemId: string): Promise<Result> {
  const user = await requireUser();
  const result = await equipItem(user.id, itemId);
  if (result.ok) revalidatePath("/arena");
  return result;
}

export async function setColorAction(color: string): Promise<Result> {
  const user = await requireUser();
  const result = await setColor(user.id, color);
  if (result.ok) revalidatePath("/arena");
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
