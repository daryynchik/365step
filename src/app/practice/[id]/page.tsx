import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { findByKey } from "@/content";
import type { Lesson } from "@/content/types";
import { LessonPlayer } from "@/components/lesson-player";
import { COURSE_TONE } from "@/components/tones";
import { currentUser } from "@/lib/auth";
import { getPracticeSet, practiceEnabled } from "@/lib/content-engine";

export const metadata: Metadata = { title: "Свежая практика" };
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const { id } = await params;
  const set = await getPracticeSet(id);
  const entry = set ? findByKey(set.lessonKey) : null;
  if (!set || !entry) notFound();

  const lesson: Lesson = {
    id: set.id,
    title: `Свежая практика: ${entry.lesson.title}`,
    summary: entry.lesson.summary,
    minutes: Math.max(5, set.questions.length * 2),
    theory: [
      {
        body:
          set.source.kind === "wikipedia"
            ? "Новый текст из открытого источника и вопросы к нему в формате урока. Стратегия та же — напомни себе её перед началом."
            : "Новые задания в формате и на навык этого урока. Каждый ответ перед публикацией был независимо перепроверен.",
      },
      ...entry.lesson.theory.filter((t) => t.heading).slice(0, 1),
    ],
    questions: set.questions,
    official: entry.lesson.official,
  };

  const note =
    set.source.kind === "wikipedia" ? (
      <p className="mt-3 text-xs text-muted">
        Текст: фрагмент статьи{" "}
        <a href={set.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          «{set.source.title}»
        </a>{" "}
        из Википедии, лицензия{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          CC BY-SA 4.0
        </a>
        . Вопросы составлены автоматически и перепроверены.
      </p>
    ) : (
      <p className="mt-3 text-xs text-muted">Задания составлены автоматически в формате экзамена и перепроверены. Это не официальные задания College Board или IELTS.</p>
    );

  return (
    <LessonPlayer
      courseId={entry.course.id}
      lesson={lesson}
      unitTitle={`${entry.course.title} · ${entry.unit.title}`}
      tone={COURSE_TONE[entry.course.id].main}
      backHref="/path"
      draft={null}
      aiFeedback={false}
      practiceSetId={set.id}
      moreKey={practiceEnabled() ? set.lessonKey : null}
      note={note}
    />
  );
}
