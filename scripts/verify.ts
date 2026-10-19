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
import { getDuel, getFightRequests, getHero, requestFight, respondToFightRequest, saveLook, upgradeGear } from "../src/lib/arena";
import { gearFromLegacy, lookForSpecies, statsFor, upgradeCost } from "../src/lib/arena-rules";
import { getOrCreatePractice, getPracticeSet } from "../src/lib/content-engine";
import { all, run, scalar } from "../src/lib/db";
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
  // Heroes: looks are validated and saved per student; gear is upgraded once per click, never twice.
  const balanceOf = (id: string) => scalar("SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = ?", [id]);
  const heroA = await getHero(A);
  ok(!heroA.chosen && heroA.fighter.gear.sword === 1 && heroA.fighter.gear.helmet === 1 && heroA.fighter.gear.armor === 1, "new hero: not chosen yet, starter gear");
  const owlLook = { ...lookForSpecies("owl"), palette: 2, eyes: "sharp" as const, expression: "fierce" as const, features: { tufts: "none", pattern: "dots" } };
  ok(!(await saveLook(A, { ...owlLook, species: "human" })).ok, "unknown species rejected");
  ok(!(await saveLook(A, { ...owlLook, palette: 9 })).ok, "unknown palette rejected");
  ok(!(await saveLook(A, { ...owlLook, eyes: "laser" })).ok, "unknown eyes rejected");
  ok((await saveLook(A, { ...owlLook, features: { tufts: "horns", horns: "big" } })).ok, "features of other species are ignored");
  ok(!(await saveLook(A, { ...owlLook, features: { tufts: "antlers" } })).ok, "unknown feature option rejected");
  ok((await saveLook(A, owlLook)).ok, "look saved");
  const savedA = await getHero(A);
  ok(savedA.chosen && JSON.stringify(savedA.fighter.look) === JSON.stringify(owlLook), "look read back exactly");
  ok((await saveLook(B, { ...lookForSpecies("robot"), palette: 1 })).ok, "second student saves another hero");
  ok((await getHero(A)).fighter.look.species === "owl" && (await getHero(B)).fighter.look.species === "robot", "looks are kept per student");

  const before = await balanceOf(A);
  ok(before >= upgradeCost(1) + upgradeCost(2) + upgradeCost(1), `enough points to test upgrades: ${before}`);
  const up = await upgradeGear(A, "sword", 1);
  ok(up.ok && up.level === 2 && up.price === upgradeCost(1), "sword upgraded to level 2");
  ok((await balanceOf(A)) === before - upgradeCost(1), "upgrade charged exactly its price");
  ok(!(await upgradeGear(A, "sword", 1)).ok && (await balanceOf(A)) === before - upgradeCost(1), "repeated request for the same level is refused and not charged");
  const racing = await Promise.all([upgradeGear(A, "sword", 2), upgradeGear(A, "sword", 2), upgradeGear(A, "sword", 2)]);
  ok(racing.filter((r) => r.ok).length === 1, "three simultaneous clicks raise the level once");
  ok((await getHero(A)).fighter.gear.sword === 3 && (await balanceOf(A)) === before - upgradeCost(1) - upgradeCost(2), "and charge once");
  ok(!(await upgradeGear(A, "shield", 1)).ok && !(await upgradeGear(A, "armor", 0)).ok && !(await upgradeGear(A, "armor", 20)).ok, "unknown slot and impossible levels refused");
  ok(await scalar("SELECT COUNT(*) FROM arena_upgrades WHERE user_id = ?", [A]) === 2, "every paid upgrade logged once");

  // Not enough points: nothing changes. Two upgrades that together cost more than the balance: only one goes through.
  const poor = randomUUID();
  await run("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)", [poor, `${poor}@test.kz`, "Бедный", "x", new Date().toISOString()]);
  await run("INSERT INTO points (id, user_id, amount, reason, ref, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [randomUUID(), poor, upgradeCost(1) + 5, "test", null, "2026-01-01", new Date().toISOString()]);
  const both = await Promise.all([upgradeGear(poor, "helmet", 1), upgradeGear(poor, "armor", 1)]);
  ok(both.filter((r) => r.ok).length === 1 && (await balanceOf(poor)) === 5, "two upgrades cannot spend the same points");
  const broke = await upgradeGear(poor, "sword", 1);
  ok(!broke.ok && /Не хватает/.test(broke.error) && (await getHero(poor)).fighter.gear.sword === 1 && (await balanceOf(poor)) === 5, "not enough points: refused, nothing changed");

  // The first arena's purchases become gear levels; the balance is untouched.
  const veteran = randomUUID();
  await run("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)", [veteran, `${veteran}@test.kz`, "Ветеран", "x", new Date().toISOString()]);
  await run("INSERT INTO arena_fighters (user_id, color, weapon, shield, updated_at) VALUES (?, 'violet', 'iron-sword', 'kite-shield', ?)", [veteran, new Date().toISOString()]);
  for (const [item, price] of [["iron-sword", 180], ["kite-shield", 300]] as const) {
    await run("INSERT INTO arena_items (user_id, item_id, price, purchased_at) VALUES (?, ?, ?, ?)", [veteran, item, price, new Date().toISOString()]);
  }
  const veteranBalance = await balanceOf(veteran);
  const migrated = await getHero(veteran);
  const expected = gearFromLegacy(["iron-sword", "kite-shield"]);
  ok(JSON.stringify(migrated.fighter.gear) === JSON.stringify(expected) && expected.sword >= 5, `old purchases became gear: ${JSON.stringify(expected)}`);
  ok((await balanceOf(veteran)) === veteranBalance && JSON.stringify((await getHero(veteran)).fighter.gear) === JSON.stringify(expected), "migration keeps the balance and runs once");
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
  const duelSnapshot = (await getDuel(A, fight.duelId!))!;
  ok(duelSnapshot.attacker.look.species === "owl" && duelSnapshot.attacker.gear.sword === 3 && duelSnapshot.defender.look.species === "robot", "duel keeps both heroes and their gear");
  ok(duelSnapshot.fight.maxHp[0] === statsFor(duelSnapshot.attacker.gear).hp, "fight stats come from the gear");
  await saveLook(A, lookForSpecies("cat"));
  ok((await getDuel(A, fight.duelId!))!.attacker.look.species === "owl", "changing the hero later does not change a past duel");
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
