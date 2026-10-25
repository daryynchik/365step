/**
 * Finds a lesson by its URL parts, for showing it and for grading it: authored
 * lessons, reviews and mock sections from the plan, practice from the task
 * bank, and the diagnostic. The server always rebuilds the lesson the same way
 * the page did, so answers are graded against the questions that were shown.
 */

import { findLesson, isSequentiallyUnlocked, PLAN_COURSES, type PathEntry } from "@/content";
import { bankLesson, parseBankKey } from "@/content/bank/lessons";
import { drawOf, lessonFromDraw, mathPractice } from "@/content/bank/math-lessons";
import { skillById, skillOfLesson } from "@/content/bank/taxonomy";
import { diagnosticLesson, isDiagnosticSection } from "@/content/diagnostic";
import type { Level, SectionId } from "@/content/exams";
import { skillNameRu } from "@/content/math-ladder";
import { isPlanUnlocked, reviewLesson, SECTION_COURSE, STRAND_COURSE, type Plan } from "@/content/plan";
import type { AnyCourseId, CourseId, Lesson } from "@/content/types";
import { getDraw, getMathContext, saveDraw } from "./mastery";
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
  /** SAT Math on the ladder: bank task and step per question, skills in remediation. */
  ladder: { taskIds: (string | null)[]; taskTiers: number[]; remediation: string[]; drawn: boolean } | null;
  /** Lesson key fresh practice can be generated for. */
  moreKey: string | null;
  entry: PathEntry | null;
  plan: Plan | null;
}

/** The step authored SAT Math lessons count as on the ladder (medium). */
const AUTHORED_TIER = 3;

/** Practice, weak-skill and mock lessons of SAT Math use the ladder. */
function isMathBankKey(key: string): boolean {
  const parsed = parseBankKey(key);
  if (!parsed) return false;
  return parsed.type === "practice" ? skillById(parsed.skill)?.section === "sat-math" : parsed.section === "sat-math";
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
  if (course === "source") {
    const skill = skillById(lessonId);
    if (skill?.section !== "sat-math") return null;
    const key = `source/${skill.id}`;
    const [plan, saved] = await Promise.all([getPlan(userId), getDraw(userId, key)]);
    if (!plan) return null;
    const state = await getMathContext(userId, plan);
    const practice = (saved ? lessonFromDraw(saved) : null) ?? mathPractice(skill.id, state, `${userId}|${state.now.slice(0, 10)}`, 8, true);
    if (practice.questions.some((q) => !q.source)) return null;
    if (!saved && practice.questions.length > 0) await saveDraw(userId, key, drawOf(practice));
    return {
      key, courseId: "source", tone: "sat-math",
      lesson: { id: skill.id, title: skillNameRu(skill.id).replace(/^./, (c) => c.toUpperCase()), summary: practice.summary, minutes: 12, theory: practice.theory, questions: practice.questions },
      unitTitle: "Математика · открытые источники", backHref: "/math-sources", open: true, calculator: true,
      taskSkills: practice.taskSkills,
      ladder: { taskIds: practice.taskIds, taskTiers: practice.taskTiers, remediation: practice.remediation, drawn: practice.questions.length > 0 },
      moreKey: null, entry: null, plan,
    };
  }
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
      ladder: null,
      moreKey: null,
      entry: null,
      plan: null,
    };
  }

  const virtual = course === "review" || course === "bank";
  const entry = virtual ? null : findLesson(course, lessonId);
  if (!virtual && !entry) return null;
  const key = `${course}/${lessonId}`;
  const math = course === "bank" && isMathBankKey(key);
  const [finished, plan, stats, saved] = await Promise.all([
    done,
    !entry || PLAN_COURSES.includes(entry.course.id) ? getPlan(userId) : null,
    course === "bank" ? getSkillStats(userId) : null,
    math ? getDraw(userId, key) : null,
  ]);

  if (!entry) {
    if (!plan) return null;
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
        ladder: null,
        moreKey: review.sourceKey,
        entry: null,
        plan,
      };
    }
    const practice = bankLesson(plan, key, stats ?? {}, math ? { state: await getMathContext(userId, plan), saved } : undefined);
    if (!practice) return null;
    // A new draw is kept once the lesson can be opened, so grading sees the same tasks.
    let ladder: ResolvedLesson["ladder"] = null;
    if (practice.ladder) {
      const drawn = Boolean(saved) || open;
      if (!saved && open) await saveDraw(userId, key, practice.ladder.draw);
      ladder = { taskIds: practice.ladder.taskIds, taskTiers: practice.ladder.taskTiers, remediation: practice.ladder.remediation, drawn };
    }
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
      ladder,
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
    // Authored SAT Math lessons count on the ladder as step-3 tasks.
    ladder:
      skill && skill.section === "sat-math" && skill.kind === "questions"
        ? { taskIds: entry.lesson.questions.map(() => null), taskTiers: entry.lesson.questions.map(() => AUTHORED_TIER), remediation: [], drawn: false }
        : null,
    moreKey: entry.key,
    entry,
    plan,
  };
}
