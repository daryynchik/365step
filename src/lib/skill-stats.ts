/**
 * Per-skill adaptive levels. A skill starts at its section's level from the
 * scores or the diagnostic; first-try answers move it (skill-level.ts).
 */

import type { Level } from "@/content/exams";
import { newSkillStat, updateSkill, type SkillStat } from "@/content/skill-level";
import { all, num, one, run, str } from "./db";
import { nowIso } from "./date";

export async function getSkillStats(userId: string): Promise<Record<string, SkillStat>> {
  const rows = await all("SELECT skill, level, window_correct, window_total, answered FROM skill_stats WHERE user_id = ?", [userId]);
  return Object.fromEntries(
    rows.map((r) => [
      str(r.skill),
      { level: str(r.level) as Level, windowCorrect: num(r.window_correct), windowTotal: num(r.window_total), answered: num(r.answered) },
    ]),
  );
}

/**
 * Records first-try answers, grouped by skill. `startLevel` gives the level of
 * a skill the student has not answered before.
 * Returns the skills whose level changed.
 */
export async function recordSkillAnswers(
  userId: string,
  answers: { skill: string; correct: boolean }[],
  startLevel: (skill: string) => Level,
): Promise<{ skill: string; from: Level; to: Level }[]> {
  const bySkill = new Map<string, boolean[]>();
  for (const a of answers) bySkill.set(a.skill, [...(bySkill.get(a.skill) ?? []), a.correct]);
  const changed: { skill: string; from: Level; to: Level }[] = [];

  for (const [skill, results] of bySkill) {
    const row = await one("SELECT level, window_correct, window_total, answered FROM skill_stats WHERE user_id = ? AND skill = ?", [userId, skill]);
    const before: SkillStat = row
      ? { level: str(row.level) as Level, windowCorrect: num(row.window_correct), windowTotal: num(row.window_total), answered: num(row.answered) }
      : newSkillStat(startLevel(skill));
    const after = updateSkill(before, results);
    if (after.level !== before.level) changed.push({ skill, from: before.level, to: after.level });
    if (row) {
      await run("UPDATE skill_stats SET level = ?, window_correct = ?, window_total = ?, answered = ?, updated_at = ? WHERE user_id = ? AND skill = ?", [
        after.level,
        after.windowCorrect,
        after.windowTotal,
        after.answered,
        nowIso(),
        userId,
        skill,
      ]);
    } else {
      await run(
        "INSERT INTO skill_stats (user_id, skill, level, window_correct, window_total, answered, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, skill, after.level, after.windowCorrect, after.windowTotal, after.answered, nowIso()],
      );
    }
  }
  return changed;
}
