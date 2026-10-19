/**
 * Friends and the friends leaderboard.
 *
 * A friendship is one row per unordered pair (user_a < user_b), so "are these
 * two friends" and "who are my friends" are each one unambiguous query.
 */

import { randomUUID } from "node:crypto";

import { all, num, one, run, str } from "./db";
import { addDays, nowIso, todayIso, weekStart } from "./date";
import { levelFor } from "./rules";

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface FriendRequest {
  id: string;
  person: Person;
  createdAt: string;
}

export interface Result {
  ok: boolean;
  error?: string;
}

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function sendFriendRequest(userId: string, email: string): Promise<Result> {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return { ok: false, error: "Введи email друга." };

  const target = await one("SELECT id FROM users WHERE email = ?", [normalised]);
  if (!target) return { ok: false, error: "Пользователя с таким email нет. Пригласи его зарегистрироваться." };
  const targetId = str(target.id);
  if (targetId === userId) return { ok: false, error: "Себя добавить нельзя." };

  const [a, b] = pair(userId, targetId);
  const existing = await one("SELECT id, status, requested_by FROM friendships WHERE user_a = ? AND user_b = ?", [a, b]);

  if (existing) {
    const status = str(existing.status);
    if (status === "accepted") return { ok: false, error: "Вы уже друзья." };
    if (status === "pending") {
      // They already asked us: sending back is the same as accepting.
      if (str(existing.requested_by) === targetId) return respondToRequest(userId, str(existing.id), true);
      return { ok: false, error: "Заявка уже отправлена." };
    }
    await run("UPDATE friendships SET status = 'pending', requested_by = ?, created_at = ?, responded_at = NULL WHERE id = ?", [
      userId,
      nowIso(),
      str(existing.id),
    ]);
    return { ok: true };
  }

  await run(
    "INSERT INTO friendships (id, user_a, user_b, status, requested_by, created_at) VALUES (?, ?, ?, 'pending', ?, ?)",
    [randomUUID(), a, b, userId, nowIso()],
  );
  return { ok: true };
}

export async function respondToRequest(userId: string, friendshipId: string, accept: boolean): Promise<Result> {
  const row = await one("SELECT * FROM friendships WHERE id = ?", [friendshipId]);
  if (!row || (str(row.user_a) !== userId && str(row.user_b) !== userId)) {
    return { ok: false, error: "Заявка не найдена." };
  }
  if (str(row.requested_by) === userId) return { ok: false, error: "Это твоя собственная заявка." };
  if (str(row.status) !== "pending") return { ok: false, error: "На эту заявку уже ответили." };

  await run("UPDATE friendships SET status = ?, responded_at = ? WHERE id = ?", [
    accept ? "accepted" : "declined",
    nowIso(),
    friendshipId,
  ]);
  return { ok: true };
}

export async function removeFriend(userId: string, friendId: string): Promise<Result> {
  const [a, b] = pair(userId, friendId);
  await run("DELETE FROM friendships WHERE user_a = ? AND user_b = ?", [a, b]);
  return { ok: true };
}

export async function areFriends(userId: string, otherId: string): Promise<boolean> {
  const [a, b] = pair(userId, otherId);
  const row = await one("SELECT id FROM friendships WHERE user_a = ? AND user_b = ? AND status = 'accepted'", [a, b]);
  return row !== null;
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await all(
    "SELECT user_a, user_b FROM friendships WHERE (user_a = ? OR user_b = ?) AND status = 'accepted'",
    [userId, userId],
  );
  return rows.map((r) => (str(r.user_a) === userId ? str(r.user_b) : str(r.user_a)));
}

export async function getRequests(userId: string): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
  const rows = await all(
    `SELECT f.id, f.requested_by, f.created_at, f.user_a, f.user_b,
            ua.name AS a_name, ua.email AS a_email, ub.name AS b_name, ub.email AS b_email
       FROM friendships f
       JOIN users ua ON ua.id = f.user_a
       JOIN users ub ON ub.id = f.user_b
      WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'pending'
      ORDER BY f.created_at DESC`,
    [userId, userId],
  );

  const incoming: FriendRequest[] = [];
  const outgoing: FriendRequest[] = [];
  for (const r of rows) {
    const iAmA = str(r.user_a) === userId;
    const person = iAmA
      ? { id: str(r.user_b), name: str(r.b_name), email: str(r.b_email) }
      : { id: str(r.user_a), name: str(r.a_name), email: str(r.a_email) };
    const request = { id: str(r.id), person, createdAt: str(r.created_at) };
    (str(r.requested_by) === userId ? outgoing : incoming).push(request);
  }
  return { incoming, outgoing };
}

// ----------------------------------------------------------- leaderboard --

export interface Standing {
  id: string;
  name: string;
  isMe: boolean;
  level: number;
  earned: number;
  earnedWeek: number;
  lessons: number;
  streak: number;
  wins: number;
  losses: number;
}

function placeholders(n: number): string {
  return Array.from({ length: n }, () => "?").join(", ");
}

/**
 * The user and their friends, with everything the leaderboard shows. A handful
 * of grouped queries for the whole group rather than a set of queries per
 * person.
 */
export async function getLeaderboard(userId: string): Promise<Standing[]> {
  const ids = [userId, ...(await getFriendIds(userId))];
  const ph = placeholders(ids.length);
  const week = weekStart(todayIso());
  const yesterday = addDays(todayIso(), -1);

  const [users, points, lessons, streaks, races] = await Promise.all([
    all(`SELECT id, name FROM users WHERE id IN (${ph})`, ids),
    all(
      `SELECT user_id,
              SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS earned,
              SUM(CASE WHEN amount > 0 AND day >= ? THEN amount ELSE 0 END) AS week
         FROM points WHERE user_id IN (${ph}) GROUP BY user_id`,
      [week, ...ids],
    ),
    all(`SELECT user_id, COUNT(*) AS n FROM lesson_results WHERE user_id IN (${ph}) GROUP BY user_id`, ids),
    all(`SELECT user_id, current_days, last_active_date FROM streaks WHERE user_id IN (${ph})`, ids),
    all(
      `SELECT user_a, user_b, winner FROM races
        WHERE status = 'finished' AND reason <> 'abandoned' AND (user_a IN (${ph}) OR user_b IN (${ph}))`,
      [...ids, ...ids],
    ),
  ]);

  const pointsBy = new Map(points.map((r) => [str(r.user_id), r]));
  const lessonsBy = new Map(lessons.map((r) => [str(r.user_id), num(r.n)]));
  const streakBy = new Map(
    streaks.map((r) => {
      const last = str(r.last_active_date);
      return [str(r.user_id), last === todayIso() || last === yesterday ? num(r.current_days) : 0];
    }),
  );

  const record = new Map<string, { wins: number; losses: number }>();
  // Study races: wins and losses (draws count as neither).
  for (const race of races) {
    const winner = race.winner === null || race.winner === undefined ? null : num(race.winner);
    [str(race.user_a), str(race.user_b)].forEach((id, side) => {
      if (!ids.includes(id) || winner === null) return;
      const r = record.get(id) ?? { wins: 0, losses: 0 };
      if (winner === side) r.wins++;
      else r.losses++;
      record.set(id, r);
    });
  }

  return users
    .map((u) => {
      const id = str(u.id);
      const p = pointsBy.get(id);
      const earnedTotal = num(p?.earned);
      return {
        id,
        name: str(u.name),
        isMe: id === userId,
        level: levelFor(earnedTotal).level,
        earned: earnedTotal,
        earnedWeek: num(p?.week),
        lessons: lessonsBy.get(id) ?? 0,
        streak: streakBy.get(id) ?? 0,
        wins: record.get(id)?.wins ?? 0,
        losses: record.get(id)?.losses ?? 0,
      };
    })
    .sort((a, b) => b.earnedWeek - a.earnedWeek || b.earned - a.earned || a.name.localeCompare(b.name));
}
