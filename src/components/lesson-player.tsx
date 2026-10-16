"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowUpRight, BookOpen, Check, Loader2, X } from "lucide-react";
import { clsx } from "clsx";

import { completeLessonAction, completePracticeAction } from "@/actions/lessons";
import { sectionHref, sectionLabel } from "@/content";
import type { CourseId, Lesson } from "@/content/types";
import { correctAnswerLabel, isCorrect, type Response } from "@/lib/answers";
import type { Completion } from "@/lib/game";
import { Celebration } from "./celebration";
import { ListeningPanel, LISTEN_MODES, type ListenMode } from "./listening-panel";
import { usePersistentMode } from "./mode-switch";
import { MorePractice } from "./more-practice";
import { QuestionView } from "./question-view";
import { RichText } from "./rich-text";
import { SpeakingStep } from "./speaking-step";
import { Button, ErrorNote } from "./ui";
import { WritingStep, type DraftState } from "./writing-step";

type Phase = "theory" | "questions" | "writing" | "speaking" | "done";

/** A short badge for an official resource link. */
function officialBadge(url: string): string {
  if (url.includes("collegeboard")) return "CB";
  if (url.includes("ielts")) return "IELTS";
  if (url.includes("ucas")) return "UCAS";
  if (url.includes("commonapp")) return "CA";
  return "↗";
}

export interface LessonPlayerProps {
  courseId: CourseId;
  lesson: Lesson;
  unitTitle: string;
  tone: string;
  backHref: string;
  draft: DraftState | null;
  aiFeedback: boolean;
  /** When set, this is a generated practice set and completes as one. */
  practiceSetId?: string;
  /** Lesson key for "more questions on this skill", when generation is available. */
  moreKey?: string | null;
  /** Shown under the title, e.g. the source of a generated passage. */
  note?: React.ReactNode;
}

export function LessonPlayer({ courseId, lesson, unitTitle, tone, backHref, draft, aiFeedback, practiceSetId, moreKey, note }: LessonPlayerProps) {
  const questions = lesson.questions;
  const [phase, setPhase] = useState<Phase>("theory");
  const [listenMode, setListenMode] = usePersistentMode<ListenMode>("365step:listen-mode", "audio", LISTEN_MODES);

  // Questions are asked in order; a wrong answer sends that question to the back
  // of the queue once, so the lesson ends on a correct answer to everything.
  const [queue, setQueue] = useState<number[]>(() => questions.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [response, setResponse] = useState<Response | null>(null);
  const [checked, setChecked] = useState(false);
  const [firstTry, setFirstTry] = useState<(Response | null)[]>(() => questions.map(() => null));
  const [cleared, setCleared] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState(false);

  const [result, setResult] = useState<Completion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const current = queue[position];
  const question = questions[current];
  const correct = checked && question ? isCorrect(question, response) : false;

  const totalSteps = 1 + questions.length + (lesson.writing || lesson.speaking ? 1 : 0);
  const doneSteps = (phase === "theory" ? 0 : 1) + cleared.size + (phase === "done" ? 1 : 0);

  const finish = useCallback(
    (responses: (Response | null)[]) => {
      setError(null);
      start(async () => {
        const res = practiceSetId
          ? await completePracticeAction(practiceSetId, responses)
          : await completeLessonAction(courseId, lesson.id, responses);
        if (res.ok) {
          setResult(res.result);
          setPhase("done");
        } else {
          setError(res.error);
        }
      });
    },
    [courseId, lesson.id, practiceSetId],
  );

  /** After the questions (or instead of them): writing, speaking, or done. */
  const afterQuestions = useCallback(
    (responses: (Response | null)[]) => {
      if (lesson.writing) setPhase("writing");
      else if (lesson.speaking) setPhase("speaking");
      else finish(responses);
    },
    [lesson.writing, lesson.speaking, finish],
  );

  const begin = useCallback(() => {
    if (questions.length > 0) setPhase("questions");
    else afterQuestions([]);
  }, [questions.length, afterQuestions]);

  const check = useCallback(() => {
    if (!question || response === null || (typeof response === "string" && !response.trim())) return;
    setChecked(true);
    const right = isCorrect(question, response);
    if (firstTry[current] === null) {
      setFirstTry((prev) => prev.map((r, i) => (i === current ? response : r)));
    }
    if (right) {
      setCleared((prev) => new Set(prev).add(current));
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 350);
      // Ask it again at the end, but only once.
      if (queue.filter((q) => q === current).length === 1) setQueue((prev) => [...prev, current]);
    }
  }, [question, response, current, firstTry, queue]);

  const advance = useCallback(() => {
    const nextPosition = position + 1;
    setChecked(false);
    setResponse(null);
    if (nextPosition < queue.length) {
      setPosition(nextPosition);
      return;
    }
    afterQuestions(firstTry);
  }, [position, queue.length, afterQuestions, firstTry]);

  // Keyboard: 1–4 or A–D to choose, Enter to check / continue.
  useEffect(() => {
    if (phase !== "questions" || !question) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "Enter") {
        e.preventDefault();
        if (checked) advance();
        else check();
        return;
      }
      if (typing || checked || question.kind !== "choice") return;
      const index = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
      if (index >= 0 && index < question.options.length) setResponse(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, question, checked, check, advance]);

  const progress = useMemo(() => Math.round((doneSteps / totalSteps) * 100), [doneSteps, totalSteps]);

  if (phase === "done" && result) {
    return (
      <Celebration
        result={result}
        kind={lesson.writing ? "writing" : lesson.speaking ? "speaking" : "lesson"}
        backHref={backHref}
        moreKey={moreKey ?? null}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4">
          <Link href={backHref} aria-label="Выйти из урока" className="rounded-lg p-1.5 text-subtle hover:bg-sunken hover:text-ink">
            <X className="size-5" />
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(4, progress)}%`, background: tone }} />
          </div>
          {phase === "questions" && (
            <span className="tabular text-sm font-medium text-muted">
              {cleared.size}/{questions.length}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-40 pt-8">
        {phase === "theory" && (
          <article className="rise">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: tone }}>
              {unitTitle}
            </p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{lesson.title}</h1>
            <p className="mt-1 text-muted">
              {lesson.minutes} мин{questions.length > 0 ? ` · ${questions.length} заданий` : ""}
              {lesson.writing ? ` · письменная работа ${lesson.writing.minWords}–${lesson.writing.maxWords} слов` : ""}
              {lesson.listening ? " · аудирование" : ""}
              {lesson.speaking ? " · разговор с экзаменатором" : ""}
            </p>
            {note}

            {lesson.reading && (
              <section className="mt-6 rounded-xl border border-seminar/20 bg-seminar-soft p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-seminar">
                  <BookOpen className="size-4" /> Прочитай перед уроком
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lesson.reading.sections.map((id) => (
                    <a
                      key={id}
                      href={sectionHref(id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-line-strong"
                    >
                      {sectionLabel(id)}
                      {id.includes("#") ? " (финал)" : ""}
                      <ArrowUpRight className="size-3.5 text-subtle" />
                    </a>
                  ))}
                </div>
                <p className="mt-4 text-sm font-medium">На что обратить внимание:</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {lesson.reading.guide.map((g) => (
                    <li key={g} className="flex gap-2.5">
                      <span className="mt-[0.55em] size-1.5 flex-none rounded-full bg-seminar/60" />
                      {g}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-6 space-y-6 text-[16px] leading-relaxed">
              {lesson.theory.map((block, i) => (
                <section key={i}>
                  {block.heading && <h2 className="mb-2 text-lg font-semibold">{block.heading}</h2>}
                  <RichText text={block.body} />
                </section>
              ))}
            </div>

            {lesson.official && (
              <a
                href={lesson.official.url}
                target="_blank"
                rel="noreferrer"
                className="mt-8 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm hover:border-line-strong"
              >
                <span className="grid size-9 flex-none place-items-center rounded-lg bg-sunken text-[10px] font-bold text-muted">
                  {officialBadge(lesson.official.url)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Официальные материалы</span>
                  <span className="block truncate text-xs text-muted">{lesson.official.label}</span>
                </span>
                <ArrowUpRight className="size-4 flex-none text-subtle" />
              </a>
            )}

            {moreKey && <MorePractice lessonKey={moreKey} className="mt-3" />}
          </article>
        )}

        {phase === "questions" && lesson.listening && (
          <ListeningPanel listening={lesson.listening} mode={listenMode} onModeChange={setListenMode} />
        )}

        {phase === "questions" && question && (
          <div key={`${current}-${position}`} className={clsx("rise", shake && "shake")}>
            {position >= questions.length && (
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
                Повтор ошибки
              </p>
            )}
            <QuestionView question={question} response={response} onRespond={setResponse} checked={checked} disabled={checked || pending} />
          </div>
        )}

        {phase === "writing" && lesson.writing && (
          <WritingStep courseId={courseId} lessonId={lesson.id} task={lesson.writing} initial={draft} aiFeedback={aiFeedback} onDone={(r) => {
            setResult(r);
            setPhase("done");
          }} />
        )}

        {phase === "speaking" && lesson.speaking && (
          <SpeakingStep
            courseId={courseId}
            lessonId={lesson.id}
            spec={lesson.speaking}
            aiExaminer={aiFeedback}
            onDone={(r) => {
              setResult(r);
              setPhase("done");
            }}
          />
        )}

        {error && (
          <div className="mt-6">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </main>

      {phase === "theory" && (
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface">
          <div className="mx-auto flex max-w-3xl justify-end px-4 py-4">
            <Button size="lg" onClick={begin} disabled={pending} className="w-full sm:w-auto">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {questions.length > 0 ? "К заданиям" : lesson.speaking ? "К разговору с экзаменатором" : lesson.writing ? "К письменной работе" : "Готово"}
            </Button>
          </div>
        </footer>
      )}

      {phase === "questions" && question && (
        <footer
          className={clsx(
            "fixed inset-x-0 bottom-0 z-30 border-t",
            !checked && "border-line bg-surface",
            checked && correct && "feedback-sheet border-accent-line bg-accent-soft",
            checked && !correct && "feedback-sheet border-danger/25 bg-danger-soft",
          )}
          aria-live="polite"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end">
            {checked && (
              <div className="min-w-0 flex-1">
                <p className={clsx("flex items-center gap-2 text-lg font-bold", correct ? "text-accent" : "text-danger")}>
                  {correct ? <Check className="size-5" strokeWidth={3} /> : <X className="size-5" strokeWidth={3} />}
                  {correct ? "Верно!" : "Не совсем"}
                </p>
                {!correct && (
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">Правильный ответ:</span> {correctAnswerLabel(question)}
                  </p>
                )}
                <p className="mt-1 max-h-32 overflow-y-auto text-sm leading-relaxed text-ink/80">{question.explanation}</p>
              </div>
            )}
            <div className={clsx("flex", !checked && "w-full justify-end")}>
              {checked ? (
                <Button size="lg" variant={correct ? "primary" : "danger-solid"} onClick={advance} disabled={pending} className="w-full sm:w-40">
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Дальше
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={check}
                  disabled={response === null || (typeof response === "string" && !response.trim())}
                  className="w-full sm:w-40"
                >
                  Проверить
                </Button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
