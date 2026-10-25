/**
 * The student's exam scores and diagnostic results. The current state lives in
 * student_scores; every change is also appended to score_history, so progress
 * over time is never overwritten.
 */

import { randomUUID } from "node:crypto";

import { diagnosticItems, levelFromDiagnostic, mathEstimateFromDiagnostic } from "@/content/diagnostic";
import { levelFromSatSection } from "@/content/skill-level";
import { validateScores, type DiagnosticSection, type ExamEntry, type Level, type ResultKind, type ScoresInput } from "@/content/exams";
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
  /** SAT section targets, when given. */
  targetSections: Record<string, number | null> | null;
  takenDate: string | null;
  /** Official exam or practice test; null when not stated (older records). */
  kind: ResultKind | null;
  /** "bluebook", "other" or the name of another practice test. */
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
  return rows.map((r) => {
    const { [TARGETS_KEY]: targets, ...sections } = json<Record<string, unknown>>(r.sections, {});
    const source = r.source === null ? null : decodeSource(str(r.source));
    return {
    exam: str(r.exam),
    total: r.total === null ? null : num(r.total),
    sections: sections as Record<string, number | null>,
    targetSections: (targets as Record<string, number | null> | undefined) ?? null,
    takenDate: r.taken_date === null ? null : str(r.taken_date),
    kind: source?.kind ?? null,
    source: source?.source ?? null,
    target: r.target === null ? null : num(r.target),
    examDate: r.exam_date === null ? null : str(r.exam_date),
    recordedAt: str(r.recorded_at),
    };
  });
}

/** Section targets ride along in the history's sections JSON under this key. */
const TARGETS_KEY = "_targets";

/**
 * score_history.source holds the kind of result and the practice test:
 * "official", "practice:bluebook", "practice:other:<name>". Older rows hold
 * "bluebook" or "other" (kind not asked then).
 */
function encodeSource(e: ExamEntry): string | null {
  if (e.kind === "official") return "official";
  const test = e.source === "other" && e.sourceName ? `other:${e.sourceName}` : e.source;
  if (e.kind === "practice") return test ? `practice:${test}` : "practice";
  return test;
}

function decodeSource(raw: string): { kind: ResultKind | null; source: string | null } {
  if (raw === "official") return { kind: "official", source: null };
  if (raw === "practice") return { kind: "practice", source: null };
  if (raw.startsWith("practice:")) {
    const test = raw.slice("practice:".length);
    return { kind: "practice", source: test.startsWith("other:") ? test.slice("other:".length) : test };
  }
  return { kind: null, source: raw };
}

function recordOf(e: ExamEntry) {
  const sections: Record<string, unknown> = { ...(e.current?.sections ?? {}) };
  if (e.targetSections) sections[TARGETS_KEY] = e.targetSections;
  return {
    total: e.current?.total ?? null,
    sections: JSON.stringify(sections),
    takenDate: e.takenDate,
    source: encodeSource(e),
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

export interface DiagnosticOutcome {
  correct: number;
  total: number;
  level: Level;
  /** SAT Math: the score estimate (200–800). */
  estimate: number | null;
}

export async function recordDiagnostic(userId: string, section: DiagnosticSection, responses: (Response | null)[]): Promise<DiagnosticOutcome> {
  const items = diagnosticItems(section);
  const results = items.map((item, i) => ({ difficulty: item.difficulty, tier: item.tier, correct: isCorrect(item.question, responses[i]) }));
  const correct = results.filter((r) => r.correct).length;
  const estimate = section === "sat-math" ? mathEstimateFromDiagnostic(results) : null;
  const level = estimate !== null ? levelFromSatSection(estimate) : levelFromDiagnostic(results);
  if (estimate !== null) {
    await run("INSERT INTO diagnostic_estimates (id, user_id, section, estimate, taken_at) VALUES (?, ?, ?, ?, ?)", [randomUUID(), userId, section, estimate, nowIso()]);
  }
  await run("INSERT INTO diagnostic_results (id, user_id, section, correct, total, level, taken_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    randomUUID(),
    userId,
    section,
    correct,
    items.length,
    level,
    nowIso(),
  ]);
  return { correct, total: items.length, level, estimate };
}

/** The latest diagnostic score estimate per section (SAT Math). */
export async function getDiagnosticEstimates(userId: string): Promise<Partial<Record<DiagnosticSection, number>>> {
  const rows = await all("SELECT section, estimate FROM diagnostic_estimates WHERE user_id = ? ORDER BY taken_at", [userId]);
  const out: Partial<Record<DiagnosticSection, number>> = {};
  for (const r of rows) out[str(r.section) as DiagnosticSection] = num(r.estimate);
  return out;
}

/** The latest diagnostic level of every section the student has taken. */
export async function getDiagnosticLevels(userId: string): Promise<Partial<Record<DiagnosticSection, Level>>> {
  const rows = await all("SELECT section, level FROM diagnostic_results WHERE user_id = ? ORDER BY taken_at", [userId]);
  const out: Partial<Record<DiagnosticSection, Level>> = {};
  for (const r of rows) out[str(r.section) as DiagnosticSection] = str(r.level) as Level;
  return out;
}
