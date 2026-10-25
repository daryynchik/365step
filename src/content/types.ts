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

export type CourseId = "ielts" | "sat-rw" | "sat-math" | "admissions" | "reading" | "vocab" | "seminar";

/** Lessons assembled per student rather than authored: reviews, the diagnostic, practice from the task bank. */
export type VirtualCourseId = "review" | "diagnostic" | "bank" | "source";
export type AnyCourseId = CourseId | VirtualCourseId;

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
  /** A first step the student may open before answering (the answer then counts as helped). */
  hint?: string;
  /** Attribution travels with the question through practice, review and races. */
  source?: {
    title: string;
    url: string;
    license: string;
    licenseUrl: string;
    attribution: string;
    note: string;
  };
}

export interface ChoiceQuestion extends QuestionBase {
  kind: "choice";
  options: string[];
  answer: number;
}

/**
 * A typed answer: SAT grid-ins, IELTS gap fills. Numerically equal forms
 * (0.5, 1/2, .5) match automatically; text is compared case-insensitively.
 */
export interface InputQuestion extends QuestionBase {
  kind: "input";
  answers: string[];
  /** All listed roots are required; their order does not matter. */
  answerFormat?: "number-set";
}

export type Question = ChoiceQuestion | InputQuestion;

export interface TheoryBlock {
  heading?: string;
  body: string;
}

/**
 * How the instant feedback reads a draft:
 *   seminar    — quotations, chapter citations, commentary (AP Seminar)
 *   ielts1     — IELTS Writing Task 1: overview, data, paragraphs
 *   ielts2     — IELTS Writing Task 2: position, paragraphs, linking, conclusion
 *   statement  — admissions essays: specifics, reflection, clichés, word limit
 *   activities — Common App activity descriptions, one per line, ≤150 characters
 *   ucas       — UCAS personal statement: three answers, ≤4,000 characters
 *   plan       — a structured list (a college list): lines and categories
 */
export type WritingProfile = "seminar" | "ielts1" | "ielts2" | "statement" | "activities" | "ucas" | "plan";

export interface WritingTask {
  prompt: string;
  minWords: number;
  maxWords: number;
  /** What a strong response does. Shown as a checklist next to the editor. */
  rubric: string[];
  /** Optional sentence starters for students who get stuck. */
  starters?: string[];
  /** Data or a visual the task refers to (IELTS Task 1). */
  table?: DataTable;
  /** What the automatic feedback looks for in the draft. */
  checks: {
    profile?: WritingProfile;
    /** Minimum number of quotations from the book (seminar). */
    quotes?: number;
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

/**
 * A listening recording, stored as its script. The player reads it aloud with
 * the browser's speech synthesis, or shows it as a transcript when the student
 * cannot listen — the questions are the same either way.
 */
export interface Listening {
  title: string;
  /** One line the exam would say before the recording ("You will hear…"). */
  context: string;
  lines: { speaker: string; text: string }[];
}

/**
 * An IELTS-style speaking test part. The examiner's questions are fixed, so it
 * works without any AI; with an API key the examiner can react to answers.
 */
export interface Speaking {
  part: 1 | 2 | 3;
  /** What the examiner says first. */
  intro: string;
  /** The examiner's questions, in order. For Part 2 the first is the cue card. */
  questions: string[];
  cueCard?: { topic: string; points: string[] };
  /** Expected words per answer when typed; spoken answers run longer. */
  targetWords: [number, number];
}

export interface LessonResource {
  title: string;
  url: string;
  publisher: string;
  kind: "guide" | "video" | "interactive" | "practice";
}

export interface Lesson {
  id: string;
  title: string;
  /** One line under the title on the path. */
  summary: string;
  minutes: number;
  /** IELTS skill or admissions stage, shown as a chip on the path. */
  skill?: string;
  /** Guided tool lessons appear in a separate module on the student's path. */
  tutorial?: { objectives: string[]; resources: LessonResource[] };
  theory: TheoryBlock[];
  questions: Question[];
  reading?: Reading;
  listening?: Listening;
  speaking?: Speaking;
  writing?: WritingTask;
  /** Matching official practice (College Board, IELTS partners, UCAS…). */
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
