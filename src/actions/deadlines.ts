"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { addDeadline, removeDeadline, toggleDeadline } from "@/lib/deadlines";

export async function addDeadlineAction(title: string, dueDate: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const result = await addDeadline(user.id, title, dueDate);
  if (result.ok) revalidatePath("/path");
  return result;
}

export async function toggleDeadlineAction(id: string): Promise<void> {
  const user = await requireUser();
  await toggleDeadline(user.id, id);
  revalidatePath("/path");
}

export async function removeDeadlineAction(id: string): Promise<void> {
  const user = await requireUser();
  await removeDeadline(user.id, id);
  revalidatePath("/path");
}
