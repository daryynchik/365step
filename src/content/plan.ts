import { ADMISSIONS } from "./admissions";
import { FIELDS, READING, type FieldId } from "./fields";
import { IELTS, IELTS_ORDER } from "./ielts";
import { SAT_MATH } from "./sat-math";
import { SAT_RW } from "./sat-rw";
import type { Course, CourseId, Lesson, Question } from "./types";
import { VOCAB } from "./vocab";

/**
 * The personal plan.
 *
 * Every student gets their own path from the day they start to the day they
 * finish school, built from three answers: where they want to study, their
 * field, and when they graduate. Nothing is stored except those answers —
 * the plan is a pure function of them, so it is the same on every request and
 * changes immediately when the student changes their goal.
 *
 *   - New lessons are spread evenly over the time available, not crammed into
 *     the first weeks: English (IELTS and SAT Reading & Writing alternating),
 *     SAT Math and academic vocabulary until shortly before the application
 *     deadline; reading in the student's field for the whole period.
 *   - Admissions steps are placed relative to the application deadline of the
 *     chosen country: the college list early, the personal statement months
 *     before the deadline, the final check just before it.
 *   - Days without a new lesson get review sets drawn from what the student has
 *     already covered; the last weeks before the deadline get mock sections.
 *   - Short timelines are compressed (more per day), long ones are stretched.
 *
 * A day opens when every lesson of the previous day is done.
 */

import {
  addDays,
  applicationDeadline,
  daysBetween,
  MAX_PLAN_DAYS,
  MIN_PLAN_DAYS,
  type CountryId,
  type StudentProfile,
} from "./goal";

export { COUNTRIES, isCountryId, applicationDeadline, MIN_PLAN_DAYS, MAX_PLAN_DAYS, type Country, type CountryId, type StudentProfile } from "./goal";

// ------------------------------------------------------------- plan --

export type StepKind = "lesson" | "review" | "mock";
export type ReviewStrand = "english" | "math" | "field";

export interface PlanStep {
  key: string;
  kind: StepKind;
  /** The course whose colour and chip the step uses. */
  courseId: CourseId | "review";
  title: string;
  /** Chip on the path: "IELTS · Reading", "SAT · Math", "Поступление"… */
  label: string;
  minutes: number;
  icon: "lesson" | "listening" | "speaking" | "writing" | "reading" | "admissions" | "math" | "review" | "mock";
}

export interface PlanDay {
  /** 1-based. */
  day: number;
  date: string;
  phase: "prep" | "final" | "after";
  steps: PlanStep[];
}

export interface Plan {
  profile: StudentProfile;
  days: PlanDay[];
  deadline: string;
  /** True when the usual deadline for this graduation year has already passed. */
  deadlinePassed: boolean;
  /** Index (0-based) of the first day after the deadline. */
  prepDays: number;
  /** Optional guided tool lessons; do not move or gate the existing daily plan. */
  tutorials: PlanStep[];
  newLessons: number;
  reviewSteps: number;
  /** Average steps per day before the deadline. */
  load: number;
}

interface Entry {
  course: Course;
  lesson: Lesson;
  key: string;
}

function entriesOf(course: Course, filter?: (lesson: Lesson, unitId: string) => boolean): Entry[] {
  return course.units.flatMap((unit) =>
    unit.lessons
      .filter((lesson) => !filter || filter(lesson, unit.id))
      .map((lesson) => ({ course, lesson, key: `${course.id}/${lesson.id}` })),
  );
}

function englishEntries(): Entry[] {
  const ielts = IELTS_ORDER.map((id) => entriesOf(IELTS).find((e) => e.lesson.id === id)!);
  const sat = entriesOf(SAT_RW);
  const out: Entry[] = [];
  for (let i = 0; i < Math.max(ielts.length, sat.length); i++) {
    if (ielts[i]) out.push(ielts[i]);
    if (sat[i]) out.push(sat[i]);
  }
  return out;
}

const UNDECIDED_FIELD_TEXTS = 4;

function fieldEntries(field: FieldId): Entry[] {
  if (field !== "undecided") return entriesOf(READING, (_, unitId) => unitId === field);
  // Not decided yet: a taste of every field, round robin.
  const perField = FIELDS.map((f) => entriesOf(READING, (_, unitId) => unitId === f.id).slice(0, UNDECIDED_FIELD_TEXTS));
  const out: Entry[] = [];
  for (let i = 0; i < UNDECIDED_FIELD_TEXTS; i++) for (const list of perField) if (list[i]) out.push(list[i]);
  return out;
}

/** Admissions steps for a country, with where they fall between start (0) and the deadline (1). */
function admissionsEntries(country: CountryId): { entry: Entry; at: number }[] {
  const essaysFor: Record<CountryId, string[]> = {
    usa: ["ps-draft", "supplements"],
    canada: ["ps-draft", "supplements"],
    uk: ["ucas-statement"],
    europe: ["motivation-letter"],
    asia: ["motivation-letter", "ps-draft"],
    undecided: ["ps-draft", "ucas-statement", "motivation-letter"],
  };
  const anchors: Record<string, number> = {
    map: 0,
    tests: 0.04,
    "college-list": 0.12,
    deadlines: 0.18,
    extracurriculars: 0.25,
    "activities-list": 0.32,
    "ps-topic": 0.4,
    "ps-draft": 0.5,
    "ucas-statement": 0.55,
    "motivation-letter": 0.58,
    supplements: 0.62,
    recommendations: 0.68,
    "financial-aid": 0.75,
    "final-check": 0.94,
  };
  const optional = new Set(["ps-draft", "ucas-statement", "motivation-letter", "supplements"]);
  return entriesOf(ADMISSIONS)
    .filter((e) => !optional.has(e.lesson.id) || essaysFor[country].includes(e.lesson.id))
    .map((entry) => ({ entry, at: anchors[entry.lesson.id] ?? 0.5 }))
    .sort((x, y) => x.at - y.at);
}

/** Spreads `n` items evenly over days [from, to). Several per day when n > span. */
function spread(n: number, from: number, to: number): number[] {
  const span = Math.max(1, to - from);
  return Array.from({ length: n }, (_, i) => from + Math.floor((i * span) / n));
}

function iconFor(entry: Entry): PlanStep["icon"] {
  const l = entry.lesson;
  if (l.listening) return "listening";
  if (l.speaking) return "speaking";
  if (l.writing) return "writing";
  if (entry.course.id === "reading") return "reading";
  if (entry.course.id === "admissions") return "admissions";
  if (entry.course.id === "sat-math") return "math";
  return "lesson";
}

export function lessonLabel(courseId: CourseId, lesson: Lesson): string {
  switch (courseId) {
    case "ielts":
      return `IELTS · ${lesson.skill ?? "English"}`;
    case "sat-rw":
      return "SAT · Reading & Writing";
    case "sat-math":
      return lesson.tutorial ? "SAT · Desmos" : "SAT · Math";
    case "admissions":
      return "Поступление";
    case "reading":
      return `Чтение · ${lesson.skill ?? "специальность"}`;
    case "vocab":
      return "Лексика";
    default:
      return "";
  }
}

function lessonStep(entry: Entry): PlanStep {
  return {
    key: entry.key,
    kind: "lesson",
    courseId: entry.course.id,
    title: entry.lesson.title,
    label: lessonLabel(entry.course.id, entry.lesson),
    minutes: entry.lesson.minutes,
    icon: iconFor(entry),
  };
}

const STRAND_TITLE: Record<ReviewStrand, string> = {
  english: "английский",
  math: "математика",
  field: "чтение по специальности",
};

function reviewStep(strand: ReviewStrand, day: number, mock: boolean): PlanStep {
  return {
    key: mock ? `review/mock-${strand}-${day}` : `review/${strand}-${day}`,
    kind: mock ? "mock" : "review",
    courseId: "review",
    title: mock ? `Пробная секция: ${strand === "math" ? "SAT Math" : "English"}` : `Повторение: ${STRAND_TITLE[strand]}`,
    label: mock ? "Пробная секция" : "Повторение",
    minutes: mock ? 20 : 10,
    icon: mock ? "mock" : "review",
  };
}

export function buildPlan(profile: StudentProfile): Plan {
  const deadline = applicationDeadline(profile);
  const total = Math.min(MAX_PLAN_DAYS, Math.max(MIN_PLAN_DAYS, daysBetween(profile.startDate, profile.graduation)));
  const untilDeadline = daysBetween(profile.startDate, deadline);
  const deadlinePassed = untilDeadline < 14;
  // Exam prep and essays need time; if the usual deadline is too close or gone,
  // work towards graduation instead (later intakes, a gap year).
  const prep = deadlinePassed ? total : Math.min(total, untilDeadline);
  const finalFrom = Math.max(1, Math.floor(prep * 0.88));

  const slots: PlanStep[][] = Array.from({ length: total }, () => []);
  const place = (day: number, step: PlanStep) => slots[Math.min(total - 1, Math.max(0, day))].push(step);

  const english = englishEntries();
  const math = entriesOf(SAT_MATH, (lesson) => !lesson.tutorial);
  const tutorials = entriesOf(SAT_MATH, (lesson) => !!lesson.tutorial).map(lessonStep);
  const vocab = entriesOf(VOCAB);
  const field = fieldEntries(profile.field);

  spread(english.length, 0, finalFrom).forEach((d, i) => place(d, lessonStep(english[i])));
  spread(math.length, 0, finalFrom).forEach((d, i) => place(d, lessonStep(math[i])));
  // Vocabulary sits between the other lessons rather than on top of them.
  spread(vocab.length, 1, Math.max(2, Math.floor(prep * 0.75))).forEach((d, i) => place(d, lessonStep(vocab[i])));
  spread(field.length, 1, total).forEach((d, i) => place(d, lessonStep(field[i])));

  let lastAdmissions = -1;
  for (const { entry, at } of admissionsEntries(profile.country)) {
    const day = Math.max(lastAdmissions + 1, Math.round(at * Math.max(0, prep - 1)));
    lastAdmissions = Math.min(total - 1, day);
    place(lastAdmissions, lessonStep(entry));
  }

  // Fill: every day before the deadline has at least two steps, every day after
  // it at least one. Reviews rotate between strands; the final stretch before
  // the deadline gets mock sections.
  // On a long timeline one step a day is plenty; on a short one, two.
  const relaxed = prep > 200;
  let rotation = 0;
  let reviews = 0;
  for (let d = 0; d < total; d++) {
    const phase = d < finalFrom ? "prep" : d < prep ? "final" : "after";
    const want = phase === "after" || (phase === "prep" && relaxed) ? 1 : 2;
    while (slots[d].length < want) {
      const strands: ReviewStrand[] =
        phase === "after" ? ["field", "english"] : phase === "final" ? ["english", "math"] : ["english", "math", "english", "math", "field"];
      const strand = strands[rotation++ % strands.length];
      const mock = phase === "final" && d % 3 === 0;
      if (slots[d].some((s) => s.key === reviewStep(strand, d + 1, mock).key)) continue;
      slots[d].push(reviewStep(strand, d + 1, mock));
      reviews++;
    }
  }

  const days: PlanDay[] = slots.map((steps, i) => ({
    day: i + 1,
    date: addDays(profile.startDate, i),
    phase: i < finalFrom ? "prep" : i < prep ? "final" : "after",
    steps,
  }));

  const newLessons = english.length + math.length + vocab.length + field.length + admissionsEntries(profile.country).length;
  const prepSteps = days.slice(0, prep).reduce((n, d) => n + d.steps.length, 0);

  return {
    profile,
    days,
    deadline,
    deadlinePassed,
    prepDays: prep,
    newLessons,
    tutorials,
    reviewSteps: reviews,
    load: Math.round((prepSteps / Math.max(1, prep)) * 10) / 10,
  };
}

// --------------------------------------------------------- queries --

const cache = new Map<string, Plan>();

/** buildPlan, memoised: the plan is a pure function of the profile. */
export function planFor(profile: StudentProfile): Plan {
  const key = `${profile.country}|${profile.field}|${profile.grade}|${profile.graduation}|${profile.startDate}`;
  let plan = cache.get(key);
  if (!plan) {
    plan = buildPlan(profile);
    if (cache.size > 500) cache.clear();
    cache.set(key, plan);
  }
  return plan;
}

export function planDayOf(plan: Plan, key: string): number | null {
  for (const d of plan.days) if (d.steps.some((s) => s.key === key)) return d.day;
  return null;
}

/** Open when every step of every earlier day is done. */
export function isPlanUnlocked(plan: Plan, key: string, done: Set<string>): boolean {
  if (plan.tutorials.some((step) => step.key === key)) return true;
  const day = planDayOf(plan, key);
  if (day === null) return false;
  for (const d of plan.days) {
    if (d.day >= day) break;
    if (d.steps.some((s) => !done.has(s.key))) return false;
  }
  return true;
}

export function currentPlanDay(plan: Plan, done: Set<string>): PlanDay | null {
  return plan.days.find((d) => d.steps.some((s) => !done.has(s.key))) ?? null;
}

export function nextPlanStep(plan: Plan, done: Set<string>): PlanStep | null {
  const day = currentPlanDay(plan, done);
  return day?.steps.find((s) => !done.has(s.key)) ?? null;
}

/** The calendar day of the plan today (1-based), clamped to the plan. */
export function todayPlanDay(plan: Plan, today: string): number {
  return Math.min(plan.days.length, Math.max(1, daysBetween(plan.profile.startDate, today) + 1));
}

// ---------------------------------------------------- review lessons --

/** mulberry32 seeded by a string: same review for the same day, every time. */
function seeded(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = (h ^ (h >>> 16)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STRAND_COURSES: Record<ReviewStrand, CourseId[]> = {
  english: ["ielts", "sat-rw", "vocab"],
  math: ["sat-math"],
  field: ["reading"],
};

const COURSE_BY_ID: Partial<Record<CourseId, Course>> = { ielts: IELTS, "sat-rw": SAT_RW, "sat-math": SAT_MATH, vocab: VOCAB, reading: READING };

function lessonByKey(key: string): Entry | null {
  const [courseId, lessonId] = key.split("/");
  const course = COURSE_BY_ID[courseId as CourseId];
  if (!course) return null;
  return entriesOf(course).find((e) => e.lesson.id === lessonId) ?? null;
}

export interface VirtualLesson {
  lesson: Lesson;
  strand: ReviewStrand;
  mock: boolean;
  /** A lesson key whose skill fresh practice can be generated for. */
  sourceKey: string | null;
}

/**
 * A review or mock section, rebuilt from the plan: questions drawn from the
 * lessons of that strand scheduled up to that day. Listening and writing-only
 * material is left out because it needs its recording or editor.
 */
export function reviewLesson(plan: Plan, key: string): VirtualLesson | null {
  const match = key.match(/^review\/(mock-)?(english|math|field)-(\d+)$/);
  if (!match) return null;
  const mock = Boolean(match[1]);
  const strand = match[2] as ReviewStrand;
  const day = Number(match[3]);
  if (!plan.days[day - 1]?.steps.some((s) => s.key === key)) return null;

  const covered: Entry[] = [];
  for (const d of plan.days.slice(0, day)) {
    for (const s of d.steps) {
      if (s.kind !== "lesson") continue;
      const entry = lessonByKey(s.key);
      if (entry && STRAND_COURSES[strand].includes(entry.course.id) && !entry.lesson.listening) covered.push(entry);
    }
  }
  // Nothing covered yet in this strand: preview its first lessons.
  if (covered.length === 0) {
    const first = plan.days.flatMap((d) => d.steps).filter((s) => s.kind === "lesson").map((s) => lessonByKey(s.key));
    covered.push(...first.filter((e): e is Entry => !!e && STRAND_COURSES[strand].includes(e.course.id) && !e.lesson.listening).slice(0, 2));
  }

  const pool: { q: Question; from: Entry }[] = covered.flatMap((from) => from.lesson.questions.map((q) => ({ q, from })));
  const rand = seeded(key + plan.profile.startDate);
  // Fisher–Yates on a copy, then take the first n.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, mock ? 10 : 6);
  if (picked.length === 0) return null;

  const sources = [...new Set(picked.map((p) => p.from.lesson.title))];
  const lesson: Lesson = {
    id: key.slice("review/".length),
    title: mock ? `Пробная секция: ${strand === "math" ? "SAT Math" : "English"}` : `Повторение: ${STRAND_TITLE[strand]}`,
    summary: mock ? "Десять заданий подряд, как на экзамене" : "Задания из пройденных уроков",
    minutes: mock ? 20 : 10,
    theory: [
      {
        body: mock
          ? "Пробная секция: десять заданий из разных навыков подряд. Постарайся решать в темпе экзамена — около полутора минут на задание — и не подглядывай в уроки."
          : "Повторение закрепляет то, что ты уже прошёл: задания вперемешку из разных уроков. Вспоминать с перерывами — один из самых надёжных способов запомнить надолго.",
      },
      { heading: "Навыки в этом наборе", body: sources.slice(0, 8).map((t) => `• ${t}`).join("\n") },
    ],
    questions: picked.map((p) => p.q),
  };

  const sourceFrom = picked.find((p) => p.from.course.id !== "vocab")?.from ?? null;
  return { lesson, strand, mock, sourceKey: sourceFrom?.key ?? null };
}

export const STRAND_COURSE: Record<ReviewStrand, CourseId> = { english: "sat-rw", math: "sat-math", field: "reading" };
