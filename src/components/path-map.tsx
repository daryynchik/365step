import Link from "next/link";
import { Check, Lock, PenLine, Star, Trophy, BookOpen } from "lucide-react";

import { flatten, isUnlocked, type Course } from "@/content";
import type { CourseId } from "@/content/types";

export const COURSE_TONE: Record<CourseId, { main: string; dark: string; soft: string }> = {
  "sat-rw": { main: "#3563c9", dark: "#274c9e", soft: "var(--rw-soft)" },
  "sat-math": { main: "#c0711b", dark: "#975712", soft: "var(--math-soft)" },
  seminar: { main: "#7a52b3", dark: "#5f3f8d", soft: "var(--seminar-soft)" },
};

/** Horizontal offsets that make the path snake gently left and right. */
const ZIGZAG = [0, 46, 70, 46, 0, -46, -70, -46];

export function PathMap({ course, done }: { course: Course; done: Set<string> }) {
  const entries = flatten(course);
  const current = entries.find((e) => !done.has(e.key));
  const tone = COURSE_TONE[course.id];

  return (
    <div className="space-y-10">
      {course.units.map((unit, unitIndex) => {
        const unitEntries = entries.filter((e) => e.unitIndex === unitIndex);
        const finished = unitEntries.filter((e) => done.has(e.key)).length;

        return (
          <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
            <header
              className="mb-8 flex items-center justify-between gap-4 rounded-xl px-5 py-4 text-white"
              style={{ background: tone.main, boxShadow: `0 4px 0 ${tone.dark}` }}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  {course.id === "seminar" ? unit.title.split(" · ")[0] : `Раздел ${unitIndex + 1}`}
                </p>
                <h2 id={`unit-${unit.id}`} className="truncate text-lg font-bold">
                  {course.id === "seminar" ? unit.title.split(" · ")[1] : unit.title}
                </h2>
                <p className="text-sm text-white/80">{unit.subtitle}</p>
              </div>
              <span className="tabular flex-none rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold">
                {finished}/{unitEntries.length}
              </span>
            </header>

            <ol className="flex flex-col items-center gap-7">
              {unitEntries.map((entry, i) => {
                const isDone = done.has(entry.key);
                const unlocked = isUnlocked(entry, done);
                const isCurrent = entry.key === current?.key;
                const state = isDone ? "done" : unlocked ? "open" : "locked";
                const x = ZIGZAG[(entry.index + unitIndex) % ZIGZAG.length];
                const Icon = isDone ? Check : !unlocked ? Lock : entry.lesson.writing ? PenLine : entry.lesson.reading ? BookOpen : Star;

                const node = (
                  <span
                    className={`node-button ${isCurrent ? "node-current" : ""}`}
                    data-state={state}
                    style={state === "open" ? ({ "--node": tone.main, "--node-shadow": tone.dark } as React.CSSProperties) : undefined}
                  >
                    <Icon className="size-7" strokeWidth={2.6} fill={state === "open" && !entry.lesson.writing && !entry.lesson.reading ? "currentColor" : "none"} />
                  </span>
                );

                return (
                  <li
                    key={entry.key}
                    className={`path-node relative flex flex-col items-center ${isCurrent && i > 0 ? "mt-8" : ""}`}
                    style={{ "--x": `${x}px` } as React.CSSProperties}
                  >
                    {isCurrent && (
                      <span
                        className="start-bubble absolute -top-11 left-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-card"
                        style={{ color: tone.main }}
                      >
                        {done.size === 0 && i === 0 ? "Начать" : "Дальше"}
                      </span>
                    )}
                    {unlocked ? (
                      <Link href={`/lesson/${course.id}/${entry.lesson.id}`} aria-label={`${entry.lesson.title}${isDone ? " — пройдено" : ""}`}>
                        {node}
                      </Link>
                    ) : (
                      <span aria-label={`${entry.lesson.title} — откроется после предыдущего урока`}>{node}</span>
                    )}
                    <span className={`mt-3 max-w-44 text-center text-[13px] leading-tight ${unlocked ? "font-medium text-ink" : "text-subtle"}`}>
                      {entry.lesson.title}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <div className="flex flex-col items-center gap-2 pb-6 pt-2 text-center">
        <span
          className="grid size-16 place-items-center rounded-full"
          style={{ background: current ? "var(--sunken)" : "var(--coin)", color: current ? "var(--subtle)" : "white" }}
        >
          <Trophy className="size-8" />
        </span>
        <p className="text-sm font-semibold">{current ? "Финиш курса" : "Курс пройден!"}</p>
      </div>
    </div>
  );
}
