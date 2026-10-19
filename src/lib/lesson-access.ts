/**
 * Finds a lesson by its URL parts, for showing it and for grading it: authored
 * lessons, reviews and mock sections from the plan, practice from the task
 * bank, and the diagnostic. The server always rebuilds the lesson the same way
 * the page did, so answers are graded against the questions that were shown.
 */

import { findLesson, isSequentiallyUnlocked, PLAN_COURSES, type PathEntry } from "@/content";
import { bankLesson } from "@/content/bank/lessons";
import { skillOfLesson } from "@/content/bank/taxonomy";
import { diagnosticLesson, isDiagnosticSection } from "@/content/diagnostic";
import type { Level, SectionId } from "@/content/exams";
import { isPlanUnlocked, reviewLesson, SECTION_COURSE, STRAND_COURSE, type Plan } from "@/content/plan";
import type { AnyCourseId, CourseId, Lesson } from "@/content/types";
import { getPlan } from "./profile";
import { getSkillStats } from "./skill-stats";

export interface ResolvedLesson {
  key: string;
  courseId: AnyCourseId;
  /** Course whose colour the player uses. */
  tone: CourseId;
  lesson: Lesson;
  unitTitle: string;
  backHref: string;
  open: boolean;
  calculator: boolean;
  /** Skill of each question, when answers feed the adaptive level. */
  taskSkills: string[] | null;
  /** Lesson key fresh practice can be generated for. */
  moreKey: string | null;
  entry: PathEntry | null;
  plan: Plan | null;
}

/** The level a skill starts at: its section's level in the plan. */
export function startLevelOf(plan: Plan | null, skill: string): Level {
  const section = skill.split(".")[0] as SectionId;
  return plan?.sections.find((s) => s.section === section)?.level ?? "medium";
}

/**
 * `done` may be a pending query: it is awaited together with the plan and the
 * skill levels, so the page waits for one database round trip, not several.
 */
export async function resolveLesson(
  userId: string,
  course: string,
  lessonId: string,
  done: Set<string> | Promise<Set<string>>,
): Promise<ResolvedLesson | null> {
  if (course === "diagnostic") {
    if (!isDiagnosticSection(lessonId)) return null;
    return {
      key: `diagnostic/${lessonId}`,
      courseId: "diagnostic",
      tone: lessonId === "ielts-reading" ? "ielts" : lessonId,
      lesson: diagnosticLesson(lessonId),
      unitTitle: "Диагностика",
      backHref: "/diagnostic",
      open: true,
      calculator: lessonId === "sat-math",
      taskSkills: null,
      moreKey: null,
      entry: null,
      plan: null,
    };
  }

  const virtual = course === "review" || course === "bank";
  const entry = virtual ? null : findLesson(course, lessonId);
  if (!virtual && !entry) return null;
  const [finished, plan, stats] = await Promise.all([
    done,
    !entry || PLAN_COURSES.includes(entry.course.id) ? getPlan(userId) : null,
    course === "bank" ? getSkillStats(userId) : null,
  ]);

  if (!entry) {
    if (!plan) return null;
    const key = `${course}/${lessonId}`;
    const open = isPlanUnlocked(plan, key, finished);
    if (course === "review") {
      const review = reviewLesson(plan, key);
      if (!review) return null;
      return {
        key,
        courseId: "review",
        tone: STRAND_COURSE[review.strand],
        lesson: review.lesson,
        unitTitle: review.mock ? "Пробная секция" : "Повторение",
        backHref: "/path",
        open,
        calculator: review.strand === "math",
        taskSkills: null,
        moreKey: review.sourceKey,
        entry: null,
        plan,
      };
    }
    const practice = bankLesson(plan, key, stats ?? {});
    if (!practice) return null;
    return {
      key,
      courseId: "bank",
      tone: SECTION_COURSE[practice.section],
      lesson: practice.lesson,
      unitTitle: practice.mock ? "Пробная секция" : "Практика",
      backHref: "/path",
      open,
      calculator: practice.section === "sat-math",
      taskSkills: practice.taskSkills,
      moreKey: null,
      entry: null,
      plan,
    };
  }

  const open = !PLAN_COURSES.includes(entry.course.id)
    ? isSequentiallyUnlocked(entry, finished)
    : plan
      ? isPlanUnlocked(plan, entry.key, finished)
      : false;
  const skill = skillOfLesson(entry.key);
  return {
    key: entry.key,
    courseId: entry.course.id,
    tone: entry.course.id,
    lesson: entry.lesson,
    unitTitle: entry.course.id === "seminar" ? entry.unit.title : `${entry.course.title} · ${entry.unit.title}`,
    backHref: entry.lesson.tutorial ? "/path#desmos" : entry.course.id === "seminar" ? "/seminar" : "/path",
    open,
    calculator: entry.course.id === "sat-math",
    // An authored lesson of a bank skill counts towards that skill's level too.
    taskSkills: skill && skill.kind === "questions" ? entry.lesson.questions.map(() => skill.id) : null,
    moreKey: entry.key,
    entry,
    plan,
  };
}
