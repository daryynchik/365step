"use server";

import { revalidatePath } from "next/cache";

import { findLesson } from "@/content";
import type { Response } from "@/lib/answers";
import { requireUser } from "@/lib/auth";
import { writingFeedback, type FeedbackResult } from "@/lib/ai-feedback";
import { completeLesson, saveDraft, submitWriting, type CompletionResult } from "@/lib/game";

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
