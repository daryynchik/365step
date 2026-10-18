/**
 * Validates the task bank (src/content/bank/**.json):
 *
 *   - every file and item against the zod schema (bank/schema.ts);
 *   - mcq: exactly one right answer, 4 distinct choices (True/False/Not Given
 *     and Yes/No/Not Given: their 3 fixed choices);
 *   - SAT Math: every numeric answer is recomputed from "check" with mathjs,
 *     and no other choice evaluates to it; expression answers are compared
 *     with "check" at several points;
 *   - duplicates and near-duplicates by stem (normalised, trigram similarity);
 *   - every file is registered in bank/files.ts;
 *   - coverage: skill × difficulty → count, cells under the minimum marked.
 *
 *   pnpm validate:content            report; exit 1 on errors
 *   pnpm validate:content --strict   also exit 1 when coverage is under the minimum
 */

import fs from "node:fs";
import path from "node:path";

import { all, create } from "mathjs";

import { BANK_FILES } from "../src/content/bank/files";
import { FIXED_CHOICES, loadFile, type Task } from "../src/content/bank/schema";
import { DOMAINS, skillById, SKILLS } from "../src/content/bank/taxonomy";

const math = create(all, {});
const ROOT = path.join(process.cwd(), "src/content/bank");
const STRICT = process.argv.includes("--strict");
const QUIET = process.argv.includes("--quiet");

/** Minimum tasks per skill × difficulty for question skills; per skill for prompts. */
const MIN_PER_CELL = 15;
const MIN_PROMPTS = 20;

const errors: string[] = [];
const warnings: string[] = [];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith(".json") ? [p] : [];
  });
}

// ------------------------------------------------------------- loading --

const files = walk(ROOT);
const registered = new Set(Object.keys(BANK_FILES));
const tasks: Task[] = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  if (!registered.has(rel)) errors.push(`${rel}: not registered in bank/files.ts`);
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    errors.push(`${rel}: invalid JSON — ${(e as Error).message}`);
    continue;
  }
  const loaded = loadFile(rel, raw);
  for (const e of loaded.errors) errors.push(`${rel}: ${e}`);
  const passageIds = new Set(loaded.passages.map((p) => p.id));
  for (const t of loaded.tasks) {
    const skill = skillById(t.skill);
    if (!skill) errors.push(`${t.id}: unknown skill ${t.skill}`);
    else {
      if (skill.domain !== t.domain) errors.push(`${t.id}: domain ${t.domain}, taxonomy says ${skill.domain}`);
      if (!DOMAINS.some((d) => d.id === t.domain)) errors.push(`${t.id}: unknown domain ${t.domain}`);
    }
    if (t.passageRef && !passageIds.has(t.passageRef)) errors.push(`${t.id}: passage ${t.passageRef} not in the file`);
    tasks.push(t);
  }
}
for (const rel of registered) if (!fs.existsSync(path.join(ROOT, rel))) errors.push(`bank/files.ts lists ${rel}, which does not exist`);

// ------------------------------------------------------------ ids, mcq --

const seenIds = new Set<string>();
for (const t of tasks) {
  if (seenIds.has(t.id)) errors.push(`${t.id}: duplicate id`);
  seenIds.add(t.id);
}

const norm = (s: string) => s.toLowerCase().replace(/[\s ]+/g, " ").trim();

for (const t of tasks.filter((x) => x.type === "mcq")) {
  const choices = t.choices ?? [];
  const local = t.skill.split(".")[1];
  const fixed = FIXED_CHOICES[local];
  if (fixed) {
    if (choices.join("|") !== fixed.join("|")) errors.push(`${t.id}: choices must be ${fixed.join(" / ")}`);
  } else if (choices.length !== 4) errors.push(`${t.id}: ${choices.length} choices, need 4`);
  if (new Set(choices.map(norm)).size !== choices.length) errors.push(`${t.id}: duplicate choices`);
  if (typeof t.answer !== "number" || t.answer < 0 || t.answer >= choices.length) errors.push(`${t.id}: answer is not one choice`);
}

// ------------------------------------------------------- SAT Math check --

/** Displayed math → mathjs syntax. */
function toMathjs(s: string): string {
  return s
    .replace(/[−–]/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/√\(/g, "sqrt(")
    .replace(/√(\d+)/g, "sqrt($1)")
    .replace(/π/g, "pi")
    .replace(/,(?=\d{3}\b)/g, "")
    .replace(/^\$/, "")
    .replace(/%$/, "")
    .trim();
}

function evaluate(expr: string, scope: Record<string, number> = {}): number | null {
  try {
    const v = math.evaluate(toMathjs(expr), { ...scope });
    const n = typeof v === "number" ? v : Number(v?.valueOf?.());
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Single-letter variables (not e or i, which mathjs reads as constants). */
function variablesIn(expr: string): string[] {
  const names = new Set<string>();
  try {
    math.parse(toMathjs(expr)).traverse((node, _path, parent) => {
      const n = node as unknown as { type: string; name: string };
      const p = parent as unknown as { type?: string; fn?: unknown } | null;
      if (n.type === "SymbolNode" && /^[a-z]$/.test(n.name) && n.name !== "e" && n.name !== "i" && !(p?.type === "FunctionNode" && p.fn === node)) names.add(n.name);
    });
  } catch {
    /* not an expression */
  }
  return [...names];
}

/**
 * "y = 2x + 5", "h(w) = 2w + 5", "G = 50 − 3t" → the right-hand side.
 * An equation with an expression on the left ("3x + 2 = 3x + 2") is not a formula: null.
 */
function formulaOf(choice: string): string | null {
  // Inequalities ("x < 9", "12 ≤ t < 20") are relations to reason about, not values.
  if (/[<>≤≥≠]/.test(choice)) return null;
  const parts = choice.split("=");
  if (parts.length === 1) return choice;
  if (parts.length !== 2) return null;
  return /^\s*([A-Za-z]|[A-Za-z]\([a-z]\))\s*$/.test(parts[0]) ? parts[1] : null;
}

const POINTS = [-2.3, -0.7, 0.45, 1.6, 3.2];
function sameExpression(a: string, b: string, vars: string[]): boolean {
  return POINTS.every((p, i) => {
    const scope = Object.fromEntries(vars.map((v, j) => [v, p + j * 0.37 + i * 0.01]));
    const x = evaluate(a, scope);
    const y = evaluate(b, scope);
    return x !== null && y !== null && Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(x));
  });
}

const close = (a: number, b: number, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(b));
let checked = 0;
let conceptual = 0;

for (const t of tasks.filter((x) => x.exam === "sat" && x.section === "math")) {
  const raw = t.type === "mcq" ? (t.choices ?? [])[t.answer as number] : Array.isArray(t.answer) ? t.answer[0] : null;
  const answerText = raw ? formulaOf(raw) : null;
  if (answerText === undefined || answerText === null) continue;
  const numeric = evaluate(answerText);
  const vars = variablesIn(answerText);
  const isMath = numeric !== null || vars.length > 0;
  if (!isMath) continue; // a worded answer: nothing to compute
  // A choice between equations or graphs where nothing evaluates to the answer.
  if (t.check === "conceptual") {
    conceptual++;
    continue;
  }
  if (!t.check) {
    errors.push(`${t.id}: numeric answer without "check"`);
    continue;
  }
  if (vars.length === 0) {
    const value = evaluate(t.check);
    if (value === null) {
      errors.push(`${t.id}: check "${t.check}" does not evaluate`);
      continue;
    }
    if (t.type === "mcq") {
      const matches = (t.choices ?? []).map((c) => evaluate(c)).filter((v) => v !== null && close(v, value)).length;
      if (!close(numeric!, value)) errors.push(`${t.id}: check gives ${value}, the marked choice is ${answerText}`);
      else if (matches !== 1) errors.push(`${t.id}: ${matches} choices equal the computed answer ${value}`);
    } else {
      for (const a of t.answer as string[]) {
        const v = evaluate(a);
        // Grid-ins accept rounded forms of a repeating decimal (.6666, .6667).
        if (v === null || !close(v, value, 5e-4)) errors.push(`${t.id}: accepted answer ${a} ≠ computed ${value}`);
      }
    }
  } else {
    if (!sameExpression(answerText, t.check, vars)) errors.push(`${t.id}: the marked choice is not equivalent to check "${t.check}"`);
    if (t.type === "mcq") {
      const equivalent = (t.choices ?? [])
        .map(formulaOf)
        .filter((c): c is string => c !== null && variablesIn(c).length > 0 && sameExpression(c, t.check!, vars)).length;
      if (equivalent !== 1) errors.push(`${t.id}: ${equivalent} choices are equivalent to the answer`);
    }
  }
  checked++;
}

// ---------------------------------------------------------- duplicates --

/**
 * Lowercase, one kind of minus, single spaces, no quotes or trailing
 * punctuation. Numbers stay: in math the numbers are the problem, so two
 * stems count as near-duplicates only when they also share most numbers.
 */
function normalise(t: Task): string {
  return `${t.passage ?? ""} ${t.passage2 ?? ""} ${t.stem}`
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[“”«»"']/g, "")
    .replace(/[.,;:!?]+(\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(s: string): Set<string> {
  const out = new Set<string>();
  const p = `  ${s} `;
  for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  return out;
}

function dice(a: Set<string>, b: Set<string>): number {
  let common = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const g of small) if (big.has(g)) common++;
  return (2 * common) / (a.size + b.size);
}

const NEAR = 0.9;
let duplicatePairs = 0;
const bySection = new Map<string, Task[]>();
for (const t of tasks) bySection.set(`${t.exam}-${t.section}`, [...(bySection.get(`${t.exam}-${t.section}`) ?? []), t]);
for (const [, list] of bySection) {
  const grams = list.map((t) => ({ t, n: normalise(t), g: trigrams(normalise(t)) }));
  for (let i = 0; i < grams.length; i++) {
    for (let j = i + 1; j < grams.length; j++) {
      const a = grams[i];
      const b = grams[j];
      // IELTS items share their passage; compare stems only (already: passage is a ref, not text).
      if (Math.abs(a.n.length - b.n.length) > 0.25 * Math.max(a.n.length, b.n.length)) continue;
      if (a.n === b.n) {
        errors.push(`duplicate: ${a.t.id} = ${b.t.id}`);
        duplicatePairs++;
      } else {
        const s = dice(a.g, b.g);
        if (s >= NEAR) {
          errors.push(`near-duplicate (${s.toFixed(2)}): ${a.t.id} ~ ${b.t.id}`);
          duplicatePairs++;
        }
      }
    }
  }
}

// ------------------------------------------------------------ coverage --

type Cell = { easy: number; medium: number; hard: number };
const coverage = new Map<string, Cell>();
for (const s of SKILLS) coverage.set(s.id, { easy: 0, medium: 0, hard: 0 });
for (const t of tasks) {
  const c = coverage.get(t.skill);
  if (c) c[t.difficulty]++;
}

const rows: string[] = [];
const under: string[] = [];
let lastSection = "";
for (const s of SKILLS) {
  if (s.kind === "listening") continue;
  const c = coverage.get(s.id)!;
  const total = c.easy + c.medium + c.hard;
  if (s.section !== lastSection) {
    rows.push(`\n${s.section}`);
    lastSection = s.section;
  }
  const isPrompt = s.kind === "writing" || s.kind === "speaking";
  const mark = (n: number) => (isPrompt ? String(n).padStart(4) : `${String(n).padStart(3)}${n < MIN_PER_CELL ? "!" : " "}`);
  rows.push(`  ${s.id.split(".")[1].padEnd(24)} ${mark(c.easy)} ${mark(c.medium)} ${mark(c.hard)}   ${String(total).padStart(4)}${isPrompt && total < MIN_PROMPTS ? "!" : ""}`);
  if (isPrompt ? total < MIN_PROMPTS : Math.min(c.easy, c.medium, c.hard) < MIN_PER_CELL) under.push(s.id);
}

const questionSkills = SKILLS.filter((s) => s.kind === "questions");
const cells = questionSkills.length * 3;
const fullCells = questionSkills.reduce((n, s) => n + (["easy", "medium", "hard"] as const).filter((d) => coverage.get(s.id)![d] >= MIN_PER_CELL).length, 0);

if (!QUIET) {
  console.log(`Coverage (skill × difficulty; "!" — under ${MIN_PER_CELL} per cell, prompts under ${MIN_PROMPTS} per skill)`);
  console.log(`  ${"skill".padEnd(24)} easy  med  hard  total`);
  console.log(rows.join("\n"));
  console.log("");
}
for (const w of warnings) console.warn(`warning: ${w}`);
console.log(
  `Bank: ${tasks.length} tasks in ${files.length} files; ${checked} SAT Math answers recomputed (${conceptual} conceptual); ${duplicatePairs} duplicate pairs; ` +
    `${fullCells}/${cells} question cells at ≥${MIN_PER_CELL}; ${under.length} skills under the minimum.`,
);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n- ${errors.slice(0, 200).join("\n- ")}`);
  process.exit(1);
}
if (STRICT && under.length) {
  console.error(`Under the minimum: ${under.join(", ")}`);
  process.exit(1);
}
console.log("Bank OK.");
