import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ExamEntry } from "./exams";
import {
  actCompositeToSat,
  actEnglishReadingToSatErw,
  actMathToSat,
  activeSections,
  allocateLessons,
  difficultiesFor,
  difficultyMix,
  duolingoToIelts,
  lessonShares,
  levelFromIeltsBand,
  levelFromSatSection,
  MIN_SHARE,
  newSkillStat,
  sectionStates,
  toeflSectionToIelts,
  toeflTotalToIelts,
  updateSkill,
} from "./skill-level";

const entry = (patch: Partial<ExamEntry> & Pick<ExamEntry, "exam">): ExamEntry => ({
  current: null,
  takenDate: null,
  source: null,
  target: null,
  examDate: null,
  ...patch,
});

const count = <T,>(xs: T[], x: T) => xs.filter((y) => y === x).length;

describe("levels from scores", () => {
  it("SAT section: <500 easy, 500–640 medium, ≥650 hard", () => {
    assert.equal(levelFromSatSection(490), "easy");
    assert.equal(levelFromSatSection(500), "medium");
    assert.equal(levelFromSatSection(640), "medium");
    assert.equal(levelFromSatSection(650), "hard");
  });
  it("IELTS skill: <5.5 easy, 5.5–6.5 medium, ≥7 hard", () => {
    assert.equal(levelFromIeltsBand(5), "easy");
    assert.equal(levelFromIeltsBand(5.5), "medium");
    assert.equal(levelFromIeltsBand(6.5), "medium");
    assert.equal(levelFromIeltsBand(7), "hard");
  });
});

describe("concordance tables", () => {
  it("TOEFL → IELTS (ETS RR-25-02)", () => {
    assert.equal(toeflTotalToIelts(120), 9);
    assert.equal(toeflTotalToIelts(95), 7);
    assert.equal(toeflTotalToIelts(80), 6);
    assert.equal(toeflSectionToIelts("reading", 22), 7);
    assert.equal(toeflSectionToIelts("speaking", 23), 6.5);
    assert.equal(toeflSectionToIelts("writing", 30), 8);
  });
  it("DET → IELTS", () => {
    assert.equal(duolingoToIelts(120), 6.5);
    assert.equal(duolingoToIelts(135), 7);
    assert.equal(duolingoToIelts(100), 5.5);
  });
  it("ACT → SAT (2018 concordance)", () => {
    assert.equal(actCompositeToSat(36), 1590);
    assert.equal(actCompositeToSat(24), 1180);
    assert.equal(actMathToSat(28), 660);
    assert.equal(actEnglishReadingToSatErw(50), 610);
    assert.equal(actEnglishReadingToSatErw(65), 700);
  });
});

describe("section states", () => {
  it("SAT 1150 (R&W 620, Math 530), target 1400: both medium, Math has the bigger gap", () => {
    const states = sectionStates([entry({ exam: "sat", current: { total: 1150, sections: { rw: 620, math: 530 } }, target: 1400 })]);
    const rw = states.find((s) => s.section === "sat-rw")!;
    const math = states.find((s) => s.section === "sat-math")!;
    assert.deepEqual(states.map((s) => s.section), ["sat-rw", "sat-math"]);
    assert.equal(rw.level, "medium");
    assert.equal(math.level, "medium");
    assert.equal(rw.gap, 80);
    assert.equal(math.gap, 170);
    assert.ok(math.normGap > rw.normGap);
  });

  it("missing SAT section is the total minus the other", () => {
    const states = sectionStates([entry({ exam: "sat", current: { total: 1200, sections: { rw: 650, math: null } } })]);
    assert.equal(states.find((s) => s.section === "sat-math")!.current, 550);
  });

  it("IELTS 6.0 overall with Writing 5.5, target 7.0: Writing has the biggest gap", () => {
    const states = sectionStates([
      entry({ exam: "ielts", current: { total: 6, sections: { listening: null, reading: null, writing: 5.5, speaking: null } }, target: 7 }),
    ]);
    const byGap = [...states].sort((a, b) => b.gap - a.gap);
    assert.equal(byGap[0].section, "ielts-writing");
    assert.equal(byGap[0].gap, 1.5);
    assert.equal(states.find((s) => s.section === "ielts-reading")!.gap, 1);
  });

  it("TOEFL and ACT are converted; native exams take precedence", () => {
    const states = sectionStates([
      entry({ exam: "toefl", current: { total: 95, sections: { reading: 27, listening: null, speaking: null, writing: null } } }),
      entry({ exam: "act", current: { total: 24, sections: { english: null, math: 28, reading: null, science: null } } }),
      entry({ exam: "sat", current: { total: null, sections: { rw: 700, math: null } } }),
    ]);
    const get = (id: string) => states.find((s) => s.section === id)!;
    assert.equal(get("ielts-reading").current, 8);
    assert.equal(get("ielts-listening").current, 7);
    assert.equal(get("ielts-reading").source, "converted");
    assert.equal(get("sat-rw").current, 700);
    assert.equal(get("sat-rw").source, "score");
    assert.equal(get("sat-math").current, 660);
  });

  it("no scores: diagnostic level, otherwise medium", () => {
    const states = sectionStates([], { "sat-math": "easy", "ielts-reading": "hard" });
    assert.equal(states.length, 6);
    assert.equal(states.find((s) => s.section === "sat-math")!.level, "easy");
    assert.equal(states.find((s) => s.section === "ielts-writing")!.level, "hard");
    assert.equal(states.find((s) => s.section === "sat-rw")!.level, "medium");
    assert.equal(states.find((s) => s.section === "sat-rw")!.source, "default");
  });

  it("only the chosen exams are active", () => {
    assert.deepEqual(activeSections([entry({ exam: "duolingo" })]), ["ielts-reading", "ielts-listening", "ielts-writing", "ielts-speaking"]);
    assert.equal(activeSections([]).length, 6);
  });

  it("exam dates attach to the sections of that exam", () => {
    const states = sectionStates([entry({ exam: "sat", examDate: "2027-03-13" })]);
    assert.ok(states.every((s) => s.examDate === "2027-03-13"));
  });
});

describe("allocation", () => {
  it("weak sections get more lessons, every section at least 15%", () => {
    const states = sectionStates([entry({ exam: "sat", current: { total: 1150, sections: { rw: 620, math: 530 } }, target: 1400 })]);
    const lessons = allocateLessons(states, 100);
    assert.equal(lessons["sat-rw"] + lessons["sat-math"], 100);
    assert.ok(lessons["sat-math"] > lessons["sat-rw"], JSON.stringify(lessons));
  });

  it("IELTS writing gets the largest share", () => {
    const states = sectionStates([
      entry({ exam: "ielts", current: { total: 6, sections: { listening: null, reading: null, writing: 5.5, speaking: null } }, target: 7 }),
    ]);
    const shares = lessonShares(states);
    const top = Object.entries(shares).sort((a, b) => b[1] - a[1])[0][0];
    assert.equal(top, "ielts-writing");
  });

  it("a section already at target keeps the 15% floor", () => {
    const shares = lessonShares([
      { section: "sat-rw", normGap: 0 },
      { section: "sat-math", normGap: 2 },
    ]);
    assert.ok(Math.abs(shares["sat-rw"] - MIN_SHARE) < 1e-9);
    assert.ok(Math.abs(shares["sat-math"] - (1 - MIN_SHARE)) < 1e-9);
  });

  it("shares always sum to 1 and respect the floor", () => {
    const shares = lessonShares([
      { section: "ielts-reading", normGap: 0.1 },
      { section: "ielts-listening", normGap: 0 },
      { section: "ielts-writing", normGap: 3 },
      { section: "ielts-speaking", normGap: 0.2 },
      { section: "sat-rw", normGap: 0 },
      { section: "sat-math", normGap: 1 },
    ]);
    const values = Object.values(shares);
    assert.ok(Math.abs(values.reduce((a, b) => a + b, 0) - 1) < 1e-9);
    assert.ok(values.every((v) => v >= MIN_SHARE - 1e-9));
  });

  it("no gaps anywhere: equal shares", () => {
    const shares = lessonShares([
      { section: "sat-rw", normGap: 0 },
      { section: "sat-math", normGap: 0 },
    ]);
    assert.deepEqual(shares, { "sat-rw": 0.5, "sat-math": 0.5 });
  });
});

describe("difficulty mix", () => {
  it("20% below, 60% at, 20% above", () => {
    assert.deepEqual(difficultyMix("medium"), { easy: 0.2, medium: 0.6, hard: 0.2 });
    assert.deepEqual(difficultyMix("easy"), { easy: 0.8, medium: 0.2, hard: 0 });
    assert.deepEqual(difficultyMix("hard"), { easy: 0, medium: 0.2, hard: 0.8 });
  });

  it("ten tasks at medium: 2 easy, 6 medium, 2 hard, spread out", () => {
    const d = difficultiesFor("medium", 10);
    assert.deepEqual([count(d, "easy"), count(d, "medium"), count(d, "hard")], [2, 6, 2]);
    // Off-level tasks are spaced out: the set starts and ends on the student's level.
    assert.equal(d[0], "medium");
    assert.equal(d[9], "medium");
    assert.ok(!d.some((l, i) => l !== "medium" && d[i + 1] !== undefined && d[i + 1] !== "medium"), d.join());
  });

  it("SAT 1150 student: Math tasks mostly medium", () => {
    const math = sectionStates([entry({ exam: "sat", current: { total: 1150, sections: { rw: 620, math: 530 } }, target: 1400 })]).find(
      (s) => s.section === "sat-math",
    )!;
    const d = difficultiesFor(math.level, 6);
    assert.ok(count(d, "medium") > d.length / 2, d.join());
  });
});

describe("adaptation", () => {
  it("level goes up after 10 answers above 80%", () => {
    const s = updateSkill(newSkillStat("medium"), [...Array(9).fill(true), true]);
    assert.equal(s.level, "hard");
    assert.equal(s.windowTotal, 0);
  });
  it("level goes down below 50%", () => {
    const s = updateSkill(newSkillStat("medium"), [true, true, true, true, false, false, false, false, false, false]);
    assert.equal(s.level, "easy");
  });
  it("stays between 50% and 80%, and only decides every 10 answers", () => {
    assert.equal(updateSkill(newSkillStat("medium"), [true, true, true, true, true, true, true, true, false, false]).level, "medium");
    const partial = updateSkill(newSkillStat("medium"), Array(9).fill(false));
    assert.equal(partial.level, "medium");
    assert.equal(partial.windowTotal, 9);
    assert.equal(updateSkill(partial, [false]).level, "easy");
  });
  it("never leaves the ladder", () => {
    assert.equal(updateSkill(newSkillStat("hard"), Array(10).fill(true)).level, "hard");
    assert.equal(updateSkill(newSkillStat("easy"), Array(10).fill(false)).level, "easy");
  });
});
