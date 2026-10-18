/**
 * Skills of the task bank, following the structure (not the questions) of the
 * official specifications:
 *   - SAT: College Board, "The SAT Suite of Assessments: Test Specifications"
 *     (digital SAT) — Reading and Writing: 4 content domains, 11 skills
 *     (Command of Evidence split into textual and quantitative, as the spec
 *     lists them); Math: 4 domains, 19 skills.
 *   - IELTS Academic: question and task types published by the IELTS partners
 *     (ielts.org, "Test format") and the public band descriptors.
 *
 * Domain weights are the approximate share of questions per domain in the
 * College Board spec; they set how often a domain's skills come up in practice.
 */

import type { SectionId } from "../exams";

export interface Skill {
  /** "<section>.<skill>", unique across the bank. */
  id: string;
  section: SectionId;
  domain: string;
  title: string;
  /** The authored lesson that teaches this skill, if any ("course/lesson"). */
  lesson?: string;
  /** Question kinds the bank holds for this skill. */
  kind: "questions" | "writing" | "speaking" | "listening";
}

export interface Domain {
  id: string;
  section: SectionId;
  title: string;
  /** Approximate share of the section (sums to 1 per section). */
  weight: number;
}

export const DOMAINS: Domain[] = [
  { id: "information-and-ideas", section: "sat-rw", title: "Information and Ideas", weight: 0.26 },
  { id: "craft-and-structure", section: "sat-rw", title: "Craft and Structure", weight: 0.28 },
  { id: "expression-of-ideas", section: "sat-rw", title: "Expression of Ideas", weight: 0.2 },
  { id: "standard-english-conventions", section: "sat-rw", title: "Standard English Conventions", weight: 0.26 },

  { id: "algebra", section: "sat-math", title: "Algebra", weight: 0.35 },
  { id: "advanced-math", section: "sat-math", title: "Advanced Math", weight: 0.35 },
  { id: "problem-solving-data", section: "sat-math", title: "Problem-Solving and Data Analysis", weight: 0.15 },
  { id: "geometry-trigonometry", section: "sat-math", title: "Geometry and Trigonometry", weight: 0.15 },

  { id: "true-false", section: "ielts-reading", title: "Identifying information and views", weight: 0.3 },
  { id: "matching", section: "ielts-reading", title: "Matching", weight: 0.3 },
  { id: "completion", section: "ielts-reading", title: "Completion and short answers", weight: 0.2 },
  { id: "multiple-choice", section: "ielts-reading", title: "Multiple choice", weight: 0.2 },

  { id: "task1", section: "ielts-writing", title: "Task 1", weight: 0.4 },
  { id: "task2", section: "ielts-writing", title: "Task 2", weight: 0.6 },

  { id: "speaking", section: "ielts-speaking", title: "Speaking test", weight: 1 },

  { id: "listening", section: "ielts-listening", title: "Listening question types", weight: 1 },
];

const rw = (id: string, domain: string, title: string): Skill => ({ id: `sat-rw.${id}`, section: "sat-rw", domain, title, lesson: `sat-rw/${id}`, kind: "questions" });
const math = (id: string, domain: string, title: string): Skill => ({ id: `sat-math.${id}`, section: "sat-math", domain, title, lesson: `sat-math/${id}`, kind: "questions" });
const reading = (id: string, domain: string, title: string, lesson?: string): Skill => ({
  id: `ielts-reading.${id}`,
  section: "ielts-reading",
  domain,
  title,
  lesson,
  kind: "questions",
});

export const SKILLS: Skill[] = [
  // SAT Reading and Writing
  rw("central-ideas", "information-and-ideas", "Central Ideas and Details"),
  rw("textual-evidence", "information-and-ideas", "Command of Evidence: Textual"),
  rw("quantitative-evidence", "information-and-ideas", "Command of Evidence: Quantitative"),
  rw("inferences", "information-and-ideas", "Inferences"),
  rw("words-in-context", "craft-and-structure", "Words in Context"),
  rw("text-structure", "craft-and-structure", "Text Structure and Purpose"),
  rw("cross-text", "craft-and-structure", "Cross-Text Connections"),
  rw("rhetorical-synthesis", "expression-of-ideas", "Rhetorical Synthesis"),
  rw("transitions", "expression-of-ideas", "Transitions"),
  rw("boundaries", "standard-english-conventions", "Boundaries"),
  rw("form-structure-sense", "standard-english-conventions", "Form, Structure, and Sense"),

  // SAT Math
  math("linear-equations-one", "algebra", "Linear equations in one variable"),
  math("linear-functions", "algebra", "Linear functions"),
  math("linear-equations-two", "algebra", "Linear equations in two variables"),
  math("systems", "algebra", "Systems of two linear equations in two variables"),
  math("inequalities", "algebra", "Linear inequalities in one or two variables"),
  math("nonlinear-functions", "advanced-math", "Nonlinear functions"),
  math("nonlinear-equations", "advanced-math", "Nonlinear equations in one variable and systems of equations in two variables"),
  math("equivalent-expressions", "advanced-math", "Equivalent expressions"),
  math("ratios-rates", "problem-solving-data", "Ratios, rates, proportional relationships, and units"),
  math("percentages", "problem-solving-data", "Percentages"),
  math("one-variable-data", "problem-solving-data", "One-variable data: distributions and measures of center and spread"),
  math("two-variable-data", "problem-solving-data", "Two-variable data: models and scatterplots"),
  math("probability", "problem-solving-data", "Probability and conditional probability"),
  math("sample-statistics", "problem-solving-data", "Inference from sample statistics and margin of error"),
  math("statistical-claims", "problem-solving-data", "Evaluating statistical claims: observational studies and experiments"),
  math("area-volume", "geometry-trigonometry", "Area and volume"),
  math("lines-angles-triangles", "geometry-trigonometry", "Lines, angles, and triangles"),
  math("right-triangles", "geometry-trigonometry", "Right triangles and trigonometry"),
  math("circles", "geometry-trigonometry", "Circles"),

  // IELTS Reading: question types
  reading("tfng", "true-false", "True / False / Not Given", "ielts/reading-tfng"),
  reading("ynng", "true-false", "Yes / No / Not Given", "ielts/reading-views"),
  reading("matching-headings", "matching", "Matching headings", "ielts/reading-headings"),
  reading("matching-information", "matching", "Matching information"),
  reading("completion", "completion", "Sentence and summary completion", "ielts/reading-completion"),
  reading("short-answer", "completion", "Short-answer questions"),
  reading("mcq", "multiple-choice", "Multiple choice"),

  // IELTS Writing
  { id: "ielts-writing.task1", section: "ielts-writing", domain: "task1", title: "Task 1: charts, tables, processes, maps", lesson: "ielts/writing-task1", kind: "writing" },
  { id: "ielts-writing.task2", section: "ielts-writing", domain: "task2", title: "Task 2: opinion, discussion, problem–solution, two-part", lesson: "ielts/writing-task2", kind: "writing" },

  // IELTS Speaking
  { id: "ielts-speaking.part1", section: "ielts-speaking", domain: "speaking", title: "Part 1: introduction and interview", lesson: "ielts/speaking-part1", kind: "speaking" },
  { id: "ielts-speaking.part2", section: "ielts-speaking", domain: "speaking", title: "Part 2: long turn", lesson: "ielts/speaking-part2", kind: "speaking" },
  { id: "ielts-speaking.part3", section: "ielts-speaking", domain: "speaking", title: "Part 3: discussion", lesson: "ielts/speaking-part3", kind: "speaking" },

  // IELTS Listening: types with a text transcript. TODO: recorded audio.
  { id: "ielts-listening.form-completion", section: "ielts-listening", domain: "listening", title: "Form and note completion", lesson: "ielts/listening-form", kind: "listening" },
  { id: "ielts-listening.mcq", section: "ielts-listening", domain: "listening", title: "Multiple choice and matching", lesson: "ielts/listening-lecture", kind: "listening" },
];

export function skillById(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id);
}

export function skillsOf(section: SectionId): Skill[] {
  return SKILLS.filter((s) => s.section === section);
}

export function skillOfLesson(key: string): Skill | undefined {
  return SKILLS.find((s) => s.lesson === key);
}

export function domainOf(skill: Skill): Domain {
  return DOMAINS.find((d) => d.id === skill.domain && d.section === skill.section)!;
}

/**
 * The order in which a section's skills come up in practice: weighted round
 * robin by domain share, then through the domain's skills in turn. Infinite
 * and deterministic — the n-th practice lesson of a section is always the same skill.
 */
export function skillSequence(section: SectionId, n: number): Skill[] {
  const skills = skillsOf(section);
  if (skills.length === 0) return [];
  const domains = DOMAINS.filter((d) => d.section === section && skills.some((s) => s.domain === d.id));
  const credit = new Map(domains.map((d) => [d.id, 0]));
  const cursor = new Map(domains.map((d) => [d.id, 0]));
  const out: Skill[] = [];
  for (let i = 0; i < n; i++) {
    // Smooth weighted round robin: each domain gains its weight, the richest is chosen.
    for (const d of domains) credit.set(d.id, credit.get(d.id)! + d.weight);
    const pick = domains.reduce((best, d) => (credit.get(d.id)! > credit.get(best.id)! ? d : best));
    credit.set(pick.id, credit.get(pick.id)! - domains.reduce((a, d) => a + d.weight, 0));
    const inDomain = skills.filter((s) => s.domain === pick.id);
    const c = cursor.get(pick.id)!;
    out.push(inDomain[c % inDomain.length]);
    cursor.set(pick.id, c + 1);
  }
  return out;
}
