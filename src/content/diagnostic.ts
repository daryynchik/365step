import { bankTasksOf, tierOf, toQuestion } from "./bank/tasks";
import { skillsOf } from "./bank/taxonomy";
import type { DiagnosticSection, Level } from "./exams";
import { TIER_SCORE, type Tier } from "./math-ladder";
import type { Lesson, Question } from "./types";

/**
 * The short diagnostic for students without scores: 12 tasks per section from
 * the task bank — 4 easy, 4 medium and 4 hard, each from a different skill,
 * in mixed order. The weighted result sets the starting level of the section;
 * the plan then adapts as the student answers.
 *
 * SAT Math goes finer: two tasks on each of the six steps of the ladder
 * (math-ladder.ts), so the result is a score estimate (200–800) that sets the
 * starting step, not just a level.
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
  /** The task's step on the SAT Math ladder. */
  tier: number;
}

/** SAT Math: step and difficulty of each task, in the order asked (twice round). */
const MATH_STEPS: [Tier, Level][] = [
  [1, "easy"],
  [3, "medium"],
  [5, "hard"],
  [2, "easy"],
  [4, "medium"],
  [6, "hard"],
];

function mathItems(): DiagnosticItem[] {
  const skills = skillsOf("sat-math").filter((s) => s.kind === "questions");
  const items: DiagnosticItem[] = [];
  const usedSkills = new Set<string>();
  const usedTasks = new Set<string>();
  let k = 0;
  for (let round = 0; round < DIAGNOSTIC_SIZE / MATH_STEPS.length; round++) {
    for (const [tier, difficulty] of MATH_STEPS) {
      // Each task from a different skill while there are skills left; the step exact, then the difficulty.
      const tries = [
        (t: { tier: number; difficulty: Level }) => t.tier === tier && t.difficulty === difficulty,
        (t: { tier: number; difficulty: Level }) => t.difficulty === difficulty,
      ];
      let picked: DiagnosticItem | null = null;
      for (const fits of tries) {
        for (let j = 0; j < skills.length * 2 && !picked; j++) {
          const skill = skills[(k + j * 7) % skills.length];
          if (j < skills.length && usedSkills.has(skill.id)) continue;
          const task = bankTasksOf(skill.id).find((t) => !usedTasks.has(t.id) && fits({ tier: tierOf(t), difficulty: t.difficulty }));
          if (task) picked = { question: toQuestion(task), difficulty, skill: skill.id, tier: tierOf(task) };
        }
        if (picked) break;
      }
      k += 5;
      if (!picked) continue;
      usedSkills.add(picked.skill);
      usedTasks.add(`${picked.skill}|${picked.question.prompt}`);
      items.push(picked);
    }
  }
  return items;
}

const cache = new Map<DiagnosticSection, DiagnosticItem[]>();

/** Fixed for every student, so results are comparable. */
export function diagnosticItems(section: DiagnosticSection): DiagnosticItem[] {
  const cached = cache.get(section);
  if (cached) return cached;
  if (section === "sat-math") {
    const items = mathItems();
    cache.set(section, items);
    return items;
  }
  const skills = skillsOf(section).filter((s) => s.kind === "questions");
  const byLevel = ORDER.map((level, li) => {
    const picked: DiagnosticItem[] = [];
    // Start each level at a different skill so the twelve tasks cover as many skills as possible.
    for (let k = 0; picked.length < PER_LEVEL && k < skills.length * 2; k++) {
      const skill = skills[(li * PER_LEVEL + k) % skills.length];
      if (picked.some((p) => p.skill === skill.id) && k < skills.length) continue;
      const task = bankTasksOf(skill.id).find((t) => t.difficulty === level && !picked.some((p) => p.question.prompt === t.stem));
      if (task) picked.push({ question: toQuestion(task), difficulty: level, skill: skill.id, tier: tierOf(task) });
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

/**
 * SAT Math estimate from the diagnostic: the share right on each step, summed
 * (0–6), read on the ladder's typical scores; 0 → 250. Rounded to 10.
 */
export function mathEstimateFromDiagnostic(results: { tier: number; correct: boolean }[]): number {
  const byTier = new Map<number, { right: number; total: number }>();
  for (const r of results) {
    const c = byTier.get(r.tier) ?? { right: 0, total: 0 };
    c.total++;
    if (r.correct) c.right++;
    byTier.set(r.tier, c);
  }
  const value = [...byTier.values()].reduce((a, c) => a + c.right / c.total, 0) * (6 / Math.max(1, byTier.size));
  const points: [number, number][] = [[0, 250], ...([1, 2, 3, 4, 5, 6] as Tier[]).map((t): [number, number] => [t, TIER_SCORE[t]])];
  let score = points[points.length - 1][1];
  for (let i = 1; i < points.length; i++) {
    if (value <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      score = y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
      break;
    }
  }
  return Math.min(800, Math.max(200, Math.round(score / 10) * 10));
}

export function diagnosticLesson(section: DiagnosticSection): Lesson {
  return {
    id: section,
    title: TITLES[section],
    summary: `${DIAGNOSTIC_SIZE} заданий разной сложности`,
    minutes: 15,
    theory: [
      {
        body:
          section === "sat-math"
            ? "Это короткая диагностика, а не экзамен: 12 задач из разных навыков, от основ до продвинутых — по две на каждую из шести ступеней сложности. По ответам с первой попытки мы оценим твой уровень Math (ориентировочный балл) и с какой ступени начинать каждый навык. Дальше подбор уточняется по ответам."
            : "Это короткая диагностика, а не экзамен: по четыре задания базового, среднего и продвинутого уровня из разных навыков. Более трудные задания весят больше. По ответам с первой попытки мы выставим стартовый уровень, и план подстроится под тебя.",
      },
      { heading: "Как проходить", body: "• Не подглядывай в подсказки и не угадывай наугад — так уровень будет точнее.\n• Если не знаешь ответа, выбери самый вероятный вариант и иди дальше." },
    ],
    questions: diagnosticQuestions(section),
  };
}
