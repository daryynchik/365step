import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCheck,
  Flag,
  Headphones,
  Lock,
  Mic,
  PenLine,
  RotateCcw,
  Sigma,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";

import { currentPlanDay, isPlanUnlocked, nextPlanStep, type Plan, type PlanDay, type PlanStep } from "@/content/plan";
import { ScrollIntoView } from "./scroll-into-view";
import { COURSE_TONE, REVIEW_TONE } from "./tones";

const ZIGZAG = [0, 46, 70, 46, 0, -46, -70, -46];

const ICONS: Record<PlanStep["icon"], { icon: LucideIcon; filled: boolean }> = {
  lesson: { icon: Star, filled: true },
  listening: { icon: Headphones, filled: false },
  speaking: { icon: Mic, filled: false },
  writing: { icon: PenLine, filled: false },
  reading: { icon: BookOpen, filled: false },
  admissions: { icon: Flag, filled: true },
  math: { icon: Sigma, filled: false },
  review: { icon: RotateCcw, filled: false },
  mock: { icon: ClipboardCheck, filled: false },
};

function toneOf(step: PlanStep) {
  return step.courseId === "review" ? REVIEW_TONE : COURSE_TONE[step.courseId];
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
}

function formatRange(days: PlanDay[]): string {
  const first = days[0].date;
  const last = days[days.length - 1].date;
  return first === last ? formatDay(first) : `${formatDay(first)} — ${formatDay(last)}`;
}

export const DAYS_PER_WEEK = 7;
const NEAR_WEEKS = 4;

export function planWeeks(plan: Plan): PlanDay[][] {
  const weeks: PlanDay[][] = [];
  for (let i = 0; i < plan.days.length; i += DAYS_PER_WEEK) weeks.push(plan.days.slice(i, i + DAYS_PER_WEEK));
  return weeks;
}

/**
 * The student's path. Only one week is drawn as a full path — the current one,
 * or the one the student opened — and every other week is a single row, so a
 * plan of a year or more stays easy to read.
 */
export function PlanMap({ plan, done, today, openWeek }: { plan: Plan; done: Set<string>; today: string; openWeek: number | null }) {
  const weeks = planWeeks(plan);
  const current = currentPlanDay(plan, done);
  const next = nextPlanStep(plan, done);
  const currentWeek = current ? Math.floor((current.day - 1) / DAYS_PER_WEEK) : weeks.length - 1;
  const shown = openWeek !== null && openWeek >= 0 && openWeek < weeks.length ? openWeek : currentWeek;
  let nodeIndex = 0;

  // Weeks far from the open one fold into one row per month.
  const near = (w: number) => Math.abs(w - shown) <= NEAR_WEEKS || Math.abs(w - currentWeek) <= 1 || w === weeks.length - 1;
  const monthOf = (w: number) => weeks[w][0].date.slice(0, 7);

  return (
    <div className="space-y-2">
      {weeks.map((week, w) => {
        if (!near(w)) {
          if (w > 0 && !near(w - 1) && monthOf(w - 1) === monthOf(w)) return null;
          let end = w;
          while (end + 1 < weeks.length && !near(end + 1) && monthOf(end + 1) === monthOf(w)) end++;
          const group = weeks.slice(w, end + 1).flatMap((wk) => wk.flatMap((d) => d.steps));
          const groupDone = group.filter((s) => done.has(s.key)).length;
          const count = end - w + 1;
          return (
            <Link
              key={`g-${w}`}
              href={`/path?week=${w}`}
              scroll={false}
              className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-2.5 text-sm transition-colors hover:border-line-strong hover:bg-surface"
            >
              <span className="min-w-0 flex-1">
                <span className="font-semibold capitalize">
                  {new Date(`${week[0].date}T00:00:00Z`).toLocaleDateString("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" })}
                </span>
                <span className="ml-2 text-xs text-muted">
                  {count === 1 ? `неделя ${w + 1}` : `недели ${w + 1}–${end + 1}`} · {phaseNote(weeks.slice(w, end + 1).flat())}
                </span>
              </span>
              <span className="tabular flex-none text-xs font-medium text-muted">
                {groupDone}/{group.length}
              </span>
              <ChevronRight className="size-4 flex-none text-subtle" />
            </Link>
          );
        }
        const steps = week.flatMap((d) => d.steps);
        const finished = steps.filter((s) => done.has(s.key)).length;
        const complete = finished === steps.length;
        const isCurrent = w === currentWeek;
        const prevMonth = w > 0 ? weeks[w - 1][0].date.slice(0, 7) : null;
        const month = week[0].date.slice(0, 7);
        const monthHeader =
          month !== prevMonth ? (
            <p key={`m-${w}`} className="px-1 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-subtle first:pt-0">
              {new Date(`${week[0].date}T00:00:00Z`).toLocaleDateString("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" })}
            </p>
          ) : null;

        if (w !== shown) {
          return (
            <div key={w}>
              {monthHeader}
              <Link
                href={`/path?week=${w}`}
                scroll={false}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-line-strong",
                  isCurrent ? "border-accent-line bg-accent-soft/60" : "border-line bg-surface",
                )}
              >
                <span
                  className={clsx(
                    "grid size-8 flex-none place-items-center rounded-full text-xs font-bold",
                    complete ? "bg-coin text-white" : isCurrent ? "bg-accent text-white" : "bg-sunken text-muted",
                  )}
                >
                  {complete ? <Check className="size-4" strokeWidth={3} /> : w + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    Неделя {w + 1}
                    {isCurrent && <span className="ml-2 text-xs font-medium text-accent">сейчас</span>}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {formatRange(week)} · {phaseNote(week)}
                  </span>
                </span>
                <span className="tabular flex-none text-xs font-medium text-muted">
                  {finished}/{steps.length}
                </span>
                <ChevronRight className="size-4 flex-none text-subtle" />
              </Link>
            </div>
          );
        }

        return (
          <section key={w} aria-labelledby={`week-${w}`} className="pb-6">
            {monthHeader}
            <header className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-accent px-5 py-4 text-white shadow-[0_4px_0_var(--accent-hover)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{formatRange(week)}</p>
                <h2 id={`week-${w}`} className="text-lg font-bold">
                  Неделя {w + 1} из {weeks.length}
                </h2>
              </div>
              <span className="tabular rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold">
                {finished}/{steps.length}
              </span>
            </header>

            <div className="space-y-8">
              {week.map((day) => {
                const isToday = day.date === today;
                const dayDone = day.steps.every((s) => done.has(s.key));
                return (
                  <div key={day.day}>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="h-px flex-1 bg-line" />
                      <span
                        className={clsx(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          day.day === current?.day ? "bg-ink text-white" : dayDone ? "bg-accent-soft text-accent" : "bg-sunken text-muted",
                        )}
                      >
                        День {day.day} · {formatDay(day.date)}
                        {isToday ? " · сегодня" : ""}
                        {dayDone ? " ✓" : ""}
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </div>

                    <ol className="flex flex-col items-center gap-7">
                      {day.steps.map((step) => {
                        const isDone = done.has(step.key);
                        const unlocked = isPlanUnlocked(plan, step.key, done);
                        const isNext = step.key === next?.key;
                        const state = isDone ? "done" : unlocked ? "open" : "locked";
                        const tone = toneOf(step);
                        const kind = ICONS[step.icon];
                        const Icon = isDone ? Check : unlocked ? kind.icon : Lock;
                        const x = ZIGZAG[nodeIndex++ % ZIGZAG.length];

                        const node = (
                          <span
                            className={`node-button ${isNext ? "node-current" : ""}`}
                            data-state={state}
                            style={state === "open" ? ({ "--node": tone.main, "--node-shadow": tone.dark } as React.CSSProperties) : undefined}
                          >
                            <Icon className="size-7" strokeWidth={2.6} fill={state === "open" && kind.filled ? "currentColor" : "none"} />
                          </span>
                        );

                        return (
                          <li
                            key={step.key}
                            id={isNext ? "current-lesson" : undefined}
                            className={clsx("path-node relative flex scroll-mt-40 flex-col items-center", isNext && "mt-8")}
                            style={{ "--x": `${x}px` } as React.CSSProperties}
                          >
                            {isNext && (
                              <span
                                className="start-bubble absolute -top-11 left-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-card"
                                style={{ color: tone.main }}
                              >
                                {done.size === 0 ? "Начать" : "Дальше"}
                              </span>
                            )}
                            {unlocked ? (
                              <Link href={`/lesson/${step.key}`} aria-label={`${step.title}${isDone ? " — пройдено" : ""}`}>
                                {node}
                              </Link>
                            ) : (
                              <span aria-label={`${step.title} — откроется после предыдущего дня`}>{node}</span>
                            )}
                            <span className="mt-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: unlocked ? tone.main : "var(--subtle)" }}>
                              {step.label}
                            </span>
                            <span className={clsx("max-w-48 text-center text-[13px] leading-tight", unlocked ? "font-medium text-ink" : "text-subtle")}>
                              {step.title}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
            {w === weeks.length - 1 && (
              <div className="flex flex-col items-center gap-2 pt-10 text-center">
                <span className="grid size-16 place-items-center rounded-full" style={{ background: next ? "var(--sunken)" : "var(--coin)", color: next ? "var(--subtle)" : "white" }}>
                  <Trophy className="size-8" />
                </span>
                <p className="text-sm font-semibold">{next ? "Выпуск из школы" : "План пройден!"}</p>
              </div>
            )}
            {w === currentWeek && <ScrollIntoView targetId="current-lesson" />}
          </section>
        );
      })}
    </div>
  );
}

function phaseNote(week: PlanDay[]): string {
  const steps = week.flatMap((d) => d.steps);
  if (steps.some((s) => s.key.startsWith("bank/mock~") || s.key.startsWith("bank/weak~"))) return "перед экзаменом: пробные секции и слабые места";
  const phases = new Set(week.map((d) => d.phase));
  if (phases.has("final")) return "финальная подготовка, пробные секции";
  if (phases.has("after") && !phases.has("prep")) return "после подачи: чтение и повторение";
  const lessons = steps.filter((s) => s.kind === "lesson").length;
  const practice = steps.filter((s) => s.kind === "practice").length;
  const parts: string[] = [];
  if (lessons > 0) {
    const n10 = lessons % 10;
    const n100 = lessons % 100;
    parts.push(`${lessons} ${n10 === 1 && n100 !== 11 ? "новый урок" : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? "новых урока" : "новых уроков"}`);
  }
  if (practice > 0) parts.push(`практика: ${practice}`);
  return parts.length ? parts.join(" · ") : "повторение";
}
