import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { findLesson, isUnlocked } from "@/content";
import { LessonPlayer } from "@/components/lesson-player";
import { COURSE_TONE } from "@/components/path-map";
import { aiFeedbackEnabled } from "@/lib/ai-feedback";
import { currentUser } from "@/lib/auth";
import { getDoneKeys, getWriting } from "@/lib/game";

export const dynamic = "force-dynamic";

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

  const backHref = entry.course.id === "seminar" ? "/seminar" : `/path?course=${entry.course.id}`;
  const done = await getDoneKeys(user.id);
  if (!isUnlocked(entry, done)) redirect(backHref);

  const writing = entry.lesson.writing ? await getWriting(user.id, entry.key) : null;

  return (
    <LessonPlayer
      courseId={entry.course.id}
      lesson={entry.lesson}
      unitTitle={entry.unit.title}
      tone={COURSE_TONE[entry.course.id].main}
      backHref={backHref}
      draft={writing ? { body: writing.body, submittedAt: writing.submittedAt } : null}
      aiFeedback={aiFeedbackEnabled()}
    />
  );
}
