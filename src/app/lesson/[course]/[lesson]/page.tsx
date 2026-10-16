import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { findLesson, isUnlocked } from "@/content";
import { LessonPlayer } from "@/components/lesson-player";
import { COURSE_TONE } from "@/components/tones";
import { aiFeedbackEnabled } from "@/lib/ai-feedback";
import { currentUser } from "@/lib/auth";
import { isGeneratable, practiceEnabled } from "@/lib/content-engine";
import { getDoneKeys, getWriting } from "@/lib/game";

export const dynamic = "force-dynamic";
// "More questions on this skill" may generate a new set, which takes a while.
export const maxDuration = 120;

type Params = Promise<{ course: string; lesson: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { course, lesson } = await params;
  return { title: findLesson(course, lesson)?.lesson.title ?? "Урок" };
}

export default async function LessonPage({ params }: { params: Params }) {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const { course, lesson } = await params;
  const entry = findLesson(course, lesson);
  if (!entry) notFound();

  const backHref = entry.course.id === "seminar" ? "/seminar" : "/path";
  const done = await getDoneKeys(user.id);
  if (!isUnlocked(entry, done)) redirect(backHref);

  const writing = entry.lesson.writing ? await getWriting(user.id, entry.key) : null;

  return (
    <LessonPlayer
      courseId={entry.course.id}
      lesson={entry.lesson}
      unitTitle={entry.course.id === "seminar" ? entry.unit.title : `${entry.course.title} · ${entry.unit.title}`}
      tone={COURSE_TONE[entry.course.id].main}
      backHref={backHref}
      draft={writing ? { body: writing.body, submittedAt: writing.submittedAt } : null}
      aiFeedback={aiFeedbackEnabled()}
      moreKey={practiceEnabled() && isGeneratable(entry) ? entry.key : null}
    />
  );
}
