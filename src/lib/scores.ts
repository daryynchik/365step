/**
 * The student's exam scores and diagnostic results. The current state lives in
 * student_scores; every change is also appended to score_history, so progress
 * over time is never overwritten.
 */

import { randomUUID } from "node:crypto";

import { diagnosticQuestions } from "@/content/diagnostic";
import { validateScores, type DiagnosticSection, type ExamEntry, type Level, type ScoresInput } from "@/content/exams";
import { isCorrect, type Response } from "./answers";
import { all, json, num, one, run, str, transaction } from "./db";
import { nowIso, todayIso } from "./date";

export async function getScores(userId: string): Promise<ScoresInput | null> {
  const row = await one("SELECT payload FROM student_scores WHERE user_id = ?", [userId]);
  return row ? json<ScoresInput>(row.payload, { entries: [] }) : null;
}

export interface ScoreRecord {
  exam: string;
  total: number | null;
  sections: Record<string, number | null>;
  takenDate: string | null;
  source: string | null;
  target: number | null;
  examDate: string | null;
  recordedAt: string;
}

export async function getScoreHistory(userId: string): Promise<ScoreRecord[]> {
  const rows = await all(
    "SELECT exam, total, sections, taken_date, source, target, exam_date, recorded_at FROM score_history WHERE user_id = ? ORDER BY recorded_at, exam",
    [userId],
  );
  return rows.map((r) => ({
    exam: str(r.exam),
    total: r.total === null ? null : num(r.total),
    sections: json<Record<string, number | null>>(r.sections, {}),
    takenDate: r.taken_date === null ? null : str(r.taken_date),
    source: r.source === null ? null : str(r.source),
    target: r.target === null ? null : num(r.target),
    examDate: r.exam_date === null ? null : str(r.exam_date),
    recordedAt: str(r.recorded_at),
  }));
}

function recordOf(e: ExamEntry) {
  return {
    total: e.current?.total ?? null,
    sections: JSON.stringify(e.current?.sections ?? {}),
    takenDate: e.takenDate,
    source: e.source,
    target: e.target,
    examDate: e.examDate,
  };
}

export type SaveScoresResult = { ok: true; value: ScoresInput } | { ok: false; error: string };

export async function saveScores(userId: string, input: ScoresInput, today = todayIso()): Promise<SaveScoresResult> {
  const valid = validateScores(input, today);
  if (!valid.ok) return valid;
  const value = valid.value;

  await transaction(async () => {
    const previous = await getScores(userId);
    const before = new Map((previous?.entries ?? []).map((e) => [e.exam, JSON.stringify(recordOf(e))]));
    const now = nowIso();
    for (const e of value.entries) {
      const rec = recordOf(e);
      if (before.get(e.exam) === JSON.stringify(rec)) continue;
      await run(
        `INSERT INTO score_history (id, user_id, exam, total, sections, taken_date, source, target, exam_date, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), userId, e.exam, rec.total, rec.sections, rec.takenDate, rec.source, rec.target, rec.examDate, now],
      );
    }
    const payload = JSON.stringify(value);
    if (previous) await run("UPDATE student_scores SET payload = ?, updated_at = ? WHERE user_id = ?", [payload, now, userId]);
    else await run("INSERT INTO student_scores (user_id, payload, updated_at) VALUES (?, ?, ?)", [userId, payload, now]);
  });
  return { ok: true, value };
}

// ---------------------------------------------------------- diagnostic --

/** Starting level from first-try accuracy on the diagnostic. */
export function levelFromDiagnostic(correct: number, total: number): Level {
  const rate = total > 0 ? correct / total : 0;
  if (rate < 0.5) return "easy";
  if (rate <= 0.8) return "medium";
  return "hard";
}

export interface DiagnosticOutcome {
  correct: number;
  total: number;
  level: Level;
}

export async function recordDiagnostic(userId: string, section: DiagnosticSection, responses: (Response | null)[]): Promise<DiagnosticOutcome> {
  const questions = diagnosticQuestions(section);
  const correct = questions.filter((q, i) => isCorrect(q, responses[i])).length;
  const level = levelFromDiagnostic(correct, questions.length);
  await run("INSERT INTO diagnostic_results (id, user_id, section, correct, total, level, taken_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    randomUUID(),
    userId,
    section,
    correct,
    questions.length,
    level,
    nowIso(),
  ]);
  return { correct, total: questions.length, level };
}

/** The latest diagnostic level of every section the student has taken. */
export async function getDiagnosticLevels(userId: string): Promise<Partial<Record<DiagnosticSection, Level>>> {
  const rows = await all("SELECT section, level FROM diagnostic_results WHERE user_id = ? ORDER BY taken_at", [userId]);
  const out: Partial<Record<DiagnosticSection, Level>> = {};
  for (const r of rows) out[str(r.section) as DiagnosticSection] = str(r.level) as Level;
  return out;
}
