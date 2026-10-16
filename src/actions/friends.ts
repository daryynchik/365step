"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { removeFriend, respondToRequest, sendFriendRequest, type Result } from "@/lib/friends";

function revalidate(): void {
  revalidatePath("/friends");
  revalidatePath("/arena");
  revalidatePath("/path");
}

export async function sendFriendRequestAction(email: string): Promise<Result> {
  const user = await requireUser();
  const result = await sendFriendRequest(user.id, email);
  if (result.ok) revalidate();
  return result;
}

export async function respondToRequestAction(friendshipId: string, accept: boolean): Promise<Result> {
  const user = await requireUser();
  const result = await respondToRequest(user.id, friendshipId, accept);
  if (result.ok) revalidate();
  return result;
}

export async function removeFriendAction(friendId: string): Promise<Result> {
  const user = await requireUser();
  const result = await removeFriend(user.id, friendId);
  if (result.ok) revalidate();
  return result;
}
