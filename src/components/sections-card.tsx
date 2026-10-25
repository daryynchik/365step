import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { LEVEL_TITLES, SECTION_TITLES } from "@/content/exams";
import type { Plan } from "@/content/plan";
import { isSatSection, type LevelSource } from "@/content/skill-level";
import { plural } from "@/lib/date";

const SOURCE: Record<LevelSource, string> = {
  score: "по твоим баллам",
  estimated: "предварительно: по общему баллу",
  converted: "пересчитано с другого экзамена",
  diagnostic: "по диагностике",
  default: "баллов нет — средний уровень",
};

const LEVEL_TONE = { easy: "bg-sunken text-muted", medium: "bg-accent-soft text-accent", hard: "bg-ink text-white" };

function score(section: Parameters<typeof isSatSection>[0], v: number): string {
  return isSatSection(section) ? String(v) : v.toFixed(1);
}

/** Where practice goes: level, gap to target and share of practice per section. */
export function SectionsCard({ plan, today }: { plan: Plan; today: string }) {
  const sections = [...plan.sections].sort((a, b) => (plan.shares[b.section] ?? 0) - (plan.shares[a.section] ?? 0));
  const nextExam = plan.windows.find((w) => w.date >= today);
  const daysToExam = nextExam ? Math.round((Date.parse(nextExam.date) - Date.parse(today)) / 86_400_000) : null;

  return (
    <section className="card mb-10 p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Куда идёт практика</h2>
        <Link href="/start/scores" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <BarChart3 className="size-4" /> Мои баллы
        </Link>
      </div>
      <ul className="space-y-3">
        {sections.map((s) => {
          const share = Math.round((plan.shares[s.section] ?? 0) * 100);
          return (
            <li key={s.section}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium">{SECTION_TITLES[s.section]}</span>
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${LEVEL_TONE[s.level]}`}>{LEVEL_TITLES[s.level]}</span>
                <span className="tabular text-xs text-muted">
                  {score(s.section, s.current)} → {score(s.section, s.target)} · {SOURCE[s.source]}
                </span>
                <span className="tabular ml-auto text-xs font-semibold">{share}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {sections.some((s) => s.preliminary && (s.section === "sat-math" || s.section === "sat-rw")) && (
        <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-xs">
          Уровень {sections.filter((s) => s.preliminary && (s.section === "sat-math" || s.section === "sat-rw")).map((s) => SECTION_TITLES[s.section]).join(" и ")} пока
          предварительный: общий балл не показывает разницу между секциями.{" "}
          <Link href="/diagnostic" className="font-semibold text-accent hover:underline">
            Пройти короткую диагностику
          </Link>{" "}
          или укажи баллы секций в «Моих баллах».
        </p>
      )}
      <p className="mt-4 text-xs text-muted">
        Больше практики — там, где разрыв с целью больше, но не меньше 15% на секцию. Задания: 60% на твоём уровне, по 20% проще и сложнее; каждые
        10 ответов по навыку уровень пересчитывается. В SAT Math сложность подбирается по ступеням отдельно для каждого навыка — см. ниже.
        {nextExam && daysToExam !== null && (
          <>
            {" "}
            До экзамена ({nextExam.sections.map((x) => SECTION_TITLES[x].split(" ")[0]).filter((v, i, a) => a.indexOf(v) === i).join(", ")}) —{" "}
            {daysToExam} {plural(daysToExam, "день", "дня", "дней")}; последние 3 недели — пробные секции и слабые места.
          </>
        )}
      </p>
    </section>
  );
}
