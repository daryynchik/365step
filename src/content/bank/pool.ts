/**
 * The pool of tasks practice lessons draw from, by skill and difficulty.
 *
 * A skill with tasks in the bank uses the bank. A skill without them (IELTS
 * Listening for now) uses the questions of its authored lessons, which have
 * no difficulty tag and count as "medium"; practice at other levels then
 * falls back to the neighbouring difficulty (see draw.ts).
 */

import { findByKey } from "../index";
import type { Level } from "../exams";
import type { Listening, Question, Speaking, WritingTask } from "../types";
import type { Task } from "./schema";
import { bankTasksOf, LEVEL_OF, toQuestion, toSpeaking, toWriting } from "./tasks";
import { SKILLS, type Skill } from "./taxonomy";

export type PoolTask =
  | { id: string; skill: string; difficulty: Level; kind: "question"; question: Question }
  | { id: string; skill: string; difficulty: Level; kind: "writing"; title: string; writing: WritingTask }
  | { id: string; skill: string; difficulty: Level; kind: "speaking"; title: string; speaking: Speaking }
  | { id: string; skill: string; difficulty: Level; kind: "listening"; title: string; listening: Listening; questions: Question[] };

export type SkillPool = Record<Level, PoolTask[]>;

/** Second-pass authored lessons that practise the same skill. */
const EXTRA_LESSONS: Record<string, string[]> = {
  "ielts-reading.tfng": ["ielts/p-reading-tfng"],
  "ielts-reading.ynng": ["ielts/p-reading-views"],
  "ielts-reading.matching-headings": ["ielts/p-reading-headings"],
  "ielts-reading.completion": ["ielts/p-reading-completion"],
  "ielts-writing.task1": ["ielts/p-writing-task1"],
  "ielts-writing.task2": ["ielts/p-writing-task2"],
  "ielts-speaking.part2": ["ielts/p-speaking-part2"],
  "ielts-listening.form-completion": ["ielts/p-listening-part2"],
  "ielts-listening.mcq": ["ielts/p-listening-part3"],
};

function authoredKeys(skill: Skill): string[] {
  const keys = skill.lesson ? [skill.lesson] : [];
  if (skill.section === "sat-rw" || skill.section === "sat-math") keys.push(skill.lesson!.replace("/", "/p-"));
  return [...keys, ...(EXTRA_LESSONS[skill.id] ?? [])];
}

function authoredTasks(skill: Skill): PoolTask[] {
  const out: PoolTask[] = [];
  for (const key of authoredKeys(skill)) {
    const lesson = findByKey(key)?.lesson;
    if (!lesson) continue;
    const base = { skill: skill.id, difficulty: "medium" as Level };
    if (skill.kind === "writing" && lesson.writing) out.push({ ...base, id: key, kind: "writing", title: lesson.title, writing: lesson.writing });
    else if (skill.kind === "speaking" && lesson.speaking) out.push({ ...base, id: key, kind: "speaking", title: lesson.title, speaking: lesson.speaking });
    else if (skill.kind === "listening" && lesson.listening)
      out.push({ ...base, id: key, kind: "listening", title: lesson.title, listening: lesson.listening, questions: lesson.questions });
    else if (skill.kind === "questions") lesson.questions.forEach((question, i) => out.push({ ...base, id: `${key}#${i}`, kind: "question", question }));
  }
  return out;
}

let pools: Map<string, SkillPool> | null = null;

function fromBank(t: Task): PoolTask {
  const base = { id: t.id, skill: t.skill, difficulty: LEVEL_OF[t.difficulty] };
  if (t.type === "essay-prompt") return { ...base, kind: "writing", title: t.stem.slice(0, 80), writing: toWriting(t) };
  if (t.type === "speaking-prompt") return { ...base, kind: "speaking", title: t.stem.slice(0, 80), speaking: toSpeaking(t) };
  return { ...base, kind: "question", question: toQuestion(t) };
}

function build(): Map<string, SkillPool> {
  const map = new Map<string, SkillPool>();
  for (const skill of SKILLS) {
    const pool: SkillPool = { easy: [], medium: [], hard: [] };
    const bank = bankTasksOf(skill.id);
    for (const t of bank.length > 0 ? bank.map(fromBank) : authoredTasks(skill)) pool[t.difficulty].push(t);
    map.set(skill.id, pool);
  }
  return map;
}

export function poolOf(skillId: string): SkillPool {
  pools ??= build();
  return pools.get(skillId) ?? { easy: [], medium: [], hard: [] };
}

export function poolSize(skillId: string): number {
  const p = poolOf(skillId);
  return p.easy.length + p.medium.length + p.hard.length;
}
