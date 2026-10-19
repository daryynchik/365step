"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FastForward, RotateCcw, Shield, Swords, Zap } from "lucide-react";
import { clsx } from "clsx";

import { itemName, speciesById, type Fighter, type FightResult } from "@/lib/arena-rules";
import { Button, buttonClass, Coin } from "../ui";
import { Hero, type Mood } from "./hero";

const HIT_MS = 1000;
const START_DELAY_MS = 800;
/** Share of a hit's time at which the blow lands. */
const IMPACT = 0.42;
const SETTLE = 0.85;

interface Popup {
  id: number;
  side: 0 | 1;
  text: string;
  kind: "hit" | "crit" | "block" | "miss";
}

interface Frame {
  /** Hits that have already landed. */
  shown: number;
  moods: [Mood, Mood];
  finished: boolean;
}

function frameAt(elapsed: number, fight: FightResult): Frame {
  const idle: [Mood, Mood] = ["idle", "idle"];
  if (elapsed < 0) return { shown: 0, moods: idle, finished: false };
  const index = Math.floor(elapsed / HIT_MS);
  if (index >= fight.hits.length) {
    const moods: [Mood, Mood] =
      fight.winner === null ? ["idle", "idle"] : fight.winner === 0 ? ["win", "lose"] : ["lose", "win"];
    return { shown: fight.hits.length, moods, finished: true };
  }
  const hit = fight.hits[index];
  const p = (elapsed - index * HIT_MS) / HIT_MS;
  const moods: [Mood, Mood] = ["idle", "idle"];
  const target = hit.by === 0 ? 1 : 0;
  if (p < SETTLE) moods[hit.by] = "attack";
  if (p >= IMPACT && p < SETTLE) moods[target] = hit.miss ? "dodge" : hit.blocked ? "block" : "hit";
  return { shown: p >= IMPACT ? index + 1 : index, moods, finished: false };
}

export function DuelReplay({
  attacker,
  defender,
  fight,
  meIndex,
  myPoints,
  opponentId,
}: {
  attacker: Fighter;
  defender: Fighter;
  fight: FightResult;
  /** Which side the viewer is on. */
  meIndex: 0 | 1;
  myPoints: number;
  opponentId: string;
}) {
  const [frame, setFrame] = useState<Frame>({ shown: 0, moods: ["idle", "idle"], finished: false });
  const [popups, setPopups] = useState<Popup[]>([]);
  const [speed, setSpeed] = useState(1);
  const [run, setRun] = useState(0); // bump to replay
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let elapsed = -START_DELAY_MS;
    let last = performance.now();
    let raf = 0;
    let shown = -1;
    let key = "";
    const tick = (now: number) => {
      elapsed += (now - last) * speedRef.current;
      last = now;
      const next = frameAt(elapsed, fight);
      const nextKey = `${next.shown}|${next.moods.join()}|${next.finished}`;
      if (nextKey !== key) {
        key = nextKey;
        setFrame(next);
      }
      if (next.shown > shown && next.shown > 0 && !next.finished) {
        for (let i = Math.max(shown, 0); i < next.shown; i++) {
          const hit = fight.hits[i];
          setPopups((prev) => [
            ...prev.slice(-4),
            {
              id: i + run * 1000,
              side: hit.by === 0 ? 1 : 0,
              text: hit.miss ? "мимо" : hit.blocked ? `−${hit.damage} блок` : hit.crit ? `−${hit.damage}!` : `−${hit.damage}`,
              kind: hit.miss ? "miss" : hit.blocked ? "block" : hit.crit ? "crit" : "hit",
            },
          ]);
        }
      }
      shown = Math.max(shown, next.shown);
      if (!next.finished) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame((now) => {
      last = now;
      setPopups([]);
      tick(now);
    });
    return () => cancelAnimationFrame(raf);
  }, [fight, run]);

  const { shown, moods, finished } = frame;
  const lastHit = shown > 0 ? fight.hits[shown - 1] : null;
  const hp: [number, number] = lastHit ? lastHit.hp : [fight.maxHp[0], fight.maxHp[1]];
  const fighters = [attacker, defender] as const;
  const outcome = fight.winner === null ? "draw" : fight.winner === meIndex ? "win" : "loss";

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden" style={{ "--speed": speed } as React.CSSProperties}>
        <div className="absolute inset-x-0 top-0 z-10 grid grid-cols-2 gap-4 p-4">
          {fighters.map((f, i) => (
            <div key={f.userId} className={clsx("min-w-0", i === 1 && "text-right")}>
              <div className={clsx("flex items-center gap-2", i === 1 && "flex-row-reverse")}>
                <span className="truncate text-sm font-semibold">
                  {f.name}
                  {i === meIndex ? " (ты)" : ""}
                </span>
                <span className="flex-none text-xs text-muted">{speciesById(f.look.species)?.name}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-sunken ring-1 ring-line">
                <div
                  className={clsx("h-full rounded-full transition-[width] duration-300", i === 1 && "ml-auto")}
                  style={{
                    width: `${(hp[i] / fight.maxHp[i]) * 100}%`,
                    background: hp[i] / fight.maxHp[i] > 0.35 ? "var(--accent)" : "var(--danger)",
                  }}
                />
              </div>
              <p className="tabular mt-1 text-xs text-muted">
                {hp[i]} / {fight.maxHp[i]}
              </p>
            </div>
          ))}
        </div>

        <div
          className="arena-stage relative h-[300px] sm:h-[420px]"
          aria-label={`Бой: ${attacker.name} против ${defender.name}`}
          role="img"
        >
          <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-[#ece6da] to-[#e0d8c8]" />
          <div className="absolute inset-x-[8%] bottom-[22%] h-6 rounded-[50%] bg-[#d6cdbb]/70 blur-[2px]" />
          {fighters.map((f, i) => (
            <div
              key={f.userId}
              className={clsx("absolute bottom-[10%] w-[44%] max-w-[300px]", i === 0 ? "left-[4%] sm:left-[10%]" : "right-[4%] sm:right-[10%]")}
            >
              <Hero look={f.look} gear={f.gear} mood={moods[i]} flip={i === 1} className="h-auto w-full" label={`${f.name}: ${speciesById(f.look.species)?.name}`} />
            </div>
          ))}
        </div>

        {popups.map((p) => (
          <span
            key={p.id}
            className={clsx(
              "pointer-events-none absolute top-[20%] z-10 animate-[floatup_900ms_ease-out_forwards] text-2xl font-black [text-shadow:0_2px_0_#fff,0_-2px_0_#fff,2px_0_0_#fff,-2px_0_0_#fff]",
              p.side === 0 ? "left-[22%] sm:left-[26%]" : "right-[22%] sm:right-[26%]",
              p.kind === "crit" ? "text-danger" : p.kind === "block" ? "text-rw" : p.kind === "miss" ? "text-subtle" : "text-ink",
            )}
          >
            {p.text}
          </span>
        ))}

        {finished && (
          <div className="rise flex flex-col items-center gap-3 border-t border-line px-5 py-4 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <p className={clsx("text-xl font-bold", outcome === "win" ? "text-accent" : outcome === "loss" ? "text-danger" : "text-ink")}>
                {outcome === "win" ? "Победа!" : outcome === "loss" ? "Поражение" : "Ничья"}
              </p>
              <p className="flex items-center justify-center gap-1 text-sm text-muted sm:justify-start">
                {myPoints > 0 ? (
                  <>
                    <Coin className="size-4" /> +{myPoints} очков
                  </>
                ) : (
                  "Очки за бой начисляются за первые 5 боёв в день."
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRun((r) => r + 1)}>
                <RotateCcw className="size-4" /> Повтор
              </Button>
              <Link href={`/arena?opponent=${opponentId}`} className={buttonClass("primary", "sm")}>
                <Swords className="size-4" /> Реванш
              </Link>
            </div>
          </div>
        )}

        {!finished && (
          <button
            type="button"
            onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
            className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-ink"
          >
            <FastForward className="size-3.5" /> ×{speed}
          </button>
        )}
      </div>

      <section className="card p-5">
        <h2 className="text-[15px] font-semibold">Ход боя</h2>
        <div className="mt-2 grid gap-3 text-xs text-muted sm:grid-cols-2">
          {fighters.map((f) => (
            <p key={f.userId}>
              <span className="font-medium text-ink">{f.name}:</span> {itemName("sword", f.gear.sword)} (ур. {f.gear.sword}),{" "}
              {itemName("helmet", f.gear.helmet).toLowerCase()} (ур. {f.gear.helmet}), {itemName("armor", f.gear.armor).toLowerCase()} (ур. {f.gear.armor})
            </p>
          ))}
        </div>
        <ol className="tabular mt-4 max-h-64 space-y-1 overflow-y-auto text-sm">
          {fight.hits.slice(0, shown).map((h, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-6 text-right text-xs text-subtle">{i + 1}</span>
              {h.crit ? <Zap className="size-3.5 text-danger" /> : h.blocked ? <Shield className="size-3.5 text-rw" /> : <Swords className="size-3.5 text-subtle" />}
              {h.miss ? (
                <span>
                  <span className="font-medium">{fighters[h.by].name}</span> промахивается
                </span>
              ) : (
                <span>
                  <span className="font-medium">{fighters[h.by].name}</span>{" "}
                  {h.crit ? "наносит критический удар" : h.blocked ? "попадает в блок" : "попадает"} —{" "}
                  <span className="font-semibold">{h.damage}</span>
                </span>
              )}
            </li>
          ))}
          {shown === 0 && <li className="text-muted">Бой начинается…</li>}
        </ol>
      </section>
    </div>
  );
}
