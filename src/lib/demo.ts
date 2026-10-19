/**
 * The demo account and its friends.
 *
 * Created on demand (the first time someone presses "Try the demo", or by
 * `npm run db:seed`), so a fresh database — including Vercel's ephemeral /tmp —
 * needs no separate seeding step. Everything is written through the same tables
 * real users write to; the history is simply back-dated.
 */

import { randomUUID } from "node:crypto";

import { COURSES, findByKey, flatten } from "@/content";
import type { FieldId } from "@/content/fields/ids";
import { bankLesson } from "@/content/bank/lessons";
import type { ExamEntry } from "@/content/exams";
import { planFor, reviewLesson, type CountryId } from "@/content/plan";
import type { Lesson } from "@/content/types";
import { itemName, lookForSpecies, simulate, STARTER_GEAR, upgradeCost, validateLook, type Fighter, type Gear, type Look, type Slot, type SpeciesId } from "./arena-rules";
import { one, run, transaction } from "./db";
import { addDays, nowIso, todayIso } from "./date";
import { hashPassword } from "./password";
import { lessonPoints, levelFor, POINTS } from "./rules";

export const DEMO_EMAIL = "demo@365step.app";
export const DEMO_PASSWORD = "demo1234";

interface Persona {
  email: string;
  name: string;
  goal: { country: CountryId; field: FieldId; grade: number; graduationMonthsAhead: number };
  /** Whole plan days finished (the plan started this many days ago), plus steps of the next day. */
  trackDays: number;
  partial?: number;
  /** Seminar lessons finished. */
  seminar?: number;
  /** Consecutive active days ending today (0 = not active today or yesterday). */
  streak: number;
  /** Days of history the finished lessons are spread across. */
  days: number;
  /** Arena hero: species, palette and a few looks. */
  hero: { species: SpeciesId; palette: number; eyes?: Look["eyes"]; expression?: Look["expression"]; features?: Record<string, string> };
  /** Gear levels bought with earned points, in the order they were bought. */
  gear: Partial<Gear>;
  /** Reported exam scores; exam dates are given in days from today. */
  scores?: (Omit<ExamEntry, "examDate"> & { examInDays: number | null })[];
}

const DEMO: Persona = {
  email: DEMO_EMAIL,
  name: "Алия",
  goal: { country: "usa", field: "cs", grade: 11, graduationMonthsAhead: 8 },
  trackDays: 6,
  partial: 1,
  seminar: 3,
  streak: 6,
  days: 18,
  hero: { species: "fox", palette: 0, eyes: "sparkle", expression: "smile" },
  gear: { sword: 4, helmet: 3, armor: 3 },
  scores: [
    { exam: "sat", current: { total: 1150, sections: { rw: 620, math: 530 } }, takenDate: null, source: "bluebook", target: 1400, examInDays: 120 },
    {
      exam: "ielts",
      current: { total: 6, sections: { listening: 6.5, reading: 6, writing: 5.5, speaking: 6 } },
      takenDate: null,
      source: null,
      target: 7,
      examInDays: 170,
    },
  ],
};

const FRIENDS: Persona[] = [
  {
    email: "daniyar@365step.app",
    name: "Данияр",
    goal: { country: "uk", field: "engineering", grade: 11, graduationMonthsAhead: 8 },
    trackDays: 9,
    scores: [{ exam: "ielts", current: { total: 7, sections: { listening: 7.5, reading: 7, writing: 6.5, speaking: 7 } }, takenDate: null, source: null, target: 7.5, examInDays: null }],
    streak: 12,
    days: 20,
    hero: { species: "bear", palette: 0, eyes: "round", expression: "fierce" },
    gear: { sword: 6, helmet: 4, armor: 5 },
  },
  {
    email: "madina@365step.app",
    name: "Мадина",
    goal: { country: "europe", field: "medicine", grade: 10, graduationMonthsAhead: 20 },
    trackDays: 7,
    partial: 2,
    seminar: 5,
    streak: 3,
    days: 25,
    hero: { species: "owl", palette: 2, eyes: "sharp", expression: "smirk" },
    gear: { sword: 4, helmet: 5, armor: 5 },
  },
  {
    email: "timur@365step.app",
    name: "Тимур",
    goal: { country: "asia", field: "business", grade: 9, graduationMonthsAhead: 32 },
    trackDays: 2,
    streak: 0,
    days: 10,
    hero: { species: "robot", palette: 1, eyes: "button", expression: "grin" },
    gear: {},
  },
];

/** Someone who has asked to be friends, so the requests UI has something in it. */
const STRANGER: Persona = {
  email: "erlan@365step.app",
  name: "Ерлан",
  goal: { country: "undecided", field: "undecided", grade: 10, graduationMonthsAhead: 20 },
  trackDays: 1,
  streak: 1,
  days: 4,
  hero: { species: "slime", palette: 1, eyes: "round", expression: "calm" },
  gear: {},
};

const DEMO_WRITING = `Walton's letters suggest that ambition can make a person blind to danger. In Letter 1 he admits that his goals are "sufficient to conquer all fear of danger or death" (Letter 1). This shows that Walton treats fear as an obstacle to be defeated rather than a warning to be heard. Because he wants to be the first to "tread a land never before imprinted by the foot of man" (Letter 1), the danger to his crew hardly appears in his reasoning. By opening the novel this way, Shelley prepares the reader to see Victor's story as a mirror of Walton's own choices.

Questions I still want to explore:
1. Why does Shelley let Walton, not Victor, open and close the novel?
2. Does Walton's loneliness in Letter 2 explain why he trusts the stranger so quickly?
3. Is the stranger's warning meant for Walton, or for the reader?`;

/** First day of the month `months` from now. */
function monthsAhead(today: string, months: number): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function insertPoints(userId: string, amount: number, reason: string, ref: string | null, day: string): Promise<void> {
  await run("INSERT INTO points (id, user_id, amount, reason, ref, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    randomUUID(),
    userId,
    amount,
    reason,
    ref,
    day,
    `${day}T12:00:00.000Z`,
  ]);
}

/** Creates one persona with back-dated history. Returns the user id and level. */
async function createPersona(p: Persona, passwordHash: string): Promise<{ id: string; level: number }> {
  const id = randomUUID();
  const today = todayIso();
  await run("INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)", [
    id,
    p.email,
    passwordHash,
    p.name,
    `${addDays(today, -p.days)}T09:00:00.000Z`,
  ]);

  // The goal, with the plan starting `trackDays` days ago so the student is on schedule.
  const startDate = addDays(today, -p.trackDays);
  const graduation = monthsAhead(today, p.goal.graduationMonthsAhead);
  await run(
    "INSERT INTO student_profiles (user_id, country, field, grade, graduation, start_date, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, p.goal.country, p.goal.field, p.goal.grade, graduation, startDate, nowIso()],
  );
  const entries: ExamEntry[] = (p.scores ?? []).map(({ examInDays, ...e }) => ({
    ...e,
    takenDate: e.current ? addDays(startDate, -14) : null,
    examDate: examInDays === null ? null : addDays(today, examInDays),
  }));
  if (p.scores) {
    await run("INSERT INTO student_scores (user_id, payload, updated_at) VALUES (?, ?, ?)", [id, JSON.stringify({ entries }), nowIso()]);
    for (const e of entries) {
      await run(
        `INSERT INTO score_history (id, user_id, exam, total, sections, taken_date, source, target, exam_date, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), id, e.exam, e.current?.total ?? null, JSON.stringify(e.current?.sections ?? {}), e.takenDate, e.source, e.target, e.examDate, `${startDate}T09:00:00.000Z`],
      );
    }
  }
  const plan = planFor({ country: p.goal.country, field: p.goal.field, grade: p.goal.grade, graduation, startDate }, { entries, diagnostic: {} });

  // Finished steps: each on the date of its plan day; seminar lessons spread over the same days.
  const finished: { key: string; lesson: Lesson; day: string }[] = [];
  const planSteps = [
    ...plan.days.slice(0, p.trackDays).flatMap((d) => d.steps.map((s) => ({ key: s.key, day: d.date }))),
    ...(plan.days[p.trackDays]?.steps.slice(0, p.partial ?? 0).map((s) => ({ key: s.key, day: today })) ?? []),
  ];
  for (const { key, day } of planSteps) {
    const lesson = key.startsWith("review/")
      ? reviewLesson(plan, key)?.lesson
      : key.startsWith("bank/")
        ? bankLesson(plan, key)?.lesson
        : findByKey(key)?.lesson;
    if (lesson) finished.push({ key, lesson, day });
  }
  flatten(COURSES.seminar)
    .slice(0, p.seminar ?? 0)
    .forEach((e, i) => finished.push({ key: e.key, lesson: e.lesson, day: addDays(startDate, Math.min(p.trackDays, i * 2)) }));

  let earned = 0;
  for (const [index, f] of finished.entries()) {
    const total = f.lesson.questions.length;
    // A believable score: mostly right, with the odd miss.
    const correct = total === 0 ? 0 : Math.max(1, total - ((index + p.name.length) % 3 === 0 ? 1 : 0));
    const points = f.lesson.writing ? POINTS.writing : f.lesson.speaking ? POINTS.speaking : lessonPoints(correct, total);
    const at = `${f.day}T12:00:00.000Z`;
    await run(
      `INSERT INTO lesson_results (user_id, lesson_key, best_correct, total, attempts, first_done_at, last_done_at, last_day)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
      [id, f.key, correct, total, at, at, f.day],
    );
    await insertPoints(id, points, "Урок пройден", f.key, f.day);
    earned += points;
  }

  if (p.streak > 0) {
    await run("INSERT INTO streaks (user_id, current_days, longest_days, last_active_date, updated_at) VALUES (?, ?, ?, ?, ?)", [
      id,
      p.streak,
      Math.max(p.streak, 9),
      today,
      nowIso(),
    ]);
  }

  // The hero, and gear upgraded along the way with earned points.
  const checked = validateLook({ ...lookForSpecies(p.hero.species), ...p.hero, features: { ...lookForSpecies(p.hero.species).features, ...p.hero.features } });
  const look = checked.ok ? checked.look : lookForSpecies(p.hero.species);
  const gear: Gear = { ...STARTER_GEAR };
  let spendable = earned;
  for (const slot of ["sword", "helmet", "armor"] as Slot[]) {
    while (gear[slot] < (p.gear[slot] ?? 1) && upgradeCost(gear[slot]) <= spendable) {
      const price = upgradeCost(gear[slot]);
      spendable -= price;
      gear[slot]++;
      const upgradeId = randomUUID();
      await run("INSERT INTO arena_upgrades (id, user_id, slot, to_level, price, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
        upgradeId,
        id,
        slot,
        gear[slot],
        price,
        nowIso(),
      ]);
      await insertPoints(id, -price, `Улучшение: ${itemName(slot, gear[slot])}, ур. ${gear[slot]}`, upgradeId, addDays(today, -2));
    }
  }
  await run(
    "INSERT INTO arena_heroes (user_id, look, chosen, sword, helmet, armor, updated_at) VALUES (?, ?, 1, ?, ?, ?, ?)",
    [id, JSON.stringify(look), gear.sword, gear.helmet, gear.armor, nowIso()],
  );

  return { id, level: levelFor(earned).level };
}

async function befriend(a: string, b: string, status: "accepted" | "pending", requestedBy: string): Promise<void> {
  const [x, y] = pair(a, b);
  await run(
    "INSERT INTO friendships (id, user_a, user_b, status, requested_by, created_at, responded_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [randomUUID(), x, y, status, requestedBy, nowIso(), status === "accepted" ? nowIso() : null],
  );
}

async function fighterOf(userId: string, name: string, level: number): Promise<Fighter> {
  const row = await one<{ look: string; sword: number; helmet: number; armor: number }>(
    "SELECT look, sword, helmet, armor FROM arena_heroes WHERE user_id = ?",
    [userId],
  );
  const checked = validateLook(row ? JSON.parse(String(row.look)) : null);
  return {
    userId,
    name,
    level,
    look: checked.ok ? checked.look : lookForSpecies("cat"),
    gear: row ? { sword: Number(row.sword), helmet: Number(row.helmet), armor: Number(row.armor) } : { ...STARTER_GEAR },
  };
}

async function recordDuel(attacker: Fighter, defender: Fighter, seed: number, daysAgo: number): Promise<void> {
  const fight = simulate(attacker, defender, seed);
  const winnerId = fight.winner === 0 ? attacker.userId : fight.winner === 1 ? defender.userId : null;
  const day = addDays(todayIso(), -daysAgo);
  await run(
    `INSERT INTO duels (id, attacker_id, defender_id, attacker_fighter, defender_fighter, seed, log, winner_id,
                        attacker_points, defender_points, day, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    [
      randomUUID(),
      attacker.userId,
      defender.userId,
      JSON.stringify(attacker),
      JSON.stringify(defender),
      seed,
      JSON.stringify(fight),
      winnerId,
      day,
      `${day}T16:30:00.000Z`,
    ],
  );
}

/** Returns the demo user's id, creating the demo world if it does not exist yet. */
export async function ensureDemo(): Promise<string> {
  const existing = await one<{ id: string }>("SELECT id FROM users WHERE email = ?", [DEMO_EMAIL]);
  if (existing) return String(existing.id);

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  return transaction(async () => {
    // Another request may have created it while we were hashing.
    const raced = await one<{ id: string }>("SELECT id FROM users WHERE email = ?", [DEMO_EMAIL]);
    if (raced) return String(raced.id);

    const me = await createPersona(DEMO, passwordHash);
    const friends = [];
    for (const persona of FRIENDS) {
      const existingFriend = await one<{ id: string }>("SELECT id FROM users WHERE email = ?", [persona.email]);
      if (existingFriend) continue;
      const created = await createPersona(persona, passwordHash);
      friends.push({ ...created, name: persona.name });
      await befriend(me.id, created.id, "accepted", created.id);
    }
    if (!(await one("SELECT id FROM users WHERE email = ?", [STRANGER.email]))) {
      const stranger = await createPersona(STRANGER, passwordHash);
      await befriend(me.id, stranger.id, "pending", stranger.id);
    }

    await run("INSERT INTO writings (user_id, lesson_key, body, words, submitted_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", [
      me.id,
      "seminar/m1-write",
      DEMO_WRITING,
      DEMO_WRITING.split(/\s+/).length,
      nowIso(),
      nowIso(),
    ]);

    // A few planner entries so the deadlines card has countdowns.
    for (const [title, inDays, done] of [
      ["IELTS — дата экзамена", 9, 0],
      ["Early Action — первая заявка", 24, 0],
      ["Стипендия — пакет документов", 52, 0],
      ["Регистрация на SAT", -3, 1],
    ] as const) {
      await run("INSERT INTO deadlines (id, user_id, title, due_date, done, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
        randomUUID(),
        me.id,
        title,
        addDays(todayIso(), inDays),
        done,
        nowIso(),
      ]);
    }

    // A little arena history in both directions.
    const aliya = await fighterOf(me.id, DEMO.name, me.level);
    const [daniyar, madina] = await Promise.all(friends.slice(0, 2).map((f) => fighterOf(f.id, f.name, f.level)));
    if (daniyar) await recordDuel(daniyar, aliya, 1234567, 1);
    if (madina) await recordDuel(aliya, madina, 7654321, 3);

    return me.id;
  });
}
