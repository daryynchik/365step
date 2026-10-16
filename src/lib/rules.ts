/**
 * Points, levels and goals. Plain constants and pure functions, so the client
 * can show the same numbers the server awards.
 */

export const POINTS = {
  lessonBase: 10,
  perCorrect: 5,
  perfectBonus: 10,
  /** Replaying a finished lesson: once per lesson per day. */
  repeat: 5,
  /** Submitting a writing task (seminar, IELTS, admissions) for the first time. */
  writing: 40,
  /** Finishing a speaking test part for the first time. */
  speaking: 30,
  /** Each correct first-try answer in a freshly generated practice set. */
  practicePerCorrect: 2,
} as const;

/** Points to earn in a day for the daily goal ring to close. */
export const DAILY_GOAL = 30;

export function lessonPoints(correct: number, total: number): number {
  const perfect = total > 0 && correct === total;
  return POINTS.lessonBase + correct * POINTS.perCorrect + (perfect ? POINTS.perfectBonus : 0);
}

/**
 * Level n starts at 50·n·(n−1) earned points: 0, 100, 300, 600, 1000, 1500…
 * A steady year of one or two lessons a day lands somewhere around level 15–20.
 */
export function levelStart(level: number): number {
  return 50 * level * (level - 1);
}

export interface LevelInfo {
  level: number;
  /** Points earned inside the current level. */
  into: number;
  /** Points the current level spans. */
  span: number;
}

export function levelFor(earned: number): LevelInfo {
  let level = 1;
  while (earned >= levelStart(level + 1)) level++;
  const start = levelStart(level);
  return { level, into: earned - start, span: levelStart(level + 1) - start };
}
