"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { clsx } from "clsx";

import { saveDraftAction, submitWritingAction, writingFeedbackAction } from "@/actions/lessons";
import type { CourseId, WritingTask } from "@/content/types";
import type { Completion } from "@/lib/game";
import { analyseDraft, countWords, type CheckStatus } from "@/lib/writing";
import { Button, ErrorNote } from "./ui";

export interface DraftState {
  body: string;
  submittedAt: string | null;
}

const STATUS_ICON: Record<CheckStatus, React.ReactNode> = {
  ok: <CheckCircle2 className="size-4 text-accent" />,
  warn: <AlertCircle className="size-4 text-warn" />,
  todo: <Circle className="size-4 text-subtle" />,
};

export function WritingStep({
  courseId,
  lessonId,
  task,
  initial,
  aiFeedback,
  onDone,
}: {
  courseId: CourseId;
  lessonId: string;
  task: WritingTask;
  initial: DraftState | null;
  aiFeedback: boolean;
  onDone: (result: Completion) => void;
}) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">(initial?.body ? "saved" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [asking, startAsk] = useTransition();
  const lastSaved = useRef(initial?.body ?? "");

  const words = countWords(body);
  const checks = useMemo(() => analyseDraft(body, task), [body, task]);
  const ready = words >= task.minWords;

  // Autosave a moment after typing stops.
  useEffect(() => {
    if (body === lastSaved.current) return;
    setSaved("saving");
    const timer = setTimeout(async () => {
      const res = await saveDraftAction(courseId, lessonId, body);
      if (res.ok) {
        lastSaved.current = body;
        setSaved("saved");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [body, courseId, lessonId]);

  const submit = () => {
    setError(null);
    startSubmit(async () => {
      const res = await submitWritingAction(courseId, lessonId, body);
      if (res.ok) onDone(res.result);
      else setError(res.error);
    });
  };

  const askFeedback = () => {
    setError(null);
    startAsk(async () => {
      const res = await writingFeedbackAction(courseId, lessonId, body);
      if (res.ok) setFeedback(res.text);
      else setError(res.error);
    });
  };

  return (
    <div className="rise grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-seminar">Задание</p>
        <p className="mt-1 text-[17px] font-semibold leading-snug">{task.prompt}</p>
        <p className="mt-1 text-sm text-muted">
          {task.minWords}–{task.maxWords} слов, по-английски. Черновик сохраняется сам.
          {initial?.submittedAt ? " Работа уже сдана — можно улучшить и сдать снова." : ""}
        </p>

        {task.starters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {task.starters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setBody((b) => (b.trim() ? `${b.trimEnd()} ${s}` : s))}
                className="rounded-lg border border-dashed border-line-strong px-2.5 py-1 text-xs text-muted hover:border-seminar hover:text-seminar"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          spellCheck
          lang="en"
          rows={14}
          className="passage mt-4 block min-h-80 w-full resize-y rounded-xl border-[1.5px] border-line-strong bg-surface px-5 py-4 outline-none focus:border-seminar"
          placeholder="Start with your claim…"
          aria-label="Текст работы"
        />

        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span className={clsx("tabular", words > task.maxWords && "text-warn")}>
            {words} / {task.minWords}–{task.maxWords} слов
          </span>
          <span>{saved === "saving" ? "Сохраняю…" : saved === "saved" ? "Черновик сохранён" : ""}</span>
        </div>

        {feedback && (
          <section className="mt-5 rounded-xl border border-seminar/25 bg-seminar-soft p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-seminar">
              <Sparkles className="size-4" /> Отзыв преподавателя-ИИ
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed">{feedback}</p>
          </section>
        )}

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" onClick={submit} disabled={!ready || submitting} className="sm:w-auto">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {initial?.submittedAt ? "Сдать снова" : "Сдать работу"}
          </Button>
          {aiFeedback && (
            <Button size="lg" variant="secondary" onClick={askFeedback} disabled={asking || words < 40}>
              {asking ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Получить отзыв
            </Button>
          )}
        </div>
        {!ready && <p className="mt-2 text-xs text-muted">Кнопка станет активной после {task.minWords} слов.</p>}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <section className="card p-4">
          <h2 className="text-sm font-semibold">Проверка черновика</h2>
          <ul className="mt-3 space-y-3">
            {checks.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                <span className="mt-0.5 flex-none">{STATUS_ICON[c.status]}</span>
                <span>
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="block text-xs leading-relaxed text-muted">{c.hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-4">
          <h2 className="text-sm font-semibold">Критерии</h2>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
            {task.rubric.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-[0.5em] size-1 flex-none rounded-full bg-subtle" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
