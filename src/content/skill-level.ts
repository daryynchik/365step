/**
 * The level model: pure functions from scores to levels, gaps, the share of
 * new lessons per section, the difficulty mix of tasks and the adaptation of a
 * skill's level as the student answers. No database, no randomness — the same
 * input always gives the same plan.
 *
 * Levels (easy / medium / hard) are per section of the plan (sat-rw, sat-math,
 * ielts-reading, ielts-listening, ielts-writing, ielts-speaking); a skill
 * starts at its section's level and then moves on its own.
 */

import {
  sectionsOfExam,
  type DiagnosticSection,
  type ExamEntry,
  type ExamId,
  type Level,
  type SectionId,
} from "./exams";

export type { Level, SectionId } from "./exams";

export const ALL_SECTIONS: SectionId[] = ["sat-rw", "sat-math", "ielts-reading", "ielts-listening", "ielts-writing", "ielts-speaking"];
const SAT_SECTIONS: SectionId[] = ["sat-rw", "sat-math"];
const IELTS_SECTIONS: SectionId[] = ["ielts-reading", "ielts-listening", "ielts-writing", "ielts-speaking"];

export function isSatSection(s: SectionId): boolean {
  return SAT_SECTIONS.includes(s);
}

// ------------------------------------------------------------- levels --

/** SAT section score (200–800): below 500 easy, 500–640 medium, 650 and up hard. */
export function levelFromSatSection(score: number): Level {
  if (score < 500) return "easy";
  if (score < 650) return "medium";
  return "hard";
}

/** IELTS band (0–9): below 5.5 easy, 5.5–6.5 medium, 7 and up hard. */
export function levelFromIeltsBand(band: number): Level {
  if (band < 5.5) return "easy";
  if (band < 7) return "medium";
  return "hard";
}

export function levelOf(section: SectionId, score: number): Level {
  return isSatSection(section) ? levelFromSatSection(score) : levelFromIeltsBand(score);
}

/**
 * A typical score for a level, used when all we know is the level (from the
 * diagnostic) or nothing at all (medium).
 */
export function scoreForLevel(section: SectionId, level: Level): number {
  if (isSatSection(section)) return { easy: 450, medium: 570, hard: 690 }[level];
  return { easy: 5, medium: 6, hard: 7 }[level];
}

/**
 * How far one level reaches on each scale: the width of the medium band
 * (SAT 500–650 = 150 points, IELTS 5.5–7 = 1.5 bands). Gaps are divided by
 * it so that SAT and IELTS gaps can be compared.
 */
export const LEVEL_WIDTH = { sat: 150, ielts: 1.5 };

/** Targets assumed when the student chose an exam but gave no target. */
export const DEFAULT_TARGET = { satSection: 700, ieltsBand: 7 };

// -------------------------------------------------------- concordance --

/** Highest row whose threshold the score reaches. Rows sorted by threshold, descending. */
function lookup(rows: [number, number][], score: number): number {
  for (const [from, value] of rows) if (score >= from) return value;
  return rows[rows.length - 1][1];
}

/**
 * TOEFL iBT → IELTS Academic, total and by section.
 * Source: ETS, "Aligning Scores of Language Proficiency Tests: A Score
 * Concordance Study Between IELTS Academic and TOEFL iBT", Research Report
 * RR-25-02, as published at https://www.eu.ets.org/toefl/score-users/ibt/compare-scores.html
 * (replaces the earlier ETS "Linking TOEFL iBT Scores to IELTS Scores").
 * Each row: lowest TOEFL score for that band.
 */
const TOEFL_TOTAL: [number, number][] = [
  [120, 9], [115, 8.5], [108, 8], [100, 7.5], [91, 7], [81, 6.5], [67, 6], [51, 5.5], [40, 5], [26, 4.5], [14, 4], [0, 3.5],
];
const TOEFL_SECTION: Record<"reading" | "listening" | "speaking" | "writing", [number, number][]> = {
  reading: [[30, 9], [28, 8.5], [27, 8], [25, 7.5], [22, 7], [19, 6.5], [16, 6], [12, 5.5], [8, 5], [4, 4.5], [0, 4]],
  listening: [[30, 9], [28, 8.5], [26, 8], [24, 7.5], [22, 7], [19, 6.5], [16, 6], [12, 5.5], [8, 5], [3, 4.5], [0, 4]],
  speaking: [[30, 9], [29, 8.5], [28, 8], [26, 7.5], [24, 7], [22, 6.5], [19, 6], [17, 5.5], [14, 5], [11, 4.5], [7, 4], [0, 3.5]],
  // ETS prints 30 for bands 9, 8.5 and 8; a TOEFL 30 is read as 8 here (the lowest band it reaches with certainty).
  writing: [[30, 8], [28, 7.5], [26, 7], [23, 6.5], [19, 6], [14, 5.5], [9, 5], [4, 4.5], [1, 4], [0, 3.5]],
};

export function toeflTotalToIelts(total: number): number {
  return lookup(TOEFL_TOTAL, total);
}

export function toeflSectionToIelts(section: keyof typeof TOEFL_SECTION, score: number): number {
  return lookup(TOEFL_SECTION[section], score);
}

/**
 * Duolingo English Test → IELTS Academic overall.
 * Source: Duolingo English Test score concordance with IELTS (2022), as
 * reproduced by bandladder.com/duolingo-to-ielts and studyu.org (the two agree
 * on every score both list). The official page at englishtest.duolingo.com/scores
 * could not be read directly — re-check before relying on it.
 */
const DET_TO_IELTS: [number, number][] = [
  [160, 8.5], [150, 8], [140, 7.5], [130, 7], [120, 6.5], [105, 6], [95, 5.5], [80, 5], [65, 4.5], [60, 4], [10, 3.5],
];

export function duolingoToIelts(score: number): number {
  return lookup(DET_TO_IELTS, score);
}

/**
 * ACT → SAT. Source: ACT and College Board, "2018 ACT/SAT Concordance Tables"
 * (https://www.act.org/content/dam/act/unsecured/documents/ACT-SAT-Concordance-Tables.pdf):
 * Table A2 (Composite → SAT Total, single-point), B2 (Math → SAT Math),
 * C2 (English + Reading → SAT ERW).
 */
const ACT_COMPOSITE: [number, number][] = [
  [36, 1590], [35, 1540], [34, 1500], [33, 1460], [32, 1430], [31, 1400], [30, 1370], [29, 1340], [28, 1310], [27, 1280],
  [26, 1240], [25, 1210], [24, 1180], [23, 1140], [22, 1110], [21, 1080], [20, 1040], [19, 1010], [18, 970], [17, 930],
  [16, 890], [15, 850], [14, 800], [13, 760], [12, 710], [11, 670], [10, 630], [9, 590], [1, 400],
];
const ACT_MATH: [number, number][] = [
  [36, 800], [35, 780], [34, 760], [33, 740], [32, 720], [31, 710], [30, 700], [29, 680], [28, 660], [27, 640], [26, 610],
  [25, 590], [24, 580], [23, 560], [22, 540], [21, 530], [20, 520], [19, 510], [18, 500], [17, 470], [16, 430], [15, 400],
  [14, 360], [13, 330], [12, 310], [11, 280], [10, 260], [1, 200],
];
const ACT_ENGLISH_READING: [number, number][] = [
  [72, 790], [71, 770], [70, 750], [69, 740], [68, 730], [67, 720], [66, 710], [64, 700], [63, 690], [61, 680], [60, 670],
  [58, 660], [57, 650], [55, 640], [53, 630], [51, 610], [50, 610], [49, 600], [48, 590], [46, 580], [45, 570], [44, 560],
  [43, 550], [41, 540], [39, 520], [38, 510], [36, 500], [35, 490], [34, 480], [33, 470], [32, 460], [31, 450], [30, 440],
  [29, 430], [28, 420], [27, 410], [26, 400], [25, 390], [24, 380], [23, 370], [22, 360], [21, 350], [20, 340], [19, 330],
  [18, 320], [17, 310], [16, 300], [15, 290], [14, 280], [2, 200],
];

export function actCompositeToSat(composite: number): number {
  return lookup(ACT_COMPOSITE, composite);
}
export function actMathToSat(math: number): number {
  return lookup(ACT_MATH, math);
}
export function actEnglishReadingToSatErw(sum: number): number {
  return lookup(ACT_ENGLISH_READING, sum);
}

// -------------------------------------------------------------- state --

export type LevelSource = "score" | "converted" | "diagnostic" | "default";

export interface SectionState {
  section: SectionId;
  /** On the section's own scale: SAT 200–800, IELTS bands. */
  current: number;
  target: number;
  level: Level;
  /** target − current, on the section's scale; negative when already above target. */
  gap: number;
  /** gap in level widths, comparable between SAT and IELTS; never below 0. */
  normGap: number;
  source: LevelSource;
  /** Planned exam date for this section, if the student gave one. */
  examDate: string | null;
}

const round10 = (n: number) => Math.round(n / 10) * 10;
const roundBand = (n: number) => Math.round(n * 2) / 2;

type Known = Partial<Record<SectionId, { value: number; source: LevelSource }>>;

function entryOf(entries: ExamEntry[], exam: ExamId): ExamEntry | undefined {
  return entries.find((e) => e.exam === exam);
}

/** Current scores per section from whatever the student reported, native exams first. */
function currentScores(entries: ExamEntry[]): Known {
  const out: Known = {};
  const set = (s: SectionId, value: number | null | undefined, source: LevelSource) => {
    if (value !== null && value !== undefined && Number.isFinite(value) && !out[s]) out[s] = { value, source };
  };

  const sat = entryOf(entries, "sat")?.current;
  if (sat) {
    const { rw, math } = sat.sections;
    const total = sat.total;
    set("sat-rw", rw ?? (total != null && math != null ? total - math : total != null ? round10(total / 2) : null), "score");
    set("sat-math", math ?? (total != null && rw != null ? total - rw : total != null ? round10(total / 2) : null), "score");
  }
  const act = entryOf(entries, "act")?.current;
  if (act) {
    const { english, reading, math } = act.sections;
    if (math != null) set("sat-math", actMathToSat(math), "converted");
    if (english != null && reading != null) set("sat-rw", actEnglishReadingToSatErw(english + reading), "converted");
    if (act.total != null) {
      const half = round10(actCompositeToSat(act.total) / 2);
      set("sat-rw", half, "converted");
      set("sat-math", half, "converted");
    }
  }

  const ielts = entryOf(entries, "ielts")?.current;
  if (ielts) {
    for (const s of IELTS_SECTIONS) set(s, ielts.sections[s.slice("ielts-".length)] ?? ielts.total, "score");
  }
  const toefl = entryOf(entries, "toefl")?.current;
  if (toefl) {
    for (const s of IELTS_SECTIONS) {
      const key = s.slice("ielts-".length) as keyof typeof TOEFL_SECTION;
      const v = toefl.sections[key];
      set(s, v != null ? toeflSectionToIelts(key, v) : toefl.total != null ? toeflTotalToIelts(toefl.total) : null, "converted");
    }
  }
  const det = entryOf(entries, "duolingo")?.current;
  if (det?.total != null) for (const s of IELTS_SECTIONS) set(s, duolingoToIelts(det.total), "converted");
  return out;
}

/** Targets per section: SAT/ACT totals split in half, IELTS/TOEFL/DET overall for every skill. */
function targetScores(entries: ExamEntry[]): Partial<Record<SectionId, number>> {
  const out: Partial<Record<SectionId, number>> = {};
  const set = (sections: SectionId[], value: number) => sections.forEach((s) => (out[s] ??= value));
  const t = (exam: ExamId) => entryOf(entries, exam)?.target ?? null;
  if (t("sat") != null) set(SAT_SECTIONS, round10(t("sat")! / 2));
  if (t("act") != null) set(SAT_SECTIONS, round10(actCompositeToSat(t("act")!) / 2));
  if (t("ielts") != null) set(IELTS_SECTIONS, t("ielts")!);
  if (t("toefl") != null) set(IELTS_SECTIONS, toeflTotalToIelts(t("toefl")!));
  if (t("duolingo") != null) set(IELTS_SECTIONS, duolingoToIelts(t("duolingo")!));
  return out;
}

function examDates(entries: ExamEntry[]): Partial<Record<SectionId, string>> {
  const out: Partial<Record<SectionId, string>> = {};
  for (const e of entries) {
    if (!e.examDate) continue;
    for (const s of sectionsOfExam(e.exam)) if (!out[s] || e.examDate < out[s]!) out[s] = e.examDate;
  }
  return out;
}

/** Sections of the exams the student chose; all of them when none were chosen. */
export function activeSections(entries: ExamEntry[]): SectionId[] {
  if (entries.length === 0) return [...ALL_SECTIONS];
  const set = new Set(entries.flatMap((e) => sectionsOfExam(e.exam)));
  return ALL_SECTIONS.filter((s) => set.has(s));
}

/** The diagnostic measures reading; its level stands in for the other IELTS skills too. */
function diagnosticLevel(section: SectionId, diagnostic: Partial<Record<DiagnosticSection, Level>>): Level | undefined {
  if (section === "sat-rw" || section === "sat-math") return diagnostic[section];
  return diagnostic["ielts-reading"];
}

export function sectionStates(entries: ExamEntry[], diagnostic: Partial<Record<DiagnosticSection, Level>> = {}): SectionState[] {
  const current = currentScores(entries);
  const targets = targetScores(entries);
  const dates = examDates(entries);

  return activeSections(entries).map((section) => {
    const sat = isSatSection(section);
    const known = current[section];
    const diag = diagnosticLevel(section, diagnostic);
    const source: LevelSource = known ? known.source : diag ? "diagnostic" : "default";
    const value = known ? (sat ? round10(known.value) : roundBand(known.value)) : scoreForLevel(section, diag ?? "medium");
    const target = targets[section] ?? (sat ? DEFAULT_TARGET.satSection : DEFAULT_TARGET.ieltsBand);
    const gap = target - value;
    return {
      section,
      current: value,
      target,
      level: known ? levelOf(section, value) : (diag ?? "medium"),
      gap,
      normGap: Math.max(0, gap / (sat ? LEVEL_WIDTH.sat : LEVEL_WIDTH.ielts)),
      source,
      examDate: dates[section] ?? null,
    };
  });
}

// --------------------------------------------------------- allocation --

/** Every active section keeps at least this share of new lessons. */
export const MIN_SHARE = 0.15;

/**
 * Shares of new lessons per section, proportional to the gap, with a floor of
 * MIN_SHARE so a strong section is still practised. Sums to 1.
 */
export function lessonShares(states: Pick<SectionState, "section" | "normGap">[]): Record<string, number> {
  const n = states.length;
  if (n === 0) return {};
  const floor = Math.min(MIN_SHARE, 1 / n);
  const weights = new Map(states.map((s) => [s.section, s.normGap]));
  if ([...weights.values()].every((w) => w <= 0)) return Object.fromEntries(states.map((s) => [s.section, 1 / n]));

  // Sections whose proportional share falls under the floor are pinned to it;
  // the rest share what is left, in proportion to their gaps. Repeat until no
  // free section is under the floor (it ends: n × floor ≤ 1).
  const pinned = new Set<SectionId>();
  for (;;) {
    const free = states.filter((s) => !pinned.has(s.section));
    const left = 1 - pinned.size * floor;
    const sum = free.reduce((a, s) => a + Math.max(0, weights.get(s.section)!), 0);
    const share = (id: SectionId) => (sum > 0 ? (Math.max(0, weights.get(id)!) / sum) * left : left / free.length);
    const under = free.filter((s) => share(s.section) < floor - 1e-12);
    if (under.length === 0) return Object.fromEntries(states.map((s) => [s.section, pinned.has(s.section) ? floor : share(s.section)]));
    under.forEach((s) => pinned.add(s.section));
  }
}

/** Splits `total` lessons by the shares, largest remainders first. */
export function allocateLessons(states: Pick<SectionState, "section" | "normGap">[], total: number): Record<string, number> {
  const shares = lessonShares(states);
  const raw = states.map((s) => ({ section: s.section, exact: shares[s.section] * total }));
  const out: Record<string, number> = Object.fromEntries(raw.map((r) => [r.section, Math.floor(r.exact)]));
  let left = total - Object.values(out).reduce((a, b) => a + b, 0);
  for (const r of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1) || a.section.localeCompare(b.section))) {
    if (left <= 0) break;
    out[r.section]++;
    left--;
  }
  return out;
}

// ------------------------------------------------------ difficulty mix --

const LADDER: Level[] = ["easy", "medium", "hard"];

/** 20% one step below the level, 60% at it, 20% one step above; at the ends the missing side folds into the level. */
export function difficultyMix(level: Level): Record<Level, number> {
  const i = LADDER.indexOf(level);
  const mix: Record<Level, number> = { easy: 0, medium: 0, hard: 0 };
  mix[level] += 0.6;
  mix[LADDER[Math.max(0, i - 1)]] += 0.2;
  mix[LADDER[Math.min(2, i + 1)]] += 0.2;
  return mix;
}

/**
 * Difficulties for `n` tasks following the mix, in a fixed spread-out order
 * (the off-level tasks are not bunched at the start or end).
 */
export function difficultiesFor(level: Level, n: number): Level[] {
  const mix = difficultyMix(level);
  const counts = LADDER.map((l) => ({ l, exact: mix[l] * n, k: Math.floor(mix[l] * n) }));
  let left = n - counts.reduce((a, c) => a + c.k, 0);
  // Remainders go to the student's own level first, then to the larger remainder.
  for (const c of [...counts].sort((a, b) => Number(b.l === level) - Number(a.l === level) || (b.exact % 1) - (a.exact % 1))) {
    if (left <= 0) break;
    c.k++;
    left--;
  }
  // Off-level tasks at evenly spaced positions (distinct, since there are at most n of them).
  const off = counts.filter((c) => c.l !== level).flatMap((c) => Array<Level>(c.k).fill(c.l));
  const out = Array<Level>(n).fill(level);
  off.forEach((l, j) => (out[Math.floor(((j + 0.5) * n) / off.length)] = l));
  return out;
}

// ---------------------------------------------------------- adaptation --

/** Answers per adaptation window. */
export const WINDOW = 10;
export const LEVEL_UP_ABOVE = 0.8;
export const LEVEL_DOWN_BELOW = 0.5;

export interface SkillStat {
  level: Level;
  /** Answers in the current window. */
  windowCorrect: number;
  windowTotal: number;
  /** All answers on this skill. */
  answered: number;
}

export function newSkillStat(level: Level): SkillStat {
  return { level, windowCorrect: 0, windowTotal: 0, answered: 0 };
}

/**
 * Feeds first-try answers into a skill. Every WINDOW answers the window's
 * accuracy is compared with the thresholds: above 80% the level goes up, below
 * 50% it goes down, otherwise it stays; then a new window starts.
 */
export function updateSkill(stat: SkillStat, answers: boolean[]): SkillStat {
  let { level, windowCorrect, windowTotal } = stat;
  for (const right of answers) {
    windowTotal++;
    if (right) windowCorrect++;
    if (windowTotal === WINDOW) {
      const accuracy = windowCorrect / windowTotal;
      const i = LADDER.indexOf(level);
      if (accuracy > LEVEL_UP_ABOVE) level = LADDER[Math.min(2, i + 1)];
      else if (accuracy < LEVEL_DOWN_BELOW) level = LADDER[Math.max(0, i - 1)];
      windowCorrect = 0;
      windowTotal = 0;
    }
  }
  return { level, windowCorrect, windowTotal, answered: stat.answered + answers.length };
}
