import { ADMISSIONS } from "./admissions";
import { FIELDS, READING, type FieldId } from "./fields";
import { IELTS, IELTS_ORDER } from "./ielts";
import { SAT_MATH } from "./sat-math";
import { SAT_RW } from "./sat-rw";
import type { Course, CourseId, Lesson, Question } from "./types";
import { VOCAB } from "./vocab";
import { drawTasks, type Shortage } from "./bank/draw";
import { poolSize } from "./bank/pool";
import { skillById, skillSequence, skillsOf, type Skill } from "./bank/taxonomy";
import { LEVEL_TITLES, SECTION_TITLES, type DiagnosticSection, type ExamEntry, type Level, type SectionId } from "./exams";
import { difficultiesFor, lessonShares, sectionStates, type SectionState } from "./skill-level";

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

export type StepKind = "lesson" | "practice" | "review" | "mock";
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
  /** Practice from the task bank: the section, its skill and the level planned for it. */
  section?: SectionId;
  skill?: string;
  level?: Level;
}

export interface PlanDay {
  /** 1-based. */
  day: number;
  date: string;
  phase: "prep" | "final" | "after";
  steps: PlanStep[];
}

/** The last weeks before a planned exam: mock sections and the weakest skills. */
export interface ExamWindow {
  date: string;
  /** 0-based plan day of the exam (may lie past the end of the plan). */
  day: number;
  /** First 0-based day of the window. */
  start: number;
  sections: SectionId[];
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
  /** Practice lessons from the task bank. */
  practiceSteps: number;
  reviewSteps: number;
  /** Average steps per day before the deadline. */
  load: number;
  /** Level, gap and exam date per active section (skill-level.ts). */
  sections: SectionState[];
  /** Share of practice lessons per section. */
  shares: Record<string, number>;
  windows: ExamWindow[];
  /** Skills and levels the bank has too few tasks for, as planned. */
  shortages: Shortage[];
}

/** What the plan is built from besides the goal: exam scores and diagnostic levels. */
export interface PlanInputs {
  entries: ExamEntry[];
  diagnostic: Partial<Record<DiagnosticSection, Level>>;
  /** Diagnostic score estimates (SAT Math). */
  estimates?: Partial<Record<DiagnosticSection, number>>;
}

export const NO_INPUTS: PlanInputs = { entries: [], diagnostic: {} };

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

/** Which section an IELTS lesson belongs to; vocabulary counts as reading. */
function ieltsSection(lessonId: string): SectionId {
  const id = lessonId.replace(/^p-/, "");
  if (id.startsWith("listening")) return "ielts-listening";
  if (id.startsWith("writing")) return "ielts-writing";
  if (id.startsWith("speaking")) return "ielts-speaking";
  return "ielts-reading";
}

function ieltsEntries(active: Set<SectionId>): Entry[] {
  return IELTS_ORDER.map((id) => entriesOf(IELTS).find((e) => e.lesson.id === id)!).filter((e) => active.has(ieltsSection(e.lesson.id)));
}

/** IELTS and SAT Reading & Writing alternate, one each in turn. */
function alternate(a: Entry[], b: Entry[]): Entry[] {
  const out: Entry[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
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

// ------------------------------------------------- practice from the bank --

/** Tasks in one practice lesson of a question skill. */
export const PRACTICE_SIZE = 8;
export const MOCK_SIZE = 10;

export const SECTION_COURSE: Record<SectionId, CourseId> = {
  "sat-rw": "sat-rw",
  "sat-math": "sat-math",
  "ielts-reading": "ielts",
  "ielts-listening": "ielts",
  "ielts-writing": "ielts",
  "ielts-speaking": "ielts",
};

const SECTION_ICON: Record<SectionId, PlanStep["icon"]> = {
  "sat-rw": "lesson",
  "sat-math": "math",
  "ielts-reading": "reading",
  "ielts-listening": "listening",
  "ielts-writing": "writing",
  "ielts-speaking": "speaking",
};

/** Sections whose mock is a set of auto-graded questions. */
const MOCK_SECTIONS: SectionId[] = ["sat-rw", "sat-math", "ielts-reading"];

function practiceMinutes(skill: Skill): number {
  if (skill.kind === "writing") return skill.id.endsWith("task1") ? 20 : 40;
  return 12;
}

export function practiceKey(skillId: string, round: number): string {
  return `bank/${skillId}~${round}`;
}

function practiceStep(skill: Skill, round: number, level: Level): PlanStep {
  return {
    key: practiceKey(skill.id, round),
    kind: "practice",
    courseId: SECTION_COURSE[skill.section],
    title: `Практика: ${skill.title}`,
    // SAT Math difficulty follows each skill's step as the student answers, not the plan.
    label: skill.section === "sat-math" ? "SAT Math · по твоей ступени" : `${SECTION_TITLES[skill.section]} · ${LEVEL_TITLES[level]}`,
    minutes: practiceMinutes(skill),
    icon: SECTION_ICON[skill.section],
    section: skill.section,
    skill: skill.id,
    level,
  };
}

function bankMockStep(section: SectionId, day: number, level: Level): PlanStep {
  return {
    key: `bank/mock~${section}~${day}`,
    kind: "mock",
    courseId: SECTION_COURSE[section],
    title: `Пробная секция: ${SECTION_TITLES[section]}`,
    label: `Пробная секция · ${LEVEL_TITLES[level]}`,
    minutes: 20,
    icon: "mock",
    section,
    level,
  };
}

function weakStep(section: SectionId, day: number, level: Level): PlanStep {
  return {
    key: `bank/weak~${section}~${day}`,
    kind: "practice",
    courseId: SECTION_COURSE[section],
    title: `Слабые места: ${SECTION_TITLES[section]}`,
    label: `Перед экзаменом · ${LEVEL_TITLES[level]}`,
    minutes: 12,
    icon: "review",
    section,
    level,
  };
}

const WINDOW_DAYS = 21;

const skipped = new Set<string>();

/** A skill with no tasks at any level is left out of practice (and logged once). */
function hasTasks(skill: Skill): boolean {
  if (poolSize(skill.id) > 0) return true;
  if (!skipped.has(skill.id)) {
    skipped.add(skill.id);
    console.warn(`[bank] no tasks for ${skill.id} at any level — skipped in practice`);
  }
  return false;
}

function examWindows(states: SectionState[], startDate: string, total: number): ExamWindow[] {
  const byDate = new Map<string, SectionId[]>();
  for (const s of states) if (s.examDate) byDate.set(s.examDate, [...(byDate.get(s.examDate) ?? []), s.section]);
  return [...byDate.entries()]
    .map(([date, sections]) => {
      const day = daysBetween(startDate, date);
      // Three weeks before the exam, shorter when the exam is close.
      const length = day >= 2 * WINDOW_DAYS ? WINDOW_DAYS : Math.max(7, Math.floor(day / 3));
      return { date, day, start: Math.max(0, day - length), sections };
    })
    .filter((w) => w.day > 0 && w.start < total)
    .sort((a, b) => a.day - b.day);
}

export function buildPlan(profile: StudentProfile, inputs: PlanInputs = NO_INPUTS): Plan {
  const deadline = applicationDeadline(profile);
  const total = Math.min(MAX_PLAN_DAYS, Math.max(MIN_PLAN_DAYS, daysBetween(profile.startDate, profile.graduation)));
  const untilDeadline = daysBetween(profile.startDate, deadline);
  const deadlinePassed = untilDeadline < 14;
  // Exam prep and essays need time; if the usual deadline is too close or gone,
  // work towards graduation instead (later intakes, a gap year).
  const prep = deadlinePassed ? total : Math.min(total, untilDeadline);
  const finalFrom = Math.max(1, Math.floor(prep * 0.88));

  const states = sectionStates(inputs.entries, inputs.diagnostic, inputs.estimates ?? {});
  const active = new Set(states.map((s) => s.section));
  const stateOf = new Map(states.map((s) => [s.section, s]));
  const shares = lessonShares(states);
  const windows = examWindows(states, profile.startDate, total);

  /** Authored lessons of a section finish before its exam window, or before the final stretch. */
  const endFor = (section: SectionId) => {
    const w = windows.find((x) => x.sections.includes(section));
    return w ? Math.max(7, Math.min(total, w.start)) : finalFrom;
  };

  const slots: PlanStep[][] = Array.from({ length: total }, () => []);
  const place = (day: number, step: PlanStep) => slots[Math.min(total - 1, Math.max(0, day))].push(step);

  const ielts = ieltsEntries(active);
  const satRw = active.has("sat-rw") ? entriesOf(SAT_RW) : [];
  const math = active.has("sat-math") ? entriesOf(SAT_MATH, (lesson) => !lesson.tutorial) : [];
  const tutorials = active.has("sat-math") ? entriesOf(SAT_MATH, (lesson) => !!lesson.tutorial).map(lessonStep) : [];
  const englishActive = ielts.length > 0 || satRw.length > 0;
  const vocab = englishActive ? entriesOf(VOCAB) : [];
  const field = fieldEntries(profile.field);

  // English: IELTS and SAT Reading & Writing alternate when they share an end
  // date; with different exam dates each runs to its own window.
  // The four IELTS sections always come together (exams.ts sectionsOfExam).
  const ieltsEnd = endFor("ielts-reading");
  const satRwEnd = endFor("sat-rw");
  if (ielts.length && satRw.length && ieltsEnd === satRwEnd) {
    const english = alternate(ielts, satRw);
    spread(english.length, 0, ieltsEnd).forEach((d, i) => place(d, lessonStep(english[i])));
  } else {
    spread(ielts.length, 0, ieltsEnd).forEach((d, i) => place(d, lessonStep(ielts[i])));
    spread(satRw.length, 0, satRwEnd).forEach((d, i) => place(d, lessonStep(satRw[i])));
  }
  spread(math.length, 0, endFor("sat-math")).forEach((d, i) => place(d, lessonStep(math[i])));
  // Vocabulary sits between the other lessons rather than on top of them.
  spread(vocab.length, 1, Math.max(2, Math.floor(prep * 0.75))).forEach((d, i) => place(d, lessonStep(vocab[i])));
  spread(field.length, 1, total).forEach((d, i) => place(d, lessonStep(field[i])));

  let lastAdmissions = -1;
  for (const { entry, at } of admissionsEntries(profile.country)) {
    const day = Math.max(lastAdmissions + 1, Math.round(at * Math.max(0, prep - 1)));
    lastAdmissions = Math.min(total - 1, day);
    place(lastAdmissions, lessonStep(entry));
  }

  // Practice from the bank, in proportion to each section's share. Each pick
  // goes to the section furthest below its share among those still to be
  // examined; within a section, skills follow the domain weights.
  const picked = new Map<SectionId, number>();
  const rounds = new Map<string, number>();
  let pickedTotal = 0;
  const sequences = new Map<SectionId, Skill[]>();
  const nextPractice = (candidates: SectionId[]): PlanStep | null => {
    const usable = candidates.filter((s) => skillsOf(s).some(hasTasks));
    if (usable.length === 0) return null;
    const section = usable.reduce((best, s) => {
      const deficit = (x: SectionId) => (shares[x] ?? 0) * (pickedTotal + 1) - (picked.get(x) ?? 0);
      return deficit(s) > deficit(best) ? s : best;
    });
    const n = picked.get(section) ?? 0;
    if (!sequences.has(section) || sequences.get(section)!.length <= n) {
      sequences.set(section, skillSequence(section, (n + 256) * 2).filter(hasTasks));
    }
    const skill = sequences.get(section)![n];
    picked.set(section, n + 1);
    pickedTotal++;
    const round = (rounds.get(skill.id) ?? 0) + 1;
    rounds.set(skill.id, round);
    return practiceStep(skill, round, stateOf.get(section)!.level);
  };
  /** Sections not yet past their exam on day d. */
  const openSections = (d: number) => states.filter((s) => !windows.some((w) => w.sections.includes(s.section) && w.day <= d)).map((s) => s.section);

  // Fill: every day before the deadline has at least two steps (one on a long
  // timeline), every day after it at least one. Before an exam: mock sections
  // every third day and the weakest skills; otherwise mostly practice, with a
  // review of past lessons every fifth step.
  const relaxed = prep > 200;
  let rotation = 0;
  let reviews = 0;
  let practice = 0;
  let fills = 0;
  const mockTurn = new Map<string, number>();
  for (let d = 0; d < total; d++) {
    const phase = d < finalFrom ? "prep" : d < prep ? "final" : "after";
    const want = phase === "after" || (phase === "prep" && relaxed) ? 1 : 2;
    const window = windows.find((w) => d >= w.start && d < w.day);
    while (slots[d].length < want) {
      let step: PlanStep | null = null;
      if (window) {
        const mockable = window.sections.filter((s) => MOCK_SECTIONS.includes(s));
        if ((d - window.start) % 3 === 0 && mockable.length && !slots[d].some((s) => s.kind === "mock")) {
          const turn = mockTurn.get(window.date) ?? 0;
          mockTurn.set(window.date, turn + 1);
          const section = mockable[turn % mockable.length];
          step = bankMockStep(section, d + 1, stateOf.get(section)!.level);
        } else {
          // The weakest sections of this exam first.
          const weakest = [...window.sections].sort((a, b) => stateOf.get(b)!.normGap - stateOf.get(a)!.normGap);
          const section = weakest[(fills + d) % Math.min(2, weakest.length)];
          const candidate = weakStep(section, d + 1, stateOf.get(section)!.level);
          step = slots[d].some((s) => s.key === candidate.key) ? nextPractice(window.sections) : candidate;
        }
      } else if (phase === "after") {
        const open = openSections(d);
        step = open.length > 0 && fills % 2 === 0 ? nextPractice(open) : null;
      } else if (phase === "final") {
        step = d % 3 === 0 ? null : nextPractice(openSections(d));
      } else {
        step = fills % 5 === 4 ? null : nextPractice(openSections(d));
      }
      fills++;

      if (step) {
        if (step.kind === "practice") practice++;
        slots[d].push(step);
        continue;
      }
      // A review of past lessons, as before the bank existed.
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

  const newLessons = ielts.length + satRw.length + math.length + vocab.length + field.length + admissionsEntries(profile.country).length;
  const prepSteps = days.slice(0, prep).reduce((n, d) => n + d.steps.length, 0);

  return {
    profile,
    days,
    deadline,
    deadlinePassed,
    prepDays: prep,
    newLessons,
    practiceSteps: practice,
    tutorials,
    reviewSteps: reviews,
    load: Math.round((prepSteps / Math.max(1, prep)) * 10) / 10,
    sections: states,
    shares,
    windows,
    shortages: planShortages(days, profile.startDate),
  };
}

/**
 * Checks every practice step against the pool, as planned; the bank logs each
 * shortage once. SAT Math is left out: its ladder falls back step by step
 * (math-ladder.ts drawLadder).
 */
function planShortages(days: PlanDay[], seed: string): Shortage[] {
  const out = new Map<string, Shortage>();
  for (const d of days) {
    for (const s of d.steps) {
      if (s.kind !== "practice" || !s.skill || !s.level || s.section === "sat-math") continue;
      const skill = skillById(s.skill)!;
      const n = skill.kind === "questions" ? PRACTICE_SIZE : 1;
      const round = Number(s.key.split("~")[1]) - 1;
      for (const sh of drawTasks(skill.id, difficultiesFor(s.level, n), round, seed).shortages) {
        const k = `${sh.skill}|${sh.difficulty}`;
        const prev = out.get(k);
        out.set(k, prev ? { ...prev, need: Math.max(prev.need, sh.need) } : sh);
      }
    }
  }
  return [...out.values()];
}

// --------------------------------------------------------- queries --

const cache = new Map<string, Plan>();

/** buildPlan, memoised: the plan is a pure function of the profile. */
export function planFor(profile: StudentProfile, inputs: PlanInputs = NO_INPUTS): Plan {
  const key = `${profile.country}|${profile.field}|${profile.grade}|${profile.graduation}|${profile.startDate}|${JSON.stringify(inputs)}`;
  let plan = cache.get(key);
  if (!plan) {
    plan = buildPlan(profile, inputs);
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
