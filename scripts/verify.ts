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

import { findByKey } from "../src/content";
import { diagnosticQuestions } from "../src/content/diagnostic";
import { currentPlanDay, isPlanUnlocked, nextPlanStep, reviewLesson, type Plan, type PlanStep } from "../src/content/plan";
import { registerUser } from "../src/lib/accounts";
import { buyItem, ensureArena, equipItem, getHero, getOutfit, getRacer, saveLook, unequipSlot } from "../src/lib/arena";
import { lookForSpecies } from "../src/lib/arena-rules";
import {
  activeRaceId,
  answerCalibration,
  calibrationView,
  forfeit,
  getInvites,
  getRating,
  inviteFriend,
  joinQueue,
  leaveQueue,
  pollQueue,
  raceView,
  recentRaces,
  respondInvite,
  startCalibration,
  submitAnswer,
  type QueueStatus,
} from "../src/lib/race";
import { DISCONNECT_MS, INVITE_TTL_MS, MAX_RACE_MS } from "../src/lib/race-rules";
import { raceTask } from "../src/lib/race-tasks";
import { getOrCreatePractice, getPracticeSet } from "../src/lib/content-engine";
import { all, one, run, scalar } from "../src/lib/db";
import { addDeadline, getDeadlines, removeDeadline, toggleDeadline } from "../src/lib/deadlines";
import { ensureDemo } from "../src/lib/demo";
import { getLeaderboard, getRequests, respondToRequest, sendFriendRequest } from "../src/lib/friends";
import { canOpen, completeLesson, completePractice, getDoneKeys, getStats, submitSpeaking, submitWriting } from "../src/lib/game";
import { resolveLesson } from "../src/lib/lesson-access";
import { getPlan, getProfile, saveProfile } from "../src/lib/profile";
import { getSkillStats } from "../src/lib/skill-stats";
import { getDiagnosticLevels, getScoreHistory, getScores, saveScores } from "../src/lib/scores";

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

function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

const ESSAY = (n: number) => Array.from({ length: n }, (_, i) => (i % 12 === 11 ? "word." : "word")).join(" ");

async function doStep(userId: string, plan: Plan, step: PlanStep) {
  const [courseId, lessonId] = step.key.split("/");
  const found = await resolveLesson(userId, courseId, lessonId, await getDoneKeys(userId));
  if (!found) return { ok: false as const, error: `cannot resolve ${step.key}` };
  const lesson = found.lesson;
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

  // -------------------------------------------------------------- scores --
  ok((await getScores(A)) === null, "no scores before the scores step");
  const satEntry = (total: number, rw: number, math: number) => ({
    exam: "sat" as const,
    current: { total, sections: { rw, math } },
    takenDate: null,
    source: "bluebook" as const,
    target: 1400,
    examDate: null,
  });
  ok(!(await saveScores(A, { entries: [satEntry(1160, 620, 530)] })).ok, "SAT sections must add up to the total");
  ok((await saveScores(A, { entries: [satEntry(1150, 620, 530)] })).ok, "scores saved");
  ok((await saveScores(A, { entries: [satEntry(1150, 620, 530)] })).ok, "same scores saved again");
  ok((await getScoreHistory(A)).length === 1, "unchanged scores add no history");
  ok((await saveScores(A, { entries: [satEntry(1210, 640, 570), { exam: "ielts", current: null, takenDate: null, source: null, target: 7, examDate: null }] })).ok, "scores updated");
  const history = await getScoreHistory(A);
  ok(history.length === 3 && history.filter((h) => h.exam === "sat").map((h) => h.total).join() === "1150,1210", "history keeps every SAT result");
  ok((await getScores(A))!.entries.length === 2, "current scores hold both exams");

  const diagnosticAnswers = diagnosticQuestions("ielts-reading").map((q) => (q.kind === "choice" ? q.answer : q.answers[0]));
  ok(diagnosticAnswers.length === 12, "diagnostic has 12 questions");
  const diag = await completeLesson(A, "diagnostic", "ielts-reading", diagnosticAnswers);
  ok(diag.ok && diag.result.nextHref === "/diagnostic", "diagnostic completes and returns to the list");
  ok((await getDiagnosticLevels(A))["ielts-reading"] === "hard", "all right on the diagnostic: hard");
  const halfRight = diagnosticAnswers.map((a, i) => (i % 2 === 0 ? a : null));
  await completeLesson(A, "diagnostic", "ielts-reading", halfRight);
  ok((await getDiagnosticLevels(A))["ielts-reading"] === "medium", "latest diagnostic wins: half right is medium");
  ok(!(await completeLesson(A, "diagnostic", "chemistry", [])).ok, "unknown diagnostic section rejected");

  // ------------------------------------------------------------- gating --
  // The scores and the diagnostic changed the plan.
  plan = (await getPlan(A))!;
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
      if (r.ok && (step.kind === "lesson" || step.kind === "practice")) {
        const [c, l] = step.key.split("/");
        const lesson = (await resolveLesson(A, c, l, await getDoneKeys(A)))!.lesson;
        if (lesson.writing) writing += r.result.points;
        if (lesson.speaking) speaking += r.result.points;
      }
      steps++;
    }
  }
  let done = await getDoneKeys(A);
  ok(currentPlanDay(plan, done) === null && nextPlanStep(plan, done) === null, `whole plan finished (${steps} steps)`);
  ok(speaking >= 30 * 4 && speaking % 30 === 0, `speaking paid 30 each: ${speaking}`);
  ok(writing > 0 && writing % 40 === 0, `writing tasks paid 40 each: ${writing}`);

  // ------------------------------------------------- personalised plan --
  // A: SAT R&W 640, Math 570, target 1400; IELTS with no result (diagnostic: medium), target 7.
  ok(plan.sections.length === 6, "SAT and IELTS sections active");
  ok(Math.abs(Object.values(plan.shares).reduce((a, b) => a + b, 0) - 1) < 1e-9, "shares sum to 1");
  const practiceOf = (p: Plan, section: string) => p.days.flatMap((d) => d.steps).filter((x) => x.kind === "practice" && x.section === section).length;
  ok(plan.practiceSteps > 0 && practiceOf(plan, "sat-math") > practiceOf(plan, "sat-rw"), `Math gets more practice than R&W: ${practiceOf(plan, "sat-math")} vs ${practiceOf(plan, "sat-rw")}`);
  const skillStats = await getSkillStats(A);
  ok(Object.values(skillStats).some((x) => x.level === "hard"), "all-correct answers raised some skills to hard");
  ok(Object.values(skillStats).every((x) => x.windowTotal < 10), "adaptation windows reset every 10 answers");
  const anyPractice = plan.days.flatMap((d) => d.steps).find((x) => x.kind === "practice" && x.section === "sat-math")!;
  const [pc, pl] = anyPractice.key.split("/");
  ok((await resolveLesson(A, pc, pl, done))!.lesson.questions.length === 8, "practice lesson has 8 tasks even when the bank is short");

  // An exam date: the last three weeks before it hold mock sections and the weakest skills.
  const B2 = (await registerUser("exam@test.kz", "password1", "Экзамен")).userId!;
  await saveProfile(B2, { country: "usa", field: "cs", grade: 11, graduationMonth: monthFromNow(10) });
  const examDate = addDaysIso(new Date().toISOString().slice(0, 10), 90);
  await saveScores(B2, {
    entries: [{ exam: "sat", current: { total: 1000, sections: { rw: 560, math: 440 } }, takenDate: null, source: "other", target: 1300, examDate }],
  });
  const examPlan = (await getPlan(B2))!;
  ok(examPlan.sections.length === 2 && !examPlan.days.flatMap((d) => d.steps).some((x) => x.key.startsWith("ielts/")), "SAT only: no IELTS lessons");
  const w = examPlan.windows[0];
  ok(w && w.day === 90 && w.start === 69, `exam window: days ${w?.start}–${w?.day}`);
  const inWindow = examPlan.days.slice(w.start, w.day).flatMap((d) => d.steps);
  ok(inWindow.some((x) => x.key.startsWith("bank/mock~sat-math")) && inWindow.some((x) => x.key.startsWith("bank/weak~sat-math")), "mocks and weak skills before the exam");
  ok(!inWindow.some((x) => x.kind === "lesson" && (x.key.startsWith("sat-math/") || x.key.startsWith("sat-rw/"))), "no new SAT lessons in the last weeks");
  ok(examPlan.sections.find((x) => x.section === "sat-math")!.level === "easy", "Math 440 starts easy");
  const weakKey = inWindow.find((x) => x.key.startsWith("bank/weak~"))!.key.split("/");
  ok((await resolveLesson(B2, weakKey[0], weakKey[1], new Set()))!.lesson.questions.length >= 4, "weak-skill set builds");
  const mockKey = inWindow.find((x) => x.key.startsWith("bank/mock~"))!.key.split("/");
  ok((await resolveLesson(B2, mockKey[0], mockKey[1], new Set()))!.lesson.questions.length >= 8, "mock section builds");

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
  // ------------------------------------------------ arena: money and looks --
  const balanceOf = (id: string) => scalar("SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = ?", [id]);
  const newUser = async (name: string) => {
    const id = randomUUID();
    await run("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)", [id, `${id}@test.kz`, name, "x", new Date().toISOString()]);
    return id;
  };
  const give = (id: string, amount: number) =>
    run("INSERT INTO points (id, user_id, amount, reason, ref, day, created_at) VALUES (?, ?, ?, 'test', NULL, '2026-01-01', ?)", [randomUUID(), id, amount, new Date().toISOString()]);

  // Gear bought in the fighting arenas is paid back once, by a clear rule: every coin spent on it.
  const veteran = await newUser("Ветеран");
  await give(veteran, 500);
  for (const [item, price] of [["iron-sword", 180], ["kite-shield", 300]] as const) {
    await run("INSERT INTO arena_items (user_id, item_id, price, purchased_at) VALUES (?, ?, ?, ?)", [veteran, item, price, new Date().toISOString()]);
    await give(veteran, -price);
  }
  await run("INSERT INTO arena_upgrades (id, user_id, slot, to_level, price, created_at) VALUES (?, ?, 'sword', 2, 30, ?)", [randomUUID(), veteran, new Date().toISOString()]);
  await give(veteran, -30);
  ok((await balanceOf(veteran)) === -10, "veteran spent 510 on gear");
  await Promise.all([ensureArena(veteran), ensureArena(veteran), getHero(veteran)]);
  await ensureArena(veteran);
  ok((await balanceOf(veteran)) === 500, "gear spend refunded in full");
  ok(await scalar("SELECT COUNT(*) FROM points WHERE user_id = ? AND ref = 'arena-refund'", [veteran]) === 1, "refund paid exactly once, even with parallel requests");
  ok((await getHero(veteran)).look.species !== undefined, "veteran keeps a hero");

  const heroA = await getHero(A);
  ok(!heroA.chosen, "new hero: not chosen yet");
  const owlLook = { ...lookForSpecies("owl"), palette: 2, eyes: "sharp" as const, expression: "fierce" as const, features: { tufts: "none", pattern: "dots" } };
  ok(!(await saveLook(A, { ...owlLook, species: "human" })).ok, "unknown species rejected");
  ok(!(await saveLook(A, { ...owlLook, palette: 9 })).ok, "unknown palette rejected");
  ok(!(await saveLook(A, { ...owlLook, features: { tufts: "antlers" } })).ok, "unknown feature option rejected");
  ok((await saveLook(A, owlLook)).ok, "look saved");
  ok((await saveLook(B, { ...lookForSpecies("robot"), palette: 1 })).ok, "second student saves another hero");
  ok((await getHero(A)).look.species === "owl" && (await getHero(B)).look.species === "robot", "looks are kept per student");

  // Shop: paid once, never below zero, decorative only.
  const ratingBeforeShop = await getRating(A, "sat");
  const coinsA = await balanceOf(A);
  const bought = await buyItem(A, "cap-red");
  ok(bought.ok && bought.balance === coinsA - 40 && (await balanceOf(A)) === coinsA - 40, "purchase charged exactly its price");
  ok(!(await buyItem(A, "cap-red")).ok && (await balanceOf(A)) === coinsA - 40, "buying an owned item is refused and not charged");
  ok(!(await buyItem(A, "laser-sword")).ok, "unknown item refused");
  const crowns = await Promise.all([buyItem(A, "crown-gold"), buyItem(A, "crown-gold"), buyItem(A, "crown-gold")]);
  ok(crowns.filter((r) => r.ok).length === 1 && (await balanceOf(A)) === coinsA - 40 - 300, "three simultaneous purchases charge once");
  const poor = await newUser("Бедный");
  await give(poor, 50);
  const racing = await Promise.all([buyItem(poor, "cap-red"), buyItem(poor, "cap-blue")]);
  ok(racing.filter((r) => r.ok).length === 1 && (await balanceOf(poor)) === 10, "two purchases cannot spend the same coins");
  const tooDear = await buyItem(poor, "crown-gold");
  ok(!tooDear.ok && /Недостаточно монет/.test(tooDear.error) && (await balanceOf(poor)) === 10, "not enough coins: refused, balance never negative");
  ok(await scalar("SELECT COUNT(*) FROM arena_wardrobe WHERE user_id = ?", [poor]) === 1, "refused purchase leaves no item behind");
  ok((await equipItem(A, "cap-red")).ok && (await getOutfit(A)).head === "cap-red", "item worn");
  ok(!(await equipItem(A, "top-hat")).ok, "an item not bought cannot be worn");
  ok((await equipItem(A, "crown-gold")).ok && (await getOutfit(A)).head === "crown-gold", "one item per slot: the crown replaces the cap");
  ok((await unequipSlot(A, "head")).ok && !(await getOutfit(A)).head, "item taken off");
  await equipItem(A, "crown-gold");
  ok((await getRacer(A)).outfit.head === "crown-gold", "the race shows what is worn");
  ok(JSON.stringify(await getRating(A, "sat")) === JSON.stringify(ratingBeforeShop), "purchases do not touch the rating");

  // ------------------------------------------------- races: matchmaking --
  const T = Date.now();
  const raceRow = (id: string) => one("SELECT * FROM races WHERE id = ?", [id]);
  const roundOf = async (id: string) => {
    const r = (await one("SELECT rr.* FROM races x JOIN race_rounds rr ON rr.race_id = x.id AND rr.round_no = x.round_no WHERE x.id = ?", [id]))!;
    const task = raceTask(String(r.task_id))!;
    const q = task.question;
    return {
      no: Number(r.round_no),
      opens: Number(r.opens_ms),
      duration: Number(r.duration_ms),
      task,
      right: (q.kind === "choice" ? q.answer : q.answers[0]) as number | string,
      wrong: (q.kind === "choice" ? (q.answer + 1) % q.options.length : "definitely wrong") as number | string,
    };
  };
  ok(!(await joinQueue(A, "chess", T)).ok, "unknown track refused");
  const C = await newUser("Сильная");
  await run("INSERT INTO race_ratings (user_id, track, rating, games, wins, calibrated, updated_at) VALUES (?, 'sat', 1600, 30, 20, 1, ?)", [C, new Date().toISOString()]);
  const qa = await joinQueue(A, "sat", T);
  ok(qa.ok && qa.queue.status === "searching", "A searches");
  ok(((await joinQueue(C, "sat", T + 500)) as { queue: QueueStatus }).queue.status === "searching", "a much stronger student waits");
  const qb = await joinQueue(B, "sat", T + 2000);
  const raceId = qb.ok && qb.queue.status === "race" ? qb.queue.raceId : "";
  ok(raceId !== "", "B is matched with A, the closest rating");
  const fromA = await pollQueue(A, T + 2100);
  ok(fromA.status === "race" && fromA.raceId === raceId, "A sees the same race");
  const cWait = await pollQueue(C, T + 10 * 60_000);
  ok(cWait.status === "searching" && cWait.window === 400, "the range widens but stays within ±400");
  await leaveQueue(C);
  ok((await pollQueue(C, T + 10 * 60_000)).status === "idle", "cancelling the search leaves the queue");
  ok((await activeRaceId(A)) === raceId && (await activeRaceId(B)) === raceId, "an unfinished race can be returned to");
  ok(((await joinQueue(A, "sat", T + 2200)) as { queue: QueueStatus }).queue.status === "race", "no second search while in a race");

  // --------------------------------------------------- races: the rounds --
  let view = (await raceView(A, raceId, T + 2300))!;
  ok(view.round?.phase === "countdown" && view.me.pos === 0 && view.opp.pos === 0, "both start before the first cell");
  let round = await roundOf(raceId);
  ok(!(await submitAnswer(A, raceId, round.no, round.right, round.opens - 1)).ok, "no answers before the question opens");
  view = (await raceView(A, raceId, round.opens))!;
  const shown = view.round;
  ok(shown?.phase === "open" && shown.question !== null, "A receives the question");
  ok(!JSON.stringify(shown).includes(round.task.question.explanation.slice(0, 30)) && !("answer" in shown!.question!), "no answer or explanation is sent before the round ends");
  const viewB = (await raceView(B, raceId, round.opens + 2000))!;
  ok(viewB.round?.question?.prompt === shown!.question!.prompt, "both get the same question");
  const bWrong = await submitAnswer(B, raceId, round.no, round.wrong, round.opens + 3000);
  ok(bWrong.ok && !bWrong.correct && Number((await raceRow(raceId))!.pos_b) === 0, "a wrong answer is checked on the server and moves nobody");
  const retry = await submitAnswer(B, raceId, round.no, round.right, round.opens + 3500);
  ok(!retry.ok, "a wrong answer cannot be retried in the same round");
  const aRight = await submitAnswer(A, raceId, round.no, round.right, round.opens + 8000);
  ok(aRight.ok && aRight.correct, "A answers right");
  ok(Number((await raceRow(raceId))!.pos_a) === 1, "first right answer moves one cell");
  const second = await roundOf(raceId);
  ok(second.no === 2 && second.task.id !== round.task.id, "a new common question follows");

  // Round 2: A's answer arrives first, but B, who got the question 3 s later, reacted faster.
  round = second;
  await raceView(A, raceId, round.opens);
  await raceView(B, raceId, round.opens + 3000);
  await submitAnswer(A, raceId, round.no, round.right, round.opens + 6000);
  ok(Number((await raceRow(raceId))!.pos_a) === 1, "A's right answer waits while B could still be faster");
  await submitAnswer(B, raceId, round.no, round.right, round.opens + 3000 + 5000);
  let row = (await raceRow(raceId))!;
  ok(Number(row.pos_b) === 1 && Number(row.pos_a) === 1, "the faster reaction wins, measured from each student's own start");

  // Round 3: both wrong — nobody moves.
  round = await roundOf(raceId);
  await raceView(A, raceId, round.opens);
  await raceView(B, raceId, round.opens);
  await submitAnswer(A, raceId, round.no, round.wrong, round.opens + 2000);
  await submitAnswer(B, raceId, round.no, round.wrong, round.opens + 2500);
  row = (await raceRow(raceId))!;
  ok(Number(row.pos_a) === 1 && Number(row.pos_b) === 1 && Number(row.round_no) === 4, "both wrong: nobody moves, next round");

  // Round 4: nobody answers in time.
  round = await roundOf(raceId);
  await raceView(A, raceId, round.opens);
  await raceView(B, raceId, round.opens);
  const late = round.opens + round.duration + 2000;
  // Both keep polling, as the page does every second.
  for (let t = round.opens + 30_000; t < late; t += 30_000) {
    await raceView(A, raceId, t);
    await raceView(B, raceId, t);
  }
  await raceView(A, raceId, late - 1000);
  ok(!(await submitAnswer(A, raceId, round.no, round.right, late)).ok, "answers after the time limit are refused");
  await raceView(B, raceId, late);
  row = (await raceRow(raceId))!;
  ok(Number(row.pos_a) === 1 && Number(row.pos_b) === 1 && Number(row.round_no) === 5, "time ran out: nobody moves");

  // A wins four more rounds; the last answer races against both students' polling.
  for (let i = 0; i < 4; i++) {
    round = await roundOf(raceId);
    await raceView(A, raceId, round.opens);
    await raceView(B, raceId, round.opens);
    await submitAnswer(B, raceId, round.no, round.wrong, round.opens + 1000);
    if (i < 3) await submitAnswer(A, raceId, round.no, round.right, round.opens + 4000);
    else
      await Promise.all([
        submitAnswer(A, raceId, round.no, round.right, round.opens + 4000),
        raceView(B, raceId, round.opens + 4001),
        raceView(A, raceId, round.opens + 4002),
      ]);
  }
  row = (await raceRow(raceId))!;
  ok(row.status === "finished" && Number(row.winner) === 0 && Number(row.pos_a) === 5 && row.reason === "finish", "first past five cells wins");
  const rA = await getRating(A, "sat");
  const rB = await getRating(B, "sat");
  ok(rA.rating > 1000 && rB.rating < 1000 && rA.rating - 1000 === 1000 - rB.rating && rA.games === 1 && rB.games === 1, `Elo applied once: ${rA.rating} / ${rB.rating}`);
  ok(await scalar("SELECT COUNT(*) FROM points WHERE ref = ?", [raceId]) === 2, "coins paid once to each");
  await raceView(A, raceId, round.opens + 60_000);
  await raceView(B, raceId, round.opens + 60_000);
  ok((await getRating(A, "sat")).rating === rA.rating && (await scalar("SELECT COUNT(*) FROM points WHERE ref = ?", [raceId])) === 2, "looking at a finished race changes nothing");
  ok(!(await submitAnswer(A, raceId, round.no, round.right, round.opens + 70_000)).ok, "no answers after the finish");
  const result = (await raceView(B, raceId, round.opens + 80_000))!;
  ok(result.winner === "opp" && result.me.delta < 0 && result.opp.delta > 0, "results show the rating change");
  ok(result.review!.length === 8 && result.review!.every((r) => r.explanation.length > 20), "every round is reviewed with an explanation");
  ok(result.review![0].me?.correct === false && result.review![0].opp?.correct === true, "the review shows both students' answers");
  ok(result.topics!.length > 0, "topics to review are listed");
  ok(new Set((await all("SELECT task_id FROM race_rounds WHERE race_id = ?", [raceId])).map((r) => String(r.task_id))).size === 8, "no question repeats within a race");

  // ------------------------------------------ races: leaving and limits --
  const startRace = async (t: number) => {
    await joinQueue(A, "sat", t);
    const q = await joinQueue(B, "sat", t + 100);
    return q.ok && q.queue.status === "race" ? q.queue.raceId : "";
  };
  const T2 = T + 3_600_000;
  const r2 = await startRace(T2);
  const usedBefore = new Set((await all("SELECT task_id FROM race_rounds WHERE race_id = ?", [raceId])).map((r) => String(r.task_id)));
  ok(!usedBefore.has((await roundOf(r2)).task.id), "recently shown questions are not repeated");
  const beforeForfeit = await getRating(A, "sat");
  ok((await forfeit(A, r2, T2 + 10_000)).ok, "leaving a race");
  row = (await raceRow(r2))!;
  ok(row.status === "finished" && Number(row.winner) === 1 && row.reason === "forfeit" && Number(row.coins_a) === 0, "leaving gives the win to the opponent and no coins to the leaver");
  ok(Number(row.coins_b) === 0, "a race left before three rounds pays nobody (no coin farming by quitting)");
  ok((await getRating(A, "sat")).rating < beforeForfeit.rating, "leaving a rated race costs rating");
  ok(!(await forfeit(A, r2, T2 + 11_000)).ok, "a finished race cannot be left twice");

  const T3 = T2 + 3_600_000;
  const r3 = await startRace(T3);
  await raceView(A, r3, T3 + 30_000);
  const away = (await raceView(A, r3, T3 + 100 + DISCONNECT_MS + 1))!;
  ok(away.status === "finished" && away.winner === "me" && away.reason === "disconnect", "an opponent who disappears loses after a minute");

  const T4 = T3 + 3_600_000;
  const r4 = await startRace(T4);
  for (let t = T4 + 50_000; t < T4 + MAX_RACE_MS; t += 50_000) {
    await raceView(A, r4, t);
    await raceView(B, r4, t);
  }
  const timed = (await raceView(A, r4, T4 + MAX_RACE_MS + 1000))!;
  ok(timed.status === "finished" && timed.reason === "time", `a race cannot last longer than the limit: ${timed.status} ${timed.reason}`);

  // ------------------------------------------------ friendly invitations --
  const D = await newUser("Незнакомец");
  ok(!(await inviteFriend(A, D, "ielts", T4)).ok, "only friends can be invited");
  ok((await inviteFriend(A, B, "ielts", T4)).ok, "friend invited to a friendly race");
  ok(!(await inviteFriend(B, A, "ielts", T4)).ok, "no crossed invitations");
  const inv = (await getInvites(B, T4))[0];
  ok(!(await respondInvite(A, inv.id, "accept", T4)).ok, "the sender cannot accept");
  const ratingsBefore = [await getRating(A, "ielts"), await getRating(B, "ielts")];
  const accepted = await respondInvite(B, inv.id, "accept", T4 + 1000);
  ok(accepted.ok && !!accepted.raceId, "the friend accepts");
  ok(!(await respondInvite(B, inv.id, "accept", T4 + 1000)).ok, "an invitation starts one race");
  const friendly = (await raceView(A, accepted.ok ? accepted.raceId! : "", T4 + 2000))!;
  ok(friendly.mode === "friendly" && friendly.track === "ielts", "friendly IELTS race");
  await forfeit(B, friendly.id, T4 + 5000);
  ok(
    (await getRating(A, "ielts")).rating === ratingsBefore[0].rating && (await getRating(B, "ielts")).rating === ratingsBefore[1].rating,
    "friendly races never change the rating",
  );
  ok((await inviteFriend(A, B, "sat", T4 + 6000)).ok && (await respondInvite(A, (await getInvites(A, T4 + 6000))[0].id, "cancel", T4 + 6000)).ok, "an invitation can be cancelled");
  ok((await inviteFriend(A, B, "sat", T4 + 7000)).ok && (await getInvites(B, T4 + 7000 + INVITE_TTL_MS + 1)).length === 0, "invitations expire");

  // ---------------------------------------------------------- calibration --
  const E = await newUser("Новичок");
  const cal = await startCalibration(E, "sat", T4);
  ok(cal.ok, "calibration starts");
  const calId = cal.ok ? cal.id : "";
  for (let i = 0; i < 6; i++) {
    const v = (await calibrationView(E, calId))!;
    const tasks = JSON.parse(String((await one("SELECT tasks FROM race_calibrations WHERE id = ?", [calId]))!.tasks)) as string[];
    const q = raceTask(tasks[v.index])!.question;
    const answerIt = await answerCalibration(E, calId, v.index, q.kind === "choice" ? q.answer : q.answers[0]);
    ok(answerIt.ok && answerIt.correct, `calibration question ${i + 1} checked on the server`);
    if (i === 0) ok(!(await answerCalibration(E, calId, 0, 0)).ok, "a calibration answer cannot be changed");
  }
  const calibrated = await getRating(E, "sat");
  ok(calibrated.calibrated && calibrated.rating === 1300, "all right: the strongest starting rating");
  ok(!(await startCalibration(E, "sat", T4)).ok, "calibration happens once");

  const board = await getLeaderboard(A);
  ok(board[0].isMe && board[0].lessons >= steps && board[0].wins >= 1, "leaderboard counts plan steps and race wins");
  const stats = await getStats(A);
  ok(stats.level.level >= 5, `level after a whole plan: ${stats.level.level}`);

  // ---------------------------------------------------------------- demo --
  const demo = await ensureDemo();
  ok(demo === (await ensureDemo()), "ensureDemo is idempotent");
  const demoPlan = (await getPlan(demo))!;
  const demoDone = await getDoneKeys(demo);
  ok(demoPlan.profile.country === "usa" && demoPlan.profile.field === "cs", "demo has a goal");
  ok(currentPlanDay(demoPlan, demoDone)?.day === 7, `demo is on day 7: ${currentPlanDay(demoPlan, demoDone)?.day}`);
  ok((await getLeaderboard(demo)).length === 4, "demo has three friends");
  const demoRaces = await recentRaces(demo);
  ok(demoRaces.length === 2 && demoRaces.some((r) => r.mode === "friendly") && demoRaces.some((r) => r.mode === "rated"), "demo has a rated and a friendly race");
  ok(Object.keys(await getOutfit(demo)).length >= 3, "demo hero wears accessories");
  const demoReview = (await raceView(demo, demoRaces[0].id, Date.now()))!;
  ok(demoReview.status === "finished" && demoReview.review!.length > 0, "demo race has a review");
  const friendsWithGoals = await all("SELECT COUNT(*) AS n FROM student_profiles");
  ok(Number(friendsWithGoals[0].n) >= 6, "demo friends have goals");

  console.log(`All ${checks} checks passed.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
