"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronRight, Clock3, Flag, Gauge, Loader2, Search, Target, Users, X } from "lucide-react";
import { clsx } from "clsx";

import { inviteFriendAction, respondInviteAction, startCalibrationAction } from "@/actions/arena";
import type { Racer } from "@/lib/arena-rules";
import type { Invite, QueueStatus, Rating, RaceSummary } from "@/lib/race";
import { RACE_REWARD, REWARDED_RACES_PER_DAY, TRACKS, type Track } from "@/lib/race-rules";
import { Button, buttonClass, Coin, ErrorNote } from "../ui";
import { Hero } from "./hero";

function minutesSeconds(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function RaceLobby({
  me,
  ratings,
  initialTrack,
  activeRaceId,
  friends,
  invites: initialInvites,
  recent,
  highlightFriend,
}: {
  me: Racer;
  ratings: Record<Track, Rating>;
  initialTrack: Track;
  activeRaceId: string | null;
  friends: Racer[];
  invites: Invite[];
  recent: RaceSummary[];
  highlightFriend: string | null;
}) {
  const router = useRouter();
  const [track, setTrack] = useState<Track>(initialTrack);
  const [queue, setQueue] = useState<QueueStatus>({ status: "idle" });
  const [invites, setInvites] = useState(initialInvites);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  // Polls can see the new race more than once; navigate only once.
  const leaving = useRef(false);
  const goToRace = useCallback(
    (id: string) => {
      if (leaving.current) return;
      leaving.current = true;
      router.push(`/arena/race/${id}`);
    },
    [router],
  );

  // Searching: a heartbeat every 1.5 s keeps the place in the queue and picks up a match.
  useEffect(() => {
    if (queue.status !== "searching") return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch("/api/race/queue", { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) return;
        if (data.queue.status === "race") goToRace(data.queue.raceId);
        else setQueue(data.queue);
      } catch {
        /* the next heartbeat retries */
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [queue.status, goToRace]);

  // Invitations and a race started by a friend accepting one.
  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/race/lobby", { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) return;
        if (data.raceId) goToRace(data.raceId);
        setInvites(data.invites);
      } catch {
        /* retry on the next tick */
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [goToRace]);

  // Leaving the page cancels the search.
  useEffect(() => {
    if (queue.status !== "searching") return;
    const cancel = () => navigator.sendBeacon?.("/api/race/queue?cancel=1");
    window.addEventListener("pagehide", cancel);
    return () => window.removeEventListener("pagehide", cancel);
  }, [queue.status]);

  const search = async () => {
    setError(null);
    setBusy("search");
    try {
      const res = await fetch("/api/race/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track }) });
      const data = await res.json();
      if (!data.ok) setError(data.error);
      else if (data.queue.status === "race") goToRace(data.queue.raceId);
      else setQueue(data.queue);
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    await fetch("/api/race/queue", { method: "DELETE" });
    setQueue({ status: "idle" });
  };

  const rating = ratings[track];
  const needsCalibration = !rating.calibrated && rating.games === 0;
  const incoming = invites.filter((i) => i.toId === me.userId);
  const outgoing = invites.filter((i) => i.fromId === me.userId);

  return (
    <div className="space-y-6">
      {activeRaceId && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3">
          <Flag className="size-5 text-accent" />
          <p className="flex-1 text-sm font-medium">У тебя есть незавершённое соревнование.</p>
          <Link href={`/arena/race/${activeRaceId}`} className={buttonClass("primary", "sm")}>
            Вернуться в гонку
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="card self-start overflow-hidden">
          <div className="bg-gradient-to-b from-sunken to-surface px-4 pt-3">
            <Hero look={me.look} outfit={me.outfit} scene className="mx-auto block h-64 w-full max-w-64" label="Твой герой" />
          </div>
          <div className="p-5">
            <p className="text-lg font-semibold">{me.name}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {TRACKS.map((t) => (
                <div key={t.id} className="rounded-lg bg-sunken px-3 py-2">
                  <p className="text-[11px] text-muted">Рейтинг {t.name}</p>
                  <p className="tabular text-lg font-semibold">{ratings[t.id].rating}</p>
                  <p className="text-[11px] text-muted">
                    {ratings[t.id].games} соревн. · {ratings[t.id].wins} побед
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Аксессуары только украшают героя: на скорость, сложность вопросов и рейтинг они не влияют.</p>
            <div className="mt-3 flex gap-2">
              <Link href="/arena/shop" className={buttonClass("secondary", "sm")}>
                Магазин
              </Link>
              <Link href="/arena/wardrobe" className={buttonClass("secondary", "sm")}>
                Гардероб
              </Link>
            </div>
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          <section className="card p-5">
            <h2 className="text-[15px] font-semibold">Новое соревнование</h2>
            <p className="mt-1 text-sm text-muted">
              Оба участника одновременно получают один и тот же вопрос. Кто первым ответит верно — продвигается на клетку. Побеждает тот, кто первым пройдёт пять клеток.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Направление">
              {TRACKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={track === t.id}
                  disabled={queue.status === "searching"}
                  onClick={() => setTrack(t.id)}
                  className={clsx(
                    "rounded-xl border p-4 text-left transition",
                    track === t.id ? "border-accent bg-accent-soft/60 ring-2 ring-accent/30" : "border-line hover:bg-sunken",
                  )}
                >
                  <p className="text-lg font-bold">{t.name}</p>
                  <p className="text-sm text-muted">{t.sections}</p>
                  <p className="tabular mt-2 text-sm">
                    Рейтинг <span className="font-semibold">{ratings[t.id].rating}</span>
                    {!ratings[t.id].calibrated && ratings[t.id].games === 0 && <span className="ml-2 text-xs text-warn">калибровка не пройдена</span>}
                  </p>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4">
                <ErrorNote>{error}</ErrorNote>
              </div>
            )}

            {queue.status === "searching" ? (
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-sunken p-4" role="status">
                <Loader2 className="size-6 animate-spin text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Ищем соперника {queue.track.toUpperCase()}…</p>
                  <p className="tabular text-sm text-muted">
                    <Clock3 className="mr-1 inline size-3.5" />
                    {minutesSeconds(queue.waitedMs)} · рейтинг {queue.rating} ± {queue.window}
                    {queue.window > 100 && " (диапазон расширяется)"}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={cancel}>
                  <X className="size-4" /> Отменить поиск
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button onClick={search} disabled={busy !== null || activeRaceId !== null}>
                  {busy === "search" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  Найти соперника
                </Button>
                {needsCalibration && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      start(async () => {
                        setBusy("calibrate");
                        const res = await startCalibrationAction(track);
                        setBusy(null);
                        if (!res.ok) setError(res.error ?? "Не получилось начать калибровку.");
                      })
                    }
                    disabled={busy !== null}
                  >
                    {busy === "calibrate" ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
                    Пройти калибровку
                  </Button>
                )}
              </div>
            )}
            {needsCalibration && queue.status !== "searching" && (
              <p className="mt-2 text-xs text-muted">
                Калибровка — 6 вопросов от простых к сложным, без соперника. По ней мы сразу подберём тебе рейтинг и соперников твоего уровня. Без неё старт с {rating.rating}.
              </p>
            )}
            <p className="mt-3 text-xs text-muted">
              Соперника подбираем с близким рейтингом: сначала ±100, при долгом поиске диапазон расширяется до ±400. Сложность вопросов зависит от рейтинга обоих. Монеты: победа +{RACE_REWARD.win}, ничья +{RACE_REWARD.draw}, участие +
              {RACE_REWARD.loss} (первые {REWARDED_RACES_PER_DAY} соревнований в день).
            </p>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-accent" />
              <h2 className="text-[15px] font-semibold">Дружеский матч</h2>
            </div>
            <p className="mt-1 text-sm text-muted">Пригласи друга на {track.toUpperCase()}. Рейтинг в дружеских матчах не меняется. Приглашение действует 10 минут.</p>
            {notice && <p className="mt-2 text-sm text-accent">{notice}</p>}

            {incoming.length > 0 && (
              <ul className="mt-3 space-y-2">
                {incoming.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-line bg-accent-soft/50 px-3 py-2">
                    <Target className="size-4 text-accent" />
                    <span className="flex-1 text-sm">
                      <span className="font-medium">{i.fromName}</span> зовёт на дружеский матч {i.track.toUpperCase()}
                    </span>
                    <Button
                      size="sm"
                      disabled={busy !== null}
                      onClick={() =>
                        start(async () => {
                          setBusy(i.id);
                          const res = await respondInviteAction(i.id, "accept");
                          setBusy(null);
                          if (!res.ok) setError(res.error ?? "Не получилось.");
                        })
                      }
                    >
                      {busy === i.id && <Loader2 className="size-3.5 animate-spin" />}
                      Принять
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => start(async () => void (await respondInviteAction(i.id, "decline"), router.refresh()))}>
                      Отклонить
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {friends.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Пока нет друзей.{" "}
                <Link href="/friends" className="font-medium text-accent hover:underline">
                  Добавить друга
                </Link>
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {friends.map((f) => {
                  const pending = outgoing.find((i) => i.toId === f.userId);
                  return (
                    <li key={f.userId} className={clsx("flex items-center gap-3 py-2.5", highlightFriend === f.userId && "-mx-2 rounded-lg bg-accent-soft/60 px-2")}>
                      <span className="grid size-11 flex-none place-items-center overflow-hidden rounded-xl bg-sunken">
                        <Hero look={f.look} outfit={f.outfit} crop="bust" still className="size-11" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span>
                      {pending ? (
                        <Button size="sm" variant="ghost" onClick={() => start(async () => void (await respondInviteAction(pending.id, "cancel"), router.refresh()))}>
                          Ждём ответа · отменить
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={highlightFriend === f.userId ? "primary" : "secondary"}
                          disabled={busy !== null}
                          onClick={() =>
                            start(async () => {
                              setBusy(f.userId);
                              setError(null);
                              const res = await inviteFriendAction(f.userId, track);
                              setBusy(null);
                              if (res.ok) {
                                setNotice(`Приглашение отправлено: ${f.name}. Как только друг примет его, гонка начнётся.`);
                                router.refresh();
                              } else setError(res.error ?? "Не получилось пригласить.");
                            })
                          }
                        >
                          {busy === f.userId ? <Loader2 className="size-3.5 animate-spin" /> : <Flag className="size-3.5" />}
                          Пригласить
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-[15px] font-semibold">Последние соревнования</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Соревнований пока не было.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link href={`/arena/race/${r.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-sunken">
                      <span className={clsx("w-20 flex-none text-xs font-bold uppercase", r.result === "win" ? "text-accent" : r.result === "loss" ? "text-danger" : "text-muted")}>
                        {r.result === "win" ? "Победа" : r.result === "loss" ? "Поражение" : "Ничья"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {r.track.toUpperCase()} · {r.opponentName} · {r.score[0]}:{r.score[1]}
                      </span>
                      <span className={clsx("tabular w-12 flex-none text-right text-xs font-semibold", r.mode !== "rated" ? "text-muted" : r.delta >= 0 ? "text-accent" : "text-danger")}>
                        {r.mode === "rated" ? `${r.delta >= 0 ? "+" : ""}${r.delta}` : "друж."}
                      </span>
                      <span className="tabular flex w-12 flex-none items-center justify-end gap-1 text-xs text-muted">
                        <Coin className="size-3.5" />+{r.coins}
                      </span>
                      <ChevronRight className="size-4 flex-none text-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
