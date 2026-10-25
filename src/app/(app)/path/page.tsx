import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";

import { FIELD_OPTIONS } from "@/content/fields/ids";
import { COUNTRIES, currentPlanDay, nextPlanStep, todayPlanDay } from "@/content/plan";
import { DesmosPath } from "@/components/desmos-path";
import { DeadlinesCard } from "@/components/deadlines-card";
import { MathSkillsCard } from "@/components/math-skills-card";
import { PlanMap } from "@/components/plan-map";
import { SectionsCard } from "@/components/sections-card";
import { DailyGoalCard, FriendsMini, OfficialPractice } from "@/components/sidebar";
import { COURSE_TONE, REVIEW_TONE } from "@/components/tones";
import { ButtonLink, ProgressBar } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { plural, todayIso } from "@/lib/date";
import { getDeadlines } from "@/lib/deadlines";
import { getLeaderboard } from "@/lib/friends";
import { getActivity, getDoneKeys, getStats } from "@/lib/game";
import { getMathContext } from "@/lib/mastery";
import { getPlan } from "@/lib/profile";

export const metadata: Metadata = { title: "Путь" };
export const dynamic = "force-dynamic";
// Generating a fresh practice set from this page can take up to a minute.
export const maxDuration = 120;

function fullDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function monthYear(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default async function PathPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { week } = await searchParams;
  const [plan, done, stats, activity, standings, deadlines] = await Promise.all([
    getPlan(user.id),
    getDoneKeys(user.id),
    getStats(user.id),
    getActivity(user.id, 7),
    getLeaderboard(user.id),
    getDeadlines(user.id),
  ]);
  if (!plan) redirect("/start");
  const mathState = plan.sections.find((s) => s.section === "sat-math");
  const ladder = mathState ? await getMathContext(user.id, plan) : null;

  const today = todayIso();
  const steps = plan.days.flatMap((d) => d.steps);
  const finished = steps.filter((s) => done.has(s.key)).length;
  const current = currentPlanDay(plan, done);
  const next = nextPlanStep(plan, done);
  const calendarDay = todayPlanDay(plan, today);
  const behind = current ? calendarDay - current.day : 0;
  const todayLeft = current ? current.steps.filter((s) => !done.has(s.key)).length : 0;
  const country = COUNTRIES.find((c) => c.id === plan.profile.country);
  const field = FIELD_OPTIONS.find((f) => f.id === plan.profile.field);
  const tone = next ? (next.courseId === "review" ? REVIEW_TONE : COURSE_TONE[next.courseId]) : REVIEW_TONE;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Мой путь</h1>
            <p className="text-sm text-muted">
              {country?.title} · {field?.title} · {plan.profile.grade} класс · выпуск: {monthYear(plan.profile.graduation)}
            </p>
          </div>
          <Link href="/start" className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-muted hover:text-ink">
            <Settings2 className="size-4" /> Изменить цель
          </Link>
        </div>

        <section className="card mb-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            {next && current ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: tone.main }}>
                  День {current.day} из {plan.days.length} · {next.label}
                </p>
                <h2 className="mt-0.5 truncate text-lg font-semibold">{next.title}</h2>
                <p className="text-sm text-muted">
                  {next.minutes} мин · {todayLeft === 1 ? "последнее задание дня" : `ещё ${todayLeft} ${plural(todayLeft, "задание", "задания", "заданий")} в этом дне`}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">План пройден</p>
                <h2 className="mt-0.5 text-lg font-semibold">Все {plan.days.length} дней позади</h2>
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
            <ButtonLink href={`/lesson/${next.key}`} size="lg" className="sm:w-auto">
              {finished === 0 ? "Начать" : "Продолжить"}
            </ButtonLink>
          )}
        </section>

        <div className="mb-10 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-xs text-muted">Темп</p>
            <p className={`font-semibold ${behind > 2 ? "text-warn" : behind < -2 ? "text-accent" : ""}`}>
              {!current
                ? "План завершён"
                : behind > 0
                  ? `Отстаёшь на ${behind} ${plural(behind, "день", "дня", "дней")}`
                  : behind < 0
                    ? `Впереди на ${-behind} ${plural(-behind, "день", "дня", "дней")}`
                    : "Точно по плану"}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-xs text-muted">{plan.deadlinePassed ? "Выпуск" : "Основной дедлайн"}</p>
            <p className="font-semibold">{plan.deadlinePassed ? monthYear(plan.profile.graduation) : `≈ ${fullDate(plan.deadline)}`}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-xs text-muted">Нагрузка до дедлайна</p>
            <p className="font-semibold">≈ {plan.load} задания в день</p>
          </div>
        </div>

        <SectionsCard plan={plan} today={today} />

        {mathState && ladder && <MathSkillsCard state={mathState} mastery={ladder.mastery} justPromoted={ladder.justPromoted} target={ladder.target} />}

        <DesmosPath lessons={plan.tutorials} done={done} />
        <section className="card mb-8 p-5">
          <h2 className="font-semibold">Задачи из открытых источников</h2>
          <p className="mt-1 text-sm text-muted">Упражнения OpenStax с исходными условиями и ответами, подобранные по твоему уровню. Можно решать параллельно основному плану.</p>
          <ButtonLink href="/math-sources" size="sm" className="mt-3">Открыть подборку</ButtonLink>
        </section>

        <div className="mx-auto max-w-md">
          <PlanMap plan={plan} done={done} today={today} openWeek={week !== undefined && /^\d+$/.test(week) ? Number(week) : null} />
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
        <DailyGoalCard earnedToday={stats.earnedToday} streak={stats.streak.current} activeToday={stats.streak.activeToday} week={activity} />
        <DeadlinesCard deadlines={deadlines} />
        <FriendsMini standings={standings} />
        <OfficialPractice />
      </aside>
    </div>
  );
}
