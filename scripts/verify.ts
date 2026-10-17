/**
 * End-to-end check of the product logic against a throwaway SQLite database:
 * sets a goal, walks one student's whole personal plan (questions, reviews,
 * mock sections, writing, speaking), changes the goal, then checks practice
 * sets, deadlines, friends, the arena and the demo world.
 *
 *   pnpm verify
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { findByKey, findLesson } from "../src/content";
import { currentPlanDay, isPlanUnlocked, nextPlanStep, reviewLesson, type Plan, type PlanStep } from "../src/content/plan";
import { registerUser } from "../src/lib/accounts";
import { buyItem, getDuel, getFightRequests, requestFight, respondToFightRequest } from "../src/lib/arena";
import { getOrCreatePractice, getPracticeSet } from "../src/lib/content-engine";
import { all, run, scalar } from "../src/lib/db";
import { addDeadline, getDeadlines, removeDeadline, toggleDeadline } from "../src/lib/deadlines";
import { ensureDemo } from "../src/lib/demo";
import { getLeaderboard, getRequests, respondToRequest, sendFriendRequest } from "../src/lib/friends";
import { canOpen, completeLesson, completePractice, getDoneKeys, getStats, submitSpeaking, submitWriting } from "../src/lib/game";
import { getPlan, getProfile, saveProfile } from "../src/lib/profile";

// A fresh database for every run. The db module connects lazily on first query.
const DB = path.join(process.cwd(), "data", "verify.db");
for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) fs.rmSync(f, { force: true });
process.env.SQLITE_PATH = DB;
delete process.env.ANTHROPIC_API_KEY;

let checks = 0;
const ok = (cond: unknown, msg: string) => {
  assert.ok(cond, msg);
  checks++;
};

function monthFromNow(months: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 7);
}

const ESSAY = (n: number) => Array.from({ length: n }, (_, i) => (i % 12 === 11 ? "word." : "word")).join(" ");

async function doStep(userId: string, plan: Plan, step: PlanStep) {
  const [courseId, lessonId] = step.key.split("/");
  if (courseId === "review") {
    const review = reviewLesson(plan, step.key)!;
    const answers = review.lesson.questions.map((q) => (q.kind === "choice" ? q.answer : q.answers[0]));
    return completeLesson(userId, "review", lessonId, answers);
  }
  const lesson = findLesson(courseId, lessonId)!.lesson;
  if (lesson.writing) {
    const w = lesson.writing;
    const body =
      w.checks.profile === "activities"
        ? "Founded a club for 40 students.\nLed a team of 6.\nTaught 12 kids math." + " extra".repeat(w.minWords)
        : ESSAY(w.minWords + 5);
    return submitWriting(userId, courseId, lessonId, body);
  }
  if (lesson.speaking) {
    const turns = lesson.speaking.questions.flatMap((q) => [
      { role: "examiner" as const, text: q },
      { role: "student" as const, text: "I think this is true because my school taught me a lot, for example in science lessons, although it was hard." },
    ]);
    return submitSpeaking(userId, courseId, lessonId, { turns, mode: "text" });
  }
  const answers = lesson.questions.map((q) => (q.kind === "choice" ? q.answer : q.answers[0]));
  return completeLesson(userId, courseId, lessonId, answers);
}

async function main() {
  const a = await registerUser("a@test.kz", "password1", "Айгерим");
  const b = await registerUser("b@test.kz", "password1", "Бекзат");
  ok(a.ok && b.ok, "register");
  const A = a.userId!;
  const B = b.userId!;

  // ---------------------------------------------------------------- goal --
  ok((await getPlan(A)) === null, "no plan before a goal is set");
  ok(!(await canOpen(A, findByKey("ielts/reading-tfng")!)), "lessons closed without a goal");
  ok(!(await canOpen(A, findByKey("sat-math/desmos-basics")!)), "tutorials require an enrolled student");
  ok(!(await saveProfile(A, { country: "mars", field: "cs", grade: 11, graduationMonth: monthFromNow(5) })).ok, "unknown country rejected");
  ok(!(await saveProfile(A, { country: "usa", field: "cs", grade: 11, graduationMonth: "2020-05" })).ok, "past graduation rejected");
  ok(!(await saveProfile(A, { country: "usa", field: "cs", grade: 3, graduationMonth: monthFromNow(5) })).ok, "bad grade rejected");
  ok((await saveProfile(A, { country: "usa", field: "cs", grade: 11, graduationMonth: monthFromNow(5) })).ok, "goal saved");

  let plan = (await getPlan(A))!;
  ok(plan.days.length > 100 && plan.days.length < 160, `plan length follows graduation: ${plan.days.length} days`);
  ok(plan.days.every((d) => d.steps.length > 0), "every day has a step");
  ok(plan.days.flatMap((d) => d.steps).filter((s) => s.key.startsWith("reading/")).every((s) => s.key.startsWith("reading/cs-")), "field texts follow the chosen field");
  ok(plan.days.flatMap((d) => d.steps).some((s) => s.key === "admissions/supplements"), "US plan includes supplemental essays");

  // ------------------------------------------------------------- gating --
  const day2 = plan.days[1].steps[0];
  ok(!isPlanUnlocked(plan, day2.key, new Set()), "day 2 locked before day 1");
  ok(!(await doStep(A, plan, day2)).ok, "server refuses a locked step");

  // Reviews are graded on the server.
  const firstReview = plan.days.flatMap((d) => d.steps).find((s) => s.kind === "review")!;
  ok(reviewLesson(plan, firstReview.key)!.lesson.questions.length >= 3, "review section has questions");

  // Independent tutorials must never reset progress or unlock future daily work.
  ok(plan.tutorials.length === 8, "eight Desmos tutorials in the path");
  const nextBeforeTutorials = nextPlanStep(plan, await getDoneKeys(A))?.key;
  ok(!isPlanUnlocked(plan, "sat-math/desmos-missing", new Set()), "unknown tutorial cannot bypass gating");
  for (let i = 0; i < plan.tutorials.length; i++) {
    const step = plan.tutorials[i];
    ok(await canOpen(A, findByKey(step.key)!), `tutorial available: ${step.key}`);
    const lesson = findByKey(step.key)!.lesson;
    const responses = lesson.questions.map((q) => q.kind === "choice" ? q.answer : q.answers[0]);
    const result = await completeLesson(A, "sat-math", lesson.id, responses);
    ok(result.ok && result.result.correct === 5 && result.result.total === 5 && result.result.points > 0, `tutorial graded and rewarded: ${step.key}`);
    ok(result.ok && result.result.nextHref === (plan.tutorials[i + 1] ? `/lesson/${plan.tutorials[i + 1].key}` : "/path#desmos"), "continue stays within the tutorial module");
  }
  const afterTutorials = await getDoneKeys(A);
  ok(nextPlanStep(plan, afterTutorials)?.key === nextBeforeTutorials, "tutorials leave the current daily step unchanged");
  ok(!isPlanUnlocked(plan, day2.key, afterTutorials), "tutorials do not unlock future daily steps");
  const firstTutorial = findByKey(plan.tutorials[0].key)!.lesson;
  const gradedTutorial = await completeLesson(B, "sat-math", firstTutorial.id, []);
  ok(!gradedTutorial.ok, "unenrolled user cannot submit a tutorial");

  // ---------------------------------------------------- walk the plan --
  let steps = 0;
  let writing = 0;
  let speaking = 0;
  for (const day of plan.days) {
    for (const step of day.steps) {
      const done = await getDoneKeys(A);
      if (done.has(step.key)) continue;
      ok(isPlanUnlocked(plan, step.key, done), `unlocked ${step.key}`);
      const r = await doStep(A, plan, step);
      ok(r.ok, `complete ${step.key}${r.ok ? "" : ` — ${(r as { error: string }).error}`}`);
      if (r.ok && step.kind === "lesson") {
        const lesson = findByKey(step.key)!.lesson;
        if (lesson.writing) writing += r.result.points;
        if (lesson.speaking) speaking += r.result.points;
      }
      steps++;
    }
  }
  let done = await getDoneKeys(A);
  ok(currentPlanDay(plan, done) === null && nextPlanStep(plan, done) === null, `whole plan finished (${steps} steps)`);
  ok(speaking === 30 * 4, `4 speaking parts × 30: ${speaking}`);
  ok(writing > 0 && writing % 40 === 0, `writing tasks paid 40 each: ${writing}`);

  // --------------------------------------------------- change the goal --
  const profileBefore = (await getProfile(A))!;
  ok((await saveProfile(A, { country: "uk", field: "medicine", grade: 11, graduationMonth: monthFromNow(5) })).ok, "goal changed");
  plan = (await getPlan(A))!;
  done = await getDoneKeys(A);
  ok((await getProfile(A))!.startDate === profileBefore.startDate, "start date kept when the goal changes");
  ok(done.has("sat-math/linear-equations-one"), "finished lessons stay finished");
  ok(plan.days.flatMap((d) => d.steps).some((s) => s.key === "admissions/ucas-statement"), "UK plan now includes UCAS");
  const next = nextPlanStep(plan, done);
  ok(next !== null && (next.key.startsWith("reading/medicine-") || next.key.startsWith("review/") || next.key.startsWith("admissions/")), `new goal brings new steps: ${next?.key}`);

  // ------------------------------------------------------------ practice --
  const noKey = await getOrCreatePractice(A, "sat-rw/central-ideas");
  ok(!noKey.ok && /не настроена/.test(noKey.error), "generation disabled without API key");
  ok(!(await getOrCreatePractice(A, "ielts/speaking-part1")).ok, "speaking not generatable");
  const setId = randomUUID();
  await run("INSERT INTO practice_sets (id, lesson_key, payload, source, created_by, created_at, day) VALUES (?, ?, ?, ?, NULL, ?, ?)", [
    setId,
    "reading/cs-1",
    JSON.stringify({
      title: "t",
      questions: [
        { kind: "choice", prompt: "p", options: ["a", "b", "c"], answer: 1, explanation: "e" },
        { kind: "choice", prompt: "q", options: ["a", "b", "c"], answer: 0, explanation: "e" },
      ],
    }),
    JSON.stringify({ kind: "wikipedia", title: "Algorithm" }),
    new Date().toISOString(),
    "2026-01-01",
  ]);
  const cached = await getOrCreatePractice(A, "reading/cs-1");
  ok(cached.ok && cached.id === setId, "field reading practice served from the shared store");
  const set = (await getPracticeSet(setId))!;
  const p1 = await completePractice(A, set, [1, 2]);
  ok(p1.ok && p1.result.correct === 1 && p1.result.points === 2, "practice graded on the server");
  ok((await completePractice(A, set, [1, 0])).ok, "practice can be repeated");

  // ----------------------------------------------------------- deadlines --
  ok(!(await addDeadline(A, "x", "2026-13-40")).ok, "bad deadline rejected");
  ok((await addDeadline(A, "MIT — EA", "2030-11-01")).ok, "deadline added");
  const dl = await getDeadlines(A);
  await toggleDeadline(B, dl[0].id);
  await removeDeadline(B, dl[0].id);
  ok((await getDeadlines(A))[0]?.done === false, "others cannot change my deadlines");
  await toggleDeadline(A, dl[0].id);
  ok((await getDeadlines(A))[0].done, "deadline toggled");

  // --------------------------------------------- friends, arena, ranking --
  ok((await sendFriendRequest(A, "b@test.kz")).ok, "friend request");
  ok((await respondToRequest(B, (await getRequests(B)).incoming[0].id, true)).ok, "accepted");
  ok((await buyItem(A, "iron-sword")).ok, "buy gear");
  ok(!(await requestFight(A, A)).ok, "self invitation rejected");
  const pointsBefore = await scalar("SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = ?", [A]);
  ok((await requestFight(A, B)).ok, "fight invitation created");
  ok(await scalar("SELECT COUNT(*) FROM duels") === 0, "invitation does not create a duel");
  ok(await scalar("SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = ?", [A]) === pointsBefore, "invitation does not award points");
  ok(!(await requestFight(A, B)).ok && !(await requestFight(B, A)).ok, "duplicate and crossed invitations rejected");
  const invitation = (await getFightRequests(B))[0];
  ok(Boolean(invitation) && (await getFightRequests(A)).length === 1, "invitation visible to both participants");
  ok(!(await respondToFightRequest(A, invitation.id, "accept")).ok, "sender cannot accept own invitation");
  ok(!(await respondToFightRequest("outsider", invitation.id, "accept")).ok, "third party cannot accept invitation");
  ok(!(await respondToFightRequest(B, invitation.id, "cancel")).ok, "recipient cannot cancel sender's invitation");
  const accepted = await Promise.all([respondToFightRequest(B, invitation.id, "accept"), respondToFightRequest(B, invitation.id, "accept")]);
  ok(accepted.filter((r) => r.ok).length === 1, "concurrent acceptance creates exactly one fight");
  const fight = accepted.find((r) => r.ok)!;
  ok(fight.ok && !!fight.duelId && (await getDuel(B, fight.duelId)) !== null, "accepted fight visible to recipient");
  ok(await scalar("SELECT COUNT(*) FROM duels") === 1 && (await getFightRequests(A)).length === 0, "one duel recorded and pending invitation removed");
  ok((await requestFight(A, B)).ok, "new invitation after completed fight");
  const declined = (await getFightRequests(B))[0];
  ok((await respondToFightRequest(B, declined.id, "decline")).ok, "recipient can decline");
  ok(!(await respondToFightRequest(B, declined.id, "accept")).ok, "declined invitation cannot start fight");
  ok((await requestFight(A, B)).ok, "new invitation after decline");
  ok((await respondToFightRequest(A, (await getFightRequests(A))[0].id, "cancel")).ok, "sender can cancel");
  await requestFight(A, B);
  const expired = (await getFightRequests(B))[0];
  await run("UPDATE arena_requests SET expires_at = ? WHERE id = ?", ["2000-01-01T00:00:00.000Z", expired.id]);
  ok((await getFightRequests(B)).length === 0 && !(await respondToFightRequest(B, expired.id, "accept")).ok, "expired invitation hidden and rejected");
  ok((await requestFight(B, A)).ok, "expired invitation does not block a new request");
  ok(await scalar("SELECT COUNT(*) FROM duels") === 1, "decline, cancel and expiry never simulate a fight");
  const board = await getLeaderboard(A);
  ok(board[0].isMe && board[0].lessons >= steps, "leaderboard counts plan steps");
  const stats = await getStats(A);
  ok(stats.level.level >= 5, `level after a whole plan: ${stats.level.level}`);

  ok(!(await requestFight(A, "outsider")).ok, "only friends can be challenged");

  // ---------------------------------------------------------------- demo --
  const demo = await ensureDemo();
  ok(demo === (await ensureDemo()), "ensureDemo is idempotent");
  const demoPlan = (await getPlan(demo))!;
  const demoDone = await getDoneKeys(demo);
  ok(demoPlan.profile.country === "usa" && demoPlan.profile.field === "cs", "demo has a goal");
  ok(currentPlanDay(demoPlan, demoDone)?.day === 7, `demo is on day 7: ${currentPlanDay(demoPlan, demoDone)?.day}`);
  ok((await getLeaderboard(demo)).length === 4, "demo has three friends");
  const friendsWithGoals = await all("SELECT COUNT(*) AS n FROM student_profiles");
  ok(Number(friendsWithGoals[0].n) >= 6, "demo friends have goals");

  console.log(`All ${checks} checks passed.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
