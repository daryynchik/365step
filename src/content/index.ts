import { ADMISSIONS } from "./admissions";
import { IELTS } from "./ielts";
import { SAT_MATH } from "./sat-math";
import { SAT_RW } from "./sat-rw";
import { SEMINAR } from "./seminar";
import { isInTrack, isTrackUnlocked } from "./track";
import type { Course, CourseId, Lesson, Unit } from "./types";

export type { Course, CourseId, Lesson, Question, Unit } from "./types";

export const COURSES: Record<CourseId, Course> = {
  ielts: IELTS,
  "sat-rw": SAT_RW,
  "sat-math": SAT_MATH,
  admissions: ADMISSIONS,
  seminar: SEMINAR,
};

export function isCourseId(value: string): value is CourseId {
  return value in COURSES;
}

export function lessonKey(courseId: CourseId, lessonId: string): string {
  return `${courseId}/${lessonId}`;
}

export interface PathEntry {
  course: Course;
  unit: Unit;
  unitIndex: number;
  lesson: Lesson;
  /** Position in the whole course, 0-based. */
  index: number;
  key: string;
}

export function flatten(course: Course): PathEntry[] {
  const entries: PathEntry[] = [];
  course.units.forEach((unit, unitIndex) => {
    for (const lesson of unit.lessons) {
      entries.push({
        course,
        unit,
        unitIndex,
        lesson,
        index: entries.length,
        key: lessonKey(course.id, lesson.id),
      });
    }
  });
  return entries;
}

export function findLesson(courseId: string, lessonId: string): PathEntry | null {
  if (!isCourseId(courseId)) return null;
  return flatten(COURSES[courseId]).find((e) => e.lesson.id === lessonId) ?? null;
}

export function findByKey(key: string): PathEntry | null {
  const [courseId, lessonId] = key.split("/");
  return courseId && lessonId ? findLesson(courseId, lessonId) : null;
}

/**
 * Track lessons open day by day (see track.ts). The seminar is its own
 * project and opens lesson by lesson.
 */
export function isUnlocked(entry: PathEntry, done: Set<string>): boolean {
  if (isInTrack(entry.course.id)) return isTrackUnlocked(entry.key, done);
  if (entry.index === 0) return true;
  const previous = flatten(entry.course)[entry.index - 1];
  return done.has(previous.key);
}

/** "chapter-5" -> "Глава 5", "letter-2" -> "Письмо 2", "chapter-24#26" -> "Глава 24". */
export function sectionLabel(id: string): string {
  const [kind, rest] = id.split("-");
  const number = rest?.split("#")[0];
  return kind === "letter" ? `Письмо ${number}` : `Глава ${number}`;
}

/** Reader URL for a section id, keeping a "#26" paragraph anchor. */
export function sectionHref(id: string): string {
  const [section, paragraph] = id.split("#");
  return `/seminar/read/${section}${paragraph ? `#p-${paragraph}` : ""}`;
}
