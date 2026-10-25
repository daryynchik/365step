/**
 * The task bank, loaded and turned into lesson material. Files are imported
 * statically (bank/files.ts) so they ship inside the server bundle.
 */

import type { Level } from "../exams";
import { DEFAULT_TIER } from "../math-ladder";
import type { Question, Speaking, WritingTask } from "../types";
import { BANK_FILES } from "./files";
import { loadFile, type BankPassage, type Task } from "./schema";

let loaded: { tasks: Task[]; passages: Map<string, BankPassage> } | null = null;

function load() {
  if (loaded) return loaded;
  const tasks: Task[] = [];
  const passages = new Map<string, BankPassage>();
  for (const [path, raw] of Object.entries(BANK_FILES)) {
    const file = loadFile(path, raw);
    // Invalid items are left out here; `pnpm validate:content` reports them.
    tasks.push(...file.tasks);
    for (const p of file.passages) passages.set(`${path}#${p.id}`, p);
    for (const t of file.tasks) if (t.passageRef) (t as Task & { passageKey?: string }).passageKey = `${path}#${t.passageRef}`;
  }
  loaded = { tasks, passages };
  return loaded;
}

export function bankTasks(): Task[] {
  return load().tasks;
}

export function bankTasksOf(skill: string): Task[] {
  return load().tasks.filter((t) => t.skill === skill);
}

export function bankTask(id: string): Task | undefined {
  return load().tasks.find((t) => t.id === id);
}

function passageOf(t: Task): BankPassage | undefined {
  const key = (t as Task & { passageKey?: string }).passageKey;
  return key ? load().passages.get(key) : undefined;
}

/** A question item as a lesson question. */
export function toQuestion(t: Task): Question {
  const passage = passageOf(t);
  const passages = passage
    ? [{ label: passage.title, text: passage.text }]
    : t.passage
      ? t.passage2
        ? [
            { label: "Text 1", text: t.passage },
            { label: "Text 2", text: t.passage2 },
          ]
        : [{ text: t.passage }]
      : undefined;
  const base = { passages, table: t.table, prompt: t.stem, explanation: t.explanation, ...(t.hint ? { hint: t.hint } : {}) };
  if (t.type === "mcq") return { ...base, kind: "choice", options: t.choices!, answer: t.answer as number };
  return { ...base, kind: "input", answers: t.answer as string[] };
}

export function toWriting(t: Task): WritingTask {
  const task1 = t.taskKind === "chart" || t.taskKind === "table" || t.taskKind === "process" || t.taskKind === "map";
  return {
    prompt: [t.passage, t.stem].filter(Boolean).join("\n\n"),
    minWords: t.minWords ?? (task1 ? 150 : 250),
    maxWords: t.maxWords ?? (task1 ? 220 : 350),
    rubric: t.rubric ?? [],
    table: t.table,
    checks: { profile: task1 ? "ielts1" : "ielts2" },
  };
}

export function toSpeaking(t: Task): Speaking {
  const part = t.part ?? 1;
  return {
    part,
    intro: t.stem,
    questions: t.questions ?? [],
    cueCard: t.cueCard,
    targetWords: part === 2 ? [150, 260] : part === 3 ? [50, 110] : [25, 70],
  };
}

/** The task's step on the SAT Math ladder (math-ladder.ts): its own, or the default of its difficulty. */
export function tierOf(t: Pick<Task, "tier" | "difficulty">): number {
  return t.tier ?? DEFAULT_TIER[t.difficulty];
}

export const LEVEL_OF: Record<Task["difficulty"], Level> = { easy: "easy", medium: "medium", hard: "hard" };
