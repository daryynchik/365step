/**
 * Validates the task bank (src/content/bank/**.json):
 *
 *   - every file and item against the zod schema (bank/schema.ts);
 *   - mcq: exactly one right answer, 4 distinct choices (True/False/Not Given
 *     and Yes/No/Not Given: their 3 fixed choices);
 *   - SAT Math: every numeric answer is recomputed from "check" with mathjs,
 *     and no other choice evaluates to it; expression answers are compared
 *     with "check" at several points;
 *   - SAT Math "verify": the condition holds with the marked answer substituted
 *     for "ans" and fails for every other choice;
 *   - duplicates and near-duplicates by stem (normalised, trigram similarity);
 *     SAT Math stems that differ only in their numbers (a template with the
 *     numbers swapped) are errors too;
 *   - every file is registered in bank/files.ts;
 *   - coverage: skill × difficulty → count, cells under the minimum marked;
 *     SAT Math also by ladder step (math-ladder.ts) against the bank's target
 *     of 40 easy, 50 medium and 60 hard per skill.
 *
 *   pnpm validate:content            report; exit 1 on errors
 *   pnpm validate:content --strict   also exit 1 when coverage is under the minimum
 */

import fs from "node:fs";
import path from "node:path";

import { all, create } from "mathjs";

import { BANK_FILES } from "../src/content/bank/files";
import { FIXED_CHOICES, loadFile, type Task } from "../src/content/bank/schema";
import { tierOf } from "../src/content/bank/tasks";
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

// --------------------------------------------------------- explanations --

// Traces of a draft left in an explanation ("…", "нет:", "?" in the middle of a sentence).
for (const t of tasks) {
  // Quotations («…») may abbreviate the text they quote.
  const prose = t.explanation.replace(/«[^»]*»/g, "«»").replace(/\([^)]*…[^)]*\)/g, "()");
  if (/\.\.\.|…|\bнет[:,]|\?\s/.test(prose)) errors.push(`${t.id}: explanation looks unfinished — ${t.explanation.slice(0, 80)}`);
  if (t.type === "mcq" && !/[A-D]\)/.test(t.explanation) && !/\([A-D]\)/.test(t.explanation)) {
    const letter = "ABCD"[t.answer as number];
    const byParagraph = (t.choices ?? []).every((c) => c.startsWith("Paragraph "));
    if (letter && !byParagraph && !t.explanation.includes(letter) && !FIXED_CHOICES[t.skill.split(".")[1]]) warnings.push(`${t.id}: explanation does not name the right choice (${letter})`);
  }
}

// ---------------------------------------------------- quoted literature --

// Quotations from Frankenstein (public domain, embedded in the repo) must be verbatim.
const bookText = (JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/content/frankenstein.json"), "utf8")) as { paragraphs: string[] }[])
  .map((s) => s.paragraphs.join(" "))
  .join(" ")
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/\s+/g, " ");
let quotesChecked = 0;
for (const t of tasks) {
  if (!/Frankenstein/.test(`${t.passage ?? ""} ${t.stem}`)) continue;
  for (const c of t.choices ?? []) {
    const m = c.match(/^"(.+)"$/s);
    if (!m) continue;
    const quote = m[1].replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ");
    if (!bookText.includes(quote)) errors.push(`${t.id}: quotation not found in Frankenstein — ${quote.slice(0, 60)}`);
    quotesChecked++;
  }
}

// ------------------------------------------------------- SAT Math check --

const SUPERSCRIPT: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };

/** Displayed math → mathjs syntax. */
function toMathjs(s: string): string {
  return s
    .replace(/[−–]/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => `^(${[...m].map((c) => SUPERSCRIPT[c]).join("")})`)
    .replace(/√\(/g, " sqrt(")
    .replace(/√(\d+)/g, " sqrt($1)")
    .replace(/√([a-z])/g, " sqrt($1)")
    .replace(/π/g, "pi")
    // "sin 50°", "cos(40°)" are degrees
    .replace(/(sin|cos|tan)\s*\(?\s*(\d+(?:\.\d+)?)\s*°\s*\)?/g, "$1($2 deg)")
    .replace(/°/g, "")
    .replace(/,(?=\d{3}\b)/g, "")
    .replace(/^\$/, "")
    .replace(/%$/, "")
    // "4ab" is 4·a·b, not a variable named "ab"; function names and words of conditions stay.
    .replace(/[a-z]{2,}/g, (w) => (WORDS.has(w) ? w : w.split("").join("*")))
    // "2x(x + 3)" multiplies; f(x), g(x), h(x), p(x), q(x) are functions.
    .replace(/(?<![A-Za-z])([abcdkmnrstuvwxyz])\(/g, "$1*(")
    .trim();
}

const WORDS = new Set([
  "sqrt", "cbrt", "nthRoot", "sin", "cos", "tan", "asin", "acos", "atan", "log", "abs", "pi", "deg", "exp", "round", "floor", "ceil",
  "max", "min", "mean", "median", "mode", "std", "variance", "sum", "prod", "combinations", "permutations", "factorial",
  "and", "or", "not", "xor", "ans",
]);

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
  // Words ("2 and −5", "Zero") make it a worded choice; sqrt, log, pi and trig are math.
  if (/[A-Za-z]{2,}/.test(choice.replace(/sqrt|log|pi|sin|cos|tan/g, ""))) return null;
  const parts = choice.split("=");
  if (parts.length === 1) return choice;
  if (parts.length !== 2) return null;
  return /^\s*([A-Za-z]|[A-Za-z]\([a-z]\))\s*$/.test(parts[0]) ? parts[1] : null;
}

const POINTS = [-2.3, -0.7, 0.45, 1.6, 3.2, 4.7, 6.1];
/**
 * Equal at every test point where both sides are real. Roots and fractional
 * powers are not real for negative inputs, so those points are skipped; at
 * least three points must remain.
 */
function sameExpression(a: string, b: string, vars: string[]): boolean {
  let valid = 0;
  for (const [i, p] of POINTS.entries()) {
    const scope = Object.fromEntries(vars.map((v, j) => [v, p + j * 0.37 + i * 0.01]));
    const x = evaluate(a, scope);
    const y = evaluate(b, scope);
    if (x === null && y === null) continue;
    if (x === null || y === null || Math.abs(x - y) > 1e-6 * Math.max(1, Math.abs(x))) return false;
    valid++;
  }
  return valid >= 3;
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
      const matches = (t.choices ?? [])
        .map(formulaOf)
        .map((c) => (c === null ? null : evaluate(c)))
        .filter((v) => v !== null && close(v, value)).length;
      if (!close(numeric!, value)) errors.push(`${t.id}: check gives ${value}, the marked choice is ${answerText}`);
      else if (matches !== 1) errors.push(`${t.id}: ${matches} choices equal the computed answer ${value}`);
    } else {
      for (const a of t.answer as string[]) {
        const v = evaluate(a);
        // Grid-ins accept rounded or truncated forms of a long decimal (.6666, .6667, 11.66):
        // within one unit of the last digit written.
        const digits = a.includes(".") ? a.split(".")[1].length : 0;
        const ok = v !== null && (close(v, value, 5e-4) || (digits > 0 && Math.abs(v - value) < 10 ** -digits));
        if (!ok) errors.push(`${t.id}: accepted answer ${a} ≠ computed ${value}`);
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

// ------------------------------------------------------ SAT Math verify --

/** A comparison mathjs can evaluate: "3*ans + 7 == 22" → true / false. */
function holds(expr: string, ans: number): boolean | null {
  try {
    const v = math.evaluate(toMathjs(expr).replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!="), { ans });
    if (typeof v === "boolean") return v;
    return null;
  } catch {
    return null;
  }
}

let verified = 0;
for (const t of tasks.filter((x) => x.exam === "sat" && x.section === "math" && x.verify)) {
  const values =
    t.type === "mcq"
      ? (t.choices ?? []).map((c) => {
          const f = formulaOf(c);
          return f === null ? null : evaluate(f);
        })
      : (t.answer as string[]).map((a) => evaluate(a));
  if (t.type === "mcq") {
    const marked = values[t.answer as number];
    if (marked === null) {
      errors.push(`${t.id}: verify needs a numeric right choice`);
      continue;
    }
    values.forEach((v, i) => {
      if (v === null) return;
      const ok = holds(t.verify!, v);
      if (ok === null) errors.push(`${t.id}: verify "${t.verify}" does not evaluate`);
      else if (i === t.answer && !ok) errors.push(`${t.id}: verify fails for the marked choice ${v}`);
      else if (i !== t.answer && ok) errors.push(`${t.id}: verify also holds for choice ${"ABCD"[i]} (${v})`);
    });
  } else {
    // The first accepted answer is the exact one; rounded forms are compared with "check" above.
    const v = values[0];
    if (v === null) errors.push(`${t.id}: accepted answer ${(t.answer as string[])[0]} is not a number`);
    else if (holds(t.verify!, v) !== true) errors.push(`${t.id}: verify fails for the answer ${v}`);
  }
  verified++;
}

// Number-swap templates: SAT Math stems that differ only in their numbers.
const skeletons = new Map<string, string>();
for (const t of tasks.filter((x) => x.exam === "sat" && x.section === "math")) {
  const skeleton = `${t.passage ?? ""} ${t.stem}`.toLowerCase().replace(/[−–]/g, "-").replace(/\d+(\.\d+)?/g, "#").replace(/\s+/g, " ").trim();
  const other = skeletons.get(skeleton);
  if (other) (skeleton.length >= 50 ? errors : warnings).push(`template with swapped numbers: ${other} ~ ${t.id}`);
  else skeletons.set(skeleton, t.id);
}

// ---------------------------------------------------------- duplicates --

/**
 * Lowercase, one kind of minus, single spaces, no quotes or trailing
 * punctuation. Numbers stay: in math the numbers are the problem, so two
 * stems count as near-duplicates only when they also share most numbers.
 */
function normalise(t: Task): string {
  // Items on a shared passage (IELTS) can share a stem ("Which heading best fits
  // paragraph B?"); the passage and the choices tell them apart.
  // Prompts share the examiner's script (left out for speaking); their questions,
  // cue cards and data differ.
  const extra = [...(t.questions ?? []), t.cueCard?.topic ?? "", ...(t.table?.rows.flat() ?? [])].join(" ");
  const stem = t.type === "speaking-prompt" ? "" : t.stem;
  return `${t.passageRef ?? ""} ${t.passage ?? ""} ${t.passage2 ?? ""} ${stem} ${(t.choices ?? []).join(" ")} ${extra}`
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

// SAT Math by ladder step, against the bank's target per skill.
const MATH_TARGET = { easy: 40, medium: 50, hard: 60 };
const mathRows: string[] = [];
const mathUnder: string[] = [];
for (const s of SKILLS.filter((x) => x.section === "sat-math")) {
  const mine = tasks.filter((t) => t.skill === s.id);
  const byTier = [1, 2, 3, 4, 5, 6].map((k) => mine.filter((t) => tierOf(t) === k).length);
  const c = coverage.get(s.id)!;
  const short = (["easy", "medium", "hard"] as const).filter((d) => c[d] < MATH_TARGET[d]);
  if (short.length) mathUnder.push(`${s.id.split(".")[1]} (${short.map((d) => `${d} ${c[d]}/${MATH_TARGET[d]}`).join(", ")})`);
  mathRows.push(`  ${s.id.split(".")[1].padEnd(24)} ${byTier.map((n) => String(n).padStart(4)).join("")}   ${String(mine.length).padStart(4)}${short.length ? " !" : ""}`);
}
const mathTotal = tasks.filter((t) => t.exam === "sat" && t.section === "math").length;

if (!QUIET) {
  console.log(`Coverage (skill × difficulty; "!" — under ${MIN_PER_CELL} per cell, prompts under ${MIN_PROMPTS} per skill)`);
  console.log(`  ${"skill".padEnd(24)} easy  med  hard  total`);
  console.log(rows.join("\n"));
  console.log("");
  console.log(`SAT Math by ladder step (1–6; "!" — under ${MATH_TARGET.easy} easy / ${MATH_TARGET.medium} medium / ${MATH_TARGET.hard} hard)`);
  console.log(`  ${"skill".padEnd(24)}    1   2   3   4   5   6   total`);
  console.log(mathRows.join("\n"));
  console.log("");
}
// ------------------------------------------- race set: IELTS Listening --
// Short recordings for study races: one right answer, four different choices,
// an explanation, a topic and a level, and an audio file with a known length.
const listening = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/content/race/ielts-listening.json"), "utf8")) as {
  topics: Record<string, string>;
  items: { id: string; difficulty: string; topic: string; lines: { voice: string; text: string }[]; choices: string[]; answer: number; explanation: string }[];
};
const audio = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/content/race/listening-audio.json"), "utf8")) as Record<string, { ms: number }>;
const listeningLevels = { easy: 0, medium: 0, hard: 0 } as Record<string, number>;
for (const it of listening.items) {
  if (!["easy", "medium", "hard"].includes(it.difficulty)) errors.push(`${it.id}: unknown difficulty`);
  else listeningLevels[it.difficulty]++;
  if (!listening.topics[it.topic]) errors.push(`${it.id}: unknown topic ${it.topic}`);
  if (it.choices.length !== 4 || new Set(it.choices.map(norm)).size !== 4) errors.push(`${it.id}: needs four different choices`);
  if (!Number.isInteger(it.answer) || it.answer < 0 || it.answer >= it.choices.length) errors.push(`${it.id}: answer is not one choice`);
  if (it.explanation.length < 60) errors.push(`${it.id}: explanation too short`);
  if (!it.lines.length || it.lines.some((l) => !["cori", "ljspeech"].includes(l.voice) || l.text.length < 5)) errors.push(`${it.id}: bad transcript lines`);
  if (!fs.existsSync(path.join(process.cwd(), "public/audio/listening", `${it.id}.mp3`))) errors.push(`${it.id}: audio file missing`);
  if (!(audio[it.id]?.ms > 1000)) errors.push(`${it.id}: audio length unknown — run scripts/listening-audio.py`);
}
for (const [level, n] of Object.entries(listeningLevels)) if (n < MIN_PER_CELL) errors.push(`IELTS Listening race set: ${n} ${level} items, need ${MIN_PER_CELL}`);

for (const w of warnings) console.warn(`warning: ${w}`);
console.log(
  `Bank: ${tasks.length} tasks in ${files.length} files; SAT Math ${mathTotal} tasks, ${checked} answers recomputed (${conceptual} conceptual), ${verified} verified against the statement; ` +
    `${mathUnder.length} SAT Math skills under the 40/50/60 target; ${duplicatePairs} duplicate pairs; ` +
    `${quotesChecked} quotations checked against the novel; ${fullCells}/${cells} question cells at ≥${MIN_PER_CELL}; ${under.length} skills under the minimum; ` +
    `race Listening: ${listening.items.length} items with audio (${listeningLevels.easy}/${listeningLevels.medium}/${listeningLevels.hard}).`,
);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n- ${errors.slice(0, 200).join("\n- ")}`);
  process.exit(1);
}
if (STRICT && (under.length || mathUnder.length)) {
  console.error(`Under the minimum: ${[...under, ...mathUnder].join(", ")}`);
  process.exit(1);
}
console.log("Bank OK.");
