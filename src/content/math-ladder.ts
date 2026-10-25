/**
 * The SAT Math ladder: how practice difficulty follows the student, skill by
 * skill. Pure functions — no database, no clock — so the rules are testable
 * and the same input always gives the same lesson.
 *
 *   - Internal score bands for choosing tasks (not an official difficulty
 *     scale): 200–490, 500–590, 600–690, 700–800.
 *   - Six steps ("ступени") of task difficulty. Bank tasks carry a step
 *     (bank/schema.ts "tier"); without one: easy 1, medium 3, hard 4.
 *   - A skill starts at the step of the section's Math score; answers move it:
 *       up    — a series: 7 of the last 8 answers at or above the step right on
 *               the first try without a hint (in the first 16 answers of a
 *               skill, 6 in a row is enough — the score was only an estimate);
 *       help  — 3 wrong of the last 5 answers at the step: the next lesson
 *               explains the skill, gives three easier tasks on it and then
 *               returns to the step;
 *       down  — only when that lesson also goes badly (under half the credit
 *               at the step). One weak skill never moves the others.
 *   - Credit: first try without a hint 1, with a hint ½, wrong 0. A correct
 *     answer after the solution was shown earns nothing.
 *   - A lesson mixes the step (current), one step lower (review), one higher
 *     (stretch); the target score sets how much stretch. Past mistakes come
 *     back after 2 and then 7 days; other recently solved tasks are not
 *     repeated for 60 days unless the pool runs out.
 */

import type { Level } from "./exams";

export type Tier = 1 | 2 | 3 | 4 | 5 | 6;
export const TIERS: Tier[] = [1, 2, 3, 4, 5, 6];
export const MAX_TIER: Tier = 6;

export const TIER_TITLES: Record<Tier, string> = {
  1: "основы",
  2: "базовая",
  3: "средняя",
  4: "уверенная",
  5: "сложная",
  6: "продвинутая",
};

/** The step a bank task has when it does not name one. */
export const DEFAULT_TIER: Record<Level, Tier> = { easy: 1, medium: 3, hard: 4 };

export function clampTier(n: number): Tier {
  return Math.min(MAX_TIER, Math.max(1, Math.round(n))) as Tier;
}

/** easy for steps 1–2, medium for 3–4, hard for 5–6. */
export function tierLevel(t: number): Level {
  return t <= 2 ? "easy" : t <= 4 ? "medium" : "hard";
}

// ------------------------------------------------------------- bands --

export interface MathBand {
  id: "b1" | "b2" | "b3" | "b4";
  from: number;
  to: number;
  /** Steps a student of this band starts on. */
  tiers: Tier[];
}

/** Internal ranges for choosing tasks; not an official difficulty scale. */
export const MATH_BANDS: MathBand[] = [
  { id: "b1", from: 200, to: 490, tiers: [1, 2] },
  { id: "b2", from: 500, to: 590, tiers: [3] },
  { id: "b3", from: 600, to: 690, tiers: [4] },
  { id: "b4", from: 700, to: 800, tiers: [5, 6] },
];

export function mathBand(score: number): MathBand {
  return MATH_BANDS.find((b) => score <= b.to) ?? MATH_BANDS[MATH_BANDS.length - 1];
}

/** The starting step for a SAT Math score: under 400 → 1, …, 700–750 → 5, 760+ → 6. */
export function startTier(score: number): Tier {
  if (score < 400) return 1;
  if (score < 500) return 2;
  if (score < 600) return 3;
  if (score < 700) return 4;
  if (score < 760) return 5;
  return 6;
}

/** A typical Math score for a step, for the diagnostic estimate. */
export const TIER_SCORE: Record<Tier, number> = { 1: 350, 2: 450, 3: 550, 4: 650, 5: 720, 6: 780 };

// ------------------------------------------------------- lesson slots --

/** current — the student's step; review — one lower; stretch — one higher; lower — remediation; retry — a past mistake. */
export type Role = "current" | "review" | "stretch" | "lower" | "retry";

export interface Slot {
  tier: Tier;
  role: Role;
}

export const LESSON_SIZE = 8;

/**
 * The slots of one practice lesson. The gap to the target step sets how much
 * stretch: at or above the target — 1 (and 2 review), one step short — 2,
 * further — 3. Remediation: three easier tasks first, then back to the step.
 */
export function lessonSlots(tier: Tier, targetTier: Tier, remediation: boolean, size = LESSON_SIZE): Slot[] {
  if (remediation) {
    const lower = clampTier(tier - 1);
    const n = Math.min(3, size - 1);
    return [...Array.from({ length: n }, () => ({ tier: lower, role: "lower" as Role })), ...Array.from({ length: size - n }, () => ({ tier, role: "current" as Role }))];
  }
  const gap = targetTier - tier;
  const stretch = tier === MAX_TIER ? 0 : gap >= 2 ? 3 : gap <= 0 ? 1 : 2;
  const review = tier === 1 ? 0 : gap <= 0 ? 2 : 1;
  const current = size - stretch - review;
  const out: Slot[] = [];
  // Warm up with review, then the step with the stretch tasks spread between.
  for (let i = 0; i < review; i++) out.push({ tier: clampTier(tier - 1), role: "review" });
  const rest: Slot[] = Array.from({ length: current }, () => ({ tier, role: "current" as Role }));
  for (let j = 0; j < stretch; j++) {
    const at = Math.min(rest.length, Math.floor(((j + 1) * (current + stretch)) / (stretch + 1)));
    rest.splice(at, 0, { tier: clampTier(tier + 1), role: "stretch" });
  }
  return [...out, ...rest];
}

// ------------------------------------------------------------ mastery --

export type Outcome = "clean" | "hinted" | "wrong";

export interface LadderAnswer {
  /** The task's step. */
  tier: number;
  outcome: Outcome;
}

export interface Mastery {
  tier: Tier;
  /** The step the skill started on (from the score, the diagnostic or old progress). */
  baseTier: Tier;
  /** Answers at or above the step since it last changed: d = task step − skill step (0 or more). Last 10. */
  recent: { d: number; o: Outcome }[];
  /** The next lesson on this skill explains it and gives easier tasks first. */
  remediation: boolean;
  answered: number;
  clean: number;
}

export const PROMOTE_WINDOW = 8;
export const PROMOTE_CLEAN = 7;
export const CALIBRATION_ANSWERS = 16;
export const CALIBRATION_WINDOW = 6;
export const HELP_WINDOW = 5;
export const HELP_WRONG = 3;
export const RECENT_KEEP = 10;

export function newMastery(tier: Tier): Mastery {
  return { tier, baseTier: tier, recent: [], remediation: false, answered: 0, clean: 0 };
}

export type MasteryEvent = { kind: "up" | "down" | "help" | "recovered"; from: Tier; to: Tier };

const credit = (o: Outcome) => (o === "clean" ? 1 : o === "hinted" ? 0.5 : 0);

/**
 * Feeds one lesson's answers on a skill into its mastery. `remediationLesson`:
 * the lesson was built as a remediation lesson (easier tasks first).
 */
export function updateMastery(m: Mastery, answers: LadderAnswer[], remediationLesson = false): { mastery: Mastery; event: MasteryEvent | null } {
  if (answers.length === 0) return { mastery: m, event: null };
  const calibrating = m.answered < CALIBRATION_ANSWERS;
  let recent = [...m.recent];
  for (const a of answers) {
    const d = Math.round(a.tier) - m.tier;
    if (d >= 0) recent.push({ d: Math.min(d, 2), o: a.outcome });
  }
  recent = recent.slice(-RECENT_KEEP);
  const base: Mastery = {
    ...m,
    recent,
    answered: m.answered + answers.length,
    clean: m.clean + answers.filter((a) => a.outcome === "clean").length,
  };

  if (m.remediation && remediationLesson) {
    const atStep = answers.filter((a) => a.tier >= m.tier);
    const share = atStep.length ? atStep.reduce((s, a) => s + credit(a.outcome), 0) / atStep.length : 1;
    if (share >= 0.5) return { mastery: { ...base, remediation: false }, event: { kind: "recovered", from: m.tier, to: m.tier } };
    const to = clampTier(m.tier - 1);
    return { mastery: { ...base, tier: to, recent: [], remediation: false }, event: { kind: "down", from: m.tier, to } };
  }

  const last = (n: number) => recent.slice(-n);
  const cleanIn = (xs: { o: Outcome }[]) => xs.filter((x) => x.o === "clean").length;
  const series =
    (recent.length >= PROMOTE_WINDOW && cleanIn(last(PROMOTE_WINDOW)) >= PROMOTE_CLEAN) ||
    (calibrating && recent.length >= CALIBRATION_WINDOW && cleanIn(last(CALIBRATION_WINDOW)) === CALIBRATION_WINDOW);
  if (m.tier < MAX_TIER && series) {
    const to = clampTier(m.tier + 1);
    return { mastery: { ...base, tier: to, recent: [], remediation: false }, event: { kind: "up", from: m.tier, to } };
  }

  const atStep = recent.filter((x) => x.d === 0).slice(-HELP_WINDOW);
  const wrong = atStep.filter((x) => x.o === "wrong").length;
  const wrongNow = answers.filter((a) => Math.round(a.tier) === m.tier && a.outcome === "wrong").length;
  if (!m.remediation && wrong >= HELP_WRONG && wrongNow >= 1) {
    return { mastery: { ...base, remediation: true }, event: { kind: "help", from: m.tier, to: m.tier } };
  }
  return { mastery: base, event: null };
}

/**
 * Old progress (skill_stats: easy / medium / hard per skill) mapped onto the
 * ladder: the skill keeps its distance from the section level.
 */
export function tierFromLegacy(start: Tier, sectionLevel: Level, legacyLevel: Level): Tier {
  const idx: Record<Level, number> = { easy: 0, medium: 1, hard: 2 };
  return clampTier(start + idx[legacyLevel] - idx[sectionLevel]);
}

/**
 * A new section score: a skill with few answers follows it; one with more
 * evidence moves at most to one step from the new start.
 */
export function rebaseline(m: Mastery, start: Tier): Mastery {
  if (start === m.baseTier) return m;
  if (m.answered < PROMOTE_WINDOW) return { ...m, tier: start, baseTier: start, recent: [], remediation: false };
  const tier = start > m.baseTier ? Math.max(m.tier, start - 1) : Math.min(m.tier, start + 1);
  return { ...m, tier: clampTier(tier), baseTier: start, recent: tier === m.tier ? m.recent : [] };
}

// --------------------------------------------------- spaced repetition --

export interface Attempt {
  outcome: Outcome;
  /** ISO timestamp. */
  at: string;
}

/** Days until a missed task comes back: after the miss, then after one right answer. Two right answers retire it. */
export const REVIEW_INTERVAL_DAYS = [2, 7];
/** A task answered within this many days is not drawn again, unless it is due or the pool runs out. */
export const RECENT_DAYS = 60;

const DAY_MS = 86_400_000;

function plusDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString();
}

/** When a task should come back, or null: never missed, or retired. Attempts oldest first. */
export function reviewDueAt(attempts: Attempt[]): string | null {
  let lastMiss = -1;
  attempts.forEach((a, i) => {
    if (a.outcome !== "clean") lastMiss = i;
  });
  if (lastMiss < 0) return null;
  const rightAfter = attempts.length - 1 - lastMiss;
  if (rightAfter >= REVIEW_INTERVAL_DAYS.length) return null;
  return plusDays(attempts[attempts.length - 1].at, REVIEW_INTERVAL_DAYS[rightAfter]);
}

// --------------------------------------------------------------- draw --

export interface LadderTask {
  id: string;
  tier: number;
}

export interface LadderPick<T extends LadderTask> {
  task: T;
  role: Role;
  /** The slot's step when the task had to come from another one. */
  wanted: Tier;
}

export interface LadderDraw<T extends LadderTask> {
  picks: LadderPick<T>[];
  /** Slots filled from another step, or not at all. */
  shortages: { tier: Tier; role: Role }[];
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

/** Nearest steps first; stretch looks up before down, the rest down before up. */
function fallbackTiers(tier: Tier, role: Role): Tier[] {
  const out: Tier[] = [];
  for (let k = 1; k < MAX_TIER; k++) {
    const order = role === "stretch" ? [tier + k, tier - k] : [tier - k, tier + k];
    for (const t of order) if (t >= 1 && t <= MAX_TIER) out.push(t as Tier);
  }
  return out;
}

export interface DrawInput<T extends LadderTask> {
  pool: T[];
  slots: Slot[];
  /** Attempts per task id, oldest first (this student). */
  history: Map<string, Attempt[]>;
  /** ISO timestamp. */
  now: string;
  seed: string;
  /** Past mistakes at most this step come back; at most `maxRetries` of them. */
  maxRetryTier?: number;
  maxRetries?: number;
}

/**
 * Fills the slots. Due mistakes take the review slots first (then the first
 * slots of the step); every other slot takes, in order: a task never seen, one
 * seen more than RECENT_DAYS ago, the least recently seen — at the slot's step,
 * then at the nearest steps.
 */
export function drawLadder<T extends LadderTask>(input: DrawInput<T>): LadderDraw<T> {
  const { pool, slots, history, now, seed } = input;
  const used = new Set<string>();
  const picks: (LadderPick<T> | null)[] = slots.map(() => null);
  const shortages: { tier: Tier; role: Role }[] = [];
  const lastSeen = (id: string) => history.get(id)?.at(-1)?.at ?? null;
  const recentCutoff = plusDays(now, -RECENT_DAYS);

  // Past mistakes that are due, the longest overdue first.
  const maxRetryTier = input.maxRetryTier ?? MAX_TIER;
  const due = pool
    .map((t) => ({ t, due: reviewDueAt(history.get(t.id) ?? []) }))
    .filter((x) => x.due !== null && x.due <= now && x.t.tier <= maxRetryTier)
    .sort((a, b) => a.due!.localeCompare(b.due!) || a.t.id.localeCompare(b.t.id));
  const retrySlots = slots
    .map((s, i) => ({ s, i }))
    .sort((a, b) => Number(b.s.role === "review" || b.s.role === "lower") - Number(a.s.role === "review" || a.s.role === "lower") || a.i - b.i);
  const cap = Math.min(input.maxRetries ?? Math.max(1, slots.filter((s) => s.role === "review").length), due.length);
  for (let k = 0; k < cap; k++) {
    const { i, s } = retrySlots[k];
    picks[i] = { task: due[k].t, role: "retry", wanted: s.tier };
    used.add(due[k].t.id);
  }

  const byTier = new Map<number, T[]>();
  for (const t of pool) byTier.set(t.tier, [...(byTier.get(t.tier) ?? []), t]);
  const ordered = new Map<number, T[]>();
  const orderOf = (tier: number): T[] => {
    if (!ordered.has(tier)) {
      const list = shuffled(byTier.get(tier) ?? [], `${seed}|${tier}`);
      const fresh = list.filter((t) => lastSeen(t.id) === null);
      const old = list.filter((t) => lastSeen(t.id) !== null && lastSeen(t.id)! < recentCutoff);
      const recentlySeen = list.filter((t) => lastSeen(t.id) !== null && lastSeen(t.id)! >= recentCutoff);
      const bySeen = (a: T, b: T) => lastSeen(a.id)!.localeCompare(lastSeen(b.id)!);
      ordered.set(tier, [...fresh, ...old.sort(bySeen), ...recentlySeen.sort(bySeen)]);
    }
    return ordered.get(tier)!;
  };
  const firstFree = (tier: number, allowRecent: boolean): T | undefined =>
    orderOf(tier).find((t) => !used.has(t.id) && (allowRecent || lastSeen(t.id) === null || lastSeen(t.id)! < recentCutoff));

  slots.forEach((s, i) => {
    if (picks[i]) return;
    // Not recently seen at the slot's step, then at the nearest steps; only then recently seen ones.
    let task: T | undefined;
    let from: Tier = s.tier;
    for (const allowRecent of [false, true]) {
      for (const t of [s.tier, ...fallbackTiers(s.tier, s.role)]) {
        task = firstFree(t, allowRecent);
        if (task) {
          from = t;
          break;
        }
      }
      if (task) break;
    }
    if (!task) {
      shortages.push({ tier: s.tier, role: s.role });
      return;
    }
    if (from !== s.tier) shortages.push({ tier: s.tier, role: s.role });
    used.add(task.id);
    picks[i] = { task, role: s.role, wanted: s.tier };
  });

  return { picks: picks.filter((p): p is LadderPick<T> => p !== null), shortages };
}

// -------------------------------------------------------- explanations --

/** Russian names of the SAT Math skills. */
export const MATH_SKILL_RU: Record<string, string> = {
  "sat-math.linear-equations-one": "линейные уравнения с одной переменной",
  "sat-math.linear-functions": "линейные функции",
  "sat-math.linear-equations-two": "линейные уравнения с двумя переменными",
  "sat-math.systems": "системы линейных уравнений",
  "sat-math.inequalities": "линейные неравенства",
  "sat-math.nonlinear-functions": "нелинейные функции",
  "sat-math.nonlinear-equations": "нелинейные уравнения и системы",
  "sat-math.equivalent-expressions": "преобразования выражений",
  "sat-math.ratios-rates": "отношения, скорости и единицы",
  "sat-math.percentages": "проценты",
  "sat-math.one-variable-data": "данные одной переменной",
  "sat-math.two-variable-data": "данные двух переменных и модели",
  "sat-math.probability": "вероятность",
  "sat-math.sample-statistics": "выборки и погрешность",
  "sat-math.statistical-claims": "выводы из исследований",
  "sat-math.area-volume": "площади и объёмы",
  "sat-math.lines-angles-triangles": "прямые, углы и треугольники",
  "sat-math.right-triangles": "прямоугольные треугольники и тригонометрия",
  "sat-math.circles": "окружности",
};

/** Where the accusative ("Закрепляем …") differs from the name. */
const ACCUSATIVE: Record<string, string> = { "sat-math.right-triangles": "прямоугольные треугольники и тригонометрию" };

export function skillNameRu(skill: string): string {
  return MATH_SKILL_RU[skill] ?? skill;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One line for the student on why the lesson holds these tasks. */
export function selectionHeadline(skill: string, m: Pick<Mastery, "tier" | "remediation" | "recent">, targetTier: Tier, justPromoted: boolean): string {
  const name = skillNameRu(skill);
  if (m.remediation) return `Разбираем трудное: ${name}`;
  if (justPromoted) return `Переходим к более сложным задачам: ${name}`;
  if (m.tier >= targetTier) return `Держим уровень: ${name}`;
  return `Закрепляем ${ACCUSATIVE[skill] ?? name}`;
}

/** The same, without the skill: a status for a list of skills. */
export function skillStatus(m: Pick<Mastery, "tier" | "remediation">, targetTier: Tier, justPromoted: boolean): string {
  if (m.remediation) return "Разбираем трудное: объяснение и задачи попроще";
  if (justPromoted) return "Переходим к более сложным задачам";
  if (m.tier >= targetTier) return "Держим уровень цели";
  return "Закрепляем";
}

/** What the lesson holds, in plain words. */
export function selectionDetail(tier: Tier, picks: { role: Role }[]): string {
  const n = (role: Role) => picks.filter((p) => p.role === role).length;
  const parts: string[] = [];
  if (n("lower")) parts.push(`${n("lower")} — на ступень проще, с коротким объяснением перед ними`);
  if (n("current")) parts.push(`${n("current")} — твоя ступень ${tier} из 6 («${TIER_TITLES[tier]}»)`);
  if (n("stretch")) parts.push(`${n("stretch")} — следующая ступень`);
  if (n("review")) parts.push(`${n("review")} — повторение ступенью ниже`);
  if (n("retry")) parts.push(`${n("retry")} — задачи, в которых ты ошибался раньше`);
  return `В этом наборе: ${parts.join("; ")}.`;
}

export function eventMessage(skill: string, e: MasteryEvent): string {
  const name = skillNameRu(skill);
  switch (e.kind) {
    case "up":
      return `${capital(name)}: серия верных ответов — переходим на ступень ${e.to} («${TIER_TITLES[e.to]}»).`;
    case "help":
      return `${capital(name)}: несколько ошибок подряд. В следующем наборе — короткое объяснение и задачи попроще, потом вернёмся к ступени ${e.from}.`;
    case "recovered":
      return `${capital(name)}: разобрались — возвращаемся к задачам ступени ${e.to}.`;
    case "down":
      return `${capital(name)}: пока трудно, временно ступень ${e.to}. Другие навыки это не затрагивает.`;
  }
}
