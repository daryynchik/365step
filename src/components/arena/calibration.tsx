"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Gauge, Loader2, X } from "lucide-react";
import { clsx } from "clsx";

import type { Question } from "@/content/types";
import type { Response } from "@/lib/answers";
import type { CalibrationView } from "@/lib/race";
import { QuestionView } from "../question-view";
import { Button, buttonClass, ErrorNote } from "../ui";

const LEVEL_NAMES = { easy: "простой", medium: "средний", hard: "сложный" } as const;

/** The starting calibration: six questions, easy to hard, no opponent and no timer. */
export function Calibration({ initial }: { initial: CalibrationView }) {
  const [view, setView] = useState(initial);
  const [response, setResponse] = useState<Response | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string; explanation: string } | null>(null);
  const [rating, setRating] = useState<number | null>(initial.rating);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (response === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/race/calibration/${view.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: view.index, response }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error);
      else {
        setFeedback(data);
        if (data.rating !== null) setRating(data.rating);
      }
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    const res = await fetch(`/api/race/calibration/${view.id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setView(data.calibration);
    setFeedback(null);
    setResponse(null);
  };

  const q = view.question;
  const question: Question | null = q
    ? q.kind === "choice"
      ? { kind: "choice", prompt: q.prompt, passages: q.passages, table: q.table, options: q.options ?? [], answer: -1, explanation: "" }
      : { kind: "input", prompt: q.prompt, passages: q.passages, table: q.table, answers: [q.numeric ? "0" : "x"], explanation: "" }
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Gauge className="size-5 text-accent" />
        <h1 className="text-2xl font-bold tracking-tight">Калибровка {view.track.toUpperCase()}</h1>
      </div>
      <p className="text-sm text-muted">Шесть вопросов от простых к сложным. Сложные приносят больше баллов. По результату мы поставим стартовый рейтинг и будем подбирать соперников твоего уровня.</p>
      <div className="flex gap-1.5" aria-label="Прогресс калибровки">
        {Array.from({ length: view.total }, (_, i) => {
          const r = view.results[i] ?? (i === view.index && feedback ? { correct: feedback.correct } : null);
          return <span key={i} className={clsx("h-2 flex-1 rounded-full", !r ? (i === view.index ? "bg-ink/30" : "bg-sunken") : r.correct ? "bg-accent" : "bg-danger")} />;
        })}
      </div>

      {view.done || (feedback && view.index + 1 >= view.total && rating !== null) ? (
        <section className="card p-6 text-center">
          {feedback && (
            <p className={clsx("mb-3 text-sm font-semibold", feedback.correct ? "text-accent" : "text-danger")}>
              {feedback.correct ? "Верно" : `Неверно. Правильный ответ: ${feedback.correctAnswer}`}
            </p>
          )}
          <p className="text-sm text-muted">Стартовый рейтинг {view.track.toUpperCase()}</p>
          <p className="tabular text-4xl font-bold">{rating}</p>
          <p className="mt-2 text-sm text-muted">Теперь соперники будут подбираться под этот уровень. Рейтинг будет меняться после каждого рейтингового соревнования.</p>
          <Link href={`/arena?track=${view.track}`} className={clsx(buttonClass("primary"), "mt-4")}>
            Найти соперника
          </Link>
        </section>
      ) : (
        question && (
          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="font-semibold">
                Вопрос {view.index + 1} из {view.total}
              </span>
              <span className="rounded-full bg-sunken px-2 py-0.5 text-muted">{view.section}</span>
              <span className="rounded-full bg-sunken px-2 py-0.5 text-muted">{view.topic}</span>
              <span className="rounded-full bg-sunken px-2 py-0.5 text-muted">{LEVEL_NAMES[view.level]}</span>
            </div>
            {view.audio && (
              <div className="rounded-xl border border-line bg-sunken px-4 py-3">
                <p className="mb-2 text-sm">{view.audio.context}</p>
                <audio controls src={view.audio.src} className="w-full" />
              </div>
            )}
            <QuestionView key={view.index} question={question} response={response} onRespond={setResponse} checked={false} disabled={feedback !== null || busy} />
            {error && <ErrorNote>{error}</ErrorNote>}
            {feedback ? (
              <div className={clsx("rounded-xl border p-4", feedback.correct ? "border-accent-line bg-accent-soft" : "border-danger/25 bg-danger-soft")}>
                <p className={clsx("flex items-center gap-1.5 font-semibold", feedback.correct ? "text-accent" : "text-danger")}>
                  {feedback.correct ? <Check className="size-5" /> : <X className="size-5" />}
                  {feedback.correct ? "Верно" : `Неверно. Правильный ответ: ${feedback.correctAnswer}`}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm">{feedback.explanation}</p>
                <Button className="mt-3" onClick={next}>
                  Следующий вопрос
                </Button>
              </div>
            ) : (
              <Button onClick={send} disabled={response === null || response === "" || busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                Ответить
              </Button>
            )}
          </section>
        )
      )}
    </div>
  );
}
