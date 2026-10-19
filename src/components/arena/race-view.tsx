"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, Flag, Headphones, Loader2, LogOut, Play, RotateCcw, Trophy, X } from "lucide-react";
import { clsx } from "clsx";

import type { Question } from "@/content/types";
import type { Response } from "@/lib/answers";
import { CELLS } from "@/lib/race-rules";
import type { Racer } from "@/lib/arena-rules";
import type { RaceView as RawView, RacerView, ReviewRound } from "@/lib/race";
import type { PublicQuestion } from "@/lib/race-tasks";
import { QuestionView } from "../question-view";
import { RichText } from "../rich-text";
import { Button, buttonClass, Coin, ErrorNote } from "../ui";
import { Hero, type Mood } from "./hero";

const POLL_MS = 900;
const LEVEL_NAMES = { easy: "простой", medium: "средний", hard: "сложный" } as const;
type FullRacer = RacerView & Racer;
/** The polled state with names and looks from the first load. */
type View = Omit<RawView, "me" | "opp"> & { me: FullRacer; opp: FullRacer };

function withRacers(raw: RawView, racers: { me: Racer; opp: Racer }): View {
  return { ...raw, me: { ...racers.me, ...raw.me }, opp: { ...racers.opp, ...raw.opp } };
}

/** Why the race ended, from the viewer's side. */
function reasonText(view: View): string {
  const me = view.winner === "me";
  const opp = view.opp.name;
  switch (view.reason) {
    case "finish":
      return me ? "Ты первым прошёл все пять клеток" : `${opp} первым прошёл(а) все пять клеток`;
    case "forfeit":
      return me ? "Соперник вышел из гонки" : "Ты вышел из гонки";
    case "disconnect":
      return me ? "Соперник потерял соединение больше чем на минуту" : "Ты был не на связи больше минуты";
    case "time":
    case "rounds":
      return view.winner === "none" ? "Время соревнования вышло, вы шли вровень" : "Время соревнования вышло — побеждает тот, кто дальше";
    default:
      return "";
  }
}

/** QuestionView needs a full question; the answer is never on the client, so a placeholder stands in. */
function asQuestion(q: PublicQuestion): Question {
  const base = { prompt: q.prompt, passages: q.passages, table: q.table, explanation: "" };
  return q.kind === "choice" ? { ...base, kind: "choice", options: q.options ?? [], answer: -1 } : { ...base, kind: "input", answers: [q.numeric ? "0" : "x"] };
}

function useServerClock(serverNow: number) {
  const offset = useRef(0);
  useEffect(() => {
    offset.current = serverNow - Date.now();
  }, [serverNow]);
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 200);
    return () => window.clearInterval(t);
  }, []);
  return () => Date.now() + offset.current;
}

// ------------------------------------------------------------- the track --

function Lane({ racer, mood, me, flip }: { racer: FullRacer; mood: Mood; me: boolean; flip: boolean }) {
  // Column 0 is the start, 1–5 the cells, 6 the finish line.
  const col = racer.pos >= CELLS ? CELLS + 1 : racer.pos;
  const cols = CELLS + 2;
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 flex-none text-right sm:w-32">
        <p className="truncate text-sm font-semibold">{me ? "Ты" : racer.name}</p>
        <p className="tabular text-xs text-muted">{racer.rating}</p>
      </div>
      <div className="relative h-16 min-w-0 flex-1 sm:h-20">
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-sunken" />
        <div className="absolute inset-0 grid items-center" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          <span className="justify-self-center rounded-md bg-surface px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-muted shadow-card sm:px-1.5 sm:text-[10px]">Старт</span>
          {Array.from({ length: CELLS }, (_, i) => (
            <span
              key={i}
              className={clsx(
                "tabular grid size-7 justify-self-center rounded-full border-2 text-[11px] font-bold transition-colors duration-500 place-items-center sm:size-10 sm:text-xs",
                i < racer.pos ? (me ? "border-accent bg-accent text-white" : "border-rw bg-rw text-white") : "border-line-strong bg-surface text-muted",
              )}
            >
              {i + 1}
            </span>
          ))}
          <span className="grid justify-self-center place-items-center text-ink" aria-label="Финиш">
            <Flag className="size-5 sm:size-6" />
            <span className="hidden text-[10px] font-bold uppercase tracking-wide sm:block">Финиш</span>
          </span>
        </div>
        <div
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-[62%] transition-[left] duration-700 ease-out"
          style={{ left: `${((col + 0.5) / cols) * 100}%` }}
        >
          <Hero look={racer.look} outfit={racer.outfit} mood={mood} crop="bust" flip={flip} className="size-11 drop-shadow sm:size-16" label={`${racer.name}: клетка ${racer.pos}`} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- listening --

function AudioPlayer({ src, plays, context, roundNo }: { src: string; plays: number; context: string; roundNo: number }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [used, setUsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const left = plays - used;

  // A listen counts only once the recording really starts.
  const play = async () => {
    const el = audio.current;
    if (!el || left <= 0 || playing) return;
    setFailed(false);
    el.currentTime = 0;
    try {
      await el.play();
      setPlaying(true);
      setUsed((u) => u + 1);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-sunken px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Headphones className="size-5 text-ielts" />
        <p className="min-w-0 flex-1 text-sm">{context}</p>
        <audio key={roundNo} ref={audio} src={src} preload="auto" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
        <Button size="sm" variant="secondary" disabled={left <= 0 || playing} onClick={play}>
          {playing ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
          {playing ? "Звучит…" : left > 0 ? `Слушать (${left} из ${plays})` : "Прослушано"}
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-muted">Запись можно прослушать {plays} раза — так же, как сопернику. Время на ответ учитывает длину записи.</p>
      {failed && <p className="mt-1 text-xs text-danger">Не удалось включить звук. Проверь громкость и нажми ещё раз — попытка не потрачена.</p>}
    </div>
  );
}

// ---------------------------------------------------------------- review --

function ReviewItem({ r, oppName }: { r: ReviewRound; oppName: string }) {
  const answer = (a: ReviewRound["me"], who: string) => (
    <p className={clsx("flex items-start gap-1.5 text-sm", !a ? "text-muted" : a.correct ? "text-accent" : "text-danger")}>
      {a ? a.correct ? <Check className="mt-0.5 size-4 flex-none" /> : <X className="mt-0.5 size-4 flex-none" /> : <Clock3 className="mt-0.5 size-4 flex-none" />}
      <span>
        <span className="font-medium text-ink">{who}:</span> {a ? `${a.answer} · ${a.seconds} с` : "не ответил(а)"}
      </span>
    </p>
  );
  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold">Раунд {r.no}</span>
        <span className="rounded-full bg-sunken px-2 py-0.5 text-muted">{r.section}</span>
        <span className="rounded-full bg-sunken px-2 py-0.5 text-muted">{r.topic}</span>
        <span className="rounded-full bg-sunken px-2 py-0.5 text-muted">{LEVEL_NAMES[r.level]}</span>
        <span className={clsx("ml-auto font-semibold", r.winner === "me" ? "text-accent" : r.winner === "opp" ? "text-rw" : "text-muted")}>
          {r.winner === "me" ? "Клетка твоя" : r.winner === "opp" ? `Клетка у соперника` : "Без продвижения"}
        </span>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-medium">{r.prompt.split("\n").pop()}</summary>
        <div className="mt-2 space-y-2">
          {r.passages?.map((p, i) => (
            <div key={i} className="max-h-48 overflow-y-auto rounded-lg bg-sunken px-3 py-2 text-sm">
              <RichText text={p.text} />
            </div>
          ))}
          <p className="whitespace-pre-line text-sm">{r.prompt}</p>
          {r.options && (
            <ol className="list-[upper-alpha] pl-5 text-sm text-muted">
              {r.options.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ol>
          )}
        </div>
      </details>
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {answer(r.me, "Ты")}
        {answer(r.opp, oppName)}
      </div>
      <p className="mt-2 text-sm">
        <span className="font-semibold">Правильный ответ:</span> {r.correctAnswer}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm text-muted">{r.explanation}</p>
    </li>
  );
}

function Results({ view }: { view: View }) {
  const { me, opp } = view;
  const result = view.winner === "me" ? "win" : view.winner === "opp" ? "loss" : "draw";
  return (
    <div className="space-y-4">
      <section className="card overflow-hidden">
        <div className="grid items-center gap-4 p-5 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="mx-auto w-44 overflow-hidden rounded-2xl">
            <Hero look={me.look} outfit={me.outfit} mood={result === "win" ? "win" : result === "loss" ? "lose" : "idle"} scene className="h-auto w-full" />
          </div>
          <div className="text-center sm:text-left">
            <p className={clsx("text-2xl font-bold", result === "win" ? "text-accent" : result === "loss" ? "text-danger" : "text-ink")}>
              {result === "win" ? "Победа!" : result === "loss" ? "Соперник финишировал первым" : "Ничья"}
            </p>
            <p className="text-sm text-muted">
              {reasonText(view)} · счёт {me.pos} : {opp.pos}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-md sm:grid-cols-3">
              <div className="rounded-lg bg-sunken px-3 py-2">
                <p className="text-[11px] text-muted">Рейтинг {view.track.toUpperCase()}</p>
                {view.mode === "rated" ? (
                  <p className="tabular text-sm font-semibold">
                    {me.rating} → {Math.max(100, me.rating + me.delta)}{" "}
                    <span className={me.delta >= 0 ? "text-accent" : "text-danger"}>
                      ({me.delta >= 0 ? "+" : ""}
                      {me.delta})
                    </span>
                  </p>
                ) : (
                  <p className="text-sm font-semibold">не меняется</p>
                )}
              </div>
              <div className="rounded-lg bg-sunken px-3 py-2">
                <p className="text-[11px] text-muted">Соперник</p>
                <p className="tabular text-sm font-semibold">
                  {opp.rating}
                  {view.mode === "rated" && (
                    <span className={opp.delta >= 0 ? "text-accent" : "text-danger"}>
                      {" "}
                      ({opp.delta >= 0 ? "+" : ""}
                      {opp.delta})
                    </span>
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-sunken px-3 py-2">
                <p className="text-[11px] text-muted">Монеты</p>
                <p className="flex items-center gap-1 text-sm font-semibold">
                  <Coin className="size-4" /> +{me.coins}
                </p>
              </div>
            </div>
            {view.mode === "friendly" && <p className="mt-2 text-xs text-muted">Дружеский матч: рейтинг не меняется.</p>}
            {me.coins === 0 && (
              <p className="mt-2 text-xs text-muted">
                {view.reason === "forfeit" || view.reason === "disconnect"
                  ? "Если соревнование прервано в первых раундах или ты вышел сам, монеты не начисляются."
                  : "Монеты дают первые 5 соревнований в день."}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Link href={`/arena?track=${view.track}`} className={buttonClass("primary", "sm")}>
                <RotateCcw className="size-4" /> Ещё соревнование
              </Link>
              <Link href="/arena" className={buttonClass("secondary", "sm")}>
                В лобби
              </Link>
            </div>
          </div>
        </div>
      </section>

      {view.topics && view.topics.length > 0 && (
        <section className="card p-5">
          <h2 className="text-[15px] font-semibold">Что стоит повторить</h2>
          <p className="mt-1 text-sm text-muted">Темы вопросов, где ты ошибся или не успел ответить.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {view.topics.map((t) => (
              <li key={t} className="rounded-full bg-warn-soft px-3 py-1 text-sm text-warn">
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <h2 className="text-[15px] font-semibold">Разбор вопросов</h2>
        <p className="mt-1 text-sm text-muted">Ответы обоих участников, время ответа и объяснение.</p>
        <ol className="mt-3 space-y-3">
          {view.review?.map((r) => <ReviewItem key={r.no} r={r} oppName={opp.name} />)}
        </ol>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ race --

export function RaceView({ initial }: { initial: RawView }) {
  const [raw, setRaw] = useState(initial);
  const [racers] = useState(initial.racers!);
  const view = withRacers(raw, racers);
  const [response, setResponse] = useState<Response | null>(null);
  const [responseRound, setResponseRound] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const now = useServerClock(view.serverNow);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/race/${initial.id}?racers=0`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setRaw(data.race);
        setOffline(false);
      }
    } catch {
      setOffline(true);
    }
  }, [initial.id]);

  useEffect(() => {
    if (view.status === "finished") return;
    const timer = window.setInterval(refresh, POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, [refresh, view.status]);

  const round = view.round;
  const roundNo = round?.no ?? 0;
  const current = responseRound === roundNo ? response : null;

  const send = async () => {
    if (!round || current === null) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/race/${view.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", round: round.no, response: current }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error);
      await refresh();
    } catch {
      setError("Нет связи. Ответ не отправлен — попробуй ещё раз.");
    } finally {
      setSending(false);
    }
  };

  const leave = async () => {
    await fetch(`/api/race/${view.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "forfeit" }) });
    setConfirmLeave(false);
    await refresh();
  };

  const t = now();
  const finished = view.status === "finished";
  const lastFresh = !finished && round?.phase === "countdown" && view.last !== null && view.last.no === roundNo - 1;
  const moodOf = (who: "me" | "opp"): Mood => {
    if (finished) return view.winner === who ? "win" : view.winner === null || view.winner === "none" ? "idle" : "lose";
    if (lastFresh && view.last) {
      if (view.last.winner === who) return "run";
      const wrong = who === "me" ? view.last.myCorrect === false : view.last.oppCorrect === false;
      return wrong ? "wrong" : "idle";
    }
    if (round?.phase === "open") {
      if (who === "me" && round.myAnswer) return round.myAnswer.correct ? "correct" : "wrong";
      return "think";
    }
    return "idle";
  };

  const secondsLeft = round?.deadlineMs ? Math.max(0, Math.ceil((round.deadlineMs - t) / 1000)) : null;
  const timeShare = round?.deadlineMs ? Math.max(0, Math.min(1, (round.deadlineMs - t) / round.timeMs)) : 1;
  const countdown = round?.phase === "countdown" ? Math.max(0, Math.ceil((round.opensMs - t) / 1000)) : null;
  const raceLeft = Math.max(0, Math.ceil((view.endsMs - t) / 60000));
  const timeUp = round?.phase === "open" && secondsLeft === 0 && !round.myAnswer;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">{view.track.toUpperCase()}</span>
        <span className="rounded-md bg-sunken px-2 py-1 text-xs font-semibold text-muted">{view.mode === "rated" ? "Рейтинговое соревнование" : "Дружеский матч · без рейтинга"}</span>
        {!finished && (
          <>
            <span className="text-xs text-muted">Раунд {roundNo}</span>
            <span className="text-xs text-muted">· до конца соревнования не больше {raceLeft} мин</span>
            {offline && <span className="rounded-md bg-danger-soft px-2 py-1 text-xs font-semibold text-danger">Нет связи — переподключаемся…</span>}
            <span className="flex-1" />
            {confirmLeave ? (
              <span className="flex items-center gap-2 text-sm">
                Выйти? Соперник получит победу.
                <Button size="sm" variant="danger" onClick={leave}>
                  Выйти
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmLeave(false)}>
                  Остаться
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmLeave(true)}>
                <LogOut className="size-4" /> Выйти из гонки
              </Button>
            )}
          </>
        )}
      </div>

      <section className="card space-y-3 p-4 sm:p-5" aria-label="Дорожки соревнования">
        <Lane racer={view.me} mood={moodOf("me")} me flip={false} />
        <Lane racer={view.opp} mood={moodOf("opp")} me={false} flip={false} />
      </section>

      {finished ? (
        <Results view={view} />
      ) : (
        <section className="card p-5" aria-live="polite">
          {round?.phase === "countdown" && (
            <div className="py-6 text-center">
              {lastFresh && view.last ? (
                <div className="rise mb-4">
                  <p className={clsx("text-xl font-bold", view.last.winner === "me" ? "text-accent" : view.last.winner === "opp" ? "text-rw" : "text-ink")}>
                    {view.last.winner === "me" ? "Ты ответил первым — +1 клетка!" : view.last.winner === "opp" ? `${view.opp.name} ответил первым` : "Никто не ответил верно — раунд без продвижения"}
                  </p>
                  <p className="mt-1 text-sm text-muted">Правильный ответ: {view.last.correctAnswer}</p>
                </div>
              ) : (
                <p className="mb-2 text-lg font-semibold">Соперник найден: {view.opp.name}</p>
              )}
              <p className="text-sm text-muted">
                {roundNo === 1 ? "Первый вопрос" : `Раунд ${roundNo}`} · {round.section} · через{" "}
                <span className="tabular text-2xl font-bold text-ink">{countdown}</span>
              </p>
            </div>
          )}

          {round?.phase === "open" && round.question && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-sunken px-2 py-0.5 font-semibold">{round.section}</span>
                <span className="rounded-full bg-sunken px-2 py-0.5 text-muted">{round.topic}</span>
                <span className="rounded-full bg-sunken px-2 py-0.5 text-muted">{LEVEL_NAMES[round.level]}</span>
                <span className="flex-1" />
                <span className={clsx("tabular text-base font-bold", (secondsLeft ?? 99) <= 10 ? "text-danger" : "text-ink")}>
                  <Clock3 className="mr-1 inline size-4" />
                  {secondsLeft} с
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${timeShare * 100}%`, background: timeShare < 0.2 ? "var(--danger)" : undefined }} />
              </div>
              {round.audio && <AudioPlayer src={round.audio.src} plays={round.audio.plays} context={round.audio.context} roundNo={round.no} />}

              <QuestionView
                key={round.no}
                question={asQuestion(round.question)}
                response={current}
                onRespond={(r) => {
                  setResponse(r);
                  setResponseRound(round.no);
                }}
                checked={false}
                disabled={round.myAnswer !== null || timeUp || sending}
              />

              {error && <ErrorNote>{error}</ErrorNote>}

              <div className="flex flex-wrap items-center gap-3">
                {round.myAnswer ? (
                  round.myAnswer.correct ? (
                    <p className="flex items-center gap-1.5 font-semibold text-accent">
                      <Check className="size-5" /> Верно! Проверяем, не ответил ли соперник быстрее…
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 font-semibold text-danger">
                      <X className="size-5" /> Неверно. Следующая попытка — в новом вопросе.
                    </p>
                  )
                ) : timeUp ? (
                  <p className="font-semibold text-muted">Время вышло — ждём окончания раунда.</p>
                ) : (
                  <Button onClick={send} disabled={current === null || current === "" || sending}>
                    {sending && <Loader2 className="size-4 animate-spin" />}
                    Ответить
                  </Button>
                )}
                <span className="text-sm text-muted">{round.oppAnswered ? `${view.opp.name} уже ответил(а)` : `${view.opp.name} думает…`}</span>
              </div>
            </div>
          )}

          {!round && (
            <p className="flex items-center gap-2 py-6 text-muted">
              <Trophy className="size-4" /> Подводим итоги…
            </p>
          )}
        </section>
      )}
    </div>
  );
}
