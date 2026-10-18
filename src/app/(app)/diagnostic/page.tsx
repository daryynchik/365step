import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";

import { DIAGNOSTIC_SIZE } from "@/content/diagnostic";
import { DIAGNOSTIC_SECTIONS, diagnosticNeeded, LEVEL_TITLES, SECTION_TITLES } from "@/content/exams";
import { ButtonLink } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { getDiagnosticLevels, getScores } from "@/lib/scores";

export const metadata: Metadata = { title: "Диагностика" };
export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const [scores, levels] = await Promise.all([getScores(user.id), getDiagnosticLevels(user.id)]);
  const needed = new Set(diagnosticNeeded(scores?.entries ?? []));
  const sections = DIAGNOSTIC_SECTIONS.filter((s) => needed.has(s) || levels[s]);
  const others = DIAGNOSTIC_SECTIONS.filter((s) => !sections.includes(s));
  const next = sections.find((s) => !levels[s]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Диагностика</h1>
      <p className="mt-2 text-muted">
        По {DIAGNOSTIC_SIZE} заданий на секцию, разной сложности. Результат выставит стартовый уровень, дальше план подстраивается сам: каждые 10
        заданий по навыку уровень растёт или снижается по твоей точности.
      </p>

      <ol className="mt-8 space-y-2">
        {sections.map((s) => (
          <li key={s}>
            <Link href={`/lesson/diagnostic/${s}`} className="card flex items-center gap-4 px-5 py-4 transition-colors hover:border-line-strong">
              <span className={`grid size-9 flex-none place-items-center rounded-full ${levels[s] ? "bg-accent text-white" : "bg-sunken text-muted"}`}>
                {levels[s] ? <Check className="size-4" strokeWidth={3} /> : <ChevronRight className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{SECTION_TITLES[s]}</span>
                <span className="block text-sm text-muted">{levels[s] ? `Уровень: ${LEVEL_TITLES[levels[s]!]} · можно пройти ещё раз` : `${DIAGNOSTIC_SIZE} заданий · ~15 минут`}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {next ? (
          <ButtonLink href={`/lesson/diagnostic/${next}`} size="lg">
            Начать: {SECTION_TITLES[next]}
          </ButtonLink>
        ) : (
          <ButtonLink href="/path" size="lg">
            К моему плану
          </ButtonLink>
        )}
        {next && (
          <Link href="/path" className="text-sm font-medium text-muted hover:text-ink">
            Позже — пока считать уровень средним
          </Link>
        )}
      </div>

      {others.length > 0 && (
        <p className="mt-10 text-sm text-muted">
          Для секций с указанными баллами диагностика не нужна. Проверить себя всё равно можно:{" "}
          {others.map((s, i) => (
            <span key={s}>
              {i > 0 && ", "}
              <Link href={`/lesson/diagnostic/${s}`} className="font-medium text-accent hover:underline">
                {SECTION_TITLES[s]}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );
}
