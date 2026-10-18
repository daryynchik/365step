"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";

import { saveScoresAction } from "@/actions/scores";
import { EXAMS, validateScores, type Exam, type ExamEntry, type ExamId, type PracticeSource, type ScoresInput } from "@/content/exams";
import { Button, ErrorNote } from "./ui";

/** What the inputs hold: text, so a half-typed "6." does not jump around. */
interface Draft {
  hasResult: boolean;
  total: string;
  sections: Record<string, string>;
  takenDate: string;
  source: PracticeSource;
  target: string;
  examDate: string;
}

function emptyDraft(exam: Exam): Draft {
  return {
    hasResult: true,
    total: "",
    sections: Object.fromEntries(exam.sections.map((s) => [s.id, ""])),
    takenDate: "",
    source: "bluebook",
    target: "",
    examDate: "",
  };
}

function toText(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

function draftOf(exam: Exam, e: ExamEntry): Draft {
  return {
    hasResult: e.current !== null,
    total: toText(e.current?.total),
    sections: Object.fromEntries(exam.sections.map((s) => [s.id, toText(e.current?.sections[s.id])])),
    takenDate: e.takenDate ?? "",
    source: e.source ?? "bluebook",
    target: toText(e.target),
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
  return {
    exam: exam.id,
    current: d.hasResult
      ? { total: parse(d.total), sections: Object.fromEntries(exam.sections.map((s) => [s.id, parse(d.sections[s.id] ?? "")])) }
      : null,
    takenDate: d.hasResult ? d.takenDate || null : null,
    source: exam.practiceSource && d.hasResult ? d.source : null,
    target: parse(d.target),
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted">{label}</span>
      <input
        inputMode="decimal"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        placeholder={placeholder ?? `${min}–${max}`}
        onChange={(e) => onChange(e.target.value)}
        className="tabular mt-1 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px]"
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

function ExamCard({ exam, draft, onChange }: { exam: Exam; draft: Draft; onChange: (d: Draft) => void }) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  const satSum =
    exam.id === "sat" && draft.sections.rw && draft.sections.math ? Number(draft.sections.rw) + Number(draft.sections.math) : null;

  return (
    <div className="card space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{exam.title}</h3>
        <div className="flex rounded-xl bg-sunken p-1 text-sm" role="group" aria-label="Результат">
          {[
            { v: true, label: "Есть результат" },
            { v: false, label: "Пока нет баллов" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              aria-pressed={draft.hasResult === o.v}
              onClick={() => set({ hasResult: o.v })}
              className={clsx("rounded-lg px-3 py-1.5 font-medium", draft.hasResult === o.v ? "bg-surface shadow-card" : "text-muted")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {draft.hasResult ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <ScoreInput
              label={exam.totalLabel}
              value={draft.total}
              onChange={(v) => set({ total: v })}
              placeholder={satSum ? String(satSum) : undefined}
              {...exam.total}
            />
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
          <div className="grid gap-3 sm:grid-cols-2">
            <DateInput label={exam.practiceSource ? "Дата пробника" : "Дата результата"} value={draft.takenDate} onChange={(v) => set({ takenDate: v })} />
            {exam.practiceSource && (
              <label className="block">
                <span className="block text-xs font-medium text-muted">Источник</span>
                <select
                  value={draft.source}
                  onChange={(e) => set({ source: e.target.value as PracticeSource })}
                  className="mt-1 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px]"
                >
                  <option value="bluebook">Официальный Bluebook / экзамен</option>
                  <option value="other">Другой пробник</option>
                </select>
              </label>
            )}
          </div>
          <p className="text-xs text-muted">Можно указать только часть секций — остальные мы оценим по общему баллу.</p>
        </div>
      ) : (
        <p className="text-sm text-muted">Ничего страшного — после сохранения будет короткая диагностика, по ней мы выставим стартовый уровень.</p>
      )}

      <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
        <ScoreInput label="Целевой балл" value={draft.target} onChange={(v) => set({ target: v })} {...exam.total} />
        <DateInput label="Планируемая дата экзамена" value={draft.examDate} onChange={(v) => set({ examDate: v })} />
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
    if (input.entries.some((e) => [e.current?.total, e.target, ...Object.values(e.current?.sections ?? {})].some((v) => Number.isNaN(v)))) {
      setError("Баллы должны быть числами.");
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
        <p className="text-sm text-muted">Все экзамены необязательны, можно выбрать несколько. По баллам план даст больше уроков туда, где разрыв с целью больше.</p>
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
          <p className="font-semibold">Пока нет баллов?</p>
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
