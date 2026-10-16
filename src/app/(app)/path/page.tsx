import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { clsx } from "clsx";

import { COURSES, flatten, isCourseId, SAT_COURSES } from "@/content";
import type { CourseId } from "@/content/types";
import { COURSE_TONE, PathMap } from "@/components/path-map";
import { DailyGoalCard, FriendsMini, OfficialPractice } from "@/components/sidebar";
import { ButtonLink, ProgressBar } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/friends";
import { getActivity, getDoneKeys, getStats, nextLesson } from "@/lib/game";

export const metadata: Metadata = { title: "Путь" };
export const dynamic = "force-dynamic";

export default async function PathPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const { course: requested } = await searchParams;
  const courseId: CourseId = requested && isCourseId(requested) && requested !== "seminar" ? requested : "sat-rw";
  const course = COURSES[courseId];

  const [done, stats, week, standings] = await Promise.all([
    getDoneKeys(user.id),
    getStats(user.id),
    getActivity(user.id, 7),
    getLeaderboard(user.id),
  ]);

  const total = flatten(course).length;
  const finished = flatten(course).filter((e) => done.has(e.key)).length;
  const next = nextLesson(courseId, done);
  const tone = COURSE_TONE[courseId];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Подготовка к SAT</h1>
            <p className="text-sm text-muted">Один урок — один навык из официальной спецификации College Board.</p>
          </div>
          <div className="flex rounded-xl border border-line bg-sunken p-1" role="tablist" aria-label="Раздел SAT">
            {SAT_COURSES.map((id) => (
              <Link
                key={id}
                href={`/path?course=${id}`}
                role="tab"
                aria-selected={id === courseId}
                className={clsx(
                  "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  id === courseId ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
                )}
              >
                {COURSES[id].short}
              </Link>
            ))}
          </div>
        </div>

        <section className="card mb-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: tone.main }}>
              {next ? "Следующий урок" : "Курс пройден"}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold">{next ? next.lesson.title : course.title}</h2>
            <p className="text-sm text-muted">
              {next ? `${next.unit.title} · ${next.lesson.minutes} мин · ${next.lesson.questions.length} заданий` : "Можно повторить любой урок на дорожке."}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={finished} max={total} tone={tone.main} className="flex-1" />
              <span className="tabular text-xs font-medium text-muted">
                {finished}/{total}
              </span>
            </div>
          </div>
          {next && (
            <ButtonLink href={`/lesson/${courseId}/${next.lesson.id}`} size="lg" className="sm:w-auto">
              {finished === 0 ? "Начать" : "Продолжить"}
            </ButtonLink>
          )}
        </section>

        <div className="mx-auto max-w-md">
          <PathMap course={course} done={done} />
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <DailyGoalCard
          earnedToday={stats.earnedToday}
          streak={stats.streak.current}
          activeToday={stats.streak.activeToday}
          week={week}
        />
        <FriendsMini standings={standings} />
        <OfficialPractice />
      </aside>
    </div>
  );
}
