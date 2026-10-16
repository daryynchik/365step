import Link from "next/link";
import { Check, Lock, Trophy } from "lucide-react";
import { clsx } from "clsx";

import { currentDay, isTrackUnlocked, nextTrackStep, stepLabel, trackWeeks, type TrackDay } from "@/content/track";
import { ScrollIntoView } from "./scroll-into-view";
import { COURSE_TONE, lessonIcon } from "./tones";

/** Horizontal offsets that make the path snake gently left and right. */
const ZIGZAG = [0, 46, 70, 46, 0, -46, -70, -46];

function dayTitle(day: TrackDay): string {
  const parts = [day.english === "ielts" ? "IELTS" : day.english === "sat" ? "SAT English" : null];
  if (day.steps.some((s) => s.course.id === "sat-math")) parts.push("Math");
  if (day.steps.some((s) => s.course.id === "admissions")) parts.push("Поступление");
  return parts.filter(Boolean).join(" · ");
}

export function TrackMap({ done }: { done: Set<string> }) {
  const next = nextTrackStep(done);
  const today = currentDay(done);
  let nodeIndex = 0;

  return (
    <div className="space-y-12">
      {trackWeeks().map((week, w) => {
        const steps = week.flatMap((d) => d.steps);
        const finished = steps.filter((s) => done.has(s.key)).length;
        const first = week[0].day;
        const last = week[week.length - 1].day;

        return (
          <section key={w} aria-labelledby={`week-${w}`}>
            <header className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-accent px-5 py-4 text-white shadow-[0_4px_0_var(--accent-hover)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Дни {first}–{last}
                </p>
                <h2 id={`week-${w}`} className="text-lg font-bold">
                  Неделя {w + 1}
                </h2>
              </div>
              <span className="tabular rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold">
                {finished}/{steps.length}
              </span>
            </header>

            <div className="space-y-8">
              {week.map((day) => {
                const isToday = day.day === today?.day;
                const dayDone = day.steps.every((s) => done.has(s.key));
                return (
                  <div key={day.day}>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="h-px flex-1 bg-line" />
                      <span
                        className={clsx(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          isToday ? "bg-ink text-white" : dayDone ? "bg-accent-soft text-accent" : "bg-sunken text-muted",
                        )}
                      >
                        День {day.day} · {dayTitle(day)}
                        {dayDone ? " ✓" : ""}
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </div>

                    <ol className="flex flex-col items-center gap-7">
                      {day.steps.map((step) => {
                        const isDone = done.has(step.key);
                        const unlocked = isTrackUnlocked(step.key, done);
                        const isCurrent = step.key === next?.key;
                        const state = isDone ? "done" : unlocked ? "open" : "locked";
                        const tone = COURSE_TONE[step.course.id];
                        const kind = lessonIcon(step.course.id, step.lesson);
                        const Icon = isDone ? Check : unlocked ? kind.icon : Lock;
                        const x = ZIGZAG[nodeIndex++ % ZIGZAG.length];

                        const node = (
                          <span
                            className={`node-button ${isCurrent ? "node-current" : ""}`}
                            data-state={state}
                            style={state === "open" ? ({ "--node": tone.main, "--node-shadow": tone.dark } as React.CSSProperties) : undefined}
                          >
                            <Icon className="size-7" strokeWidth={2.6} fill={state === "open" && kind.filled ? "currentColor" : "none"} />
                          </span>
                        );

                        return (
                          <li
                            key={step.key}
                            id={isCurrent ? "current-lesson" : undefined}
                            className={clsx("path-node relative flex scroll-mt-40 flex-col items-center", isCurrent && "mt-8")}
                            style={{ "--x": `${x}px` } as React.CSSProperties}
                          >
                            {isCurrent && (
                              <span
                                className="start-bubble absolute -top-11 left-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-card"
                                style={{ color: tone.main }}
                              >
                                {done.size === 0 ? "Начать" : "Дальше"}
                              </span>
                            )}
                            {unlocked ? (
                              <Link href={`/lesson/${step.course.id}/${step.lesson.id}`} aria-label={`${step.lesson.title}${isDone ? " — пройдено" : ""}`}>
                                {node}
                              </Link>
                            ) : (
                              <span aria-label={`${step.lesson.title} — откроется после предыдущего дня`}>{node}</span>
                            )}
                            <span
                              className="mt-3 text-[11px] font-semibold uppercase tracking-wide"
                              style={{ color: unlocked ? tone.main : "var(--subtle)" }}
                            >
                              {stepLabel(step)}
                            </span>
                            <span className={clsx("max-w-48 text-center text-[13px] leading-tight", unlocked ? "font-medium text-ink" : "text-subtle")}>
                              {step.lesson.title}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex flex-col items-center gap-2 pb-6 pt-2 text-center">
        <span
          className="grid size-16 place-items-center rounded-full"
          style={{ background: next ? "var(--sunken)" : "var(--coin)", color: next ? "var(--subtle)" : "white" }}
        >
          <Trophy className="size-8" />
        </span>
        <p className="text-sm font-semibold">{next ? "Финиш программы" : "Программа пройдена!"}</p>
      </div>

      <ScrollIntoView targetId="current-lesson" />
    </div>
  );
}
