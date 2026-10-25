"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";

import { saveScoresAction } from "@/actions/scores";
import {
  EXAMS,
  validateScores,
  type Exam,
  type ExamEntry,
  type ExamId,
  type PracticeSource,
  type ResultKind,
  type ScoresInput,
} from "@/content/exams";
import { Button, ErrorNote } from "./ui";

type ResultChoice = ResultKind | "unknown";

/** What the inputs hold: text, so a half-typed "6." does not jump around. */
interface Draft {
  result: ResultChoice;
  total: string;
  sections: Record<string, string>;
  takenDate: string;
  source: PracticeSource;
  sourceName: string;
  target: string;
  targetSections: Record<string, string>;
  examDate: string;
}

function emptyDraft(exam: Exam): Draft {
  return {
    result: "official",
    total: "",
    sections: Object.fromEntries(exam.sections.map((s) => [s.id, ""])),
    takenDate: "",
    source: "bluebook",
    sourceName: "",
    target: "",
    targetSections: Object.fromEntries(exam.sections.map((s) => [s.id, ""])),
    examDate: "",
  };
}

function toText(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function draftOf(exam: Exam, e: ExamEntry): Draft {
  // Results saved before the kind was asked: SAT ones came from "Bluebook / exam" or another practice test.
  const kind: ResultKind = e.kind ?? (exam.practiceSource && e.source === "other" ? "practice" : "official");
  return {
    result: e.current === null ? "unknown" : kind,
    total: toText(e.current?.total),
    sections: Object.fromEntries(exam.sections.map((s) => [s.id, toText(e.current?.sections[s.id])])),
    takenDate: e.takenDate ?? "",
    source: e.source ?? "bluebook",
    sourceName: e.sourceName ?? "",
    target: toText(e.target),
    targetSections: Object.fromEntries(exam.sections.map((s) => [s.id, toText(e.targetSections?.[s.id])])),
    examDate: e.examDate ?? "",
  };
}

function parse(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function entryOf(exam: Exam, d: Draft): ExamEntry {
  const has = d.result !== "unknown";
  const kind = has ? (d.result as ResultKind) : null;
  const targetSections = exam.sectionTargets ? Object.fromEntries(exam.sections.map((s) => [s.id, parse(d.targetSections[s.id] ?? "")])) : null;
  return {
    exam: exam.id,
    current: has ? { total: parse(d.total), sections: Object.fromEntries(exam.sections.map((s) => [s.id, parse(d.sections[s.id] ?? "")])) } : null,
    takenDate: has ? d.takenDate || null : null,
    kind,
    source: exam.practiceSource && kind === "practice" ? d.source : null,
    sourceName: kind === "practice" ? d.sourceName.trim() || null : null,
    target: parse(d.target),
    targetSections: targetSections && Object.values(targetSections).some((v) => v !== null) ? targetSections : null,
    examDate: d.examDate || null,
  };
}

function ScoreInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  strong,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  placeholder?: string;
  strong?: boolean;
}) {
  return (
    <label className="block">
      <span className={clsx("block text-xs font-medium", strong ? "text-ink" : "text-muted")}>{label}</span>
      <input
        inputMode="decimal"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        placeholder={placeholder ?? `${min}–${max}`}
        onChange={(e) => onChange(e.target.value)}
        className={clsx("tabular mt-1 w-full rounded-xl border border-line-strong bg-surface px-3", strong ? "h-12 text-lg font-semibold" : "h-11 text-[15px]")}
      />
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px]"
      />
    </label>
  );
}

const RESULT_CHOICES: { v: ResultChoice; label: string }[] = [
  { v: "official", label: "Официальный экзамен" },
  { v: "practice", label: "Пробный тест" },
  { v: "unknown", label: "Пока не знаю свои баллы" },
];

/** What the SAT numbers say about the sections, in plain words. */
function SatNote({ draft }: { draft: Draft }) {
  const rw = parse(draft.sections.rw ?? "");
  const math = parse(draft.sections.math ?? "");
  const total = parse(draft.total);
  if (rw !== null && math !== null && !Number.isNaN(rw) && !Number.isNaN(math)) {
    return (
      <p className="text-xs text-muted">
        Total = {rw} + {math} = <span className="tabular font-semibold text-ink">{rw + math}</span>. Математические задачи подбираются по Math ({math}), задания на
        чтение и письмо — по Reading & Writing ({rw}).
      </p>
    );
  }
  if (total !== null && !Number.isNaN(total) && (rw === null) !== (math === null)) {
    return <p className="text-xs text-muted">Вторую секцию посчитаем как Total − {rw ?? math} = {total - (rw ?? math)!}.</p>;
  }
  if (total !== null && !Number.isNaN(total)) {
    return (
      <p className="flex gap-2 rounded-lg bg-warn-soft px-3 py-2 text-xs">
        <AlertTriangle className="mt-0.5 size-3.5 flex-none text-warn" />
        <span>
          Указан только общий балл — он может скрывать разницу между Math и Reading & Writing. Уровень Math будет <b>предварительным</b> (≈ {Math.round(total / 20) * 10}).
          После сохранения предложим короткую диагностику: 12 задач по математике разной сложности.
        </span>
      </p>
    );
  }
  return <p className="text-xs text-muted">Главное — баллы секций Math и Reading & Writing: по ним подбирается сложность задач в каждой секции.</p>;
}

function ExamCard({ exam, draft, onChange }: { exam: Exam; draft: Draft; onChange: (d: Draft) => void }) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  const isSat = exam.id === "sat";
  const satSum = isSat && draft.sections.rw && draft.sections.math ? Number(draft.sections.rw) + Number(draft.sections.math) : null;
  const has = draft.result !== "unknown";
  // SAT: Math first, then Reading & Writing — the two numbers that matter; the total after them.
  const sections = isSat ? [...exam.sections].sort((a, b) => Number(b.id === "math") - Number(a.id === "math")) : exam.sections;
  const targetSum = isSat && draft.targetSections.rw && draft.targetSections.math ? Number(draft.targetSections.rw) + Number(draft.targetSections.math) : null;

  return (
    <div className="card space-y-5 p-5">
      <div className="space-y-3">
        <h3 className="text-base font-semibold">{exam.title}</h3>
        <div className="flex flex-wrap gap-1 rounded-xl bg-sunken p-1 text-sm" role="group" aria-label="Какой у тебя результат">
          {RESULT_CHOICES.map((o) => (
            <button
              key={o.v}
              type="button"
              aria-pressed={draft.result === o.v}
              onClick={() => set({ result: o.v })}
              className={clsx("flex-1 rounded-lg px-3 py-1.5 font-medium", draft.result === o.v ? "bg-surface shadow-card" : "text-muted")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {has ? (
        <div className="space-y-4">
          {isSat ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {sections.map((s) => (
                  <ScoreInput
                    key={s.id}
                    strong
                    label={s.title}
                    value={draft.sections[s.id] ?? ""}
                    onChange={(v) => set({ sections: { ...draft.sections, [s.id]: v } })}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                  />
                ))}
                <ScoreInput
                  label={`${exam.totalLabel} (если знаешь только его)`}
                  value={draft.total}
                  onChange={(v) => set({ total: v })}
                  placeholder={satSum ? String(satSum) : undefined}
                  {...exam.total}
                />
              </div>
              <SatNote draft={draft} />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <ScoreInput label={exam.totalLabel} value={draft.total} onChange={(v) => set({ total: v })} {...exam.total} />
                {exam.sections.map((s) => (
                  <ScoreInput
                    key={s.id}
                    label={s.title}
                    value={draft.sections[s.id] ?? ""}
                    onChange={(v) => set({ sections: { ...draft.sections, [s.id]: v } })}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                  />
                ))}
              </div>
              {exam.sections.length > 0 && <p className="text-xs text-muted">Можно указать только часть секций — остальные мы оценим по общему баллу.</p>}
            </>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <DateInput label={draft.result === "practice" ? "Дата пробного теста" : "Дата экзамена, по которому результат"} value={draft.takenDate} onChange={(v) => set({ takenDate: v })} />
            {draft.result === "practice" && exam.practiceSource && (
              <label className="block">
                <span className="block text-xs font-medium text-muted">Какой пробник</span>
                <select
                  value={draft.source}
                  onChange={(e) => set({ source: e.target.value as PracticeSource })}
                  className="mt-1 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px]"
                >
                  <option value="bluebook">Bluebook (College Board)</option>
                  <option value="other">Другой пробник</option>
                </select>
              </label>
            )}
            {draft.result === "practice" && (!exam.practiceSource || draft.source === "other") && (
              <label className="block">
                <span className="block text-xs font-medium text-muted">Название пробника (необязательно)</span>
                <input
                  type="text"
                  maxLength={80}
                  value={draft.sourceName}
                  onChange={(e) => set({ sourceName: e.target.value })}
                  placeholder="например, книга или сайт"
                  className="mt-1 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px]"
                />
              </label>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Ничего страшного — выдумывать балл не нужно. После сохранения будет короткая диагностика{isSat ? " по Math и Reading & Writing" : ""}: по ней мы выставим
          стартовый уровень, а дальше его уточнят твои ответы.
        </p>
      )}

      <div className="space-y-3 border-t border-line pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ScoreInput label="Желаемый балл" value={draft.target} onChange={(v) => set({ target: v })} placeholder={targetSum ? String(targetSum) : undefined} {...exam.total} />
          <DateInput label="Дата будущего экзамена" value={draft.examDate} onChange={(v) => set({ examDate: v })} />
        </div>
        {exam.sectionTargets && (
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((s) => (
              <ScoreInput
                key={s.id}
                label={`Цель по ${s.title} (необязательно)`}
                value={draft.targetSections[s.id] ?? ""}
                onChange={(v) => set({ targetSections: { ...draft.targetSections, [s.id]: v } })}
                min={s.min}
                max={s.max}
                step={s.step}
              />
            ))}
          </div>
        )}
        <p className="text-xs text-muted">Текущий результат задаёт стартовую сложность, а цель — направление: чем дальше цель, тем больше задач следующей ступени.</p>
      </div>
    </div>
  );
}

export function ScoreForm({ initial, onboarding }: { initial: ScoresInput | null; onboarding: boolean }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selected, setSelected] = useState<ExamId[]>(() => initial?.entries.map((e) => e.exam) ?? []);
  const [drafts, setDrafts] = useState<Partial<Record<ExamId, Draft>>>(() => {
    const out: Partial<Record<ExamId, Draft>> = {};
    for (const e of initial?.entries ?? []) {
      const exam = EXAMS.find((x) => x.id === e.exam);
      if (exam) out[e.exam] = draftOf(exam, e);
    }
    return out;
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (exam: Exam) => {
    setError(null);
    setSelected((prev) => (prev.includes(exam.id) ? prev.filter((x) => x !== exam.id) : [...prev, exam.id]));
    setDrafts((prev) => (prev[exam.id] ? prev : { ...prev, [exam.id]: emptyDraft(exam) }));
  };

  const input: ScoresInput = {
    entries: EXAMS.filter((e) => selected.includes(e.id)).map((e) => entryOf(e, drafts[e.id] ?? emptyDraft(e))),
  };

  const submit = () => {
    setError(null);
    const numbers = (e: ExamEntry) => [e.current?.total, e.target, ...Object.values(e.current?.sections ?? {}), ...Object.values(e.targetSections ?? {})];
    if (input.entries.some((e) => numbers(e).some((v) => Number.isNaN(v)))) {
      setError("Баллы должны быть числами.");
      return;
    }
    const empty = input.entries.find((e) => e.current && e.current.total === null && Object.values(e.current.sections).every((v) => v === null));
    if (empty) {
      setError(`${EXAMS.find((x) => x.id === empty.exam)?.title}: укажи баллы или выбери «Пока не знаю свои баллы».`);
      return;
    }
    const valid = validateScores(input, today);
    if (!valid.ok) {
      setError(valid.error);
      return;
    }
    start(async () => {
      const res = await saveScoresAction(valid.value);
      if (res && !res.ok) setError(res.error);
    });
  };

  const noResults = input.entries.every((e) => e.current === null);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Какие экзамены ты сдаёшь или будешь сдавать?</h2>
        <p className="text-sm text-muted">Можно выбрать несколько. По результату и цели план решит, какой сложности давать задания и каким секциям нужно больше практики.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMS.map((exam) => {
            const on = selected.includes(exam.id);
            return (
              <button
                key={exam.id}
                type="button"
                onClick={() => toggle(exam)}
                aria-pressed={on}
                className={clsx(
                  "flex items-center gap-2 rounded-xl border-[1.5px] border-b-[3px] px-4 py-2.5 font-semibold transition-colors",
                  on ? "border-accent bg-accent-soft" : "border-line-strong bg-surface hover:bg-sunken",
                )}
              >
                {exam.title}
                {on && <Check className="size-4 text-accent" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </section>

      {EXAMS.filter((e) => selected.includes(e.id)).map((exam) => (
        <ExamCard key={exam.id} exam={exam} draft={drafts[exam.id] ?? emptyDraft(exam)} onChange={(d) => setDrafts((prev) => ({ ...prev, [exam.id]: d }))} />
      ))}

      {selected.length === 0 && (
        <div className="card p-5 text-sm">
          <p className="font-semibold">Пока не знаешь свои баллы?</p>
          <p className="mt-1 text-muted">Пройди короткую диагностику: по 12 заданий по SAT Reading & Writing, SAT Math и IELTS Reading. Она займёт около 40 минут, и её можно проходить по частям.</p>
        </div>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {selected.length === 0 ? "Пройти диагностику" : noResults ? "Сохранить и пройти диагностику" : onboarding ? "Сохранить и построить план" : "Сохранить и перестроить план"}
        </Button>
        <Link href="/path" className="text-sm font-medium text-muted hover:text-ink">
          {onboarding ? "Пропустить" : "Отмена"}
        </Link>
      </div>
    </div>
  );
}
