import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { findLesson } from "@/content";
import { isPlanUnlocked, reviewLesson, STRAND_COURSE } from "@/content/plan";
import { LessonPlayer } from "@/components/lesson-player";
import { COURSE_TONE } from "@/components/tones";
import { aiFeedbackEnabled } from "@/lib/ai-feedback";
import { currentUser } from "@/lib/auth";
import { isGeneratable, practiceEnabled } from "@/lib/content-engine";
import { canOpen, getDoneKeys, getWriting } from "@/lib/game";
import { getPlan } from "@/lib/profile";

export const dynamic = "force-dynamic";
// "More questions on this skill" may generate a new set, which takes a while.
export const maxDuration = 120;

type Params = Promise<{ course: string; lesson: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { course, lesson } = await params;
  if (course === "review") return { title: lesson.startsWith("mock-") ? "Пробная секция" : "Повторение" };
  return { title: findLesson(course, lesson)?.lesson.title ?? "Урок" };
}

export default async function LessonPage({ params }: { params: Params }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { course, lesson } = await params;

  // Reviews and mock sections only exist inside the student's own plan.
  if (course === "review") {
    const plan = await getPlan(user.id);
    if (!plan) redirect("/start");
    const key = `review/${lesson}`;
    const review = reviewLesson(plan, key);
    if (!review) notFound();
    if (!isPlanUnlocked(plan, key, await getDoneKeys(user.id))) redirect("/path");
    const tone = COURSE_TONE[STRAND_COURSE[review.strand]].main;
    return (
      <LessonPlayer
        courseId="review"
        lesson={review.lesson}
        unitTitle={review.mock ? "Пробная секция" : "Повторение"}
        tone={tone}
        backHref="/path"
        draft={null}
        aiFeedback={false}
        moreKey={practiceEnabled() ? review.sourceKey : null}
      />
    );
  }

  const entry = findLesson(course, lesson);
  if (!entry) notFound();

  const backHref = entry.course.id === "seminar" ? "/seminar" : "/path";
  if (!(await canOpen(user.id, entry))) redirect(backHref);

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
