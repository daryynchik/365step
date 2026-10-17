"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FastForward, RotateCcw, Shield, Swords, Zap } from "lucide-react";
import { clsx } from "clsx";

import type { Fighter, FightResult } from "@/lib/arena-rules";
import { item } from "@/lib/arena-rules";
import { Avatar, Button, buttonClass, Coin } from "../ui";
import { buildFighter, createStage, type FighterRig } from "./fighter-model";

const HIT_MS = 950;
const START_DELAY_MS = 700;
const FINISH_MS = 1100;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

interface Popup {
  id: number;
  side: 0 | 1;
  text: string;
  kind: "hit" | "crit" | "block" | "miss";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState(0); // hits already landed
  const [finished, setFinished] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [speed, setSpeed] = useState(1);
  const [run, setRun] = useState(0); // bump to replay

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const onImpact = useCallback(
    (index: number) => {
      const hit = fight.hits[index];
      const side = hit.by === 0 ? 1 : 0;
      setShown(index + 1);
      setPopups((prev) => [
        ...prev.slice(-4),
        {
          id: index + run * 1000,
          side,
          text: hit.miss ? "мимо" : hit.blocked ? `−${hit.damage} блок` : hit.crit ? `−${hit.damage}!` : `−${hit.damage}`,
          kind: hit.miss ? "miss" : hit.blocked ? "block" : hit.crit ? "crit" : "hit",
        },
      ]);
    },
    [fight.hits, run],
  );
  const onImpactRef = useRef(onImpact);
  onImpactRef.current = onImpact;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setShown(0);
    setFinished(false);
    setPopups([]);

    let stage: ReturnType<typeof createStage>;
    try {
      stage = createStage(canvas);
    } catch {
      setShown(fight.hits.length);
      setFinished(true);
      return;
    }
    const { renderer, scene } = stage;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 2.3, 6.4);
    camera.lookAt(0, 0.9, 0);

    const rigs: [FighterRig, FighterRig] = [
      buildFighter(attacker.color, attacker.weapon, attacker.shield),
      buildFighter(defender.color, defender.weapon, defender.shield),
    ];
    const home = [-1.05, 1.05];
    rigs.forEach((rig, i) => {
      rig.root.position.x = home[i];
      rig.root.scale.x = i === 0 ? -1 : 1;
      scene.add(rig.root);
    });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 1 ? 8.6 : 6.4;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let elapsed = -START_DELAY_MS;
    let last = performance.now();
    let landed = -1;
    let done = false;
    let raf = 0;
    const flashUntil = [0, 0];

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      elapsed += dt * speedRef.current;
      const t = now / 1000;

      // Idle sway for both.
      rigs.forEach((rig) => {
        rig.body.position.y = Math.sin(t * 2.4) * 0.015;
      });

      const index = Math.floor(Math.max(0, elapsed) / HIT_MS);
      if (elapsed >= 0 && index < fight.hits.length) {
        const hit = fight.hits[index];
        const a = rigs[hit.by];
        const d = rigs[hit.by === 0 ? 1 : 0];
        const dir = hit.by === 0 ? 1 : -1;
        const p = (elapsed - index * HIT_MS) / HIT_MS;

        // Attacker: step in, wind up, swing, step back.
        const step = p < 0.4 ? ease(p / 0.4) : p < 0.6 ? 1 : 1 - ease((p - 0.6) / 0.4);
        a.root.position.x = home[hit.by] + dir * 0.55 * step;
        a.body.rotation.z = -dir * 0.12 * step;
        const windUp = p < 0.3 ? ease(p / 0.3) : p < 0.45 ? 1 - ease((p - 0.3) / 0.15) : 0;
        a.rightArm.rotation.x = -0.35 - 2.1 * windUp + (p >= 0.45 && p < 0.65 ? 0.5 * Math.sin(((p - 0.45) / 0.2) * Math.PI) : 0);

        // Defender: raise the shield when blocking, recoil on impact.
        const guard = hit.blocked ? Math.sin(clamp01((p - 0.2) / 0.5) * Math.PI) : 0;
        d.leftArm.rotation.x = -0.6 - 0.9 * guard;
        // A miss is a dodge: the defender steps aside instead of recoiling.
        const recoil = p > 0.45 && p < 0.8 ? Math.sin(((p - 0.45) / 0.35) * Math.PI) : 0;
        const dodge = hit.miss ? Math.sin(clamp01((p - 0.25) / 0.55) * Math.PI) : 0;
        d.root.position.x = home[hit.by === 0 ? 1 : 0] + dir * 0.18 * recoil * (hit.miss ? 0 : hit.blocked ? 0.4 : 1);
        d.root.position.z = 0.45 * dodge;
        d.body.rotation.z = dir * 0.1 * recoil;

        if (p >= 0.45 && landed < index) {
          landed = index;
          if (!hit.miss) flashUntil[hit.by === 0 ? 1 : 0] = now + 160;
          onImpactRef.current(index);
        }
      } else if (elapsed >= fight.hits.length * HIT_MS && !done) {
        // Finale: the loser falls, the winner raises their weapon.
        const p = clamp01((elapsed - fight.hits.length * HIT_MS) / FINISH_MS);
        rigs.forEach((rig, i) => {
          rig.root.position.x += (home[i] - rig.root.position.x) * 0.2;
          rig.root.position.z *= 0.8;
          rig.rightArm.rotation.x = -0.35;
          rig.leftArm.rotation.x = -0.6;
        });
        if (fight.winner !== null) {
          const loser = rigs[fight.winner === 0 ? 1 : 0];
          const winner = rigs[fight.winner];
          loser.body.rotation.z = (fight.winner === 0 ? -1 : 1) * (Math.PI / 2.1) * ease(p);
          loser.body.position.y = -0.1 * ease(p);
          winner.rightArm.rotation.x = -0.35 - 2.6 * ease(p);
          winner.body.position.y = Math.abs(Math.sin(p * Math.PI * 2)) * 0.18;
        }
        if (p >= 1) {
          done = true;
          setFinished(true);
        }
      }

      rigs.forEach((rig, i) => {
        const flashing = now < flashUntil[i];
        rig.flashables.forEach((m) => m.emissive.set(flashing ? "#ff3b2f" : "#000000"));
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      rigs.forEach((r) => r.dispose());
      stage.dispose();
    };
  }, [attacker, defender, fight, run]);

  const lastHit = shown > 0 ? fight.hits[shown - 1] : null;
  const hp: [number, number] = lastHit ? lastHit.hp : [fight.maxHp[0], fight.maxHp[1]];
  const fighters = [attacker, defender] as const;
  const outcome = fight.winner === null ? "draw" : fight.winner === meIndex ? "win" : "loss";

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-10 grid grid-cols-2 gap-4 p-4">
          {fighters.map((f, i) => (
            <div key={f.userId} className={clsx("min-w-0", i === 1 && "text-right")}>
              <div className={clsx("flex items-center gap-2", i === 1 && "flex-row-reverse")}>
                <Avatar name={f.name} size={26} />
                <span className="truncate text-sm font-semibold">
                  {f.name}
                  {i === meIndex ? " (ты)" : ""}
                </span>
                <span className="text-xs text-muted">ур. {f.level}</span>
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

        <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[440px]" aria-label="Бой на арене" />

        {popups.map((p) => (
          <span
            key={p.id}
            className={clsx(
              "pointer-events-none absolute top-[38%] z-10 animate-[floatup_900ms_ease-out_forwards] text-2xl font-black",
              p.side === 0 ? "left-[30%]" : "right-[30%]",
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
              <span className="font-medium text-ink">{f.name}:</span> {item(f.weapon).name}, {item(f.shield).name}
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
                  {h.crit ? "наносит критический удар" : h.blocked ? "бьёт в щит" : "попадает"} —{" "}
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
