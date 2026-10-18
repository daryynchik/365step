/**
 * Shows how the level model changes a plan: four test students with the same
 * goal and different scores, and what their first two weeks contain — lessons
 * per section and the difficulty of the practice tasks.
 *
 *   pnpm compare:plans
 */

import { drawTasks } from "../src/content/bank/draw";
import { parseBankKey } from "../src/content/bank/lessons";
import { skillById, skillSequence } from "../src/content/bank/taxonomy";
import { SECTION_TITLES, type ExamEntry, type Level, type SectionId } from "../src/content/exams";
import { buildPlan, MOCK_SIZE, PRACTICE_SIZE, type Plan, type PlanStep } from "../src/content/plan";
import { difficultiesFor } from "../src/content/skill-level";

const START = "2026-10-19";
const addMonths = (n: number) => {
  const d = new Date(`${START}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

const sat = (total: number, rw: number, math: number, target: number): ExamEntry => ({
  exam: "sat",
  current: { total, sections: { rw, math } },
  takenDate: null,
  source: "bluebook",
  target,
  examDate: addMonths(4),
});

const PROFILES: { name: string; entries: ExamEntry[] }[] = [
  { name: "Слабый SAT: 900 (R&W 480, Math 420) → 1200", entries: [sat(900, 480, 420, 1200)] },
  { name: "Средний SAT: 1150 (R&W 620, Math 530) → 1400", entries: [sat(1150, 620, 530, 1400)] },
  { name: "Сильный SAT: 1450 (R&W 720, Math 730) → 1550", entries: [sat(1450, 720, 730, 1550)] },
  {
    name: "IELTS: 6.0 (L 6.5, R 6.0, W 5.5, S 6.0) → 7.0",
    entries: [
      {
        exam: "ielts",
        current: { total: 6, sections: { listening: 6.5, reading: 6, writing: 5.5, speaking: 6 } },
        takenDate: null,
        source: null,
        target: 7,
        examDate: addMonths(5),
      },
    ],
  },
];

const DAYS = 14;

function sectionOfStep(s: PlanStep): SectionId | "other" {
  if (s.section) return s.section;
  if (s.key.startsWith("sat-rw/")) return "sat-rw";
  if (s.key.startsWith("sat-math/")) return "sat-math";
  if (s.key.startsWith("ielts/")) {
    const id = s.key.slice("ielts/".length).replace(/^p-/, "");
    if (id.startsWith("listening")) return "ielts-listening";
    if (id.startsWith("writing")) return "ielts-writing";
    if (id.startsWith("speaking")) return "ielts-speaking";
    return "ielts-reading";
  }
  return "other";
}

/** Difficulties of the tasks a practice step would draw, as planned (before any adaptation). */
function taskLevels(plan: Plan, s: PlanStep): Level[] {
  const parsed = parseBankKey(s.key);
  if (!parsed || !s.level) return [];
  const seed = plan.profile.startDate;
  if (parsed.type === "practice") {
    const skill = skillById(parsed.skill)!;
    const n = skill.kind === "questions" ? PRACTICE_SIZE : 1;
    return drawTasks(skill.id, difficultiesFor(s.level, n), parsed.round - 1, seed, false).tasks.map((t) => t.difficulty);
  }
  const seq = skillSequence(parsed.section, MOCK_SIZE);
  return difficultiesFor(s.level, seq.length);
}

const pad = (v: string | number, n: number) => String(v).padEnd(n);
const lpad = (v: string | number, n: number) => String(v).padStart(n);

for (const p of PROFILES) {
  const plan = buildPlan({ country: "usa", field: "cs", grade: 11, graduation: addMonths(10), startDate: START }, { entries: p.entries, diagnostic: {} });
  const steps = plan.days.slice(0, DAYS).flatMap((d) => d.steps);
  console.log(`\n=== ${p.name}`);
  console.log(
    "Секции: " +
      plan.sections
        .map((s) => `${SECTION_TITLES[s.section]} — ${s.level}, ${s.current}→${s.target}, доля ${Math.round(plan.shares[s.section] * 100)}%`)
        .join("; "),
  );
  console.log(`  ${pad("Секция", 28)} ${lpad("уроки", 6)} ${lpad("практика", 9)} ${lpad("easy", 5)} ${lpad("med", 5)} ${lpad("hard", 5)}`);
  const rows = new Map<string, { lessons: number; practice: number; easy: number; medium: number; hard: number }>();
  for (const s of steps) {
    const sec = sectionOfStep(s);
    const r = rows.get(sec) ?? { lessons: 0, practice: 0, easy: 0, medium: 0, hard: 0 };
    if (s.kind === "lesson") r.lessons++;
    else if (s.kind === "practice" || (s.kind === "mock" && s.section)) {
      r.practice++;
      for (const l of taskLevels(plan, s)) r[l]++;
    }
    rows.set(sec, r);
  }
  const order = [...plan.sections.map((s) => s.section as string), "other"];
  for (const sec of order) {
    const r = rows.get(sec);
    if (!r) continue;
    const title = sec === "other" ? "Поступление/лексика/чтение" : SECTION_TITLES[sec as SectionId];
    console.log(`  ${pad(title, 28)} ${lpad(r.lessons, 6)} ${lpad(r.practice, 9)} ${lpad(r.easy, 5)} ${lpad(r.medium, 5)} ${lpad(r.hard, 5)}`);
  }
  const reviews = steps.filter((s) => s.kind === "review").length;
  console.log(`  Повторений: ${reviews}; всего шагов за ${DAYS} дней: ${steps.length}; окно экзамена: ${plan.windows.map((w) => `${w.date} (с дня ${w.start + 1})`).join(", ") || "нет"}`);
}
