"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buyItem, equipItem, saveLook, unequipSlot, type PurchaseResult, type Result } from "@/lib/arena";
import type { Look } from "@/lib/arena-rules";
import { requireUser } from "@/lib/auth";
import { inviteFriend, respondInvite, startCalibration } from "@/lib/race";
import type { Outfit } from "@/lib/shop-items";

export async function saveLookAction(look: Look): Promise<Result> {
  const user = await requireUser();
  const result = await saveLook(user.id, look);
  if (result.ok) revalidatePath("/arena", "layout");
  return { ok: result.ok, error: result.error };
}

export async function buyItemAction(itemId: string): Promise<PurchaseResult> {
  const user = await requireUser();
  const result = await buyItem(user.id, itemId);
  // The coin balance in the header changes too.
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function equipItemAction(itemId: string): Promise<Result & { outfit?: Outfit }> {
  const user = await requireUser();
  const result = await equipItem(user.id, itemId);
  if (result.ok) revalidatePath("/arena", "layout");
  return result;
}

export async function unequipAction(slot: string): Promise<Result & { outfit?: Outfit }> {
  const user = await requireUser();
  const result = await unequipSlot(user.id, slot);
  if (result.ok) revalidatePath("/arena", "layout");
  return result;
}

export async function inviteFriendAction(friendId: string, track: string): Promise<Result> {
  const user = await requireUser();
  const result = await inviteFriend(user.id, friendId, track, Date.now());
  if (result.ok) revalidatePath("/arena");
  return result.ok ? { ok: true } : result;
}

export async function respondInviteAction(inviteId: string, response: string): Promise<Result> {
  const user = await requireUser();
  const result = await respondInvite(user.id, inviteId, response, Date.now());
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  if (result.raceId) redirect(`/arena/race/${result.raceId}`);
  return { ok: true };
}

export async function startCalibrationAction(track: string): Promise<Result> {
  const user = await requireUser();
  const result = await startCalibration(user.id, track, Date.now());
  if (!result.ok) return result;
  redirect(`/arena/calibrate/${result.id}`);
}
