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
import { buildPlan, COUNTRIES, reviewLesson } from "../src/content/plan";
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

      // Every core lesson is scheduled.
      for (const id of ["ielts", "sat-rw", "sat-math", "vocab"] as const) {
        for (const e of flatten(COURSES[id])) if (!keys.includes(e.key)) problems.push(`${where}: missing ${e.key}`);
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
    }
  }
}
console.log(`Plans: ${plans} checked (up to ${longest} days).`);

console.log(`${Object.keys(COURSES).length} courses, ${questions} questions, ${quotes} quoted fragments checked.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Content OK.");
