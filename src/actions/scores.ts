"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { diagnosticNeeded, type ScoresInput } from "@/content/exams";
import { requireUser } from "@/lib/auth";
import { getDiagnosticLevels, saveScores } from "@/lib/scores";

/** Saves the scores; students with sections they have no score for go on to the diagnostic. */
export async function saveScoresAction(input: ScoresInput): Promise<{ ok: false; error: string } | void> {
  const user = await requireUser();
  const result = await saveScores(user.id, input);
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  const taken = await getDiagnosticLevels(user.id);
  const missing = diagnosticNeeded(result.value.entries).filter((s) => !taken[s]);
  redirect(missing.length > 0 ? "/diagnostic" : "/path");
}
