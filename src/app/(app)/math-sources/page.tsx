import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { mathPractice, sourceCoverage } from "@/content/bank/math-lessons";
import { skillsOf } from "@/content/bank/taxonomy";
import { skillNameRu, TIER_TITLES } from "@/content/math-ladder";
import { ButtonLink } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { plural } from "@/lib/date";
import { getMathContext } from "@/lib/mastery";
import { getPlan } from "@/lib/profile";

export const metadata: Metadata = { title: "Математика из открытых источников" };
export const dynamic = "force-dynamic";

export default async function MathSourcesPage() {
  const user = await requireUser();
  const plan = await getPlan(user.id);
  if (!plan) redirect("/start");
  const state = await getMathContext(user.id, plan);
  const skills = skillsOf("sat-math").map((s) => ({ ...s, ...sourceCoverage(s.id, state.mastery[s.id].tier) }));
  const total = skills.reduce((sum, s) => sum + s.total, 0);
  const covered = skills.filter((s) => s.total > 0).length;
  const math = plan.sections.find((s) => s.section === "sat-math");

  return <div className="mx-auto max-w-4xl space-y-6">
    <div>
      <Link href="/path" className="text-sm text-muted hover:text-ink">← К моему пути</Link>
      <h1 className="mt-3 text-2xl font-bold">Математика из открытых источников</h1>
      <p className="mt-2 text-sm text-muted">{total} упражнений OpenStax по {covered} навыкам. Условия и ключи ответов взяты из учебника. Это дополнительная практика математики, не официальные задания SAT.</p>
      <p className="mt-2 text-sm text-muted">{math ? `Подбор от твоего Math ${math.current}${math.preliminary ? " (предварительно)" : ""}, затем — по ответам в каждом навыке.` : "Уровень пока предварительный; уточни его в «Моих баллах» или диагностике."} Верные ответы с первой попытки повышают ступень после устойчивой серии. Старый прогресс сохраняется.</p>
      <Link href="/start/scores" className="mt-2 inline-block text-sm font-semibold text-accent hover:underline">Мои баллы</Link>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {skills.filter((s) => s.total > 0).map((s) => {
        const m = state.mastery[s.id];
        const practice = s.suitable ? mathPractice(s.id, state, `${user.id}|preview`, 8, true) : null;
        return <section key={s.id} className="card p-5">
          <h2 className="font-semibold">{skillNameRu(s.id).replace(/^./, (c) => c.toUpperCase())}</h2>
          <p className="mt-1 text-sm text-muted">{s.total} {plural(s.total, "упражнение", "упражнения", "упражнений")} · твоя ступень {m.tier}/6 — {TIER_TITLES[m.tier]}</p>
          {practice && practice.questions.length > 0 ? <>
            <p className="mt-2 text-xs text-muted">Набор подбирается в пределах соседних ступеней. Источник указан у каждой задачи, ключ ответа появится после проверки.</p>
            <ButtonLink href={`/lesson/source/${s.id}`} size="sm" className="mt-3">Решать упражнения</ButtonLink>
          </> : <p className="mt-3 text-sm text-muted">Упражнений твоей сложности пока нет. Можно выбрать другую тему или внешний банк ниже.</p>}
        </section>;
      })}
    </div>
    <section className="card p-5">
      <h2 className="font-semibold">Другие темы и внешние банки</h2>
      <p className="mt-1 text-sm text-muted">По {skills.length - covered} навыкам импортированной подборки пока нет. Существующие уроки доступны в твоём плане. Эти ссылки открывают отдельные сайты; для задач 1609SAT и AlikhanPrep нужен вход. Ответы на внешних сайтах не передаются в прогресс 365step автоматически.</p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-accent">
        <a href="https://alikhanprep.kz/sat-suite-question-bank/" target="_blank" rel="noopener noreferrer">AlikhanPrep ↗</a>
        <a href="https://www.1609sat.com/app" target="_blank" rel="noopener noreferrer">1609SAT ↗</a>
        <a href="https://satsuitequestionbank.collegeboard.org/" target="_blank" rel="noopener noreferrer">College Board ↗</a>
      </div>
    </section>
    <p className="text-xs leading-relaxed text-muted">© Rice University, OpenStax. Access for free at openstax.org. Использована зафиксированная версия College Algebra 2e под <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a>. Формулы преобразованы в текст; приложение проверяет конечный ответ. Подробный ключ учебника может содержать только ответ без пошагового разбора.</p>
  </div>;
}
