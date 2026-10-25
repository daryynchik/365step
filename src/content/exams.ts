/**
 * Exams a student can report scores for, and the validation of those scores.
 * Kept free of course content so the score form in the browser can use it.
 *
 * Scores are optional: a student may pick an exam with no result yet and only
 * a target and a date. Students with no scores at all take a short diagnostic.
 */

export type ExamId = "sat" | "ielts" | "toefl" | "duolingo" | "act";

/** Sections the plan works with. Other exams map onto these (see skill-level.ts). */
export type SectionId = "sat-rw" | "sat-math" | "ielts-reading" | "ielts-listening" | "ielts-writing" | "ielts-speaking";

export const SECTION_TITLES: Record<SectionId, string> = {
  "sat-rw": "SAT Reading & Writing",
  "sat-math": "SAT Math",
  "ielts-reading": "IELTS Reading",
  "ielts-listening": "IELTS Listening",
  "ielts-writing": "IELTS Writing",
  "ielts-speaking": "IELTS Speaking",
};

export interface ScoreScale {
  min: number;
  max: number;
  step: number;
}

export interface ExamSection extends ScoreScale {
  id: string;
  title: string;
}

export interface Exam {
  id: ExamId;
  title: string;
  short: string;
  totalLabel: string;
  total: ScoreScale;
  sections: ExamSection[];
  /** SAT asks for the date and kind of the practice test the score came from. */
  practiceSource: boolean;
  /** SAT: targets per section may be given next to the total. */
  sectionTargets?: boolean;
}

const BAND: ScoreScale = { min: 0, max: 9, step: 0.5 };

export const EXAMS: Exam[] = [
  {
    id: "sat",
    title: "SAT",
    short: "SAT",
    totalLabel: "Total",
    total: { min: 400, max: 1600, step: 10 },
    sections: [
      { id: "rw", title: "Reading & Writing", min: 200, max: 800, step: 10 },
      { id: "math", title: "Math", min: 200, max: 800, step: 10 },
    ],
    practiceSource: true,
    sectionTargets: true,
  },
  {
    id: "ielts",
    title: "IELTS Academic",
    short: "IELTS",
    totalLabel: "Overall",
    total: BAND,
    sections: [
      { id: "listening", title: "Listening", ...BAND },
      { id: "reading", title: "Reading", ...BAND },
      { id: "writing", title: "Writing", ...BAND },
      { id: "speaking", title: "Speaking", ...BAND },
    ],
    practiceSource: false,
  },
  {
    id: "toefl",
    title: "TOEFL iBT",
    short: "TOEFL",
    totalLabel: "Total",
    total: { min: 0, max: 120, step: 1 },
    sections: [
      { id: "reading", title: "Reading", min: 0, max: 30, step: 1 },
      { id: "listening", title: "Listening", min: 0, max: 30, step: 1 },
      { id: "speaking", title: "Speaking", min: 0, max: 30, step: 1 },
      { id: "writing", title: "Writing", min: 0, max: 30, step: 1 },
    ],
    practiceSource: false,
  },
  {
    id: "duolingo",
    title: "Duolingo English Test",
    short: "DET",
    totalLabel: "Overall",
    total: { min: 10, max: 160, step: 5 },
    sections: [],
    practiceSource: false,
  },
  {
    id: "act",
    title: "ACT",
    short: "ACT",
    totalLabel: "Composite",
    total: { min: 1, max: 36, step: 1 },
    sections: [
      { id: "english", title: "English", min: 1, max: 36, step: 1 },
      { id: "math", title: "Math", min: 1, max: 36, step: 1 },
      { id: "reading", title: "Reading", min: 1, max: 36, step: 1 },
      { id: "science", title: "Science", min: 1, max: 36, step: 1 },
    ],
    practiceSource: false,
  },
];

export function examById(id: string): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

export type PracticeSource = "bluebook" | "other";
/** Where a result comes from: the real exam or a practice test. */
export type ResultKind = "official" | "practice";

export const RESULT_KIND_TITLES: Record<ResultKind, string> = { official: "Официальный экзамен", practice: "Пробный тест" };
export const PRACTICE_SOURCE_TITLES: Record<PracticeSource, string> = { bluebook: "Bluebook (College Board)", other: "Другой пробник" };

/** One exam in the student's profile. Every score is optional. */
export interface ExamEntry {
  exam: ExamId;
  /** Latest result; null when the student has not taken it yet. */
  current: { total: number | null; sections: Record<string, number | null> } | null;
  /** When the current result was obtained (the practice test date for SAT). */
  takenDate: string | null;
  /**
   * Official exam or practice test. Missing in results saved before it was
   * asked (then `source` alone told "Bluebook / official" from "other").
   */
  kind?: ResultKind | null;
  /** SAT practice tests: Bluebook or another one. */
  source: PracticeSource | null;
  /** The name of another practice test ("Princeton Review #3"). */
  sourceName?: string | null;
  target: number | null;
  /** SAT: targets per section (rw, math), optional. */
  targetSections?: Record<string, number | null> | null;
  /** Planned exam date, ISO. */
  examDate: string | null;
}

export interface ScoresInput {
  entries: ExamEntry[];
}

// ------------------------------------------------------------ validation --

function onScale(value: number, scale: ScoreScale): boolean {
  if (!Number.isFinite(value) || value < scale.min || value > scale.max) return false;
  const steps = (value - scale.min) / scale.step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

function scaleHint(scale: ScoreScale): string {
  return `от ${scale.min} до ${scale.max}${scale.step !== 1 ? `, шаг ${scale.step}` : ""}`;
}

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function addDaysIso(iso: string, days: number): string {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

export type ScoresValidation = { ok: true; value: ScoresInput } | { ok: false; error: string };

/**
 * Checks ranges, steps and sums, and normalises the entries (sections that
 * an exam does not have are dropped, empty current results become null).
 */
export function validateScores(input: ScoresInput, today: string): ScoresValidation {
  if (!input || !Array.isArray(input.entries)) return { ok: false, error: "Нет данных о баллах." };
  const seen = new Set<string>();
  const entries: ExamEntry[] = [];

  for (const raw of input.entries) {
    const exam = examById(String(raw?.exam));
    if (!exam) return { ok: false, error: "Неизвестный экзамен." };
    if (seen.has(exam.id)) return { ok: false, error: `${exam.title} указан дважды.` };
    seen.add(exam.id);

    let current: ExamEntry["current"] = null;
    if (raw.current) {
      const total = raw.current.total ?? null;
      if (total !== null && !onScale(total, exam.total)) {
        return { ok: false, error: `${exam.title}: ${exam.totalLabel} — ${scaleHint(exam.total)}.` };
      }
      const sections: Record<string, number | null> = {};
      for (const s of exam.sections) {
        const v = raw.current.sections?.[s.id] ?? null;
        if (v !== null && !onScale(v, s)) return { ok: false, error: `${exam.title}: ${s.title} — ${scaleHint(s)}.` };
        sections[s.id] = v;
      }
      const values = exam.sections.map((s) => sections[s.id]);
      const allSections = values.length > 0 && values.every((v) => v !== null);
      if (exam.id === "sat" && total !== null && allSections && sections.rw! + sections.math! !== total) {
        return { ok: false, error: `SAT: Reading & Writing + Math должно равняться Total (${sections.rw} + ${sections.math} ≠ ${total}).` };
      }
      if (exam.id === "toefl" && total !== null && allSections && values.reduce((a, b) => a! + b!, 0) !== total) {
        return { ok: false, error: "TOEFL: сумма четырёх секций должна равняться Total." };
      }
      if (total !== null || values.some((v) => v !== null)) current = { total, sections };
    }

    // SAT: a section left out but implied by the total and the other section.
    if (exam.id === "sat" && current && current.total !== null) {
      const { rw, math } = current.sections;
      if ((rw === null) !== (math === null)) {
        const derived = current.total - (rw ?? math)!;
        if (derived < 200 || derived > 800) return { ok: false, error: `SAT: при Total ${current.total} секция не может быть ${rw ?? math} — проверь баллы.` };
      }
    }

    let target = raw.target ?? null;
    let targetSections: Record<string, number | null> | null = null;
    if (exam.sectionTargets && raw.targetSections) {
      const t: Record<string, number | null> = {};
      for (const s of exam.sections) {
        const v = raw.targetSections[s.id] ?? null;
        if (v !== null && !onScale(v, s)) return { ok: false, error: `${exam.title}: цель по ${s.title} — ${scaleHint(s)}.` };
        t[s.id] = v;
      }
      const values = exam.sections.map((s) => t[s.id]);
      if (values.some((v) => v !== null)) {
        targetSections = t;
        if (values.every((v) => v !== null)) {
          const sum = values.reduce((a, b) => a! + b!, 0)!;
          if (target === null) target = sum;
          else if (sum !== target) return { ok: false, error: `${exam.title}: цели по секциям (${values.join(" + ")}) должны давать общий целевой балл ${target}.` };
        }
      }
    }
    if (target !== null && !onScale(target, exam.total)) {
      return { ok: false, error: `${exam.title}: целевой балл — ${scaleHint(exam.total)}.` };
    }

    const examDate = raw.examDate || null;
    if (examDate !== null) {
      if (!ISO_DATE.test(examDate)) return { ok: false, error: `${exam.title}: неверная дата экзамена.` };
      if (examDate < today) return { ok: false, error: `${exam.title}: дата экзамена уже прошла.` };
      if (examDate > addDaysIso(today, 365 * 6)) return { ok: false, error: `${exam.title}: дата экзамена слишком далеко.` };
    }

    const takenDate = current ? raw.takenDate || null : null;
    if (takenDate !== null) {
      if (!ISO_DATE.test(takenDate)) return { ok: false, error: `${exam.title}: неверная дата результата.` };
      if (takenDate > today) return { ok: false, error: `${exam.title}: дата результата не может быть в будущем.` };
    }

    const kind: ResultKind | null = current && (raw.kind === "official" || raw.kind === "practice") ? raw.kind : null;
    const source =
      exam.practiceSource && current && kind !== "official" && (raw.source === "bluebook" || raw.source === "other") ? raw.source : null;
    // A practice test's name: "other" on SAT; any practice test elsewhere.
    const named = kind === "practice" && (source === "other" || !exam.practiceSource);
    const sourceName = named && typeof raw.sourceName === "string" && raw.sourceName.trim() ? raw.sourceName.trim().slice(0, 80) : null;

    entries.push({ exam: exam.id, current, takenDate, kind, source, sourceName, target, targetSections, examDate });
  }

  return { ok: true, value: { entries } };
}

/** Sections of the plan an exam covers. TOEFL and DET count as English, ACT as SAT. */
export function sectionsOfExam(exam: ExamId): SectionId[] {
  switch (exam) {
    case "sat":
    case "act":
      return ["sat-rw", "sat-math"];
    case "ielts":
    case "toefl":
    case "duolingo":
      return ["ielts-reading", "ielts-listening", "ielts-writing", "ielts-speaking"];
  }
}

/** Sections the diagnostic can measure with auto-graded questions. */
export const DIAGNOSTIC_SECTIONS = ["sat-rw", "sat-math", "ielts-reading"] as const;
export type DiagnosticSection = (typeof DIAGNOSTIC_SECTIONS)[number];

/**
 * SAT sections the result tells exactly: a section score, or the total minus
 * the other section. Only a total (or an ACT composite) leaves both open.
 */
export function satSectionsKnown(e: ExamEntry): { rw: boolean; math: boolean } {
  const c = e.current;
  if (!c) return { rw: false, math: false };
  if (e.exam === "sat") {
    const { rw = null, math = null } = c.sections;
    const viaTotal = c.total !== null;
    return { rw: rw !== null || (viaTotal && math !== null), math: math !== null || (viaTotal && rw !== null) };
  }
  if (e.exam === "act") {
    const { english = null, reading = null, math = null } = c.sections;
    return { rw: english !== null && reading !== null, math: math !== null };
  }
  return { rw: false, math: false };
}

/**
 * Which diagnostic sections a student needs: those of chosen exams with no
 * result yet, and SAT sections a total alone only estimates.
 */
export function diagnosticNeeded(entries: ExamEntry[]): DiagnosticSection[] {
  if (entries.length === 0) return [...DIAGNOSTIC_SECTIONS];
  const out = new Set<DiagnosticSection>();
  const satKnown = { rw: false, math: false };
  for (const e of entries) {
    if (e.exam === "sat" || e.exam === "act") {
      const k = satSectionsKnown(e);
      satKnown.rw ||= k.rw;
      satKnown.math ||= k.math;
      continue;
    }
    if (e.current) continue;
    for (const s of sectionsOfExam(e.exam)) if ((DIAGNOSTIC_SECTIONS as readonly string[]).includes(s)) out.add(s as DiagnosticSection);
  }
  if (entries.some((e) => e.exam === "sat" || e.exam === "act")) {
    if (!satKnown.rw) out.add("sat-rw");
    if (!satKnown.math) out.add("sat-math");
  }
  return DIAGNOSTIC_SECTIONS.filter((s) => out.has(s));
}

export type Level = "easy" | "medium" | "hard";
export const LEVELS: Level[] = ["easy", "medium", "hard"];
export const LEVEL_TITLES: Record<Level, string> = { easy: "базовый", medium: "средний", hard: "продвинутый" };
