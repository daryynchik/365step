/**
 * Study races between two students: matchmaking, rounds, answers, results.
 *
 * The server is the only authority. It opens rounds, hands out questions,
 * checks answers, decides who was first and finishes the race. Every state
 * change is a conditional UPDATE inside a transaction (a "claim"), so two
 * students polling at the same moment cannot resolve a round twice, move a
 * racer twice, or pay a result twice. Clients poll /api/race/... about once a
 * second; any request moves the race forward (lib/race-rules.ts decides).
 *
 * Every function takes `now` (epoch ms) so tests can move time.
 */

import { randomInt, randomUUID } from "node:crypto";

import { isCorrect, type Response } from "./answers";
import { ensureArena, getRacer } from "./arena";
import type { Racer } from "./arena-rules";
import { all, json, num, one, run, scalar, str, transaction } from "./db";
import { nowIso, todayIso } from "./date";
import { areFriends } from "./friends";
import { addPoints } from "./game";
import {
  applyDelta,
  BETWEEN_ROUNDS_MS,
  calibratedRating,
  CALIBRATION_LEVELS,
  canMatch,
  CELLS,
  deadlineOf,
  DISCONNECT_MS,
  eloDelta,
  FIRST_ROUND_DELAY_MS,
  GRACE_MS,
  INVITE_TTL_MS,
  isTrack,
  leader,
  LEVELS,
  levelForRound,
  matchDifficulty,
  matchWindow,
  MAX_RACE_MS,
  MAX_ROUNDS,
  QUEUE_STALE_MS,
  RACE_REWARD,
  resolveRound,
  REWARDED_RACES_PER_DAY,
  START_RATING,
  type Level,
  type RoundState,
  type Track,
} from "./race-rules";
import { publicQuestion, raceTask, raceTasksOf, SECTION_NAMES, TRACK_SECTIONS, type PublicQuestion, type RaceAudio, type RaceTask } from "./race-tasks";

type Side = 0 | 1;
const COL = ["a", "b"] as const;
/** Questions a student saw within this window are not shown again. */
const RECENT_MS = 30 * 24 * 3600_000;
/** Rounds that must be played before leaving a race still pays the one who stayed. */
const MIN_PAID_ROUNDS = 3;

export type Outcome<T = object> = ({ ok: true } & T) | { ok: false; error: string };

class Refused extends Error {}

async function refusable<T>(fn: () => Promise<Outcome<T>>): Promise<Outcome<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message };
    throw error;
  }
}

// ---------------------------------------------------------------- ratings --

export interface Rating {
  track: Track;
  rating: number;
  games: number;
  wins: number;
  calibrated: boolean;
}

export async function getRating(userId: string, track: Track): Promise<Rating> {
  const row = await one("SELECT rating, games, wins, calibrated FROM race_ratings WHERE user_id = ? AND track = ?", [userId, track]);
  return {
    track,
    rating: row ? num(row.rating) : START_RATING,
    games: num(row?.games),
    wins: num(row?.wins),
    calibrated: num(row?.calibrated) === 1,
  };
}

async function ensureRatingRow(userId: string, track: Track): Promise<void> {
  await run("INSERT INTO race_ratings (user_id, track, rating, games, wins, calibrated, updated_at) VALUES (?, ?, ?, 0, 0, 0, ?) ON CONFLICT DO NOTHING", [
    userId,
    track,
    START_RATING,
    nowIso(),
  ]);
}

// ------------------------------------------------------------------- races --

export interface RaceRow {
  id: string;
  track: Track;
  mode: "rated" | "friendly";
  status: "active" | "finished";
  users: [string, string];
  ratings: [number, number];
  difficulty: number;
  pos: [number, number];
  roundNo: number;
  winner: Side | null;
  reason: string | null;
  delta: [number, number];
  coins: [number, number];
  createdMs: number;
  finishedMs: number | null;
  seen: [number, number];
}

function toRace(r: Record<string, unknown>): RaceRow {
  return {
    id: str(r.id),
    track: str(r.track) as Track,
    mode: str(r.mode) as RaceRow["mode"],
    status: str(r.status) as RaceRow["status"],
    users: [str(r.user_a), str(r.user_b)],
    ratings: [num(r.rating_a), num(r.rating_b)],
    difficulty: num(r.difficulty),
    pos: [num(r.pos_a), num(r.pos_b)],
    roundNo: num(r.round_no),
    winner: r.winner === null || r.winner === undefined ? null : (num(r.winner) as Side),
    reason: r.reason === null || r.reason === undefined ? null : str(r.reason),
    delta: [num(r.delta_a), num(r.delta_b)],
    coins: [num(r.coins_a), num(r.coins_b)],
    createdMs: num(r.created_ms),
    finishedMs: r.finished_ms === null || r.finished_ms === undefined ? null : num(r.finished_ms),
    seen: [num(r.seen_a_ms), num(r.seen_b_ms)],
  };
}

async function loadRace(id: string): Promise<RaceRow | null> {
  const row = await one("SELECT * FROM races WHERE id = ?", [id]);
  return row ? toRace(row) : null;
}

export async function activeRaceId(userId: string): Promise<string | null> {
  const row = await one("SELECT id FROM races WHERE status = 'active' AND (user_a = ? OR user_b = ?) ORDER BY created_ms DESC LIMIT 1", [userId, userId]);
  return row ? str(row.id) : null;
}

interface RoundRow {
  roundNo: number;
  taskId: string;
  level: Level;
  opensMs: number;
  durationMs: number;
  start: [number | null, number | null];
  winner: number | null;
  resolvedMs: number | null;
}

function toRound(r: Record<string, unknown>): RoundRow {
  const maybe = (v: unknown) => (v === null || v === undefined ? null : num(v));
  return {
    roundNo: num(r.round_no),
    taskId: str(r.task_id),
    level: str(r.level) as Level,
    opensMs: num(r.opens_ms),
    durationMs: num(r.duration_ms),
    start: [maybe(r.start_a_ms), maybe(r.start_b_ms)],
    winner: maybe(r.winner),
    resolvedMs: maybe(r.resolved_ms),
  };
}

interface AnswerRow {
  roundNo: number;
  side: Side;
  response: Response;
  correct: boolean;
  atMs: number;
}

async function loadAnswers(raceId: string, roundNo?: number): Promise<AnswerRow[]> {
  const rows = roundNo
    ? await all("SELECT * FROM race_answers WHERE race_id = ? AND round_no = ?", [raceId, roundNo])
    : await all("SELECT * FROM race_answers WHERE race_id = ?", [raceId]);
  return rows.map((r) => ({
    roundNo: num(r.round_no),
    side: num(r.side) as Side,
    response: json<Response>(r.response, ""),
    correct: num(r.correct) === 1,
    atMs: num(r.at_ms),
  }));
}

/** Picks the next question: the match's level, alternating sections, nothing either student saw recently. */
async function pickTask(race: RaceRow, roundNo: number, now: number): Promise<RaceTask> {
  const sections = TRACK_SECTIONS[race.track];
  const section = sections[(roundNo + race.id.charCodeAt(0)) % sections.length];
  const level = levelForRound(race.difficulty, randomInt(0, 1_000_000) / 1_000_000);
  const [used, seen] = await Promise.all([
    all("SELECT task_id FROM race_rounds WHERE race_id = ?", [race.id]),
    all("SELECT task_id, seen_ms FROM race_seen WHERE user_id IN (?, ?) AND seen_ms > ?", [race.users[0], race.users[1], now - RECENT_MS]),
  ]);
  const usedIds = new Set(used.map((r) => str(r.task_id)));
  const seenIds = new Set(seen.map((r) => str(r.task_id)));
  // Same level first, then the neighbouring ones, then the other section.
  const order = [level, ...LEVELS.filter((l) => l !== level).sort((a, b) => Math.abs(LEVELS.indexOf(a) - LEVELS.indexOf(level)) - Math.abs(LEVELS.indexOf(b) - LEVELS.indexOf(level)))];
  for (const sec of [section, ...sections.filter((s) => s !== section)]) {
    for (const l of order) {
      const fresh = raceTasksOf(sec, l).filter((t) => !usedIds.has(t.id) && !seenIds.has(t.id));
      if (fresh.length) return fresh[randomInt(0, fresh.length)];
    }
  }
  const any = raceTasksOf(section, level).filter((t) => !usedIds.has(t.id));
  const pool = any.length ? any : raceTasksOf(section, level);
  return pool[randomInt(0, pool.length)];
}

async function openRound(race: RaceRow, roundNo: number, opensMs: number, now: number): Promise<void> {
  const task = await pickTask(race, roundNo, now);
  const inserted = await one(
    `INSERT INTO race_rounds (race_id, round_no, task_id, level, opens_ms, duration_ms) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT DO NOTHING RETURNING round_no`,
    [race.id, roundNo, task.id, task.difficulty, opensMs, task.timeMs],
  );
  if (!inserted) return;
  await run("UPDATE races SET round_no = ? WHERE id = ? AND round_no < ?", [roundNo, race.id, roundNo]);
  for (const userId of race.users) {
    await run(
      `INSERT INTO race_seen (user_id, task_id, seen_ms) VALUES (?, ?, ?)
       ON CONFLICT (user_id, task_id) DO UPDATE SET seen_ms = excluded.seen_ms`,
      [userId, task.id, now],
    );
  }
}

async function createRace(userA: string, userB: string, track: Track, mode: RaceRow["mode"], now: number): Promise<string> {
  for (const u of [userA, userB]) {
    if (await activeRaceId(u)) throw new Refused("Один из участников уже в гонке.");
    await ensureRatingRow(u, track);
  }
  const [ra, rb] = await Promise.all([getRating(userA, track), getRating(userB, track)]);
  const id = randomUUID();
  await run(
    `INSERT INTO races (id, track, mode, status, user_a, user_b, rating_a, rating_b, difficulty, created_ms, seen_a_ms, seen_b_ms, day)
     VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, track, mode, userA, userB, ra.rating, rb.rating, matchDifficulty(ra.rating, rb.rating), now, now, now, todayIso()],
  );
  await openRound((await loadRace(id))!, 1, now + FIRST_ROUND_DELAY_MS, now);
  return id;
}

async function rewardedToday(userId: string): Promise<number> {
  return scalar(
    "SELECT COUNT(*) FROM races WHERE day = ? AND status = 'finished' AND ((user_a = ? AND coins_a > 0) OR (user_b = ? AND coins_b > 0))",
    [todayIso(), userId, userId],
  );
}

/**
 * Ends a race exactly once. Rated races move both ratings (Elo, from the
 * ratings both had at the start); every finished race pays coins for the first
 * few races of the day. Leaving early gives the leaver nothing.
 */
async function finish(race: RaceRow, winner: Side | null, reason: string, now: number): Promise<void> {
  const claimed = await one(
    "UPDATE races SET status = 'finished', winner = ?, reason = ?, finished_ms = ? WHERE id = ? AND status = 'active' RETURNING id",
    [winner, reason, now, race.id],
  );
  if (!claimed) return;
  if (reason === "abandoned") return;

  const score = (side: Side): 0 | 0.5 | 1 => (winner === null ? 0.5 : winner === side ? 1 : 0);
  const delta: [number, number] = [0, 0];
  if (race.mode === "rated") {
    for (const side of [0, 1] as const) {
      const rating = await getRating(race.users[side], race.track);
      delta[side] = eloDelta(race.ratings[side], race.ratings[side === 0 ? 1 : 0], score(side), rating.games);
      await run("UPDATE race_ratings SET rating = ?, games = games + 1, wins = wins + ?, updated_at = ? WHERE user_id = ? AND track = ?", [
        applyDelta(rating.rating, delta[side]),
        score(side) === 1 ? 1 : 0,
        nowIso(),
        race.users[side],
        race.track,
      ]);
    }
  }

  const coins: [number, number] = [0, 0];
  // A race left after fewer than three rounds pays nobody, so coins cannot be handed over by quitting.
  const early = (reason === "forfeit" || reason === "disconnect") && (await scalar("SELECT COUNT(*) FROM race_rounds WHERE race_id = ? AND winner IS NOT NULL", [race.id])) < MIN_PAID_ROUNDS;
  for (const side of [0, 1] as const) {
    const left = (reason === "forfeit" || reason === "disconnect") && winner !== side;
    if (early || left || (await rewardedToday(race.users[side])) >= REWARDED_RACES_PER_DAY) continue;
    coins[side] = winner === null ? RACE_REWARD.draw : winner === side ? RACE_REWARD.win : RACE_REWARD.loss;
    const label = winner === null ? "ничья" : winner === side ? "победа" : "участие";
    await addPoints(race.users[side], coins[side], `Соревнование: ${label}`, race.id);
  }
  await run("UPDATE races SET delta_a = ?, delta_b = ?, coins_a = ?, coins_b = ? WHERE id = ?", [delta[0], delta[1], coins[0], coins[1], race.id]);
}

function roundState(round: RoundRow, answers: AnswerRow[]): RoundState {
  const of = (side: Side) => {
    const a = answers.find((x) => x.side === side);
    return a ? { correct: a.correct, atMs: a.atMs } : null;
  };
  return { opensMs: round.opensMs, durationMs: round.durationMs, start: round.start, answers: [of(0), of(1)] };
}

/** Moves a race forward to `now`: limits, disconnects, the current round. */
export async function advance(raceId: string, now: number): Promise<void> {
  await transaction(async () => {
    const race = await loadRace(raceId);
    if (!race || race.status !== "active") return;

    const away = [now - race.seen[0] > DISCONNECT_MS, now - race.seen[1] > DISCONNECT_MS];
    if (away[0] && away[1]) return finish(race, null, "abandoned", now);
    if (away[0] || away[1]) return finish(race, away[0] ? 1 : 0, "disconnect", now);
    if (now - race.createdMs >= MAX_RACE_MS) return finish(race, leader(race.pos[0], race.pos[1]), "time", now);

    const row = await one("SELECT * FROM race_rounds WHERE race_id = ? AND round_no = ?", [raceId, race.roundNo]);
    if (!row) return;
    const round = toRound(row);
    if (round.winner !== null || now < round.opensMs) return;

    const result = resolveRound(roundState(round, await loadAnswers(raceId, round.roundNo)), now);
    if (!result.done) return;
    const claimed = await one(
      "UPDATE race_rounds SET winner = ?, resolved_ms = ? WHERE race_id = ? AND round_no = ? AND winner IS NULL RETURNING round_no",
      [result.winner ?? -1, now, raceId, round.roundNo],
    );
    if (!claimed) return;

    if (result.winner !== null) {
      const col = COL[result.winner];
      await run(`UPDATE races SET pos_${col} = pos_${col} + 1 WHERE id = ?`, [raceId]);
      if (race.pos[result.winner] + 1 >= CELLS) return finish(race, result.winner, "finish", now);
    }
    if (round.roundNo >= MAX_ROUNDS) {
      const pos: [number, number] = [...race.pos];
      if (result.winner !== null) pos[result.winner]++;
      return finish(race, leader(pos[0], pos[1]), "rounds", now);
    }
    await openRound(race, round.roundNo + 1, now + BETWEEN_ROUNDS_MS, now);
  });
}

function sideOf(race: RaceRow, userId: string): Side | null {
  return race.users[0] === userId ? 0 : race.users[1] === userId ? 1 : null;
}

export async function submitAnswer(userId: string, raceId: string, roundNo: number, response: Response, now: number): Promise<Outcome<{ correct: boolean }>> {
  return refusable(async (): Promise<Outcome<{ correct: boolean }>> => {
    const race = await loadRace(raceId);
    const side = race ? sideOf(race, userId) : null;
    if (!race || side === null) return { ok: false, error: "Гонка не найдена." };
    if (race.status !== "active") return { ok: false, error: "Гонка уже закончилась." };
    if (roundNo !== race.roundNo) return { ok: false, error: "Этот вопрос уже закрыт." };
    const row = await one("SELECT * FROM race_rounds WHERE race_id = ? AND round_no = ?", [raceId, roundNo]);
    const round = row ? toRound(row) : null;
    if (!round || round.winner !== null) return { ok: false, error: "Этот вопрос уже закрыт." };
    if (round.start[side] === null) return { ok: false, error: "Вопрос ещё не открыт." };
    const deadline = deadlineOf(roundState(round, []), side, now)!;
    if (now > deadline) return { ok: false, error: "Время на ответ вышло." };
    const task = raceTask(round.taskId);
    if (!task) return { ok: false, error: "Задание не найдено." };
    if (typeof response !== "number" && typeof response !== "string") return { ok: false, error: "Пустой ответ." };

    const correct = isCorrect(task.question, response);
    const inserted = await one(
      "INSERT INTO race_answers (race_id, round_no, side, response, correct, at_ms) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING side",
      [raceId, roundNo, side, JSON.stringify(response), correct ? 1 : 0, now],
    );
    if (!inserted) return { ok: false, error: "Ответ на этот вопрос уже принят." };
    await advance(raceId, now);
    return { ok: true, correct };
  });
}

/** Leaving a race on purpose: the opponent wins. */
export async function forfeit(userId: string, raceId: string, now: number): Promise<Outcome> {
  return transaction(async () => {
    const race = await loadRace(raceId);
    const side = race ? sideOf(race, userId) : null;
    if (!race || side === null) return { ok: false, error: "Гонка не найдена." };
    if (race.status !== "active") return { ok: false, error: "Гонка уже закончилась." };
    await finish(race, side === 0 ? 1 : 0, "forfeit", now);
    return { ok: true };
  });
}

// ------------------------------------------------------------------ state --

export interface RacerView {
  userId: string;
  side: Side;
  pos: number;
  rating: number;
  delta: number;
  coins: number;
}

export interface ReviewAnswer {
  answer: string;
  correct: boolean;
  seconds: number;
}

export interface ReviewRound {
  no: number;
  section: string;
  topic: string;
  level: Level;
  prompt: string;
  passages?: PublicQuestion["passages"];
  options?: string[];
  correctAnswer: string;
  explanation: string;
  winner: "me" | "opp" | "none";
  me: ReviewAnswer | null;
  opp: ReviewAnswer | null;
}

export interface RaceView {
  id: string;
  track: Track;
  mode: RaceRow["mode"];
  status: RaceRow["status"];
  reason: string | null;
  winner: "me" | "opp" | "none" | null;
  serverNow: number;
  startedMs: number;
  endsMs: number;
  me: RacerView;
  opp: RacerView;
  /** Names and looks; sent on the first load only (they do not change during a race). */
  racers: { me: Racer; opp: Racer } | null;
  round: {
    no: number;
    phase: "countdown" | "open";
    opensMs: number;
    level: Level;
    section: string;
    topic: string;
    timeMs: number;
    deadlineMs: number | null;
    question: PublicQuestion | null;
    audio: RaceAudio | null;
    myAnswer: { correct: boolean } | null;
    oppAnswered: boolean;
  } | null;
  /** The round that just ended, for feedback while the next one counts down. */
  last: { no: number; winner: "me" | "opp" | "none"; myCorrect: boolean | null; oppCorrect: boolean | null; correctAnswer: string } | null;
  review: ReviewRound[] | null;
  topics: string[] | null;
}

function answerLabel(task: RaceTask, response: Response): string {
  const q = task.question;
  if (q.kind === "choice" && typeof response === "number") return `${String.fromCharCode(65 + response)}. ${q.options[response] ?? ""}`;
  return String(response);
}

function correctLabel(task: RaceTask): string {
  const q = task.question;
  return q.kind === "choice" ? `${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}` : q.answers[0];
}

async function loadRounds(raceId: string): Promise<RoundRow[]> {
  return (await all("SELECT * FROM race_rounds WHERE race_id = ? ORDER BY round_no", [raceId])).map(toRound);
}

/** Whether advance() would change anything now. Checked in memory, so a quiet poll costs no transaction. */
function dueToAdvance(race: RaceRow, rounds: RoundRow[], answers: AnswerRow[], now: number): boolean {
  if (race.status !== "active") return false;
  if (now - race.seen[0] > DISCONNECT_MS || now - race.seen[1] > DISCONNECT_MS) return true;
  if (now - race.createdMs >= MAX_RACE_MS) return true;
  const cur = rounds.find((r) => r.roundNo === race.roundNo);
  if (!cur || cur.winner !== null || now < cur.opensMs) return false;
  return resolveRound(roundState(cur, answers.filter((a) => a.roundNo === cur.roundNo)), now).done;
}

/**
 * The race as one participant sees it. Also records that they are present,
 * moves the race forward when something is due, and starts their clock the
 * first time they receive the current question. A quiet poll is two round
 * trips to the database: the presence update (which returns the race) and
 * the rounds with their answers.
 */
export async function raceView(userId: string, raceId: string, now: number, options: { racers?: boolean } = {}): Promise<RaceView | null> {
  const row = await one(
    `UPDATE races SET seen_a_ms = CASE WHEN user_a = ? AND status = 'active' THEN ? ELSE seen_a_ms END,
                      seen_b_ms = CASE WHEN user_b = ? AND status = 'active' THEN ? ELSE seen_b_ms END
      WHERE id = ? AND (user_a = ? OR user_b = ?) RETURNING *`,
    [userId, now, userId, now, raceId, userId, userId],
  );
  if (!row) return null;
  let race = toRace(row);
  const side = sideOf(race, userId)!;
  let [rounds, answers] = await Promise.all([loadRounds(raceId), loadAnswers(raceId)]);
  if (dueToAdvance(race, rounds, answers, now)) {
    await advance(raceId, now);
    [race, rounds, answers] = await Promise.all([loadRace(raceId).then((r) => r!), loadRounds(raceId), loadAnswers(raceId)]);
  }

  const other: Side = side === 0 ? 1 : 0;
  const racers = options.racers === false ? null : await Promise.all([getRacer(race.users[side]), getRacer(race.users[other])]).then(([me, opp]) => ({ me, opp }));
  const view = (s: Side): RacerView => ({ userId: race.users[s], side: s, pos: race.pos[s], rating: race.ratings[s], delta: race.delta[s], coins: race.coins[s] });
  const who = (w: number | null): "me" | "opp" | "none" => (w === side ? "me" : w === other ? "opp" : "none");
  const answerOf = (roundNo: number, s: Side) => answers.find((a) => a.roundNo === roundNo && a.side === s) ?? null;

  let current: RaceView["round"] = null;
  const cur = rounds.find((r) => r.roundNo === race.roundNo);
  if (race.status === "active" && cur && cur.winner === null) {
    const task = raceTask(cur.taskId)!;
    let start = cur.start[side];
    if (now >= cur.opensMs && start === null) {
      // The first delivery sets the clock; a concurrent poll keeps the earlier value.
      const set = await one(
        `UPDATE race_rounds SET start_${COL[side]}_ms = COALESCE(start_${COL[side]}_ms, ?) WHERE race_id = ? AND round_no = ? RETURNING start_${COL[side]}_ms AS s`,
        [Math.min(now, cur.opensMs + GRACE_MS), raceId, cur.roundNo],
      );
      start = num(set?.s);
    }
    const open = now >= cur.opensMs && start !== null;
    const mine = answerOf(cur.roundNo, side);
    current = {
      no: cur.roundNo,
      phase: open ? "open" : "countdown",
      opensMs: cur.opensMs,
      level: cur.level,
      section: SECTION_NAMES[task.section],
      topic: task.topic,
      timeMs: cur.durationMs,
      deadlineMs: open ? start! + cur.durationMs : null,
      question: open ? publicQuestion(task) : null,
      audio: open ? (task.audio ?? null) : null,
      myAnswer: mine ? { correct: mine.correct } : null,
      oppAnswered: answerOf(cur.roundNo, other) !== null,
    };
  }

  const resolved = rounds.filter((r) => r.winner !== null);
  const lastRound = resolved[resolved.length - 1];
  const last: RaceView["last"] = lastRound
    ? {
        no: lastRound.roundNo,
        winner: who(lastRound.winner === -1 ? null : lastRound.winner),
        myCorrect: answerOf(lastRound.roundNo, side)?.correct ?? null,
        oppCorrect: answerOf(lastRound.roundNo, other)?.correct ?? null,
        correctAnswer: correctLabel(raceTask(lastRound.taskId)!),
      }
    : null;

  let review: ReviewRound[] | null = null;
  let topics: string[] | null = null;
  if (race.status === "finished") {
    review = resolved.map((r) => {
      const task = raceTask(r.taskId)!;
      const q = publicQuestion(task);
      const pack = (s: Side): ReviewAnswer | null => {
        const a = answerOf(r.roundNo, s);
        const start = r.start[s] ?? r.opensMs + GRACE_MS;
        return a ? { answer: answerLabel(task, a.response), correct: a.correct, seconds: Math.max(0, Math.round((a.atMs - start) / 100) / 10) } : null;
      };
      return {
        no: r.roundNo,
        section: SECTION_NAMES[task.section],
        topic: task.topic,
        level: r.level,
        prompt: q.prompt,
        passages: q.passages,
        options: q.options,
        correctAnswer: correctLabel(task),
        explanation: task.question.explanation,
        winner: who(r.winner === -1 ? null : r.winner),
        me: pack(side),
        opp: pack(other),
      };
    });
    topics = [...new Set(review.filter((r) => !r.me?.correct).map((r) => `${r.section}: ${r.topic}`))];
  }

  return {
    id: race.id,
    track: race.track,
    mode: race.mode,
    status: race.status,
    reason: race.reason,
    winner: race.status === "finished" ? who(race.winner) : null,
    serverNow: now,
    startedMs: race.createdMs,
    endsMs: race.createdMs + MAX_RACE_MS,
    me: view(side),
    opp: view(other),
    racers,
    round: current,
    last,
    review,
    topics,
  };
}

// ------------------------------------------------------------ matchmaking --

export type QueueStatus =
  | { status: "idle" }
  | { status: "race"; raceId: string }
  | { status: "searching"; track: Track; rating: number; waitedMs: number; window: number };

export async function joinQueue(userId: string, track: string, now: number): Promise<Outcome<{ queue: QueueStatus }>> {
  if (!isTrack(track)) return { ok: false, error: "Выбери направление: SAT или IELTS." };
  await ensureArena(userId);
  const active = await activeRaceId(userId);
  if (active) return { ok: true, queue: { status: "race", raceId: active } };
  await ensureRatingRow(userId, track);
  const { rating } = await getRating(userId, track);
  await run(
    `INSERT INTO race_queue (user_id, track, rating, joined_ms, seen_ms) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET track = excluded.track, rating = excluded.rating, joined_ms = excluded.joined_ms, seen_ms = excluded.seen_ms`,
    [userId, track, rating, now, now],
  );
  return { ok: true, queue: await pollQueue(userId, now) };
}

export async function leaveQueue(userId: string): Promise<void> {
  await run("DELETE FROM race_queue WHERE user_id = ?", [userId]);
}

/**
 * The searcher's heartbeat. Looks for the closest rating in the same track
 * within the allowed window (it widens the longer either student waits), and
 * claims both queue rows at once so a student is never matched twice.
 */
export async function pollQueue(userId: string, now: number): Promise<QueueStatus> {
  const active = await activeRaceId(userId);
  if (active) return { status: "race", raceId: active };
  const mine = await one("SELECT * FROM race_queue WHERE user_id = ?", [userId]);
  if (!mine) return { status: "idle" };
  await run("UPDATE race_queue SET seen_ms = ? WHERE user_id = ?", [now, userId]);
  await run("DELETE FROM race_queue WHERE seen_ms < ?", [now - QUEUE_STALE_MS]);

  const me = { rating: num(mine.rating), waitMs: now - num(mine.joined_ms) };
  const track = str(mine.track) as Track;
  const candidates = await all("SELECT * FROM race_queue WHERE track = ? AND user_id <> ? AND seen_ms >= ? ORDER BY joined_ms", [
    track,
    userId,
    now - QUEUE_STALE_MS,
  ]);
  const match = candidates
    .map((c) => ({ id: str(c.user_id), rating: num(c.rating), waitMs: now - num(c.joined_ms) }))
    .filter((c) => canMatch(me, c))
    .sort((a, b) => Math.abs(a.rating - me.rating) - Math.abs(b.rating - me.rating))[0];

  if (match) {
    const raceId = await transaction(async () => {
      const taken = await all("DELETE FROM race_queue WHERE user_id IN (?, ?) RETURNING user_id", [userId, match.id]);
      if (taken.length !== 2) throw new Refused("taken");
      return createRace(match.id, userId, track, "rated", now);
    }).catch((error) => {
      if (error instanceof Refused) return null;
      throw error;
    });
    if (raceId) return { status: "race", raceId };
    const still = await one("SELECT user_id FROM race_queue WHERE user_id = ?", [userId]);
    if (!still) {
      const raced = await activeRaceId(userId);
      return raced ? { status: "race", raceId: raced } : { status: "idle" };
    }
  }
  return { status: "searching", track, rating: me.rating, waitedMs: me.waitMs, window: matchWindow(me.waitMs) };
}

// ---------------------------------------------------------------- invites --

export interface Invite {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  track: Track;
  status: string;
  raceId: string | null;
  expiresMs: number;
}

export async function inviteFriend(userId: string, friendId: string, track: string, now: number): Promise<Outcome> {
  if (!isTrack(track)) return { ok: false, error: "Выбери направление: SAT или IELTS." };
  if (userId === friendId) return { ok: false, error: "Себя пригласить нельзя." };
  if (!(await areFriends(userId, friendId))) return { ok: false, error: "Приглашать можно только друзей." };
  const [a, b] = [userId, friendId].sort();
  return transaction(async () => {
    await run("UPDATE race_invites SET status = 'expired' WHERE pair_a = ? AND pair_b = ? AND status = 'pending' AND expires_ms <= ?", [a, b, now]);
    const inserted = await one(
      `INSERT INTO race_invites (id, from_id, to_id, pair_a, pair_b, track, status, created_ms, expires_ms)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?) ON CONFLICT DO NOTHING RETURNING id`,
      [randomUUID(), userId, friendId, a, b, track, now, now + INVITE_TTL_MS],
    );
    return inserted ? { ok: true } : { ok: false, error: "Между вами уже есть приглашение. Ответь на него или дождись друга." };
  });
}

export async function getInvites(userId: string, now: number): Promise<Invite[]> {
  const rows = await all(
    `SELECT i.*, f.name AS from_name, t.name AS to_name FROM race_invites i
       JOIN users f ON f.id = i.from_id JOIN users t ON t.id = i.to_id
      WHERE (i.from_id = ? OR i.to_id = ?) AND i.status = 'pending' AND i.expires_ms > ?
      ORDER BY i.created_ms DESC`,
    [userId, userId, now],
  );
  return rows.map((r) => ({
    id: str(r.id),
    fromId: str(r.from_id),
    toId: str(r.to_id),
    fromName: str(r.from_name),
    toName: str(r.to_name),
    track: str(r.track) as Track,
    status: str(r.status),
    raceId: r.race_id ? str(r.race_id) : null,
    expiresMs: num(r.expires_ms),
  }));
}

export async function respondInvite(userId: string, inviteId: string, response: string, now: number): Promise<Outcome<{ raceId?: string }>> {
  if (!["accept", "decline", "cancel"].includes(response)) return { ok: false, error: "Неизвестное действие." };
  return refusable(() =>
    transaction(async (): Promise<Outcome<{ raceId?: string }>> => {
      const invite = await one("SELECT * FROM race_invites WHERE id = ? AND status = 'pending' AND expires_ms > ?", [inviteId, now]);
      if (!invite) return { ok: false, error: "Приглашение уже обработано или истекло." };
      const actor = response === "cancel" ? str(invite.from_id) : str(invite.to_id);
      if (actor !== userId) return { ok: false, error: "Это не твоё приглашение." };
      const status = response === "accept" ? "accepted" : response === "decline" ? "declined" : "cancelled";
      const claimed = await one("UPDATE race_invites SET status = ? WHERE id = ? AND status = 'pending' RETURNING id", [status, inviteId]);
      if (!claimed) return { ok: false, error: "Приглашение уже обработано." };
      if (response !== "accept") return { ok: true };
      if (!(await areFriends(str(invite.from_id), str(invite.to_id)))) throw new Refused("Для гонки нужно оставаться друзьями.");
      await leaveQueue(str(invite.from_id));
      await leaveQueue(str(invite.to_id));
      const raceId = await createRace(str(invite.from_id), str(invite.to_id), str(invite.track) as Track, "friendly", now);
      await run("UPDATE race_invites SET race_id = ? WHERE id = ?", [raceId, inviteId]);
      return { ok: true, raceId };
    }),
  );
}

// ------------------------------------------------------------ calibration --

export interface CalibrationView {
  id: string;
  track: Track;
  index: number;
  total: number;
  question: PublicQuestion | null;
  audio: RaceAudio | null;
  section: string;
  topic: string;
  level: Level;
  done: boolean;
  rating: number | null;
  results: { correct: boolean; level: Level }[];
}

export async function startCalibration(userId: string, track: string, now: number): Promise<Outcome<{ id: string }>> {
  if (!isTrack(track)) return { ok: false, error: "Выбери направление: SAT или IELTS." };
  const rating = await getRating(userId, track);
  if (rating.calibrated || rating.games > 0) return { ok: false, error: "Рейтинг по этому направлению уже определён." };
  const open = await one("SELECT id FROM race_calibrations WHERE user_id = ? AND track = ? AND status = 'active'", [userId, track]);
  if (open) return { ok: true, id: str(open.id) };
  const sections = TRACK_SECTIONS[track];
  const tasks = CALIBRATION_LEVELS.map((level, i) => {
    const pool = raceTasksOf(sections[i % sections.length], level);
    return pool[randomInt(0, pool.length)].id;
  });
  const id = randomUUID();
  await run("INSERT INTO race_calibrations (id, user_id, track, tasks, answers, status, created_ms) VALUES (?, ?, ?, ?, '[]', 'active', ?)", [
    id,
    userId,
    track,
    JSON.stringify(tasks),
    now,
  ]);
  return { ok: true, id };
}

async function loadCalibration(userId: string, id: string) {
  const row = await one("SELECT * FROM race_calibrations WHERE id = ? AND user_id = ?", [id, userId]);
  if (!row) return null;
  return {
    id,
    track: str(row.track) as Track,
    tasks: json<string[]>(row.tasks, []),
    answers: json<{ correct: boolean }[]>(row.answers, []),
    status: str(row.status),
  };
}

export async function calibrationView(userId: string, id: string): Promise<CalibrationView | null> {
  const c = await loadCalibration(userId, id);
  if (!c) return null;
  const index = c.answers.length;
  const task = index < c.tasks.length ? raceTask(c.tasks[index]) : undefined;
  const results = c.answers.map((a, i) => ({ correct: a.correct, level: CALIBRATION_LEVELS[i] }));
  const rating = c.status === "done" ? (await getRating(userId, c.track)).rating : null;
  return {
    id,
    track: c.track,
    index,
    total: c.tasks.length,
    question: task ? publicQuestion(task) : null,
    audio: task?.audio ?? null,
    section: task ? SECTION_NAMES[task.section] : "",
    topic: task?.topic ?? "",
    level: CALIBRATION_LEVELS[Math.min(index, CALIBRATION_LEVELS.length - 1)],
    done: c.status === "done",
    rating,
    results,
  };
}

export async function answerCalibration(
  userId: string,
  id: string,
  index: number,
  response: Response,
): Promise<Outcome<{ correct: boolean; correctAnswer: string; explanation: string; rating: number | null }>> {
  return transaction(async () => {
    const c = await loadCalibration(userId, id);
    if (!c || c.status !== "active") return { ok: false, error: "Калибровка не найдена или уже завершена." };
    if (index !== c.answers.length) return { ok: false, error: "Этот вопрос уже отвечен." };
    const task = raceTask(c.tasks[index])!;
    const correct = isCorrect(task.question, response);
    const answers = [...c.answers, { correct }];
    const done = answers.length >= c.tasks.length;
    const claimed = await one(
      "UPDATE race_calibrations SET answers = ?, status = ? WHERE id = ? AND status = 'active' AND answers = ? RETURNING id",
      [JSON.stringify(answers), done ? "done" : "active", id, JSON.stringify(c.answers)],
    );
    if (!claimed) return { ok: false, error: "Этот вопрос уже отвечен." };
    let rating: number | null = null;
    if (done) {
      rating = calibratedRating(answers.map((a, i) => ({ correct: a.correct, level: CALIBRATION_LEVELS[i] })));
      await ensureRatingRow(userId, c.track);
      await run("UPDATE race_ratings SET rating = ?, calibrated = 1, updated_at = ? WHERE user_id = ? AND track = ? AND games = 0", [
        rating,
        nowIso(),
        userId,
        c.track,
      ]);
    }
    return { ok: true, correct, correctAnswer: correctLabel(task), explanation: task.question.explanation, rating };
  });
}

// ---------------------------------------------------------------- history --

export interface RaceSummary {
  id: string;
  track: Track;
  mode: RaceRow["mode"];
  result: "win" | "loss" | "draw";
  opponentId: string;
  opponentName: string;
  score: [number, number];
  delta: number;
  coins: number;
  reason: string | null;
  finishedMs: number;
}

export async function recentRaces(userId: string, limit = 8): Promise<RaceSummary[]> {
  const rows = await all(
    `SELECT r.*, ua.name AS name_a, ub.name AS name_b FROM races r
       JOIN users ua ON ua.id = r.user_a JOIN users ub ON ub.id = r.user_b
      WHERE r.status = 'finished' AND (r.user_a = ? OR r.user_b = ?) AND r.reason <> 'abandoned'
      ORDER BY r.finished_ms DESC LIMIT ?`,
    [userId, userId, limit],
  );
  return rows.map((row) => {
    const r = toRace(row);
    const side: Side = r.users[0] === userId ? 0 : 1;
    const other: Side = side === 0 ? 1 : 0;
    return {
      id: r.id,
      track: r.track,
      mode: r.mode,
      result: r.winner === null ? "draw" : r.winner === side ? "win" : "loss",
      opponentId: r.users[other],
      opponentName: str(other === 0 ? row.name_a : row.name_b),
      score: [r.pos[side], r.pos[other]],
      delta: r.delta[side],
      coins: r.coins[side],
      reason: r.reason,
      finishedMs: r.finishedMs ?? r.createdMs,
    };
  });
}
