/**
 * End-to-end check of the product logic against a throwaway SQLite database:
 * walks the whole track as one student (every lesson type: questions, writing,
 * speaking), then practice sets, deadlines, friends, the arena and the demo.
 *
 *   pnpm verify
 */

import fs from "node:fs";
import path from "node:path";

// A fresh database for every run. Must happen before the db module connects.
const DB = path.join(process.cwd(), "data", "verify.db");
for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) fs.rmSync(f, { force: true });
process.env.SQLITE_PATH = DB;
delete process.env.ANTHROPIC_API_KEY;

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { registerUser } from "../src/lib/accounts";
import { completeLesson, getStats, getDoneKeys, submitWriting, submitSpeaking, completePractice } from "../src/lib/game";
import { sendFriendRequest, respondToRequest, getRequests, getLeaderboard } from "../src/lib/friends";
import { buyItem, startFight, getDuel } from "../src/lib/arena";
import { addDeadline, getDeadlines, toggleDeadline, removeDeadline } from "../src/lib/deadlines";
import { getOrCreatePractice, getPracticeSet } from "../src/lib/content-engine";
import { ensureDemo } from "../src/lib/demo";
import { TRACK, nextTrackStep, isTrackUnlocked, currentDay } from "../src/content/track";
import { run } from "../src/lib/db";
import type { TrackStep } from "../src/content/track";

let checks = 0;
const ok = (cond: unknown, msg: string) => { assert.ok(cond, msg); checks++; };

const ESSAY = (n: number) => Array.from({ length: n }, (_, i) => (i % 12 === 11 ? "word." : "word")).join(" ");

async function doStep(userId: string, step: TrackStep) {
  const { course, lesson } = step;
  if (lesson.writing) {
    const w = lesson.writing;
    const body = w.checks.profile === "activities" ? "Founded a club for 40 students.\nLed a team of 6.\nTaught 12 kids weekly math." + " extra".repeat(w.minWords) : ESSAY(w.minWords + 5);
    return submitWriting(userId, course.id, lesson.id, body);
  }
  if (lesson.speaking) {
    const turns = lesson.speaking.questions.flatMap((q) => [
      { role: "examiner" as const, text: q },
      { role: "student" as const, text: "I think this is true because my school taught me a lot, for example in science lessons, although it was hard." },
    ]);
    return submitSpeaking(userId, course.id, lesson.id, { turns, mode: "text" });
  }
  const answers = lesson.questions.map((q) => (q.kind === "choice" ? q.answer : q.answers[0]));
  return completeLesson(userId, course.id, lesson.id, answers);
}

async function main() {
  const a = await registerUser("a@test.kz", "password1", "Айгерим");
  const b = await registerUser("b@test.kz", "password1", "Бекзат");
  ok(a.ok && b.ok, "register");
  const A = a.userId!, B = b.userId!;

  // Day gating
  const day2 = TRACK[1].steps[0];
  ok(!(await completeLesson(A, day2.course.id, day2.lesson.id, [])).ok, "day 2 locked before day 1");
  ok(nextTrackStep(new Set())!.key === TRACK[0].steps[0].key, "first step is day 1 english");
  ok(TRACK[0].english === "ielts" && TRACK[1].english === "sat" && TRACK[2].english === "ielts", "english alternates");
  ok(TRACK.slice(0, 19).every((d) => d.steps.some((s) => s.course.id === "sat-math")), "math every day while it lasts");

  // Within a day any order: do the last step of day 1 first.
  const d1 = TRACK[0].steps;
  const first = await doStep(A, d1[d1.length - 1]);
  ok(first.ok, "day 1 steps in any order");
  ok(first.ok && first.result.nextHref.includes(d1[0].lesson.id), "continue goes to the remaining step of the day");

  // Speaking validation
  const sp = TRACK.flatMap((d) => d.steps).find((s) => s.lesson.speaking)!;
  ok(!(await submitSpeaking(A, sp.course.id, sp.lesson.id, { turns: [], mode: "text" })).ok, "speaking locked / empty rejected");

  // Walk the whole track.
  let speakingPoints = 0, writingPoints = 0;
  for (const day of TRACK) {
    for (const step of day.steps) {
      const done = await getDoneKeys(A);
      if (done.has(step.key)) continue;
      ok(isTrackUnlocked(step.key, done), "unlocked " + step.key);
      const r = await doStep(A, step);
      ok(r.ok, "complete " + step.key + (r.ok ? "" : " — " + (r as { error: string }).error));
      if (r.ok && step.lesson.speaking) speakingPoints += r.result.points;
      if (r.ok && step.lesson.writing) writingPoints += r.result.points;
    }
  }
  const doneAll = await getDoneKeys(A);
  ok(currentDay(doneAll) === null && nextTrackStep(doneAll) === null, "whole track finished");
  ok(speakingPoints === 90, "3 speaking parts × 30: " + speakingPoints);
  ok(writingPoints === 40 * 8, "8 writing tasks (2 IELTS + 6 admissions) × 40: " + writingPoints);

  // Practice: without a key generation is off, but stored sets work.
  const noKey = await getOrCreatePractice(A, "sat-rw/central-ideas");
  ok(!noKey.ok && /не настроена/.test(noKey.error), "generation disabled without API key");
  ok(!(await getOrCreatePractice(A, "ielts/speaking-part1")).ok, "speaking not generatable");
  const setId = randomUUID();
  await run("INSERT INTO practice_sets (id, lesson_key, payload, source, created_by, created_at, day) VALUES (?, ?, ?, ?, NULL, ?, ?)", [
    setId, "sat-rw/central-ideas",
    JSON.stringify({ title: "t", questions: [{ kind: "choice", prompt: "p", options: ["a", "b", "c"], answer: 1, explanation: "e" }, { kind: "choice", prompt: "q", options: ["a", "b", "c"], answer: 0, explanation: "e" }] }),
    JSON.stringify({ kind: "generated" }), new Date().toISOString(), "2026-01-01",
  ]);
  const cached = await getOrCreatePractice(A, "sat-rw/central-ideas");
  ok(cached.ok && cached.id === setId, "unseen stored set is served without generating");
  const set = (await getPracticeSet(setId))!;
  const p1 = await completePractice(A, set, [1, 2]);
  ok(p1.ok && p1.result.correct === 1 && p1.result.points === 2, "practice graded server-side, 2 pts/correct");
  const p2 = await completePractice(A, set, [1, 0]);
  ok(p2.ok && p2.result.points === 0, "practice pays once");
  const after = await getOrCreatePractice(A, "sat-rw/central-ideas");
  ok(!after.ok, "done set not served again");

  // Deadlines
  ok(!(await addDeadline(A, "x", "2026-13-40")).ok, "bad deadline rejected");
  ok((await addDeadline(A, "MIT — EA", "2030-11-01")).ok, "deadline added");
  let dl = await getDeadlines(A);
  ok(dl.length === 1 && dl[0].daysLeft > 0, "deadline countdown");
  await toggleDeadline(A, dl[0].id);
  await toggleDeadline(B, dl[0].id); // someone else's: no effect
  dl = await getDeadlines(A);
  ok(dl[0].done, "toggle own deadline only");
  await removeDeadline(B, dl[0].id);
  ok((await getDeadlines(A)).length === 1, "cannot delete someone else's deadline");
  await removeDeadline(A, dl[0].id);
  ok((await getDeadlines(A)).length === 0, "deadline removed");

  // Friends + arena + leaderboard still work.
  ok((await sendFriendRequest(A, "b@test.kz")).ok, "friend request");
  const reqs = await getRequests(B);
  ok((await respondToRequest(B, reqs.incoming[0].id, true)).ok, "accepted");
  ok((await buyItem(A, "iron-sword")).ok, "buy");
  const f = await startFight(A, B);
  ok(f.ok && (await getDuel(B, f.duelId)) !== null, "fight");
  const board = await getLeaderboard(A);
  ok(board[0].isMe && board[0].lessons === 56, "leaderboard counts track lessons");

  const stats = await getStats(A);
  ok(stats.earned > 1500 && stats.level.level >= 5, "level after full track: " + stats.level.level + " / " + stats.earned);

  // Demo
  const demo = await ensureDemo();
  const demoDone = await getDoneKeys(demo);
  ok(demoDone.size === TRACK.slice(0, 6).flatMap((d) => d.steps).length + 1 + 3, "demo: 6 days + 1 + 3 seminar = " + demoDone.size);
  ok((await getDeadlines(demo)).length === 4, "demo deadlines");
  ok(nextTrackStep(demoDone)!.key === TRACK[6].steps[1].key, "demo next step is 2nd lesson of day 7");

  console.log("All " + checks + " checks passed.");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
