import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { currentDay, nextTrackStep, stepLabel, TRACK } from "@/content/track";
import { DeadlinesCard } from "@/components/deadlines-card";
import { DailyGoalCard, FriendsMini, OfficialPractice } from "@/components/sidebar";
import { COURSE_TONE } from "@/components/tones";
import { TrackMap } from "@/components/track-map";
import { ButtonLink, ProgressBar } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { getDeadlines } from "@/lib/deadlines";
import { getLeaderboard } from "@/lib/friends";
import { getActivity, getDoneKeys, getStats } from "@/lib/game";

export const metadata: Metadata = { title: "Путь" };
export const dynamic = "force-dynamic";
// Generating a fresh practice set from this page can take up to a minute.
export const maxDuration = 120;

export default async function PathPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const [done, stats, week, standings, deadlines] = await Promise.all([
    getDoneKeys(user.id),
    getStats(user.id),
    getActivity(user.id, 7),
    getLeaderboard(user.id),
    getDeadlines(user.id),
  ]);

  const steps = TRACK.flatMap((d) => d.steps);
  const finished = steps.filter((s) => done.has(s.key)).length;
  const today = currentDay(done);
  const next = nextTrackStep(done);
  const todayLeft = today ? today.steps.filter((s) => !done.has(s.key)).length : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Подготовка к поступлению</h1>
          <p className="text-sm text-muted">
            Одна программа: IELTS и SAT English через день, SAT Math каждый день и шаги поступления.
          </p>
        </div>

        <section className="card mb-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            {next ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COURSE_TONE[next.course.id].main }}>
                  День {today?.day} из {TRACK.length} · {stepLabel(next)}
                </p>
                <h2 className="mt-0.5 truncate text-lg font-semibold">{next.lesson.title}</h2>
                <p className="text-sm text-muted">
                  {next.lesson.minutes} мин · {todayLeft === 1 ? "последний урок дня" : `ещё ${todayLeft} урока сегодня`}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Программа пройдена</p>
                <h2 className="mt-0.5 text-lg font-semibold">Все {TRACK.length} дней позади</h2>
                <p className="text-sm text-muted">Повторяй уроки и бери свежие задания по любому навыку.</p>
              </>
            )}
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={finished} max={steps.length} className="flex-1" />
              <span className="tabular text-xs font-medium text-muted">
                {finished}/{steps.length}
              </span>
            </div>
          </div>
          {next && (
            <ButtonLink href={`/lesson/${next.course.id}/${next.lesson.id}`} size="lg" className="sm:w-auto">
              {finished === 0 ? "Начать" : "Продолжить"}
            </ButtonLink>
          )}
        </section>

        <div className="mx-auto max-w-md">
          <TrackMap done={done} />
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
        <DailyGoalCard
          earnedToday={stats.earnedToday}
          streak={stats.streak.current}
          activeToday={stats.streak.activeToday}
          week={week}
        />
        <DeadlinesCard deadlines={deadlines} />
        <FriendsMini standings={standings} />
        <OfficialPractice />
      </aside>
    </div>
  );
}
