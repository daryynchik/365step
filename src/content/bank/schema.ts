/**
 * The task bank's schema. One JSON file per skill (src/content/bank/<exam>/<section>/<skill>.json):
 *
 *   {
 *     "defaults": { exam, section, domain, skill, source, license },   // merged into every item
 *     "passages": [ { id, title, text, source, license } ],             // optional, IELTS Reading
 *     "items": [ { id, difficulty, type, stem, choices?, answer, explanation, ... } ]
 *   }
 *
 * After merging, every item satisfies TaskSchema. Explanations are in Russian
 * and say why the right answer is right and why the others are not.
 *
 * Copyright: items are original ("source": "original") unless they carry an
 * open licence (CC BY, CC BY-SA, public domain) and a link in "source".
 * Nothing is copied or closely paraphrased from College Board, Cambridge,
 * Khan Academy or commercial books.
 */

import { z } from "zod";

export const Difficulty = z.enum(["easy", "medium", "hard"]);
export const TaskType = z.enum(["mcq", "grid-in", "short-answer", "essay-prompt", "speaking-prompt"]);
export const Exam = z.enum(["sat", "ielts"]);
export const BankSection = z.enum(["rw", "math", "reading", "writing", "speaking", "listening"]);

/** "original", or the URL of an openly licensed source. */
const Source = z.union([z.literal("original"), z.string().url()]);
const License = z.string().min(2);

const Table = z.object({
  caption: z.string().optional(),
  head: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())).min(1),
});

export const TaskSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, "id: <section>.<skill>.<local id>"),
    exam: Exam,
    section: BankSection,
    domain: z.string().min(2),
    skill: z.string().min(2),
    difficulty: Difficulty,
    type: TaskType,
    stem: z.string().min(5),
    /** Inline passage text (SAT). */
    passage: z.string().optional(),
    /** Id of a passage in the file's "passages" (IELTS Reading). */
    passageRef: z.string().optional(),
    /** Second text for cross-text questions. */
    passage2: z.string().optional(),
    table: Table.optional(),
    choices: z.array(z.string().min(1)).optional(),
    /** mcq: index of the right choice; grid-in / short-answer: accepted answers; prompts: what a strong response contains. */
    answer: z.union([z.number().int().nonnegative(), z.array(z.string().min(1)).min(1), z.string().min(1)]),
    explanation: z.string().min(20),
    source: Source,
    license: License,
    attribution: z.object({
      title: z.string().min(3),
      licenseUrl: z.string().url().refine((s) => s.startsWith("https://"), "license URL must use HTTPS"),
      credit: z.string().min(10),
      note: z.string().min(10),
      revision: z.string().regex(/^[a-f0-9]{40}$/),
      module: z.string().regex(/^m\d+$/),
      exercise: z.string().min(3),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    }).optional(),
    answerFormat: z.literal("number-set").optional(),
    /**
     * SAT Math: an expression mathjs evaluates to the answer (or, with variables,
     * an expression equivalent to the right choice). "conceptual" when the
     * choices are equations or graphs to reason about, not values.
     */
    check: z.string().optional(),
    /**
     * SAT Math: a condition mathjs checks with the answer substituted for "ans"
     * (e.g. "3*ans + 7 == 22"). It must hold for the marked choice and fail for
     * every other one, so it proves the answer from the problem statement.
     */
    verify: z.string().optional(),
    /**
     * Internal step of the SAT Math ladder (math-ladder.ts), 1–6: easy 1–2,
     * medium 3–4, hard 4–6. Left out: easy 1, medium 3, hard 4. Not an
     * official difficulty — it only orders tasks for adaptive practice.
     */
    tier: z.number().int().min(1).max(6).optional(),
    /** A first step, shown on request before answering. Using it lowers the credit for the answer. */
    hint: z.string().min(5).optional(),
    // Writing prompts
    taskKind: z.enum(["chart", "table", "process", "map", "opinion", "discussion", "problem-solution", "two-part"]).optional(),
    minWords: z.number().int().positive().optional(),
    maxWords: z.number().int().positive().optional(),
    rubric: z.array(z.string()).optional(),
    // Speaking prompts
    part: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    questions: z.array(z.string()).optional(),
    cueCard: z.object({ topic: z.string(), points: z.array(z.string()).min(2) }).optional(),
    // Listening (text transcript only; recorded audio is TODO)
    transcript: z.array(z.object({ speaker: z.string(), text: z.string() })).optional(),
  })
  .superRefine((t, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    if (t.type === "mcq") {
      if (!t.choices) issue("mcq needs choices");
      if (typeof t.answer !== "number") issue("mcq answer must be the index of the right choice");
      else if (t.choices && t.answer >= t.choices.length) issue("mcq answer index out of range");
    }
    if ((t.type === "grid-in" || t.type === "short-answer") && !Array.isArray(t.answer)) issue(`${t.type} answer must be a list of accepted answers`);
    if (t.type === "essay-prompt") {
      if (typeof t.answer !== "string") issue("essay-prompt answer: what a strong response contains");
      if (!t.taskKind || !t.minWords || !t.rubric?.length) issue("essay-prompt needs taskKind, minWords and rubric");
    }
    if (t.type === "speaking-prompt") {
      if (typeof t.answer !== "string") issue("speaking-prompt answer: what a strong answer contains");
      if (!t.part || !t.questions?.length) issue("speaking-prompt needs part and questions");
      if (t.part === 2 && !t.cueCard) issue("Part 2 needs a cue card");
    }
    if (t.tier !== undefined) {
      const allowed = { easy: [1, 2], medium: [3, 4], hard: [4, 5, 6] }[t.difficulty];
      if (!allowed.includes(t.tier)) issue(`tier ${t.tier} does not fit difficulty ${t.difficulty}`);
    }
    if (t.source !== "original" && !/CC BY|public domain/i.test(t.license)) issue("external material needs an open licence (CC BY, CC BY-SA, public domain)");
    if (t.source !== "original" && (!t.attribution || !t.source.startsWith("https://"))) issue("external tasks need HTTPS source and complete attribution");
    if (t.source === "original" && t.attribution) issue("sourced tasks must not be labelled original");
    if (t.answerFormat && t.type !== "grid-in") issue("number-set needs a grid-in question");
  });

export type Task = z.infer<typeof TaskSchema>;

export const PassageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(200),
  source: Source,
  license: License,
});

export type BankPassage = z.infer<typeof PassageSchema>;

/** A file before merging defaults: items may leave out what the defaults give. */
export const FileSchema = z.object({
  defaults: z.object({
    exam: Exam,
    section: BankSection,
    domain: z.string(),
    skill: z.string(),
    source: Source.default("original"),
    license: License.default("original — © 365step"),
    choices: z.array(z.string()).optional(),
  }),
  passages: z.array(PassageSchema).optional(),
  items: z.array(z.record(z.string(), z.unknown())).min(1),
});

export type BankFile = z.infer<typeof FileSchema>;

/** The fixed choices of True/False/Not Given and Yes/No/Not Given. */
export const FIXED_CHOICES: Record<string, string[]> = {
  tfng: ["TRUE", "FALSE", "NOT GIVEN"],
  ynng: ["YES", "NO", "NOT GIVEN"],
};

export interface LoadedFile {
  path: string;
  tasks: Task[];
  passages: BankPassage[];
  errors: string[];
}

/** Merges defaults, prefixes ids with the skill and validates every item. */
export function loadFile(path: string, raw: unknown): LoadedFile {
  const parsed = FileSchema.safeParse(raw);
  if (!parsed.success) return { path, tasks: [], passages: [], errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  const { defaults, passages = [], items } = parsed.data;
  const { choices: defaultChoices, ...base } = defaults;
  const tasks: Task[] = [];
  const errors: string[] = [];
  const skillId = `${sectionPrefix(defaults.exam, defaults.section)}.${defaults.skill}`;
  for (const [i, item] of items.entries()) {
    const merged = {
      ...base,
      ...(defaultChoices && item.type === "mcq" && !item.choices ? { choices: defaultChoices } : {}),
      ...item,
      skill: skillId,
      id: `${skillId}.${String(item.id ?? i)}`,
    };
    const r = TaskSchema.safeParse(merged);
    if (r.success) tasks.push(r.data);
    else errors.push(`item ${String(item.id ?? i)}: ${r.error.issues.map((x) => `${x.path.join(".") || "item"} — ${x.message}`).join("; ")}`);
  }
  return { path, tasks, passages, errors };
}

/** "sat" + "math" → "sat-math", the section id used by the plan and the taxonomy. */
export function sectionPrefix(exam: string, section: string): string {
  return `${exam}-${section}`;
}
