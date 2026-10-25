/**
 * SAT Math practice from the task bank, on the ladder (math-ladder.ts):
 *
 *   practice  one skill: its step, one lower, one higher, due mistakes;
 *             remediation — a short explanation and easier tasks first;
 *   weak      before an exam: the two skills furthest below their start;
 *   mock      one task per skill in turn, each at that skill's step.
 *
 * Pure: the student's state comes in as a LadderState (lib/mastery.ts reads it).
 * What a lesson was given is returned as a SavedDraw, kept until it is graded.
 */

import { findByKey } from "../index";
import {
  drawLadder,
  eventMessage,
  lessonSlots,
  newMastery,
  selectionDetail,
  selectionHeadline,
  skillNameRu,
  TIER_TITLES,
  type Attempt,
  type LadderTask,
  type Mastery,
  type Role,
  type Slot,
  type Tier,
} from "../math-ladder";
import type { Question, TheoryBlock } from "../types";
import type { Task } from "./schema";
import { bankTask, bankTasksOf, tierOf, toQuestion } from "./tasks";
import { skillById, skillSequence, skillsOf, type Skill } from "./taxonomy";

export interface LadderState {
  /** Every SAT Math skill. */
  mastery: Record<string, Mastery>;
  /** Skills whose step went up with the last lesson on them. */
  justPromoted: Set<string>;
  /** Attempts per task id, oldest first. */
  history: Map<string, Attempt[]>;
  /** Steps of the section's Math score and of the target. */
  start: Tier;
  target: Tier;
  /** ISO timestamp. */
  now: string;
}

/** A state with no answers yet: every skill at the start step. */
export function freshLadderState(start: Tier, target: Tier, now = new Date().toISOString()): LadderState {
  const mastery = Object.fromEntries(skillsOf("sat-math").map((s) => [s.id, newMastery(start)]));
  return { mastery, justPromoted: new Set(), history: new Map(), start, target, now };
}

/** A practice lesson's tasks as first shown. */
export interface SavedDraw {
  v: 1;
  tasks: { id: string; role: Role }[];
  /** Skills the lesson was built to help with. */
  remediation: string[];
  theory: TheoryBlock[];
  summary: string;
}

export interface MathLesson {
  questions: Question[];
  taskIds: string[];
  taskSkills: string[];
  taskTiers: number[];
  roles: Role[];
  remediation: string[];
  theory: TheoryBlock[];
  summary: string;
  /** Slots that had to be filled from another step. */
  shortages: { skill: string; tier: Tier; role: Role }[];
}

interface MathPoolTask extends LadderTask {
  task: Task;
}

const pools = new Map<string, MathPoolTask[]>();

function poolOf(skill: string): MathPoolTask[] {
  let pool = pools.get(skill);
  if (!pool) {
    pool = bankTasksOf(skill)
      .filter((t) => t.type === "mcq" || t.type === "grid-in")
      .map((t) => ({ id: t.id, tier: tierOf(t), sourced: t.source !== "original", task: t }));
    pools.set(skill, pool);
  }
  return pool;
}

/** How many tasks each step of a skill holds. */
export function tierCounts(skill: string): Record<Tier, number> {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<Tier, number>;
  for (const t of poolOf(skill)) out[t.tier as Tier]++;
  return out;
}

/** Rebuilds a lesson from its saved draw; null when a task has left the bank. */
export function lessonFromDraw(draw: SavedDraw): MathLesson | null {
  const tasks = draw.tasks.map((x) => ({ t: bankTask(x.id), role: x.role }));
  if (tasks.length === 0 || tasks.some((x) => !x.t)) return null;
  return {
    questions: tasks.map((x) => toQuestion(x.t!)),
    taskIds: tasks.map((x) => x.t!.id),
    taskSkills: tasks.map((x) => x.t!.skill),
    taskTiers: tasks.map((x) => tierOf(x.t!)),
    roles: tasks.map((x) => x.role),
    remediation: draw.remediation,
    theory: draw.theory,
    summary: draw.summary,
    shortages: [],
  };
}

export function drawOf(lesson: MathLesson): SavedDraw {
  return {
    v: 1,
    tasks: lesson.taskIds.map((id, i) => ({ id, role: lesson.roles[i] })),
    remediation: lesson.remediation,
    theory: lesson.theory,
    summary: lesson.summary,
  };
}

function assemble(picks: { task: MathPoolTask; role: Role }[], extra: Pick<MathLesson, "remediation" | "theory" | "summary" | "shortages">): MathLesson {
  return {
    questions: picks.map((p) => toQuestion(p.task.task)),
    taskIds: picks.map((p) => p.task.id),
    taskSkills: picks.map((p) => p.task.task.skill),
    taskTiers: picks.map((p) => p.task.tier),
    roles: picks.map((p) => p.role),
    ...extra,
  };
}

const RULES =
  "Как меняется ступень: после серии — 7 из 8 задач твоей ступени и выше верно с первой попытки без подсказки — задачи становятся сложнее. Ответ с подсказкой засчитывается наполовину, ответ после показанного решения не засчитывается. Если на ступени подряд несколько ошибок, следующий набор начнётся с объяснения и задач попроще, а потом вернёт тебя к той же ступени. Ступени — внутренняя шкала подбора 365step, не официальная сложность SAT.";

/** The theory of the skill's authored lesson, shortened: what remediation shows first. */
function skillRefresher(skill: Skill): TheoryBlock[] {
  const lesson = skill.lesson ? findByKey(skill.lesson)?.lesson : null;
  if (!lesson) return [];
  return lesson.theory.slice(0, 2).map((b, i) => ({ heading: i === 0 ? `Коротко: ${skillNameRu(skill.id)}` : b.heading, body: b.body }));
}

/** The last task the student missed on this skill, with its solution. */
function lastMiss(skill: string, state: LadderState): TheoryBlock | null {
  let best: { t: MathPoolTask; at: string } | null = null;
  for (const t of poolOf(skill)) {
    const misses = (state.history.get(t.id) ?? []).filter((a) => a.outcome === "wrong");
    const at = misses.at(-1)?.at;
    if (at && (!best || at > best.at)) best = { t, at };
  }
  if (!best) return null;
  const stem = best.t.task.stem.length > 220 ? `${best.t.task.stem.slice(0, 217).trimEnd()}…` : best.t.task.stem;
  return { heading: "Разбор задачи, где была ошибка", body: `${stem}\n\n${best.t.task.explanation}` };
}

/** One skill's practice lesson. */
export function mathPractice(skillId: string, state: LadderState, seed: string, size = 8, sourceOnly = false): MathLesson {
  const skill = skillById(skillId)!;
  const m = state.mastery[skillId] ?? newMastery(state.start);
  const slots = lessonSlots(m.tier, state.target, m.remediation, size);
  const pool = sourceOnly ? poolOf(skillId).filter((t) => t.sourced && t.tier >= m.tier - 1 && t.tier <= m.tier + 1) : poolOf(skillId);
  const draw = drawLadder({ pool, slots, history: state.history, now: state.now, seed: `${seed}|${skillId}`, maxRetryTier: m.tier + 1, ...(sourceOnly ? { minimumCurrentTier: m.tier } : {}) });
  // A source-only set must contain current/stretch practice, never just easy review.
  const picks = sourceOnly && !draw.picks.some((p) => p.task.tier >= m.tier) ? [] : draw.picks;
  const justPromoted = state.justPromoted.has(skillId);
  const theory: TheoryBlock[] = [
    { heading: selectionHeadline(skillId, m, state.target, justPromoted), body: `${selectionDetail(m.tier, picks)}\n\n${RULES}` },
  ];
  if (sourceOnly) theory.unshift({
    heading: "Задачи из открытого учебника",
    body: picks.length ? `${picks.length} упражнений OpenStax с исходными условиями и ответами. Это практика навыка, не официальный пробный SAT. Если решений несколько, введи все корни через точку с запятой.` : "В подборке пока нет упражнений этой темы на твоей ступени. Выбери другую тему или открой внешний банк. Более простые задачи не подставляются вместо твоего уровня.",
  });
  if (m.remediation) {
    theory.push(...skillRefresher(skill));
    const miss = lastMiss(skillId, state);
    if (miss) theory.push(miss);
  }
  if (skill.lesson) theory.push({ heading: "Если забыл приёмы", body: sourceOnly ? `Теория этого навыка есть в основном плане: урок «${skill.title}». Его можно повторить, когда он открыт.` : `Повтори урок «${skill.title}» — он есть в твоём плане раньше.` });
  return assemble(picks, {
    remediation: m.remediation ? [skillId] : [],
    theory,
    summary: `SAT Math · ступень ${m.tier} из 6 («${TIER_TITLES[m.tier]}»)`,
    shortages: draw.shortages.map((s) => ({ skill: skillId, ...s })),
  });
}

/** Honest source coverage: counts, not a claim that a whole external bank was copied. */
export function sourceCoverage(skill: string, tier: Tier): { total: number; suitable: number } {
  const source = poolOf(skill).filter((t) => t.sourced);
  return { total: source.length, suitable: source.filter((t) => t.tier >= tier && t.tier <= tier + 1).length };
}

/** Skills furthest below where they started first; then remediation, accuracy, least practised. */
export function weakestMathSkills(state: LadderState, n: number): Skill[] {
  const skills = skillsOf("sat-math").filter((s) => poolOf(s.id).length > 0);
  const m = (s: Skill) => state.mastery[s.id] ?? newMastery(state.start);
  const accuracy = (s: Skill) => (m(s).answered ? m(s).clean / m(s).answered : 0.65);
  return [...skills]
    .sort(
      (a, b) =>
        m(a).tier - m(a).baseTier - (m(b).tier - m(b).baseTier) ||
        Number(m(b).remediation) - Number(m(a).remediation) ||
        accuracy(a) - accuracy(b) ||
        m(a).answered - m(b).answered ||
        a.id.localeCompare(b.id),
    )
    .slice(0, n);
}

/** Before an exam: four tasks on each of the two weakest skills. */
export function mathWeak(state: LadderState, seed: string, size = 8): MathLesson {
  const pair = weakestMathSkills(state, 2);
  const per = Math.floor(size / pair.length);
  const picks: { task: MathPoolTask; role: Role }[] = [];
  const shortages: MathLesson["shortages"] = [];
  const remediation: string[] = [];
  pair.forEach((s, i) => {
    const m = state.mastery[s.id] ?? newMastery(state.start);
    if (m.remediation) remediation.push(s.id);
    const n = i === pair.length - 1 ? size - per * (pair.length - 1) : per;
    const draw = drawLadder({ pool: poolOf(s.id), slots: lessonSlots(m.tier, state.target, m.remediation, n), history: state.history, now: state.now, seed: `${seed}|${s.id}`, maxRetries: 1 });
    picks.push(...draw.picks);
    shortages.push(...draw.shortages.map((x) => ({ skill: s.id, ...x })));
  });
  const names = pair.map((s) => `«${skillNameRu(s.id)}» (ступень ${(state.mastery[s.id] ?? newMastery(state.start)).tier})`);
  return assemble(picks, {
    remediation,
    theory: [
      { heading: "Слабые места перед экзаменом", body: `До экзамена меньше трёх недель. Здесь — навыки, которые сейчас дальше всего от твоего уровня: ${names.join(" и ")}. ${selectionDetail(pair[0] ? (state.mastery[pair[0].id] ?? newMastery(state.start)).tier : state.start, picks)}` },
      { body: RULES },
    ],
    summary: pair.map((s) => skillNameRu(s.id)).join(" · "),
    shortages,
  });
}

/** A mock section: one task per skill in turn (by domain weight), each at that skill's step. */
export function mathMock(state: LadderState, seed: string, day: number, size = 10): MathLesson {
  const sequence = skillSequence("sat-math", size * 3)
    .filter((s) => poolOf(s.id).length > 0)
    .slice(0, size);
  const used = new Set<string>();
  const picks: { task: MathPoolTask; role: Role }[] = [];
  const shortages: MathLesson["shortages"] = [];
  sequence.forEach((s, i) => {
    const m = state.mastery[s.id] ?? newMastery(state.start);
    const slot: Slot = { tier: m.tier, role: "current" };
    const draw = drawLadder({ pool: poolOf(s.id).filter((t) => !t.task.answerFormat && !used.has(t.id)), slots: [slot], history: state.history, now: state.now, seed: `${seed}|mock|${day}|${i}`, maxRetries: 0 });
    for (const p of draw.picks) {
      used.add(p.task.id);
      picks.push(p);
    }
    shortages.push(...draw.shortages.map((x) => ({ skill: s.id, ...x })));
  });
  return assemble(picks, {
    remediation: [],
    theory: [
      {
        body: "Пробная секция: задачи из разных навыков подряд, как на экзамене, каждая — на ступени этого навыка. Решай в темпе экзамена — около полутора минут на задачу — и не подглядывай в уроки.",
      },
    ],
    summary: `${picks.length} заданий подряд, как на экзамене`,
    shortages,
  });
}

/** What changed after a lesson, in the student's words. */
export function adaptationMessages(events: { skill: string; event: Parameters<typeof eventMessage>[1] }[]): string[] {
  return events.map((e) => eventMessage(e.skill, e.event));
}
