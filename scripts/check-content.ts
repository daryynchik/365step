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
import { TRACK, TRACK_COURSES } from "../src/content/track";
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

// The track must contain every lesson of its courses exactly once.
const inTrack = TRACK.flatMap((d) => d.steps.map((s) => s.key));
if (new Set(inTrack).size !== inTrack.length) problems.push("track: a lesson appears twice");
for (const id of TRACK_COURSES) {
  for (const e of flatten(COURSES[id])) if (!inTrack.includes(e.key)) problems.push(`track: missing ${e.key}`);
}
TRACK.forEach((d, i) => {
  if (d.steps.length === 0) problems.push(`track: day ${d.day} is empty`);
  const next = TRACK[i + 1];
  if (d.english && next?.english && d.english === next.english && i < TRACK.length - 3) problems.push(`track: days ${d.day} and ${next.day} both ${d.english}`);
});
console.log(`Track: ${TRACK.length} days, ${inTrack.length} lessons.`);

console.log(`${Object.keys(COURSES).length} courses, ${questions} questions, ${quotes} quoted fragments checked.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Content OK.");
