"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { saveProfile, type ProfileInput } from "@/lib/profile";

export async function saveGoalAction(input: ProfileInput): Promise<{ ok: false; error: string } | void> {
  const user = await requireUser();
  const result = await saveProfile(user.id, {
    country: String(input.country),
    field: String(input.field),
    grade: Number(input.grade),
    graduationMonth: String(input.graduationMonth),
  });
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  redirect("/path");
}
