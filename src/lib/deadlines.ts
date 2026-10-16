/** The student's own application deadlines, with countdowns on the Path page. */

import { randomUUID } from "node:crypto";

import { all, num, one, run, str } from "./db";
import { daysBetween, nowIso, todayIso } from "./date";

export interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
  daysLeft: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function getDeadlines(userId: string): Promise<Deadline[]> {
  const rows = await all("SELECT id, title, due_date, done FROM deadlines WHERE user_id = ? ORDER BY done, due_date", [userId]);
  const today = todayIso();
  return rows.map((r) => ({
    id: str(r.id),
    title: str(r.title),
    dueDate: str(r.due_date),
    done: num(r.done) === 1,
    daysLeft: daysBetween(today, str(r.due_date)),
  }));
}

export async function addDeadline(userId: string, title: string, dueDate: string): Promise<{ ok: boolean; error?: string }> {
  const name = title.trim().slice(0, 80);
  if (name.length < 2) return { ok: false, error: "Напиши, что это за дедлайн." };
  if (!DATE_RE.test(dueDate) || Number.isNaN(Date.parse(dueDate))) return { ok: false, error: "Укажи дату." };
  const count = await one<{ n: number }>("SELECT COUNT(*) AS n FROM deadlines WHERE user_id = ?", [userId]);
  if (num(count?.n) >= 40) return { ok: false, error: "Слишком много дедлайнов — удали прошедшие." };

  await run("INSERT INTO deadlines (id, user_id, title, due_date, done, created_at) VALUES (?, ?, ?, ?, 0, ?)", [
    randomUUID(),
    userId,
    name,
    dueDate,
    nowIso(),
  ]);
  return { ok: true };
}

export async function toggleDeadline(userId: string, id: string): Promise<void> {
  await run("UPDATE deadlines SET done = 1 - done WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function removeDeadline(userId: string, id: string): Promise<void> {
  await run("DELETE FROM deadlines WHERE id = ? AND user_id = ?", [id, userId]);
}
