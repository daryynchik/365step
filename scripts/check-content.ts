/**
 * Sanity checks over the course content. Run with `npm run check:content`.
 *
 *   - lesson ids are unique within a course
 *   - every choice question has a valid answer index and distinct options
 *   - every input question's accepted answers are well-formed
 *   - every quotation from Frankenstein appears in the book text verbatim
 *   - every reading section exists in the book
 */

import fs from "node:fs";
import path from "node:path";

import { COURSES, flatten } from "../src/content";
import { FIELD_OPTIONS } from "../src/content/fields/ids";
import { bankLesson } from "../src/content/bank/lessons";
import type { ExamEntry } from "../src/content/exams";
import { buildPlan, COUNTRIES, reviewLesson, type Plan } from "../src/content/plan";
import { parseNumber } from "../src/lib/answers";

const book = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/content/frankenstein.json"), "utf8")) as {
  id: string;
  paragraphs: string[];
}[];
const bookText = book.map((s) => s.paragraphs.join(" ")).join(" ");

const problems: string[] = [];
let questions = 0;
let quotes = 0;

for (const course of Object.values(COURSES)) {
  const ids = new Set<string>();
  for (const { lesson, key } of flatten(course)) {
    if (ids.has(lesson.id)) problems.push(`${key}: duplicate lesson id`);
    ids.add(lesson.id);

    if (lesson.questions.length === 0 && !lesson.writing && !lesson.speaking) problems.push(`${key}: nothing to do`);
    if (lesson.listening && lesson.listening.lines.length < 3) problems.push(`${key}: listening script too short`);
    if (lesson.speaking) {
      const sp = lesson.speaking;
      if (sp.questions.length === 0) problems.push(`${key}: speaking has no questions`);
      if (sp.part === 2 && !sp.cueCard) problems.push(`${key}: Part 2 needs a cue card`);
      if (sp.targetWords[0] >= sp.targetWords[1]) problems.push(`${key}: bad targetWords`);
    }
    if (lesson.writing && lesson.writing.minWords >= lesson.writing.maxWords) problems.push(`${key}: bad word range`);

    if (lesson.tutorial) {
      if (!lesson.tutorial.objectives.length || !lesson.tutorial.resources.length) problems.push(`${key}: incomplete tutorial`);
      for (const resource of lesson.tutorial.resources) {
        try { if (new URL(resource.url).protocol !== "https:") problems.push(`${key}: insecure resource URL`); }
        catch { problems.push(`${key}: malformed resource URL`); }
      }
    }

    for (const section of lesson.reading?.sections ?? []) {
      const [id, paragraph] = section.split("#");
      const found = book.find((s) => s.id === id);
      if (!found) problems.push(`${key}: unknown book section ${section}`);
      else if (paragraph && !found.paragraphs[Number(paragraph)]) problems.push(`${key}: no paragraph ${section}`);
    }

    lesson.questions.forEach((q, i) => {
      questions++;
      const where = `${key} q${i + 1}`;
      if (q.kind === "choice") {
        if (q.answer < 0 || q.answer >= q.options.length) problems.push(`${where}: answer index out of range`);
        if (new Set(q.options).size !== q.options.length) problems.push(`${where}: duplicate options`);
      } else {
        if (q.answers.length === 0) problems.push(`${where}: no accepted answers`);
        for (const a of q.answers) if (parseNumber(a) === null && !/^[a-z0-9][a-z0-9 '-]*$/i.test(a)) problems.push(`${where}: odd answer "${a}"`);
      }

      // Quotations attributed to the novel: “…” followed by (Ch. N) or (Letter N).
      if (course.id === "seminar") {
        for (const p of q.passages ?? []) {
          const match = p.text.match(/^“([\s\S]+)”\s*\((?:Ch\.|Letter) \d+\)$/);
          if (!match) continue;
          // Ellipses mark omissions; every fragment between them must be in the book.
          for (const fragment of match[1].split("…").map((f) => f.trim()).filter((f) => f.length > 3)) {
            quotes++;
            if (!bookText.includes(fragment)) problems.push(`${where}: quotation not found in book: "${fragment.slice(0, 60)}…"`);
          }
        }
      }
    });
  }
}

function checkBank(plan: Plan, where: string, keys: string[]): void {
  for (const k of keys) {
    const b = bankLesson(plan, k);
    const l = b?.lesson;
    if (!b || !l || (l.questions.length === 0 && !l.writing && !l.speaking)) problems.push(`${where}: ${k} builds empty`);
    else if (b.taskSkills.length !== l.questions.length) problems.push(`${where}: ${k} questions without a skill`);
  }
}

// Personal plans: every country × field × a range of timelines.
const start = "2026-09-01";
const durations = [21, 45, 90, 180, 300, 420, 600, 900];
let plans = 0;
let longest = 0;
for (const country of COUNTRIES) {
  for (const field of FIELD_OPTIONS) {
    for (const days of durations) {
      const graduation = new Date(Date.parse(start) + days * 86_400_000).toISOString().slice(0, 10);
      const plan = buildPlan({ country: country.id, field: field.id, grade: 11, graduation, startDate: start });
      const where = `plan ${country.id}/${field.id}/${days}d`;
      plans++;
      longest = Math.max(longest, plan.days.length);

      const keys = plan.days.flatMap((d) => d.steps.map((x) => x.key));
      if (new Set(keys).size !== keys.length) problems.push(`${where}: a step appears twice`);
      if (plan.days.some((d) => d.steps.length === 0)) problems.push(`${where}: an empty day`);
      if (plan.days.length !== Math.max(21, Math.min(1000, days))) problems.push(`${where}: ${plan.days.length} days`);

      const tutorialKeys = plan.tutorials.map((step) => step.key);
      if (tutorialKeys.length !== 8 || new Set([...keys, ...tutorialKeys]).size !== keys.length + tutorialKeys.length) problems.push(`${where}: tutorial missing, duplicated, or mixed into daily plan`);
      // Each lesson belongs to its daily schedule or independent tutorial module.
      for (const id of ["ielts", "sat-rw", "sat-math", "vocab"] as const) {
        for (const e of flatten(COURSES[id])) if (!(e.lesson.tutorial ? tutorialKeys : keys).includes(e.key)) problems.push(`${where}: missing ${e.key}`);
      }
      const fieldTexts = keys.filter((k) => k.startsWith("reading/"));
      if (fieldTexts.length < 10) problems.push(`${where}: only ${fieldTexts.length} field texts`);
      if (field.id !== "undecided" && fieldTexts.some((k) => !k.startsWith(`reading/${field.id}-`))) problems.push(`${where}: text from another field`);
      for (const must of ["admissions/map", "admissions/college-list", "admissions/final-check"]) {
        if (!keys.includes(must)) problems.push(`${where}: missing ${must}`);
      }
      if (country.id === "uk" && !keys.includes("admissions/ucas-statement")) problems.push(`${where}: UK plan without UCAS`);
      if (country.id === "usa" && keys.includes("admissions/ucas-statement")) problems.push(`${where}: US plan with UCAS`);

      // Every review and mock section can be built.
      for (const k of keys.filter((x) => x.startsWith("review/"))) {
        const r = reviewLesson(plan, k);
        if (!r || r.lesson.questions.length < 3) problems.push(`${where}: review ${k} has too few questions`);
      }
      // Practice from the bank builds (a sample per plan: building is a scan of the plan).
      checkBank(plan, where, keys.filter((x) => x.startsWith("bank/")).filter((_, i) => i < 25 || i % 50 === 0));
    }
  }
}
// Plans built from scores: one exam only, an exam date, a weak and a strong student.
const scored: { name: string; entries: ExamEntry[] }[] = [
  { name: "SAT only", entries: [{ exam: "sat", current: { total: 1150, sections: { rw: 620, math: 530 } }, takenDate: null, source: "bluebook", target: 1400, examDate: "2027-03-13" }] },
  { name: "IELTS only", entries: [{ exam: "ielts", current: { total: 6, sections: { listening: null, reading: null, writing: 5.5, speaking: null } }, takenDate: null, source: null, target: 7, examDate: "2027-01-20" }] },
  { name: "TOEFL + ACT", entries: [
    { exam: "toefl", current: { total: 80, sections: { reading: null, listening: null, speaking: null, writing: null } }, takenDate: null, source: null, target: 100, examDate: null },
    { exam: "act", current: { total: 22, sections: { english: null, math: null, reading: null, science: null } }, takenDate: null, source: null, target: 30, examDate: "2027-04-10" },
  ] },
];
for (const { name, entries } of scored) {
  for (const days of [45, 300, 900]) {
    const graduation = new Date(Date.parse(start) + days * 86_400_000).toISOString().slice(0, 10);
    const plan = buildPlan({ country: "usa", field: "cs", grade: 11, graduation, startDate: start }, { entries, diagnostic: {} });
    const where = `plan ${name}/${days}d`;
    plans++;
    const keys = plan.days.flatMap((d) => d.steps.map((x) => x.key));
    if (new Set(keys).size !== keys.length) problems.push(`${where}: a step appears twice`);
    if (plan.days.some((d) => d.steps.length === 0)) problems.push(`${where}: an empty day`);
    const sections = new Set(plan.sections.map((x) => x.section));
    for (const k of keys.filter((x) => x.startsWith("bank/"))) {
      const sec = k.startsWith("bank/mock~") || k.startsWith("bank/weak~") ? k.split("~")[1] : k.slice("bank/".length).split(".")[0];
      if (!sections.has(sec as never)) problems.push(`${where}: ${k} outside the chosen exams`);
    }
    checkBank(plan, where, keys.filter((x) => x.startsWith("bank/")).filter((_, i) => i < 40 || i % 25 === 0));
  }
}

console.log(`Plans: ${plans} checked (up to ${longest} days).`);

console.log(`${Object.keys(COURSES).length} courses, ${questions} questions, ${quotes} quoted fragments checked.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Content OK.");
