/**
 * Progress, points and streaks. Every write that changes a user's score goes
 * through here.
 *
 * Points are an append-only ledger: earnings are positive rows, purchases are
 * negative rows. Nothing derived (balance, level, weekly score) is stored, so
 * none of it can drift from the ledger.
 */

import { randomUUID } from "node:crypto";
import { cache } from "react";

import { COURSES, findByKey, findLesson, flatten, isSequentiallyUnlocked, PLAN_COURSES, type PathEntry } from "@/content";
import { isPlanUnlocked, nextPlanStep } from "@/content/plan";
import { isDiagnosticSection } from "@/content/diagnostic";
import type { AnyCourseId, CourseId, Question } from "@/content/types";
import { adaptationMessages } from "@/content/bank/math-lessons";
import { isCorrect, outcomeOf, type AttemptMeta, type Response } from "./answers";
import { all, one, run, scalar, str, num, transaction } from "./db";
import { addDays, lastNDays, nowIso, todayIso, weekStart } from "./date";
import { getPlan } from "./profile";
import { DAILY_GOAL, lessonPoints, levelFor, POINTS, type LevelInfo } from "./rules";
import { resolveLesson, startLevelOf } from "./lesson-access";
import { recordDiagnostic } from "./scores";
import { clearDraw, recordMathAnswers } from "./mastery";
import { recordSkillAnswers } from "./skill-stats";
import { countWords } from "./writing";

// ---------------------------------------------------------------- points --

export async function addPoints(userId: string, amount: number, reason: string, ref: string | null = null): Promise<void> {
  if (amount === 0) return;
  await run("INSERT INTO points (id, user_id, amount, reason, ref, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    randomUUID(),
    userId,
    amount,
    reason,
    ref,
    todayIso(),
    nowIso(),
  ]);
}

export async function balance(userId: string): Promise<number> {
  return scalar("SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = ?", [userId]);
}

export async function earned(userId: string, since?: string): Promise<number> {
  return since
    ? scalar("SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = ? AND amount > 0 AND day >= ?", [userId, since])
    : scalar("SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = ? AND amount > 0", [userId]);
}

// --------------------------------------------------------------- streaks --

export interface Streak {
  current: number;
  longest: number;
  activeToday: boolean;
}

export async function getStreak(userId: string): Promise<Streak> {
  const row = await one("SELECT current_days, longest_days, last_active_date FROM streaks WHERE user_id = ?", [userId]);
  if (!row) return { current: 0, longest: 0, activeToday: false };
  const today = todayIso();
  const last = str(row.last_active_date);
  // A streak survives until the end of the day after the last active day.
  const alive = last === today || last === addDays(today, -1);
  return {
    current: alive ? num(row.current_days) : 0,
    longest: num(row.longest_days),
    activeToday: last === today,
  };
}

/** Marks today as active. Returns the streak after the update. */
async function touchStreak(userId: string): Promise<{ streak: number; extended: boolean }> {
  const today = todayIso();
  const row = await one("SELECT current_days, longest_days, last_active_date FROM streaks WHERE user_id = ?", [userId]);

  if (!row) {
    await run(
      "INSERT INTO streaks (user_id, current_days, longest_days, last_active_date, updated_at) VALUES (?, 1, 1, ?, ?)",
      [userId, today, nowIso()],
    );
    return { streak: 1, extended: true };
  }

  const last = str(row.last_active_date);
  if (last === today) return { streak: num(row.current_days), extended: false };

  const current = last === addDays(today, -1) ? num(row.current_days) + 1 : 1;
  const longest = Math.max(current, num(row.longest_days));
  await run("UPDATE streaks SET current_days = ?, longest_days = ?, last_active_date = ?, updated_at = ? WHERE user_id = ?", [
    current,
    longest,
    today,
    nowIso(),
    userId,
  ]);
  return { streak: current, extended: true };
}

// --------------------------------------------------------------- summary --

export interface Stats {
  balance: number;
  earned: number;
  earnedWeek: number;
  earnedToday: number;
  level: LevelInfo;
  streak: Streak;
  lessonsDone: number;
}

/** Cached for the request: the app layout and the page both show it. */
export const getStats = cache(async (userId: string): Promise<Stats> => {
  const today = todayIso();
  const [bal, total, week, day, streak, lessons] = await Promise.all([
    balance(userId),
    earned(userId),
    earned(userId, weekStart(today)),
    earned(userId, today),
    getStreak(userId),
    scalar("SELECT COUNT(*) FROM lesson_results WHERE user_id = ?", [userId]),
  ]);
  return {
    balance: bal,
    earned: total,
    earnedWeek: week,
    earnedToday: day,
    level: levelFor(total),
    streak,
    lessonsDone: lessons,
  };
});

/** Points earned on each of the last `days` days, oldest first. */
export async function getActivity(userId: string, days = 7): Promise<{ day: string; points: number }[]> {
  const range = lastNDays(days);
  const rows = await all(
    "SELECT day, SUM(amount) AS points FROM points WHERE user_id = ? AND amount > 0 AND day >= ? GROUP BY day",
    [userId, range[0]],
  );
  const byDay = new Map(rows.map((r) => [str(r.day), num(r.points)]));
  return range.map((day) => ({ day, points: byDay.get(day) ?? 0 }));
}

export async function getDoneKeys(userId: string): Promise<Set<string>> {
  const rows = await all("SELECT lesson_key FROM lesson_results WHERE user_id = ?", [userId]);
  return new Set(rows.map((r) => str(r.lesson_key)));
}

export interface LessonResult {
  bestCorrect: number;
  total: number;
  attempts: number;
}

export async function getLessonResults(userId: string): Promise<Map<string, LessonResult>> {
  const rows = await all("SELECT lesson_key, best_correct, total, attempts FROM lesson_results WHERE user_id = ?", [userId]);
  return new Map(
    rows.map((r) => [str(r.lesson_key), { bestCorrect: num(r.best_correct), total: num(r.total), attempts: num(r.attempts) }]),
  );
}

/** The first lesson in a course that is not done yet, or null when the course is finished. */
export function nextLesson(courseId: CourseId, done: Set<string>): PathEntry | null {
  return flatten(COURSES[courseId]).find((e) => !done.has(e.key)) ?? null;
}

// ------------------------------------------------------------ completion --

export interface Completion {
  correct: number;
  total: number;
  points: number;
  firstTime: boolean;
  streak: number;
  streakExtended: boolean;
  level: number;
  leveledUp: boolean;
  earnedToday: number;
  dailyGoal: number;
  /** Where "Continue" goes: the next lesson, or back to the path. */
  nextHref: string;
  /** SAT Math ladder: what changed for which skill after this lesson. */
  adaptation?: string[];
}

export type CompletionResult = { ok: true; result: Completion } | { ok: false; error: string };

/** Where "Continue" goes: the next step of the plan, or the next seminar lesson. */
async function continueHref(userId: string, target: { key?: string; courseId: AnyCourseId }, done: Set<string>): Promise<string> {
  const { courseId } = target;
  if (courseId === "seminar") {
    const next = nextLesson("seminar", done);
    return next ? `/lesson/seminar/${next.lesson.id}` : "/seminar";
  }
  const plan = await getPlan(userId);
  if (target.key && findByKey(target.key)?.lesson.tutorial) {
    const tutorial = plan?.tutorials.find((step) => !done.has(step.key));
    return tutorial ? `/lesson/${tutorial.key}` : "/path#desmos";
  }
  const next = plan ? nextPlanStep(plan, done) : null;
  return next ? `/lesson/${next.key}` : "/path";
}

/** Whether this student may open a lesson: by day in their plan, or in order in the seminar. */
export async function canOpen(userId: string, entry: PathEntry, done?: Set<string>): Promise<boolean> {
  const finished = done ?? (await getDoneKeys(userId));
  if (!PLAN_COURSES.includes(entry.course.id)) return isSequentiallyUnlocked(entry, finished);
  const plan = await getPlan(userId);
  return plan ? isPlanUnlocked(plan, entry.key, finished) : false;
}

/**
 * Records a finished lesson. The client sends its first-try responses; the
 * server grades them again against the content, so a tampered request cannot
 * claim a better score than it earned.
 */
async function recordCompletion(
  userId: string,
  target: { key: string; courseId: AnyCourseId },
  correct: number,
  total: number,
  firstTimePoints: number,
): Promise<Completion> {
  const key = target.key;
  const today = todayIso();

  const result = await transaction(async () => {
    const earnedBefore = await earned(userId);
    const existing = await one("SELECT best_correct, last_day FROM lesson_results WHERE user_id = ? AND lesson_key = ?", [userId, key]);

    let points = 0;
    if (!existing) {
      points = firstTimePoints;
      await run(
        `INSERT INTO lesson_results (user_id, lesson_key, best_correct, total, attempts, first_done_at, last_done_at, last_day)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
        [userId, key, correct, total, nowIso(), nowIso(), today],
      );
    } else {
      // Practice pays a little, once per lesson per day.
      if (str(existing.last_day) !== today) points = POINTS.repeat;
      await run(
        `UPDATE lesson_results
            SET best_correct = ?, total = ?, attempts = attempts + 1, last_done_at = ?, last_day = ?
          WHERE user_id = ? AND lesson_key = ?`,
        [Math.max(num(existing.best_correct), correct), total, nowIso(), today, userId, key],
      );
    }

    await addPoints(userId, points, existing ? "Повторение урока" : "Урок пройден", key);
    const { streak, extended } = await touchStreak(userId);
    const earnedAfter = earnedBefore + points;

    return {
      correct,
      total,
      points,
      firstTime: !existing,
      streak,
      streakExtended: extended,
      level: levelFor(earnedAfter).level,
      leveledUp: levelFor(earnedAfter).level > levelFor(earnedBefore).level,
      earnedToday: await earned(userId, today),
      dailyGoal: DAILY_GOAL,
      nextHref: "/path",
    };
  });

  result.nextHref = await continueHref(userId, target, await getDoneKeys(userId));
  return result;
}

export async function completeLesson(
  userId: string,
  courseId: string,
  lessonId: string,
  responses: (Response | null)[],
  meta: AttemptMeta = {},
): Promise<CompletionResult> {
  // The diagnostic sets the starting level of a section; open to everyone with a goal.
  if (courseId === "diagnostic") {
    if (!isDiagnosticSection(lessonId)) return { ok: false, error: "Диагностика не найдена." };
    const outcome = await recordDiagnostic(userId, lessonId, responses);
    const key = `diagnostic/${lessonId}`;
    const result = await recordCompletion(userId, { key, courseId: "diagnostic" }, outcome.correct, outcome.total, lessonPoints(outcome.correct, outcome.total));
    result.nextHref = "/diagnostic";
    return { ok: true, result };
  }

  const found = await resolveLesson(userId, courseId, lessonId, getDoneKeys(userId));
  if (!found) return { ok: false, error: courseId === "review" ? "Повторение не найдено." : "Урок не найден." };
  if (found.lesson.writing) return { ok: false, error: "Этот урок завершается сдачей работы." };
  if (found.lesson.speaking) return { ok: false, error: "Этот урок завершается разговором с экзаменатором." };
  if (!found.open) return { ok: false, error: "Сначала пройди предыдущие уроки." };

  const questions = found.lesson.questions;
  const results = questions.map((q, i) => isCorrect(q, responses[i]));
  // A hint counts only where the question had one to open.
  const hinted = questions.map((q, i) => Boolean(q.hint) && meta.hinted?.[i] === true);
  const outcomes = results.map((right, i) => outcomeOf(right, hinted[i]));
  const correct = results.filter(Boolean).length;
  const result = await recordCompletion(userId, { key: found.key, courseId: found.courseId }, correct, questions.length, lessonPoints(correct, questions.length));

  // First-try answers move the adaptive level of each skill; a hinted answer does not count as right.
  if (found.taskSkills) {
    const plan = found.plan;
    const skills = found.taskSkills;
    // SAT Math: the ladder, task by task; a right answer after the solution was shown earns nothing.
    // Recorded before skill_stats, which the ladder reads as old progress for skills it has not seen yet.
    if (found.ladder) {
      const ladder = found.ladder;
      const events = await recordMathAnswers(
        userId,
        plan,
        found.key,
        skills.map((skill, i) => ({
          taskId: ladder.taskIds[i] ?? null,
          skill,
          tier: ladder.taskTiers[i] ?? 3,
          outcome: outcomes[i],
          retried: outcomes[i] === "wrong" && meta.retried?.[i] === true,
        })),
        new Set(ladder.remediation),
      );
      if (ladder.drawn) await clearDraw(userId, found.key);
      if (events.length) result.adaptation = adaptationMessages(events);
    }
    await recordSkillAnswers(
      userId,
      skills.map((skill, i) => ({ skill, correct: outcomes[i] === "clean" })),
      (skill) => startLevelOf(plan, skill),
    );
  }
  return { ok: true, result };
}

// --------------------------------------------------------------- writing --

export interface Writing {
  body: string;
  words: number;
  submittedAt: string | null;
  updatedAt: string;
}

export async function getWriting(userId: string, key: string): Promise<Writing | null> {
  const row = await one("SELECT body, words, submitted_at, updated_at FROM writings WHERE user_id = ? AND lesson_key = ?", [userId, key]);
  if (!row) return null;
  return {
    body: str(row.body),
    words: num(row.words),
    submittedAt: row.submitted_at ? str(row.submitted_at) : null,
    updatedAt: str(row.updated_at),
  };
}

export async function getWritings(userId: string): Promise<Map<string, Writing>> {
  const rows = await all("SELECT lesson_key, body, words, submitted_at, updated_at FROM writings WHERE user_id = ?", [userId]);
  return new Map(
    rows.map((r) => [
      str(r.lesson_key),
      { body: str(r.body), words: num(r.words), submittedAt: r.submitted_at ? str(r.submitted_at) : null, updatedAt: str(r.updated_at) },
    ]),
  );
}

const MAX_BODY = 20_000;

/** A writing or speaking task by its URL parts, from authored lessons or the task bank. */
export async function findTask(userId: string, courseId: string, lessonId: string) {
  if (courseId === "bank") {
    const found = await resolveLesson(userId, courseId, lessonId, getDoneKeys(userId));
    return found && (found.lesson.writing || found.lesson.speaking) ? found : null;
  }
  const entry = findLesson(courseId, lessonId);
  if (!entry || !(entry.lesson.writing || entry.lesson.speaking)) return null;
  return { key: entry.key, courseId: entry.course.id as AnyCourseId, lesson: entry.lesson, entry };
}

export async function saveDraft(userId: string, courseId: string, lessonId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const task = await findTask(userId, courseId, lessonId);
  if (!task) return { ok: false, error: "Задание не найдено." };
  const text = body.slice(0, MAX_BODY);
  const key = task.key;

  await transaction(async () => {
    const existing = await one("SELECT lesson_key FROM writings WHERE user_id = ? AND lesson_key = ?", [userId, key]);
    if (existing) {
      await run("UPDATE writings SET body = ?, words = ?, updated_at = ? WHERE user_id = ? AND lesson_key = ?", [
        text,
        countWords(text),
        nowIso(),
        userId,
        key,
      ]);
    } else {
      await run("INSERT INTO writings (user_id, lesson_key, body, words, updated_at) VALUES (?, ?, ?, ?, ?)", [
        userId,
        key,
        text,
        countWords(text),
        nowIso(),
      ]);
    }
  });
  return { ok: true };
}

export async function submitWriting(userId: string, courseId: string, lessonId: string, body: string): Promise<CompletionResult> {
  const found = await resolveLesson(userId, courseId, lessonId, getDoneKeys(userId));
  const task = found?.lesson.writing;
  if (!found || !task) return { ok: false, error: "Задание не найдено." };

  if (!found.open) return { ok: false, error: "Сначала пройди предыдущие уроки." };

  const words = countWords(body);
  if (words < task.minWords) return { ok: false, error: `Нужно хотя бы ${task.minWords} слов — сейчас ${words}.` };

  await saveDraft(userId, courseId, lessonId, body);
  await run("UPDATE writings SET submitted_at = ? WHERE user_id = ? AND lesson_key = ?", [nowIso(), userId, found.key]);

  const result = await recordCompletion(userId, { key: found.key, courseId: found.courseId }, 0, 0, POINTS.writing);
  return { ok: true, result };
}

// -------------------------------------------------------------- speaking --

export interface SpeakingSubmission {
  turns: { role: "examiner" | "student"; text: string }[];
  mode: "voice" | "text";
}

export async function submitSpeaking(
  userId: string,
  courseId: string,
  lessonId: string,
  submission: SpeakingSubmission,
): Promise<CompletionResult> {
  const found = await resolveLesson(userId, courseId, lessonId, getDoneKeys(userId));
  const spec = found?.lesson.speaking;
  if (!found || !spec) return { ok: false, error: "Задание не найдено." };

  if (!found.open) return { ok: false, error: "Сначала пройди предыдущие уроки." };

  const answers = submission.turns.filter((t) => t.role === "student").map((t) => t.text.trim()).filter(Boolean);
  const words = countWords(answers.join(" "));
  if (answers.length < spec.questions.length) return { ok: false, error: "Ответь на все вопросы экзаменатора." };
  if (words < spec.questions.length * 8) return { ok: false, error: "Ответы слишком короткие — попробуй развернуть их." };

  const transcript = submission.turns
    .map((t) => `${t.role === "examiner" ? "Examiner" : "Student"}: ${t.text.trim()}`)
    .join("\n\n")
    .slice(0, MAX_BODY);
  await saveDraft(userId, courseId, lessonId, transcript);
  await run("UPDATE writings SET submitted_at = ?, words = ? WHERE user_id = ? AND lesson_key = ?", [nowIso(), words, userId, found.key]);

  const result = await recordCompletion(userId, { key: found.key, courseId: found.courseId }, 0, 0, POINTS.speaking);
  return { ok: true, result };
}

// -------------------------------------------------------------- practice --

/**
 * Records a finished generated practice set. Graded on the server against the
 * stored key; pays a little per correct answer, once per set.
 */
export async function completePractice(
  userId: string,
  set: { id: string; questions: Question[] },
  responses: (Response | null)[],
): Promise<CompletionResult> {
  const correct = set.questions.filter((q, i) => isCorrect(q, responses[i])).length;
  const total = set.questions.length;

  const result = await transaction(async () => {
    const earnedBefore = await earned(userId);
    const existing = await one("SELECT set_id FROM practice_results WHERE user_id = ? AND set_id = ?", [userId, set.id]);
    const points = existing ? 0 : correct * POINTS.practicePerCorrect;
    if (!existing) {
      await run("INSERT INTO practice_results (user_id, set_id, correct, total, done_at) VALUES (?, ?, ?, ?, ?)", [
        userId,
        set.id,
        correct,
        total,
        nowIso(),
      ]);
    }
    await addPoints(userId, points, "Свежая практика", set.id);
    const { streak, extended } = await touchStreak(userId);
    const earnedAfter = earnedBefore + points;
    return {
      correct,
      total,
      points,
      firstTime: !existing,
      streak,
      streakExtended: extended,
      level: levelFor(earnedAfter).level,
      leveledUp: levelFor(earnedAfter).level > levelFor(earnedBefore).level,
      earnedToday: await earned(userId, todayIso()),
      dailyGoal: DAILY_GOAL,
      nextHref: "/path",
    };
  });
  result.nextHref = await continueHref(userId, { courseId: "sat-rw" }, await getDoneKeys(userId));
  return { ok: true, result };
}
