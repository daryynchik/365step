import Link from "next/link";
import { Calculator, Check, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

import type { PlanStep } from "@/content/plan";
import { ButtonLink, ProgressBar } from "./ui";

export function DesmosPath({ lessons, done }: { lessons: PlanStep[]; done: Set<string> }) {
  if (lessons.length === 0) return null;
  const finished = lessons.filter((step) => done.has(step.key)).length;
  const next = lessons.find((step) => !done.has(step.key));
  return (
    <section id="desmos" className="card mb-8 scroll-mt-20 p-5" aria-labelledby="desmos-path-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-math"><Calculator className="size-4" />SAT Math · Практикум</p>
          <h2 id="desmos-path-title" className="mt-1 text-lg font-semibold">Desmos для SAT Math</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">8 уроков и 40 заданий: ввод выражений, графики, уравнения, системы и таблицы. Официальные инструкции и видео Desmos, практика College Board.</p>
        </div>
        <ButtonLink href={next ? `/lesson/${next.key}` : `/lesson/${lessons[0].key}`} size="sm" variant="secondary">{next ? finished ? "Продолжить Desmos" : "Начать Desmos" : "Повторить Desmos"}</ButtonLink>
      </div>
      <div className="mt-4 flex items-center gap-3"><ProgressBar value={finished} max={lessons.length} tone="var(--math)" className="flex-1" /><span className="tabular text-xs text-muted">{finished}/{lessons.length} уроков</span></div>
      <p className="mt-2 text-xs text-muted">Можно проходить параллельно основному плану. Калькулятор доступен во время объяснений и заданий.</p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {lessons.map((step, index) => {
          const completed = done.has(step.key);
          return <li key={step.key}>
            <Link href={`/lesson/${step.key}`} className={clsx("group flex h-full items-center gap-3 rounded-lg border px-3 py-3 transition-colors hover:border-line-strong hover:bg-sunken", completed ? "border-accent-line bg-accent-soft/40" : "border-line")}>
              <span className={clsx("grid size-7 flex-none place-items-center rounded-full text-xs font-semibold", completed ? "bg-accent text-white" : "bg-math-soft text-math")}>{completed ? <Check className="size-4" /> : index + 1}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-snug">{step.title.replace(/^Desmos: /, "").replace(/^./, (letter) => letter.toUpperCase())}</span><span className="mt-1 block text-xs text-muted">{step.minutes} мин · {completed ? "Пройдено" : "5 заданий"}</span></span>
              <ChevronRight className="size-4 flex-none text-subtle group-hover:text-ink" />
            </Link>
          </li>;
        })}
      </ol>
    </section>
  );
}
