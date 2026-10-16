"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Target } from "lucide-react";

import type { Completion } from "@/lib/game";
import { MorePractice } from "./more-practice";
import { buttonClass, Coin, Flame } from "./ui";

const CONFETTI_COLORS = ["#2e7d4f", "#3563c9", "#c0711b", "#7a52b3", "#c9971c", "#e0702a"];

/** A short burst of paper confetti from two points near the top. No dependencies. */
function Confetti() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      el.width = el.clientWidth * dpr;
      el.height = el.clientHeight * dpr;
    };
    resize();

    const w = el.clientWidth;
    const pieces = Array.from({ length: 160 }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const angle = (fromLeft ? -60 : -120) + (Math.random() - 0.5) * 50;
      const speed = 9 + Math.random() * 9;
      return {
        x: fromLeft ? w * 0.25 : w * 0.75,
        y: el.clientHeight * 0.3,
        vx: Math.cos((angle * Math.PI) / 180) * speed,
        vy: Math.sin((angle * Math.PI) / 180) * speed,
        size: 6 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        wobble: Math.random() * 10,
      };
    });

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame++;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, el.clientWidth, el.clientHeight);
      for (const p of pieces) {
        p.vy += 0.32;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx + Math.sin((frame + p.wobble) / 8) * 0.6;
        p.y += p.vy;
        p.rot += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - frame / 170);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (frame < 170) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-[60] h-full w-full" aria-hidden />;
}

/** Counts up from 0 to `to` over ~0.9s. */
function useCountUp(to: number, delay = 350): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (to === 0) return;
    let raf = 0;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 900);
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [to, delay]);
  return value;
}

export function Celebration({
  result,
  kind,
  backHref,
  moreKey = null,
}: {
  result: Completion;
  kind: "lesson" | "writing" | "speaking";
  backHref: string;
  /** Offer a fresh practice set on the same skill. */
  moreKey?: string | null;
}) {
  const points = useCountUp(result.points);
  const continueRef = useRef<HTMLAnchorElement>(null);
  const perfect = result.total > 0 && result.correct === result.total;
  const goalPct = Math.min(100, Math.round((result.earnedToday / result.dailyGoal) * 100));

  useEffect(() => {
    continueRef.current?.focus();
  }, []);

  const title =
    kind === "writing" ? "Работа сдана!" : kind === "speaking" ? "Часть экзамена пройдена!" : perfect ? "Без единой ошибки!" : result.firstTime ? "Урок пройден!" : "Повторение засчитано";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Confetti />

      <div className="pop-in grid size-24 place-items-center rounded-full bg-accent shadow-[0_6px_0_var(--accent-hover)]">
        <svg viewBox="0 0 24 24" className="size-12" aria-hidden>
          <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="rise mt-7 text-center text-3xl font-bold tracking-tight" style={{ animationDelay: "150ms" }}>
        {title}
      </h1>
      {kind === "lesson" && result.total > 0 && (
        <p className="rise mt-2 text-muted" style={{ animationDelay: "220ms" }}>
          Верно с первой попытки: {result.correct} из {result.total}
        </p>
      )}

      <div className="rise mt-8 grid w-full max-w-md grid-cols-3 gap-3" style={{ animationDelay: "300ms" }}>
        <div className="card flex flex-col items-center gap-1 px-2 py-4">
          <Coin className="size-7" />
          <span className="tabular text-xl font-bold">+{points}</span>
          <span className="text-xs text-muted">очков</span>
        </div>
        <div className="card flex flex-col items-center gap-1 px-2 py-4">
          <Flame className="size-7" />
          <span className="tabular text-xl font-bold">{result.streak}</span>
          <span className="text-xs text-muted">{result.streakExtended ? "серия +1" : "дней подряд"}</span>
        </div>
        <div className="card flex flex-col items-center gap-1 px-2 py-4">
          <Target className="size-7 text-accent" />
          <span className="tabular text-xl font-bold">{goalPct}%</span>
          <span className="text-xs text-muted">цель дня</span>
        </div>
      </div>

      {result.leveledUp && (
        <div
          className="pop-in mt-4 flex w-full max-w-md items-center gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3"
          style={{ animationDelay: "700ms" }}
        >
          <span className="grid size-9 place-items-center rounded-full bg-accent text-white">
            <ArrowUp className="size-5" />
          </span>
          <p className="text-sm">
            <span className="font-semibold">Новый уровень — {result.level}.</span>{" "}
            <span className="text-muted">Твой боец на арене стал крепче.</span>
          </p>
        </div>
      )}

      {!result.firstTime && result.points === 0 && (
        <p className="mt-4 max-w-md text-center text-sm text-muted">
          Очки за повторение начисляются один раз в день для каждого урока.
        </p>
      )}

      <div className="rise mt-10 flex w-full max-w-md flex-col gap-2 sm:flex-row" style={{ animationDelay: "450ms" }}>
        <Link href={backHref} className={buttonClass("secondary", "lg", "flex-1")}>
          К дорожке
        </Link>
        <Link ref={continueRef} href={result.nextHref} className={buttonClass("primary", "lg", "flex-1")}>
          Продолжить
        </Link>
      </div>
      {moreKey && <MorePractice lessonKey={moreKey} className="rise mt-3 w-full max-w-md" />}
    </div>
  );
}
