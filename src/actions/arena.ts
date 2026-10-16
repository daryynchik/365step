"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buyItem, equipItem, setColor, startFight, type Result } from "@/lib/arena";
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

export async function startFightAction(opponentId: string): Promise<Result> {
  const user = await requireUser();
  const outcome = await startFight(user.id, opponentId);
  if (!outcome.ok) return { ok: false, error: outcome.error };
  revalidate();
  redirect(`/arena/duel/${outcome.duelId}`);
}
