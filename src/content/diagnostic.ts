import type { DiagnosticSection } from "./exams";
import { IELTS } from "./ielts";
import { SAT_MATH } from "./sat-math";
import { SAT_RW } from "./sat-rw";
import type { Course, Lesson, Question } from "./types";

/**
 * The short diagnostic for students without scores: 12 questions per section
 * from different skills. It sets the starting level of each section; the plan
 * then adapts as the student answers.
 */

export const DIAGNOSTIC_SIZE = 12;

const TITLES: Record<DiagnosticSection, string> = {
  "sat-rw": "Диагностика: SAT Reading & Writing",
  "sat-math": "Диагностика: SAT Math",
  "ielts-reading": "Диагностика: IELTS Reading",
};

export function isDiagnosticSection(value: string): value is DiagnosticSection {
  return value in TITLES;
}

/** Round robin over lessons: the first question of every skill, then the second… */
function roundRobin(lessons: Lesson[], n: number): Question[] {
  const out: Question[] = [];
  for (let round = 0; out.length < n; round++) {
    let added = false;
    for (const l of lessons) {
      const q = l.questions[round];
      if (q && out.length < n) {
        out.push(q);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

function lessonsOf(course: Course, filter: (unitId: string, lesson: Lesson) => boolean): Lesson[] {
  return course.units.flatMap((u) => u.lessons.filter((l) => filter(u.id, l)));
}

export function diagnosticQuestions(section: DiagnosticSection): Question[] {
  switch (section) {
    case "sat-rw":
      return roundRobin(lessonsOf(SAT_RW, (u) => !u.endsWith("practice")), DIAGNOSTIC_SIZE);
    case "sat-math":
      return roundRobin(lessonsOf(SAT_MATH, (u, l) => !u.endsWith("practice") && !l.tutorial), DIAGNOSTIC_SIZE);
    case "ielts-reading":
      return roundRobin(lessonsOf(IELTS, (u) => u === "reading" || u === "reading-practice"), DIAGNOSTIC_SIZE);
  }
}

export function diagnosticLesson(section: DiagnosticSection): Lesson {
  return {
    id: section,
    title: TITLES[section],
    summary: `${DIAGNOSTIC_SIZE} заданий из разных навыков`,
    minutes: 15,
    theory: [
      {
        body: "Это короткая диагностика, а не экзамен: задания из разных навыков и разной сложности. По ответам с первой попытки мы выставим стартовый уровень, и план подстроится под тебя.",
      },
      { heading: "Как проходить", body: "• Не подглядывай в подсказки и не угадывай наугад — так уровень будет точнее.\n• Если не знаешь ответа, выбери самый вероятный вариант и иди дальше." },
    ],
    questions: diagnosticQuestions(section),
  };
}
