/**
 * Study race rules, pure and shared by the server and the tests.
 *
 * Two students race along parallel tracks of five cells. Each round both get
 * the same question; the first right answer moves its author one cell
 * forward and ends the round for both. A wrong answer locks that student out
 * until the next question. First past the fifth cell wins.
 *
 * "First" is fair to slow connections: each student's clock starts when the
 * server hands them the question (capped a few seconds after the round
 * opens), and the faster reaction wins, not the earlier packet.
 */

export type Track = "sat" | "ielts";
export type Level = "easy" | "medium" | "hard";

export const TRACKS: { id: Track; name: string; sections: string }[] = [
  { id: "sat", name: "SAT", sections: "Math и Reading and Writing" },
  { id: "ielts", name: "IELTS", sections: "Reading и Listening" },
];

export function isTrack(value: unknown): value is Track {
  return value === "sat" || value === "ielts";
}

export const CELLS = 5;
export const START_RATING = 1000;
export const MIN_RATING = 100;

// ------------------------------------------------------------------- Elo --

export function expectedScore(rating: number, opponent: number): number {
  return 1 / (1 + Math.pow(10, (opponent - rating) / 400));
}

/** Bigger steps while a rating is still settling. */
export function kFactor(games: number): number {
  return games < 10 ? 40 : 24;
}

/** Rating change for a result: 1 win, 0.5 draw, 0 loss. */
export function eloDelta(rating: number, opponent: number, score: 0 | 0.5 | 1, games: number): number {
  return Math.round(kFactor(games) * (score - expectedScore(rating, opponent)));
}

export function applyDelta(rating: number, delta: number): number {
  return Math.max(MIN_RATING, rating + delta);
}

// ----------------------------------------------------------- matchmaking --

export const QUEUE_STALE_MS = 15_000;

/** How far apart two ratings may be after waiting this long: ±100, widening by 50 every 5 s, up to ±400. */
export function matchWindow(waitMs: number): number {
  return Math.min(400, 100 + 50 * Math.floor(Math.max(0, waitMs) / 5000));
}

export function canMatch(a: { rating: number; waitMs: number }, b: { rating: number; waitMs: number }): boolean {
  return Math.abs(a.rating - b.rating) <= Math.max(matchWindow(a.waitMs), matchWindow(b.waitMs));
}

// ------------------------------------------------------------ difficulty --

export const LEVELS: Level[] = ["easy", "medium", "hard"];

/**
 * One difficulty for the whole match, from both ratings: 0 = easy, 1 = medium,
 * 2 = hard, and anything in between. 750 and below is all easy, 1100 is
 * medium, 1450 and above is all hard.
 */
export function matchDifficulty(ratingA: number, ratingB: number): number {
  const avg = (ratingA + ratingB) / 2;
  return Math.min(2, Math.max(0, (avg - 750) / 350));
}

/**
 * The level of one round. Between two levels the share of the harder one
 * grows smoothly with the difficulty; `roll` is a random number in [0, 1).
 */
export function levelForRound(difficulty: number, roll: number): Level {
  const lower = Math.floor(difficulty);
  const index = roll < difficulty - lower ? lower + 1 : lower;
  return LEVELS[Math.min(2, index)];
}

// ---------------------------------------------------------------- rounds --

/** "Opponent found" pause before the first question. */
export const FIRST_ROUND_DELAY_MS = 5_000;
/** Feedback on the last round, then a countdown to the next. */
export const BETWEEN_ROUNDS_MS = 4_500;
/** A student who has not fetched the question by now starts the clock anyway. */
export const GRACE_MS = 5_000;
/** Network slack for an answer sent just before the time ran out. */
export const ANSWER_TOLERANCE_MS = 750;
export const MAX_RACE_MS = 15 * 60_000;
export const MAX_ROUNDS = 30;
/** No contact for this long during a race counts as leaving it. */
export const DISCONNECT_MS = 60_000;
export const INVITE_TTL_MS = 10 * 60_000;

export interface RoundAnswer {
  correct: boolean;
  atMs: number;
}

export interface RoundState {
  opensMs: number;
  durationMs: number;
  /** When each side received the question, if they have. */
  start: [number | null, number | null];
  answers: [RoundAnswer | null, RoundAnswer | null];
}

/** When a side's clock started: on delivery, or at the grace cap if they never fetched it. */
export function startOf(r: RoundState, side: 0 | 1, now: number): number | null {
  const s = r.start[side];
  if (s !== null) return s;
  const cap = r.opensMs + GRACE_MS;
  return now >= cap ? cap : null;
}

/** The last moment a side's answer is accepted. */
export function deadlineOf(r: RoundState, side: 0 | 1, now: number): number | null {
  const s = startOf(r, side, now);
  return s === null ? null : s + r.durationMs + ANSWER_TOLERANCE_MS;
}

function reaction(r: RoundState, side: 0 | 1): number {
  const a = r.answers[side];
  if (!a) return Infinity;
  return a.atMs - (r.start[side] ?? r.opensMs + GRACE_MS);
}

export type Resolution = { done: false } | { done: true; winner: 0 | 1 | null };

/**
 * Decides a round once nothing can change it any more:
 *   - the fastest right answer wins, as soon as the other side can no longer
 *     beat its reaction time (answered, or ran out of that much time);
 *   - nobody moves if both answered wrong, or both ran out of time.
 */
export function resolveRound(r: RoundState, now: number): Resolution {
  let best: 0 | 1 | null = null;
  for (const side of [0, 1] as const) {
    const a = r.answers[side];
    if (!a?.correct) continue;
    if (best === null) best = side;
    else {
      const [rs, rb] = [reaction(r, side), reaction(r, best)];
      if (rs < rb || (rs === rb && a.atMs < r.answers[best]!.atMs)) best = side;
    }
  }

  if (best !== null) {
    const other = best === 0 ? 1 : 0;
    if (r.answers[other]) return { done: true, winner: best };
    // The other side could still answer faster than `best` did, measured from their own start.
    const otherStart = r.start[other] ?? r.opensMs + GRACE_MS;
    return now >= otherStart + reaction(r, best) ? { done: true, winner: best } : { done: false };
  }

  const finished = (side: 0 | 1) => {
    if (r.answers[side]) return true;
    const deadline = deadlineOf(r, side, now);
    return deadline !== null && now > deadline;
  };
  return finished(0) && finished(1) ? { done: true, winner: null } : { done: false };
}

// --------------------------------------------------------------- results --

export const RACE_REWARD = { win: 20, draw: 10, loss: 6 } as const;
export const REWARDED_RACES_PER_DAY = 5;

/** Who wins when the race stops early (time limit): the one further ahead, else a draw. */
export function leader(posA: number, posB: number): 0 | 1 | null {
  return posA === posB ? null : posA > posB ? 0 : 1;
}

// ------------------------------------------------------------ calibration --

/** Six questions from easy to hard; harder ones count more. */
export const CALIBRATION_LEVELS: Level[] = ["easy", "easy", "medium", "medium", "hard", "hard"];
const WEIGHT: Record<Level, number> = { easy: 1, medium: 2, hard: 3 };

/** 0 of 12 points → 700, all 12 → 1300. */
export function calibratedRating(results: { level: Level; correct: boolean }[]): number {
  const points = results.reduce((sum, r) => sum + (r.correct ? WEIGHT[r.level] : 0), 0);
  return 700 + 50 * points;
}
