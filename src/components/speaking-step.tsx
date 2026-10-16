"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Circle, Loader2, Mic, Send, Sparkles, Square, Timer } from "lucide-react";
import { clsx } from "clsx";

import { examinerFollowUpAction, speakingAssessmentAction, submitSpeakingAction } from "@/actions/lessons";
import type { CourseId, Speaking } from "@/content/types";
import type { Completion } from "@/lib/game";
import { analyseSpeaking, targetFor, type SpeakingTurn } from "@/lib/speaking";
import { countWords, type CheckStatus } from "@/lib/writing";
import { ModeSwitch, usePersistentMode } from "./mode-switch";
import { Button, ErrorNote } from "./ui";

export type SpeakMode = "voice" | "text";
const SPEAK_MODES = ["voice", "text"] as const;

const FALLBACK_FOLLOW_UPS = ["Could you tell me a bit more about that?", "Why is that?", "What do you mean by that?"];
const PREP_SECONDS = 60;
const LONG_TURN_SECONDS = 120;

const STATUS_ICON: Record<CheckStatus, React.ReactNode> = {
  ok: <CheckCircle2 className="size-4 text-accent" />,
  warn: <AlertCircle className="size-4 text-warn" />,
  todo: <Circle className="size-4 text-subtle" />,
};

// Minimal typings for the Web Speech API, which TypeScript's DOM lib omits.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = synth.getVoices().find((v) => /en-gb/i.test(v.lang)) ?? synth.getVoices().find((v) => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-GB";
  synth.speak(u);
}

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function SpeakingStep({
  courseId,
  lessonId,
  spec,
  aiExaminer,
  onDone,
}: {
  courseId: CourseId;
  lessonId: string;
  spec: Speaking;
  aiExaminer: boolean;
  onDone: (result: Completion) => void;
}) {
  const [mode, setMode] = usePersistentMode<SpeakMode>("365step:speak-mode", "voice", SPEAK_MODES);
  const [notice, setNotice] = useState<string | null>(null);
  const [turns, setTurns] = useState<SpeakingTurn[]>(() => [
    { role: "examiner", text: spec.intro },
    { role: "examiner", text: spec.questions[0] },
  ]);
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => spec.questions.map(() => ""));
  const [followedUp, setFollowedUp] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [prepLeft, setPrepLeft] = useState(spec.part === 2 ? PREP_SECONDS : 0);

  const [assessment, setAssessment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinking, startThinking] = useTransition();
  const [assessing, startAssess] = useTransition();
  const [submitting, startSubmit] = useTransition();

  const recognition = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const chatEnd = useRef<HTMLDivElement>(null);
  const spokenUpTo = useRef(0);

  const voiceSupported = useMemo(() => recognitionCtor() !== null, []);

  // No speech recognition in this browser: text mode is the only option.
  useEffect(() => {
    if (!voiceSupported && mode === "voice") {
      setMode("text");
      setNotice("Этот браузер не распознаёт речь (лучше всего работает Chrome). Включён текстовый режим.");
    }
  }, [voiceSupported, mode, setMode]);

  // In voice mode the examiner's lines are read aloud as they appear.
  useEffect(() => {
    // Scroll the chat itself, not the page.
    const box = chatEnd.current?.parentElement;
    box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    if (mode !== "voice") {
      spokenUpTo.current = turns.length;
      return;
    }
    const fresh = turns.slice(spokenUpTo.current).filter((t) => t.role === "examiner");
    spokenUpTo.current = turns.length;
    if (fresh.length) speak(fresh.map((t) => t.text).join(" "));
  }, [turns, mode]);

  // Part 2 preparation countdown.
  useEffect(() => {
    if (prepLeft <= 0) return;
    const t = setTimeout(() => setPrepLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [prepLeft]);

  // Recording timer; the Part 2 long turn stops at two minutes like the real test.
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const stopRecording = useCallback(() => {
    recognition.current?.stop();
    setRecording(false);
  }, []);

  useEffect(() => {
    if (recording && spec.part === 2 && question === 0 && elapsed >= LONG_TURN_SECONDS) stopRecording();
  }, [recording, elapsed, spec.part, question, stopRecording]);

  useEffect(() => () => recognition.current?.abort(), []);

  const startRecording = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    setError(null);
    window.speechSynthesis?.cancel();
    finalText.current = draft ? `${draft.trim()} ` : "";
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText.current += `${r[0].transcript.trim()} `;
        else live += r[0].transcript;
      }
      setDraft(finalText.current.trim());
      setInterim(live);
    };
    rec.onerror = (e) => {
      setRecording(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") {
        setMode("text");
        setNotice("Нет доступа к микрофону — включён текстовый режим. Разрешить микрофон можно в настройках браузера.");
      } else if (e.error === "no-speech") {
        setError("Не слышно речи. Проверь микрофон и попробуй ещё раз.");
      } else if (e.error !== "aborted") {
        setError("Распознавание речи прервалось. Попробуй ещё раз или переключись на текст.");
      }
    };
    rec.onend = () => {
      setRecording(false);
      setInterim("");
    };
    recognition.current = rec;
    setElapsed(0);
    setPrepLeft(0);
    rec.start();
    setRecording(true);
  };

  const send = () => {
    const text = draft.trim();
    if (!text || thinking) return;
    if (recording) stopRecording();
    setDraft("");
    setInterim("");
    setError(null);

    const nextTurns: SpeakingTurn[] = [...turns, { role: "student", text }];
    setTurns(nextTurns);
    setAnswers((prev) => prev.map((a, i) => (i === question ? `${a} ${text}`.trim() : a)));

    const words = countWords(`${answers[question]} ${text}`);
    // Only clearly brief answers get a follow-up, as in the real test.
    const tooShort = words < Math.ceil(targetFor(spec, question)[0] * 0.6);
    const canFollowUp = spec.part !== 2 && tooShort && !followedUp.has(question);

    startThinking(async () => {
      if (canFollowUp) {
        const ai = aiExaminer ? await examinerFollowUpAction(courseId, lessonId, nextTurns) : null;
        const follow = ai ?? FALLBACK_FOLLOW_UPS[question % FALLBACK_FOLLOW_UPS.length];
        setFollowedUp((s) => new Set(s).add(question));
        setTurns((t) => [...t, { role: "examiner", text: follow }]);
        return;
      }
      const next = question + 1;
      if (next < spec.questions.length) {
        setQuestion(next);
        setTurns((t) => [...t, { role: "examiner", text: spec.questions[next] }]);
      } else {
        setFinished(true);
        setTurns((t) => [...t, { role: "examiner", text: "Thank you. That is the end of this part of the test." }]);
      }
    });
  };

  const checks = useMemo(() => (finished ? analyseSpeaking(spec, answers) : []), [finished, spec, answers]);

  const assess = () =>
    startAssess(async () => {
      const res = await speakingAssessmentAction(courseId, lessonId, turns, mode);
      if (res.ok) setAssessment(res.text);
      else setError(res.error);
    });

  const submit = () =>
    startSubmit(async () => {
      setError(null);
      const res = await submitSpeakingAction(courseId, lessonId, turns, mode);
      if (res.ok) onDone(res.result);
      else setError(res.error);
    });

  const [minWords, maxWords] = targetFor(spec, question);
  const longTurn = spec.part === 2 && question === 0;

  return (
    <div className="rise grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="flex h-[calc(100dvh-8rem)] max-h-[720px] min-h-[480px] flex-col overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-sm font-semibold">IELTS Speaking · Part {spec.part}</p>
          <p className="text-xs text-muted">
            Вопрос {Math.min(question + 1, spec.questions.length)} из {spec.questions.length}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {turns.map((t, i) => (
            <div key={i} className={clsx("flex", t.role === "student" ? "justify-end" : "justify-start")}>
              <div
                className={clsx(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                  t.role === "student" ? "rounded-br-md bg-rw text-white" : "rounded-bl-md bg-sunken",
                )}
              >
                {t.role === "examiner" && <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Examiner</p>}
                {t.text}
              </div>
            </div>
          ))}

          {spec.cueCard && question === 0 && !finished && (
            <div className="mx-auto max-w-md rounded-xl border-2 border-dashed border-ielts/40 bg-ielts-soft/50 p-4">
              <p className="font-semibold">{spec.cueCard.topic}</p>
              <p className="mt-2 text-sm text-muted">You should say:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                {spec.cueCard.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {prepLeft > 0 && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Timer className="size-4 text-ielts" /> Подготовка: <b className="tabular">{formatTime(prepLeft)}</b>
                  </span>
                  <button type="button" onClick={() => setPrepLeft(0)} className="text-xs font-medium text-muted hover:text-ink">
                    Готов раньше
                  </button>
                </div>
              )}
            </div>
          )}

          {thinking && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" /> Экзаменатор слушает…
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        {!finished ? (
          <div className="border-t border-line bg-bg/60 p-3">
            {notice && <p className="mb-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">{notice}</p>}

            {mode === "voice" ? (
              <div className="flex flex-col items-center gap-3 py-2">
                {(draft || interim) && (
                  <div className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                    {draft} <span className="text-subtle">{interim}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {recording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 rounded-full bg-danger px-5 py-3 font-semibold text-white shadow-[0_3px_0_#9b3524]"
                    >
                      <Square className="size-4" fill="currentColor" /> Стоп · <span className="tabular">{formatTime(elapsed)}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={thinking || prepLeft > 0}
                      className="flex items-center gap-2 rounded-full bg-ielts px-5 py-3 font-semibold text-white shadow-[0_3px_0_#8f3029] disabled:opacity-50"
                    >
                      <Mic className="size-5" /> {draft ? "Продолжить ответ" : "Ответить голосом"}
                    </button>
                  )}
                  {draft && !recording && (
                    <Button onClick={send} disabled={thinking}>
                      <Send className="size-4" /> Отправить
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted">
                  {longTurn ? "Говори до двух минут — запись остановится сама." : `Обычно хватает ${minWords}–${maxWords} слов.`}
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={longTurn ? 6 : 3}
                  lang="en"
                  placeholder={longTurn ? "Write your talk as you would say it…" : "Type your answer as you would say it…"}
                  aria-label="Ответ экзаменатору"
                  className="min-h-20 flex-1 resize-y rounded-xl border border-line-strong bg-surface px-3 py-2 text-[15px] outline-none focus:border-ielts"
                />
                <Button onClick={send} disabled={!draft.trim() || thinking} className="self-end" aria-label="Отправить ответ">
                  <Send className="size-4" />
                </Button>
              </div>
            )}

            {mode === "text" && (
              <p className="mt-1.5 px-1 text-xs text-muted">
                {countWords(draft)} слов · ориентир {minWords}–{maxWords}. Пиши так, как сказал бы вслух. Enter — отправить.
              </p>
            )}

            <ModeSwitch
              className="mt-3"
              label="Режим ответа"
              value={mode}
              onChange={(m) => {
                if (m === "voice" && !voiceSupported) {
                  setNotice("Этот браузер не распознаёт речь — попробуй Chrome или Edge.");
                  return;
                }
                if (recording) stopRecording();
                setNotice(null);
                setMode(m);
              }}
              options={[
                { value: "voice", icon: "🎤", label: "Говорить голосом" },
                { value: "text", icon: "⌨️", label: "Не могу говорить" },
              ]}
            />
          </div>
        ) : (
          <div className="border-t border-line p-5">
            {error && (
              <div className="mb-3">
                <ErrorNote>{error}</ErrorNote>
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" onClick={submit} disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Завершить часть
              </Button>
              {aiExaminer && !assessment && (
                <Button size="lg" variant="secondary" onClick={assess} disabled={assessing}>
                  {assessing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Оценка экзаменатора
                </Button>
              )}
            </div>
          </div>
        )}
        {!finished && error && (
          <div className="px-3 pb-3">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {finished ? (
          <section className="card p-4">
            <h2 className="text-sm font-semibold">Разбор ответов</h2>
            <ul className="mt-3 space-y-3">
              {checks.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <span className="mt-0.5 flex-none">{STATUS_ICON[c.status]}</span>
                  <span>
                    <span className="block text-[11px] uppercase tracking-wide text-subtle">{c.criterion}</span>
                    <span className="block text-sm font-medium">{c.label}</span>
                    <span className="block text-xs leading-relaxed text-muted">{c.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-subtle">
              Pronunciation по тексту оценить нельзя{mode === "voice" ? " — распознавание речи показывает только слова" : ""}.
            </p>
          </section>
        ) : (
          <section className="card p-4 text-sm">
            <h2 className="font-semibold">Как отвечать</h2>
            <ul className="mt-2 space-y-1.5 text-muted">
              <li>• Ответ → причина → пример.</li>
              <li>• Связки: because, although, for example.</li>
              <li>• Если ответ короткий, экзаменатор задаст уточняющий вопрос.</li>
            </ul>
          </section>
        )}
        {assessment && (
          <section className="rounded-xl border border-ielts/25 bg-ielts-soft/60 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ielts">
              <Sparkles className="size-4" /> Оценка экзаменатора-ИИ
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed">{assessment}</p>
          </section>
        )}
      </aside>
    </div>
  );
}
