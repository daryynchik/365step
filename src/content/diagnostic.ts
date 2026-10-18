import { bankTasksOf, toQuestion } from "./bank/tasks";
import { skillsOf } from "./bank/taxonomy";
import type { DiagnosticSection, Level } from "./exams";
import type { Lesson, Question } from "./types";

/**
 * The short diagnostic for students without scores: 12 tasks per section from
 * the task bank — 4 easy, 4 medium and 4 hard, each from a different skill,
 * in mixed order. The weighted result sets the starting level of the section;
 * the plan then adapts as the student answers.
 */

export const DIAGNOSTIC_SIZE = 12;
const PER_LEVEL = DIAGNOSTIC_SIZE / 3;
const ORDER: Level[] = ["easy", "medium", "hard"];
/** Harder tasks count for more in the diagnostic score. */
export const DIAGNOSTIC_WEIGHT: Record<Level, number> = { easy: 1, medium: 2, hard: 3 };

const TITLES: Record<DiagnosticSection, string> = {
  "sat-rw": "Диагностика: SAT Reading & Writing",
  "sat-math": "Диагностика: SAT Math",
  "ielts-reading": "Диагностика: IELTS Reading",
};

export function isDiagnosticSection(value: string): value is DiagnosticSection {
  return value in TITLES;
}

export interface DiagnosticItem {
  question: Question;
  difficulty: Level;
  skill: string;
}

const cache = new Map<DiagnosticSection, DiagnosticItem[]>();

/** Fixed for every student, so results are comparable. */
export function diagnosticItems(section: DiagnosticSection): DiagnosticItem[] {
  const cached = cache.get(section);
  if (cached) return cached;
  const skills = skillsOf(section).filter((s) => s.kind === "questions");
  const byLevel = ORDER.map((level, li) => {
    const picked: DiagnosticItem[] = [];
    // Start each level at a different skill so the twelve tasks cover as many skills as possible.
    for (let k = 0; picked.length < PER_LEVEL && k < skills.length * 2; k++) {
      const skill = skills[(li * PER_LEVEL + k) % skills.length];
      if (picked.some((p) => p.skill === skill.id) && k < skills.length) continue;
      const task = bankTasksOf(skill.id).find((t) => t.difficulty === level && !picked.some((p) => p.question.prompt === t.stem));
      if (task) picked.push({ question: toQuestion(task), difficulty: level, skill: skill.id });
    }
    return picked;
  });
  // Interleave: easy, medium, hard, easy, …
  const items: DiagnosticItem[] = [];
  for (let i = 0; i < PER_LEVEL; i++) for (const list of byLevel) if (list[i]) items.push(list[i]);
  cache.set(section, items);
  return items;
}

export function diagnosticQuestions(section: DiagnosticSection): Question[] {
  return diagnosticItems(section).map((i) => i.question);
}

/** Starting level from the weighted share of points: below 50% easy, up to 80% medium, above hard. */
export function levelFromDiagnostic(results: { difficulty: Level; correct: boolean }[]): Level {
  const total = results.reduce((a, r) => a + DIAGNOSTIC_WEIGHT[r.difficulty], 0);
  const earned = results.reduce((a, r) => a + (r.correct ? DIAGNOSTIC_WEIGHT[r.difficulty] : 0), 0);
  const share = total > 0 ? earned / total : 0;
  if (share < 0.5) return "easy";
  if (share <= 0.8) return "medium";
  return "hard";
}

export function diagnosticLesson(section: DiagnosticSection): Lesson {
  return {
    id: section,
    title: TITLES[section],
    summary: `${DIAGNOSTIC_SIZE} заданий разной сложности`,
    minutes: 15,
    theory: [
      {
        body: "Это короткая диагностика, а не экзамен: по четыре задания базового, среднего и продвинутого уровня из разных навыков. Более трудные задания весят больше. По ответам с первой попытки мы выставим стартовый уровень, и план подстроится под тебя.",
      },
      { heading: "Как проходить", body: "• Не подглядывай в подсказки и не угадывай наугад — так уровень будет точнее.\n• Если не знаешь ответа, выбери самый вероятный вариант и иди дальше." },
    ],
    questions: diagnosticQuestions(section),
  };
}
