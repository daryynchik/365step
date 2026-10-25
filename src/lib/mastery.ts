/**
 * The SAT Math ladder per student (rules: content/math-ladder.ts):
 *
 *   skill_mastery   the step of each skill and its recent answers;
 *   task_attempts   every graded answer on a bank task — what comes back when;
 *   lesson_draws    the tasks a practice lesson was given, fixed when it is
 *                   first opened so the server grades what the student saw.
 *
 * A skill without a row starts at the step of the section's Math score; when
 * the student has old progress on it (skill_stats, easy / medium / hard), the
 * step keeps that skill's distance from the section level. Nothing old is
 * rewritten: skill_stats is still updated next to this table.
 */

import { randomUUID } from "node:crypto";

import type { LadderState, SavedDraw } from "@/content/bank/math-lessons";
import { skillsOf } from "@/content/bank/taxonomy";
import type { Level } from "@/content/exams";
import {
  clampTier,
  newMastery,
  rebaseline,
  startTier,
  tierFromLegacy,
  updateMastery,
  type Attempt,
  type Mastery,
  type MasteryEvent,
  type Outcome,
  type Tier,
} from "@/content/math-ladder";
import type { Plan } from "@/content/plan";
import { all, json, num, one, run, str } from "./db";
import { nowIso } from "./date";
import { getSkillStats } from "./skill-stats";

/** The student's ladder: every SAT Math skill's mastery and their attempts. */
export type MathContext = LadderState;

/** The section's steps from the plan: the Math score and the Math target. */
export function mathTiers(plan: Plan | null): { start: Tier; target: Tier; level: Level } {
  const state = plan?.sections.find((s) => s.section === "sat-math");
  const current = state?.current ?? 570;
  return { start: startTier(current), target: startTier(Math.max(current, state?.target ?? current)), level: state?.level ?? "medium" };
}

function masteryOf(row: Record<string, unknown>): Mastery {
  return {
    tier: clampTier(num(row.tier, 3)),
    baseTier: clampTier(num(row.base_tier, 3)),
    recent: json<Mastery["recent"]>(row.recent, []),
    remediation: num(row.remediation) === 1,
    answered: num(row.answered),
    clean: num(row.clean),
  };
}

export async function getMathContext(userId: string, plan: Plan | null): Promise<MathContext> {
  const { start, target, level } = mathTiers(plan);
  const [rows, legacy, attempts] = await Promise.all([
    all("SELECT skill, tier, base_tier, recent, remediation, answered, clean, last_event FROM skill_mastery WHERE user_id = ?", [userId]),
    getSkillStats(userId),
    all("SELECT task_id, outcome, answered_at FROM task_attempts WHERE user_id = ? AND skill LIKE 'sat-math.%' ORDER BY answered_at, id", [userId]),
  ]);
  const byRow = new Map(rows.map((r) => [str(r.skill), r]));
  const mastery: Record<string, Mastery> = {};
  const justPromoted = new Set<string>();
  for (const skill of skillsOf("sat-math")) {
    const row = byRow.get(skill.id);
    if (row) {
      mastery[skill.id] = rebaseline(masteryOf(row), start);
      if (str(row.last_event) === "up") justPromoted.add(skill.id);
      continue;
    }
    const old = legacy[skill.id];
    const m = newMastery(old && old.answered > 0 ? tierFromLegacy(start, level, old.level) : start);
    mastery[skill.id] = { ...m, baseTier: start, answered: old?.answered ?? 0 };
  }
  const history = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const id = str(a.task_id);
    history.set(id, [...(history.get(id) ?? []), { outcome: str(a.outcome) as Outcome, at: str(a.answered_at) }]);
  }
  return { mastery, justPromoted, history, start, target, now: nowIso() };
}

export interface GradedTask {
  /** Bank task id; null for questions of authored lessons. */
  taskId: string | null;
  skill: string;
  tier: number;
  outcome: Outcome;
  /** Right on the second try, after the solution was shown. */
  retried: boolean;
}

/**
 * Records one lesson's SAT Math answers: the attempts, then each skill's
 * mastery. `remediation` — skills this lesson was built to help with.
 */
export async function recordMathAnswers(
  userId: string,
  plan: Plan | null,
  lessonKey: string,
  graded: GradedTask[],
  remediation: Set<string>,
): Promise<{ skill: string; event: MasteryEvent }[]> {
  const math = graded.filter((g) => g.skill.startsWith("sat-math."));
  if (math.length === 0) return [];
  const now = nowIso();
  for (const g of math) {
    if (!g.taskId) continue;
    await run(
      "INSERT INTO task_attempts (id, user_id, task_id, skill, tier, outcome, retried, lesson_key, answered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), userId, g.taskId, g.skill, g.tier, g.outcome, g.retried ? 1 : 0, lessonKey, now],
    );
  }

  const ctx = await getMathContext(userId, plan);
  const events: { skill: string; event: MasteryEvent }[] = [];
  const bySkill = new Map<string, GradedTask[]>();
  for (const g of math) bySkill.set(g.skill, [...(bySkill.get(g.skill) ?? []), g]);
  for (const [skill, answers] of bySkill) {
    const before = ctx.mastery[skill];
    if (!before) continue;
    const { mastery: after, event } = updateMastery(
      before,
      answers.map((a) => ({ tier: a.tier, outcome: a.outcome })),
      remediation.has(skill),
    );
    if (event) events.push({ skill, event });
    const params = [after.tier, after.baseTier, JSON.stringify(after.recent), after.remediation ? 1 : 0, after.answered, after.clean, event?.kind ?? null, now];
    const exists = await one("SELECT 1 AS x FROM skill_mastery WHERE user_id = ? AND skill = ?", [userId, skill]);
    if (exists) {
      await run(
        "UPDATE skill_mastery SET tier = ?, base_tier = ?, recent = ?, remediation = ?, answered = ?, clean = ?, last_event = ?, updated_at = ? WHERE user_id = ? AND skill = ?",
        [...params, userId, skill],
      );
    } else {
      await run(
        "INSERT INTO skill_mastery (tier, base_tier, recent, remediation, answered, clean, last_event, updated_at, user_id, skill) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [...params, userId, skill],
      );
    }
  }
  return events;
}

// --------------------------------------------------------- lesson draws --

export type { SavedDraw };

export async function getDraw(userId: string, lessonKey: string): Promise<SavedDraw | null> {
  const row = await one("SELECT payload FROM lesson_draws WHERE user_id = ? AND lesson_key = ?", [userId, lessonKey]);
  const draw = row ? json<SavedDraw | null>(row.payload, null) : null;
  return draw?.v === 1 && Array.isArray(draw.tasks) ? draw : null;
}

/** Saves the draw unless one is already there (two tabs); returns the one that holds. */
export async function saveDraw(userId: string, lessonKey: string, draw: SavedDraw): Promise<SavedDraw> {
  await run("INSERT INTO lesson_draws (user_id, lesson_key, payload, created_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING", [
    userId,
    lessonKey,
    JSON.stringify(draw),
    nowIso(),
  ]);
  return (await getDraw(userId, lessonKey)) ?? draw;
}

/** After grading: the next time the lesson is opened it draws fresh tasks. */
export async function clearDraw(userId: string, lessonKey: string): Promise<void> {
  await run("DELETE FROM lesson_draws WHERE user_id = ? AND lesson_key = ?", [userId, lessonKey]);
}
