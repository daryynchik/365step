/**
 * Picks tasks for a practice lesson: the difficulties the level model asks
 * for, rotating through the pool so consecutive lessons of a skill see
 * different tasks. When a difficulty runs short the neighbouring one fills
 * in, and the shortage is reported (and logged once per skill and level).
 */

import type { Level } from "../exams";
import { poolOf, type PoolTask } from "./pool";

export interface Shortage {
  skill: string;
  difficulty: Level;
  need: number;
  have: number;
  usedInstead: Level | null;
}

/** Where to look when a difficulty has too few tasks, nearest first. */
const NEIGHBOURS: Record<Level, Level[]> = {
  easy: ["medium", "hard"],
  medium: ["easy", "hard"],
  hard: ["medium", "easy"],
};

const logged = new Set<string>();

function logShortage(s: Shortage): void {
  const key = `${s.skill}|${s.difficulty}`;
  if (logged.has(key)) return;
  logged.add(key);
  console.warn(
    `[bank] not enough ${s.difficulty} tasks for ${s.skill}: need ${s.need}, have ${s.have}` +
      (s.usedInstead ? ` — using ${s.usedInstead}` : " — no tasks at any level"),
  );
}

/** mulberry32 seeded by a string. */
function seeded(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = (h ^ (h >>> 16)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: string): T[] {
  const rand = seeded(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface Draw {
  tasks: PoolTask[];
  shortages: Shortage[];
}

/**
 * `difficulties` — one entry per task wanted (from skill-level difficultiesFor).
 * `round` — which practice lesson of this skill this is (0-based), so lesson
 * k starts where lesson k−1 stopped.
 * `seed` — per student, so two students do not get the same order.
 */
export function drawTasks(skill: string, difficulties: Level[], round: number, seed: string, log = true): Draw {
  const pool = poolOf(skill);
  const order: Record<Level, PoolTask[]> = {
    easy: shuffled(pool.easy, `${seed}|${skill}|easy`),
    medium: shuffled(pool.medium, `${seed}|${skill}|medium`),
    hard: shuffled(pool.hard, `${seed}|${skill}|hard`),
  };
  const need: Record<Level, number> = { easy: 0, medium: 0, hard: 0 };
  for (const d of difficulties) need[d]++;

  const taken = new Set<string>();
  const byLevel: Record<Level, PoolTask[]> = { easy: [], medium: [], hard: [] };
  const take = (level: Level, count: number, offset: number): number => {
    const list = order[level];
    let got = 0;
    for (let i = 0; i < list.length && got < count; i++) {
      const t = list[(offset + i) % list.length];
      if (taken.has(t.id)) continue;
      taken.add(t.id);
      byLevel[level].push(t);
      got++;
    }
    return got;
  };

  const shortages: Shortage[] = [];
  for (const level of ["medium", "easy", "hard"] as Level[]) {
    if (need[level] === 0) continue;
    const got = take(level, need[level], round * need[level]);
    if (got === need[level]) continue;
    let missing = need[level] - got;
    let usedInstead: Level | null = null;
    for (const other of NEIGHBOURS[level]) {
      if (missing === 0) break;
      const extra = take(other, missing, round * need[level]);
      if (extra > 0) {
        usedInstead ??= other;
        // Keep the slot's place in the lesson: these stand in for `level`.
        byLevel[level].push(...byLevel[other].splice(byLevel[other].length - extra, extra));
        missing -= extra;
      }
    }
    const s: Shortage = { skill, difficulty: level, need: need[level], have: pool[level].length, usedInstead };
    shortages.push(s);
    if (log) logShortage(s);
  }

  // Back into the order the difficulties were asked for.
  const cursor: Record<Level, number> = { easy: 0, medium: 0, hard: 0 };
  const tasks: PoolTask[] = [];
  for (const d of difficulties) {
    const t = byLevel[d][cursor[d]++];
    if (t) tasks.push(t);
  }
  return { tasks, shortages };
}
