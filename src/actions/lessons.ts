"use server";

import { revalidatePath } from "next/cache";

import { findLesson } from "@/content";
import type { Response } from "@/lib/answers";
import { requireUser } from "@/lib/auth";
import { examinerFollowUp, speakingAssessment, writingFeedback, type FeedbackResult } from "@/lib/ai-feedback";
import { getOrCreatePractice, getPracticeSet, type PracticeOutcome } from "@/lib/content-engine";
import { completeLesson, completePractice, saveDraft, submitSpeaking, submitWriting, type CompletionResult } from "@/lib/game";

function revalidateProgress(): void {
  // Points and streaks show in the header of every page.
  revalidatePath("/", "layout");
}

export async function completeLessonAction(
  courseId: string,
  lessonId: string,
  responses: (Response | null)[],
): Promise<CompletionResult> {
  const user = await requireUser();
  const result = await completeLesson(user.id, courseId, lessonId, responses);
  if (result.ok) revalidateProgress();
  return result;
}

export async function saveDraftAction(courseId: string, lessonId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  return saveDraft(user.id, courseId, lessonId, body);
}

export async function submitWritingAction(courseId: string, lessonId: string, body: string): Promise<CompletionResult> {
  const user = await requireUser();
  const result = await submitWriting(user.id, courseId, lessonId, body);
  if (result.ok) revalidateProgress();
  return result;
}

export async function writingFeedbackAction(courseId: string, lessonId: string, body: string): Promise<FeedbackResult> {
  await requireUser();
  const task = findLesson(courseId, lessonId)?.lesson.writing;
  if (!task) return { ok: false, error: "Задание не найдено." };
  if (body.trim().split(/\s+/).length < 40) return { ok: false, error: "Напиши хотя бы 40 слов — тогда будет что обсуждать." };
  return writingFeedback(task, body.slice(0, 12_000));
}

// -------------------------------------------------------------- speaking --

type Turn = { role: "examiner" | "student"; text: string };

function cleanTurns(turns: Turn[]): Turn[] {
  return turns
    .slice(0, 40)
    .map((t) => ({ role: t.role === "examiner" ? ("examiner" as const) : ("student" as const), text: String(t.text).slice(0, 4000) }));
}

export async function examinerFollowUpAction(courseId: string, lessonId: string, turns: Turn[]): Promise<string | null> {
  await requireUser();
  const spec = findLesson(courseId, lessonId)?.lesson.speaking;
  if (!spec) return null;
  return examinerFollowUp(spec, cleanTurns(turns));
}

export async function speakingAssessmentAction(courseId: string, lessonId: string, turns: Turn[], mode: "voice" | "text"): Promise<FeedbackResult> {
  await requireUser();
  const spec = findLesson(courseId, lessonId)?.lesson.speaking;
  if (!spec) return { ok: false, error: "Задание не найдено." };
  return speakingAssessment(spec, cleanTurns(turns), mode === "voice" ? "voice" : "text");
}

export async function submitSpeakingAction(courseId: string, lessonId: string, turns: Turn[], mode: "voice" | "text"): Promise<CompletionResult> {
  const user = await requireUser();
  const result = await submitSpeaking(user.id, courseId, lessonId, { turns: cleanTurns(turns), mode });
  if (result.ok) revalidateProgress();
  return result;
}

// -------------------------------------------------------------- practice --

export async function generatePracticeAction(key: string): Promise<PracticeOutcome> {
  const user = await requireUser();
  return getOrCreatePractice(user.id, key);
}

export async function completePracticeAction(setId: string, responses: (Response | null)[]): Promise<CompletionResult> {
  const user = await requireUser();
  const set = await getPracticeSet(setId);
  if (!set) return { ok: false, error: "Набор заданий не найден." };
  const result = await completePractice(user.id, set, responses);
  if (result.ok) revalidateProgress();
  return result;
}
