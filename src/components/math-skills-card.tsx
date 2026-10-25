import { DOMAINS, skillsOf } from "@/content/bank/taxonomy";
import { mathBand, skillNameRu, skillStatus, TIER_TITLES, type Mastery, type Tier } from "@/content/math-ladder";
import type { SectionState } from "@/content/skill-level";

/** SAT Math: the step of every skill and why the next tasks are what they are. */
export function MathSkillsCard({
  state,
  mastery,
  justPromoted,
  target,
}: {
  state: SectionState;
  mastery: Record<string, Mastery>;
  justPromoted: Set<string>;
  target: Tier;
}) {
  const band = mathBand(state.current);
  const skills = skillsOf("sat-math");
  const domains = DOMAINS.filter((d) => d.section === "sat-math");

  return (
    <section className="card mb-10 p-5" id="math-skills">
      <h2 className="font-semibold">SAT Math по навыкам</h2>
      <p className="mt-1 text-sm text-muted">
        Math {state.current}
        {state.preliminary ? " (предварительно)" : ""} — диапазон подбора {band.from}–{band.to}. Цель {state.target} — ступень {target} из 6. Ступени —
        внутренняя шкала подбора задач, не официальная сложность SAT.
      </p>
      <div className="mt-4 space-y-5">
        {domains.map((d) => (
          <div key={d.id}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{d.title}</p>
            <ul className="space-y-2.5">
              {skills
                .filter((s) => s.domain === d.id)
                .map((s) => {
                  const m = mastery[s.id];
                  if (!m) return null;
                  return (
                    <li key={s.id} className="text-sm">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="min-w-0 flex-1 font-medium">{skillNameRu(s.id).replace(/^./, (c) => c.toUpperCase())}</span>
                        <span className="flex gap-0.5" aria-label={`Ступень ${m.tier} из 6`}>
                          {[1, 2, 3, 4, 5, 6].map((t) => (
                            <span key={t} className={`h-2 w-4 rounded-sm ${t <= m.tier ? (m.remediation ? "bg-warn" : "bg-accent") : "bg-sunken"}`} />
                          ))}
                        </span>
                        <span className="tabular w-28 text-right text-xs text-muted">
                          {m.tier}/6 · {TIER_TITLES[m.tier]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {skillStatus(m, target, justPromoted.has(s.id))}
                        {m.answered > 0 ? ` · ответов: ${m.answered}, с первой попытки без подсказки: ${m.clean}` : " · ещё не решал"}
                      </p>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Ступень навыка растёт после серии: 7 из 8 задач своей ступени и выше — верно с первой попытки без подсказки. После нескольких ошибок подряд — объяснение и
        задачи попроще на тот же навык, затем возврат к своей ступени. Один слабый навык не снижает остальные. Ошибки возвращаются через 2 и 7 дней.
      </p>
    </section>
  );
}
