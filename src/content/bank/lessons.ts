/**
 * Practice lessons assembled from the task bank for one student:
 *
 *   bank/<skill>~<round>        practice on one skill at the student's level
 *   bank/weak~<section>~<day>   the two weakest skills of a section, before an exam
 *   bank/mock~<section>~<day>   a mock section across the section's skills
 *
 * The plan decides which of these exist and when; this module fills them with
 * tasks. Difficulty follows the skill's current level (adapted as the student
 * answers), so the same key is rebuilt the same way until the level changes —
 * which only happens when a lesson is submitted.
 */

import { LEVEL_TITLES, SECTION_TITLES, type Level, type SectionId } from "../exams";
import { MOCK_SIZE, PRACTICE_SIZE, type Plan } from "../plan";
import { difficultiesFor, type SkillStat } from "../skill-level";
import type { Lesson, Question } from "../types";
import { drawTasks, type Shortage } from "./draw";
import { poolSize, type PoolTask } from "./pool";
import { skillById, skillSequence, skillsOf, type Skill } from "./taxonomy";

export type BankKey =
  | { type: "practice"; skill: string; round: number }
  | { type: "mock" | "weak"; section: SectionId; day: number };

export function parseBankKey(key: string): BankKey | null {
  const id = key.startsWith("bank/") ? key.slice("bank/".length) : key;
  const parts = id.split("~");
  if (parts.length === 2 && skillById(parts[0]) && /^\d+$/.test(parts[1])) return { type: "practice", skill: parts[0], round: Number(parts[1]) };
  if (parts.length === 3 && (parts[0] === "mock" || parts[0] === "weak") && SECTION_TITLES[parts[1] as SectionId] && /^\d+$/.test(parts[2])) {
    return { type: parts[0], section: parts[1] as SectionId, day: Number(parts[2]) };
  }
  return null;
}

export interface BankLesson {
  lesson: Lesson;
  section: SectionId;
  mock: boolean;
  /** The level the tasks were chosen for. */
  level: Level;
  /** Skill of each question, for adaptation. */
  taskSkills: string[];
  shortages: Shortage[];
}

const ORDER: Level[] = ["easy", "medium", "hard"];

function levelFor(plan: Plan, stats: Record<string, SkillStat>, skill: Skill): Level {
  return stats[skill.id]?.level ?? plan.sections.find((s) => s.section === skill.section)?.level ?? "medium";
}

function mixNote(level: Level): string {
  return `Задания на твоём уровне (${LEVEL_TITLES[level]}): примерно 20% проще, 60% на уровне и 20% сложнее. Каждые 10 ответов по навыку уровень пересчитывается: больше 80% верных — задания станут сложнее, меньше 50% — проще.`;
}

function questionsOf(tasks: PoolTask[]): { questions: Question[]; skills: string[] } {
  const questions: Question[] = [];
  const skills: string[] = [];
  for (const t of tasks) {
    if (t.kind === "question") {
      questions.push(t.question);
      skills.push(t.skill);
    } else if (t.kind === "listening") {
      for (const q of t.questions) {
        questions.push(q);
        skills.push(t.skill);
      }
    }
  }
  return { questions, skills };
}

/** One skill's practice lesson: eight questions, or one writing, speaking or listening task. */
function skillLesson(plan: Plan, id: string, skill: Skill, level: Level, round: number, title: string, seed: string): BankLesson {
  const n = skill.kind === "questions" ? PRACTICE_SIZE : 1;
  const draw = drawTasks(skill.id, difficultiesFor(level, n), round, seed);
  const { questions, skills } = questionsOf(draw.tasks);
  const first = draw.tasks[0];
  const lesson: Lesson = {
    id,
    title,
    summary: `${SECTION_TITLES[skill.section]} · ${LEVEL_TITLES[level]} уровень`,
    minutes: skill.kind === "writing" ? (skill.id.endsWith("task1") ? 20 : 40) : 12,
    skill: skill.title,
    theory: [{ body: skill.kind === "questions" ? mixNote(level) : `Задание уровня «${LEVEL_TITLES[level]}». Выполни его так, как на экзамене.` }],
    questions,
    ...(first?.kind === "writing" ? { writing: first.writing } : {}),
    ...(first?.kind === "speaking" ? { speaking: first.speaking } : {}),
    ...(first?.kind === "listening" ? { listening: first.listening } : {}),
  };
  if (skill.lesson) lesson.theory.push({ heading: "Если забыл приёмы", body: `Повтори урок «${skill.title}» — он есть в твоём плане раньше.` });
  return { lesson, section: skill.section, mock: false, level, taskSkills: skills, shortages: draw.shortages };
}

export function bankLesson(plan: Plan, key: string, stats: Record<string, SkillStat> = {}): BankLesson | null {
  const parsed = parseBankKey(key);
  if (!parsed) return null;
  const step = plan.days.flatMap((d) => d.steps).find((s) => s.key === key);
  if (!step) return null;
  const seed = plan.profile.startDate;
  const id = key.slice("bank/".length);

  if (parsed.type === "practice") {
    const skill = skillById(parsed.skill)!;
    return skillLesson(plan, id, skill, levelFor(plan, stats, skill), parsed.round - 1, step.title, seed);
  }

  const section = parsed.section;
  const skills = skillsOf(section).filter((s) => poolSize(s.id) > 0);

  if (parsed.type === "weak") {
    // Lowest level first, then lowest accuracy in the current window, then least practised.
    const accuracy = (s: Skill) => (stats[s.id]?.windowTotal ? stats[s.id].windowCorrect / stats[s.id].windowTotal : 0.65);
    const ranked = [...skills].sort(
      (a, b) =>
        ORDER.indexOf(levelFor(plan, stats, a)) - ORDER.indexOf(levelFor(plan, stats, b)) ||
        accuracy(a) - accuracy(b) ||
        (stats[a.id]?.answered ?? 0) - (stats[b.id]?.answered ?? 0),
    );
    const weakest = ranked[0];
    if (!weakest) return null;
    if (weakest.kind !== "questions") return skillLesson(plan, id, weakest, levelFor(plan, stats, weakest), parsed.day, step.title, seed);

    const pair = ranked.filter((s) => s.kind === "questions").slice(0, 2);
    const parts = pair.map((s, i) => drawTasks(s.id, difficultiesFor(levelFor(plan, stats, s), PRACTICE_SIZE / 2 + (i === 0 && pair.length === 1 ? PRACTICE_SIZE / 2 : 0)), parsed.day, seed));
    const { questions, skills: taskSkills } = questionsOf(parts.flatMap((p) => p.tasks));
    const level = levelFor(plan, stats, weakest);
    return {
      lesson: {
        id,
        title: step.title,
        summary: pair.map((s) => s.title).join(" · "),
        minutes: 12,
        theory: [
          { body: `До экзамена меньше трёх недель. Здесь — твои самые слабые навыки сейчас: ${pair.map((s) => `«${s.title}»`).join(" и ")}.` },
          { body: mixNote(level) },
        ],
        questions,
      },
      section,
      mock: false,
      level,
      taskSkills,
      shortages: parts.flatMap((p) => p.shortages),
    };
  }

  // Mock section: one task from each skill in turn, by domain weight.
  const sequence = skillSequence(section, MOCK_SIZE * 3)
    .filter((s) => s.kind === "questions" && poolSize(s.id) > 0)
    .slice(0, MOCK_SIZE);
  const sectionLevel = plan.sections.find((s) => s.section === section)?.level ?? "medium";
  const difficulties = difficultiesFor(sectionLevel, sequence.length);
  const seen = new Set<string>();
  const tasks: PoolTask[] = [];
  const shortages: Shortage[] = [];
  sequence.forEach((s, i) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const draw = drawTasks(s.id, [difficulties[i]], parsed.day + i + attempt * 7, `${seed}|mock`);
      shortages.push(...draw.shortages);
      const t = draw.tasks[0];
      if (t && !seen.has(t.id)) {
        seen.add(t.id);
        tasks.push(t);
        break;
      }
    }
  });
  const { questions, skills: taskSkills } = questionsOf(tasks);
  return {
    lesson: {
      id,
      title: step.title,
      summary: `${questions.length} заданий подряд, как на экзамене`,
      minutes: 20,
      theory: [
        {
          body: "Пробная секция: задания из разных навыков подряд, как на экзамене. Решай в темпе экзамена — около полутора минут на задание — и не подглядывай в уроки.",
        },
      ],
      questions,
    },
    section,
    mock: true,
    level: sectionLevel,
    taskSkills,
    shortages,
  };
}
