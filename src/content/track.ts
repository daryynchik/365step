import { ADMISSIONS } from "./admissions";
import { IELTS, IELTS_ORDER } from "./ielts";
import { SAT_MATH } from "./sat-math";
import { SAT_RW } from "./sat-rw";
import type { Course, CourseId, Lesson } from "./types";

/**
 * The single preparation track. One program, day by day:
 *
 *   - English alternates: an IELTS day, then a SAT Reading & Writing day.
 *   - Math is SAT Math every day, until its nineteen skills are done.
 *   - Admissions steps come every other day, starting on day one.
 *
 * A day opens once every lesson of the previous day is done; inside a day the
 * lessons can be taken in any order. Lesson keys ("ielts/reading-tfng") are the
 * same as in the courses, so progress is stored exactly as before.
 */

export interface TrackStep {
  course: Course;
  lesson: Lesson;
  unitTitle: string;
  key: string;
}

export interface TrackDay {
  /** 1-based. */
  day: number;
  /** Which English exam this day trains. */
  english: "ielts" | "sat" | null;
  steps: TrackStep[];
}

export const TRACK_COURSES: CourseId[] = ["ielts", "sat-rw", "sat-math", "admissions"];

function stepsOf(course: Course, order?: string[]): TrackStep[] {
  const all = course.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({ course, lesson, unitTitle: unit.title, key: `${course.id}/${lesson.id}` })),
  );
  if (!order) return all;
  return order.map((id) => {
    const found = all.find((s) => s.lesson.id === id);
    if (!found) throw new Error(`Unknown IELTS lesson in IELTS_ORDER: ${id}`);
    return found;
  });
}

function buildTrack(): TrackDay[] {
  const ielts = stepsOf(IELTS, IELTS_ORDER);
  const sat = stepsOf(SAT_RW);
  const math = stepsOf(SAT_MATH);
  const admissions = stepsOf(ADMISSIONS);

  // English days alternate, starting with IELTS; when one exam runs out the
  // other continues on its own.
  const english: { exam: "ielts" | "sat"; step: TrackStep }[] = [];
  for (let i = 0; i < Math.max(ielts.length, sat.length); i++) {
    if (ielts[i]) english.push({ exam: "ielts", step: ielts[i] });
    if (sat[i]) english.push({ exam: "sat", step: sat[i] });
  }

  const days: TrackDay[] = [];
  let a = 0;
  for (let d = 0; d < english.length || d < math.length || a < admissions.length; d++) {
    const steps: TrackStep[] = [];
    if (english[d]) steps.push(english[d].step);
    if (math[d]) steps.push(math[d]);
    if (d % 2 === 0 && admissions[a]) steps.push(admissions[a++]);
    days.push({ day: d + 1, english: english[d]?.exam ?? null, steps });
  }
  return days;
}

export const TRACK: TrackDay[] = buildTrack();

const DAY_OF = new Map<string, number>();
for (const day of TRACK) for (const step of day.steps) DAY_OF.set(step.key, day.day);

export function trackDayOf(key: string): number | null {
  return DAY_OF.get(key) ?? null;
}

export function isInTrack(courseId: CourseId): boolean {
  return TRACK_COURSES.includes(courseId);
}

/** Open when every lesson of every earlier day is done. */
export function isTrackUnlocked(key: string, done: Set<string>): boolean {
  const day = trackDayOf(key);
  if (day === null) return false;
  for (const d of TRACK) {
    if (d.day >= day) break;
    if (d.steps.some((s) => !done.has(s.key))) return false;
  }
  return true;
}

/** The first day that is not finished, or null when the whole track is done. */
export function currentDay(done: Set<string>): TrackDay | null {
  return TRACK.find((d) => d.steps.some((s) => !done.has(s.key))) ?? null;
}

/** The next lesson to take: the first unfinished one on the current day. */
export function nextTrackStep(done: Set<string>, after?: string): TrackStep | null {
  const day = currentDay(done);
  if (!day) return null;
  const open = day.steps.filter((s) => !done.has(s.key) && s.key !== after);
  return open[0] ?? null;
}

export const DAYS_PER_WEEK = 5;

export function trackWeeks(): TrackDay[][] {
  const weeks: TrackDay[][] = [];
  for (let i = 0; i < TRACK.length; i += DAYS_PER_WEEK) weeks.push(TRACK.slice(i, i + DAYS_PER_WEEK));
  return weeks;
}

/** The label shown on a lesson's chip: "IELTS · Listening", "SAT · Math", "Поступление". */
export function stepLabel(step: { course: Course; lesson: Lesson }): string {
  switch (step.course.id) {
    case "ielts":
      return `IELTS · ${step.lesson.skill ?? "English"}`;
    case "sat-rw":
      return "SAT · Reading & Writing";
    case "sat-math":
      return "SAT · Math";
    case "admissions":
      return "Поступление";
    default:
      return step.course.short;
  }
}
