import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { findLesson } from "@/content";
import { LessonPlayer } from "@/components/lesson-player";
import { COURSE_TONE } from "@/components/tones";
import { aiFeedbackEnabled } from "@/lib/ai-feedback";
import { currentUser } from "@/lib/auth";
import { isGeneratable, practiceEnabled } from "@/lib/content-engine";
import { getDoneKeys, getWriting } from "@/lib/game";
import { resolveLesson } from "@/lib/lesson-access";

export const dynamic = "force-dynamic";
// "More questions on this skill" may generate a new set, which takes a while.
export const maxDuration = 120;

type Params = Promise<{ course: string; lesson: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { course, lesson } = await params;
  if (course === "review") return { title: lesson.startsWith("mock-") ? "Пробная секция" : "Повторение" };
  if (course === "diagnostic") return { title: "Диагностика" };
  if (course === "bank") return { title: lesson.startsWith("mock~") ? "Пробная секция" : "Практика" };
  return { title: findLesson(course, lesson)?.lesson.title ?? "Урок" };
}

export default async function LessonPage({ params }: { params: Params }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { course, lesson } = await params;

  const found = await resolveLesson(user.id, course, decodeURIComponent(lesson), await getDoneKeys(user.id));
  if (!found) notFound();
  if (!found.open) redirect(found.backHref);

  const hasTask = found.lesson.writing || found.lesson.speaking;
  const writing = hasTask ? await getWriting(user.id, found.key) : null;
  // Fresh generated practice: for authored lessons that support it, and for reviews.
  const moreKey =
    !practiceEnabled() ? null : found.entry ? (isGeneratable(found.entry) ? found.entry.key : null) : found.courseId === "review" ? found.moreKey : null;

  return (
    <LessonPlayer
      courseId={found.courseId}
      calculatorAvailable={found.calculator}
      lesson={found.lesson}
      unitTitle={found.unitTitle}
      tone={COURSE_TONE[found.tone].main}
      backHref={found.backHref}
      draft={writing ? { body: writing.body, submittedAt: writing.submittedAt } : null}
      aiFeedback={found.courseId !== "review" && found.courseId !== "diagnostic" && aiFeedbackEnabled()}
      moreKey={moreKey}
    />
  );
}
