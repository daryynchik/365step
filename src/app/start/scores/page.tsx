import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { examById, PRACTICE_SOURCE_TITLES, RESULT_KIND_TITLES, type PracticeSource } from "@/content/exams";
import { ScoreForm } from "@/components/score-form";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { getScoreHistory, getScores, type ScoreRecord } from "@/lib/scores";

export const metadata: Metadata = { title: "Твой текущий уровень" };
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function describe(r: ScoreRecord): string {
  const exam = examById(r.exam);
  const parts: string[] = [];
  if (r.total !== null) parts.push(`${exam?.totalLabel ?? "Total"} ${r.total}`);
  for (const s of exam?.sections ?? []) if (r.sections[s.id] != null) parts.push(`${s.title} ${r.sections[s.id]}`);
  if (parts.length === 0) parts.push("баллы пока неизвестны");
  else {
    const test = r.source ? (PRACTICE_SOURCE_TITLES[r.source as PracticeSource] ?? r.source) : null;
    if (r.kind) parts.push(r.kind === "practice" && test ? `${RESULT_KIND_TITLES.practice.toLowerCase()}: ${test}` : RESULT_KIND_TITLES[r.kind].toLowerCase());
    else if (test) parts.push(test);
    if (r.takenDate) parts.push(`от ${formatDate(r.takenDate)}`);
  }
  if (r.target !== null) parts.push(`цель ${r.target}`);
  for (const s of exam?.sections ?? []) if (r.targetSections?.[s.id] != null) parts.push(`цель ${s.title} ${r.targetSections[s.id]}`);
  if (r.examDate) parts.push(`экзамен ${formatDate(r.examDate)}`);
  return parts.join(" · ");
}

export default async function ScoresPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const profile = await getProfile(user.id);
  if (!profile) redirect("/start");
  const [scores, history] = await Promise.all([getScores(user.id), getScoreHistory(user.id)]);
  const onboarding = scores === null;

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Logo className="text-lg" />
        <Link href="/path" className="text-sm font-medium text-muted hover:text-ink">
          {onboarding ? "Пропустить" : "Отмена"}
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4">
        {onboarding && <p className="text-sm font-semibold text-accent">Шаг 5 из 5</p>}
        <h1 className="text-3xl font-bold tracking-tight">Твой текущий уровень</h1>
        <p className="mb-10 mt-2 max-w-xl text-muted">
          Укажи результат официального экзамена или пробного теста — по секциям, если знаешь. Он задаст стартовую сложность задач, а желаемый балл —
          направление подготовки. Дальше уровень уточняют твои ответы. Результат можно поменять в любой момент — план перестроится, а история сохранится.
        </p>
        <ScoreForm initial={scores} onboarding={onboarding} />

        {history.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-semibold">История</h2>
            <ol className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
              {[...history].reverse().map((r, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm">
                  <span>
                    <span className="font-semibold">{examById(r.exam)?.title ?? r.exam}</span>
                    <span className="text-muted"> · {describe(r)}</span>
                  </span>
                  <span className="text-xs text-subtle">{formatDate(r.recordedAt)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </div>
  );
}
