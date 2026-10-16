/**
 * Course content is authored as typed modules rather than database rows: it is
 * versioned with the code, type-checked, and needs no seeding. The database only
 * stores what users do with it (results, points, writing).
 *
 * Text conventions used by the renderer (see components/rich-text.tsx):
 *   - blank line          -> new paragraph
 *   - line starting "• "  -> bullet
 *   - **bold**, __underline__ (underline marks the sentence a question asks about)
 */

export type CourseId = "sat-rw" | "sat-math" | "seminar";

export interface Passage {
  /** "Text 1", "Text 2" for cross-text questions; omitted otherwise. */
  label?: string;
  text: string;
}

export interface DataTable {
  caption?: string;
  head: string[];
  rows: string[][];
}

interface QuestionBase {
  passages?: Passage[];
  table?: DataTable;
  prompt: string;
  /** Shown after answering, right or wrong. Explains why, not just what. */
  explanation: string;
}

export interface ChoiceQuestion extends QuestionBase {
  kind: "choice";
  options: string[];
  answer: number;
}

/** A student-produced response, like the SAT's grid-in questions. */
export interface InputQuestion extends QuestionBase {
  kind: "input";
  /** Accepted answers. Numerically equal forms (0.5, 1/2, .5) match automatically. */
  answers: string[];
}

export type Question = ChoiceQuestion | InputQuestion;

export interface TheoryBlock {
  heading?: string;
  body: string;
}

export interface WritingTask {
  prompt: string;
  minWords: number;
  maxWords: number;
  /** What a strong response does. Shown as a checklist next to the editor. */
  rubric: string[];
  /** Optional sentence starters for students who get stuck. */
  starters?: string[];
  /** What the automatic feedback looks for in the draft. */
  checks: {
    /** Minimum number of quotations from the book. */
    quotes: number;
    /** Requires a counterargument ("Some readers argue… However…"). */
    counterargument?: boolean;
    /** Requires a cited outside source (author and year, or a link). */
    outsideSource?: boolean;
  };
}

export interface Reading {
  /** Book section ids, e.g. ["chapter-4", "chapter-5"]. */
  sections: string[];
  /** What to notice while reading, as short bullets. */
  guide: string[];
}

export interface Lesson {
  id: string;
  title: string;
  /** One line under the title on the path. */
  summary: string;
  minutes: number;
  theory: TheoryBlock[];
  questions: Question[];
  reading?: Reading;
  writing?: WritingTask;
  /** The matching official College Board practice, for SAT skills. */
  official?: { label: string; url: string };
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}

export interface Course {
  id: CourseId;
  title: string;
  short: string;
  description: string;
  units: Unit[];
}
