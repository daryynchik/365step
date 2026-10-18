import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { diagnosticNeeded, validateScores, type ExamEntry } from "./exams";

const TODAY = "2026-10-18";

function entry(patch: Partial<ExamEntry> & Pick<ExamEntry, "exam">): ExamEntry {
  return { current: null, takenDate: null, source: null, target: null, examDate: null, ...patch };
}

const sat = (total: number | null, rw: number | null, math: number | null) =>
  entry({ exam: "sat", current: { total, sections: { rw, math } } });

describe("validateScores", () => {
  it("accepts an empty list (no exams yet)", () => {
    assert.equal(validateScores({ entries: [] }, TODAY).ok, true);
  });

  it("checks SAT ranges and the step of 10", () => {
    assert.equal(validateScores({ entries: [sat(1150, null, null)] }, TODAY).ok, true);
    assert.equal(validateScores({ entries: [sat(1155, null, null)] }, TODAY).ok, false);
    assert.equal(validateScores({ entries: [sat(390, null, null)] }, TODAY).ok, false);
    assert.equal(validateScores({ entries: [sat(null, 810, null)] }, TODAY).ok, false);
  });

  it("requires R&W + Math = Total when all three are given", () => {
    assert.equal(validateScores({ entries: [sat(1150, 620, 530)] }, TODAY).ok, true);
    const bad = validateScores({ entries: [sat(1160, 620, 530)] }, TODAY);
    assert.equal(bad.ok, false);
    assert.match(!bad.ok ? bad.error : "", /Total/);
    // Only some of them: nothing to compare.
    assert.equal(validateScores({ entries: [sat(1150, 620, null)] }, TODAY).ok, true);
  });

  it("checks IELTS half bands", () => {
    const ielts = (overall: number, writing: number) =>
      entry({ exam: "ielts", current: { total: overall, sections: { listening: null, reading: null, writing, speaking: null } } });
    assert.equal(validateScores({ entries: [ielts(6, 5.5)] }, TODAY).ok, true);
    assert.equal(validateScores({ entries: [ielts(6.25, 5.5)] }, TODAY).ok, false);
    assert.equal(validateScores({ entries: [ielts(6, 9.5)] }, TODAY).ok, false);
  });

  it("checks TOEFL sections sum, DET step 5 and ACT range", () => {
    const toefl = entry({ exam: "toefl", current: { total: 90, sections: { reading: 22, listening: 23, speaking: 22, writing: 22 } } });
    assert.equal(validateScores({ entries: [toefl] }, TODAY).ok, false);
    toefl.current!.total = 89;
    assert.equal(validateScores({ entries: [toefl] }, TODAY).ok, true);
    assert.equal(validateScores({ entries: [entry({ exam: "duolingo", current: { total: 117, sections: {} } })] }, TODAY).ok, false);
    assert.equal(validateScores({ entries: [entry({ exam: "duolingo", current: { total: 115, sections: {} } })] }, TODAY).ok, true);
    assert.equal(validateScores({ entries: [entry({ exam: "act", current: { total: 37, sections: {} } })] }, TODAY).ok, false);
  });

  it("checks targets and dates", () => {
    assert.equal(validateScores({ entries: [entry({ exam: "sat", target: 1400, examDate: "2027-03-13" })] }, TODAY).ok, true);
    assert.equal(validateScores({ entries: [entry({ exam: "sat", target: 1405 })] }, TODAY).ok, false);
    assert.equal(validateScores({ entries: [entry({ exam: "sat", examDate: "2026-01-01" })] }, TODAY).ok, false);
    const future = entry({ exam: "sat", current: { total: 1200, sections: {} }, takenDate: "2026-12-01" });
    assert.equal(validateScores({ entries: [future] }, TODAY).ok, false);
  });

  it("rejects duplicates and unknown exams", () => {
    assert.equal(validateScores({ entries: [entry({ exam: "sat" }), entry({ exam: "sat" })] }, TODAY).ok, false);
    assert.equal(validateScores({ entries: [entry({ exam: "gre" as never })] }, TODAY).ok, false);
  });

  it("drops a current result with no numbers in it", () => {
    const r = validateScores({ entries: [sat(null, null, null)] }, TODAY);
    assert.equal(r.ok && r.value.entries[0].current, null);
  });
});

describe("diagnosticNeeded", () => {
  it("asks for everything when no exams are chosen", () => {
    assert.deepEqual(diagnosticNeeded([]), ["sat-rw", "sat-math", "ielts-reading"]);
  });
  it("asks only for exams without a result", () => {
    assert.deepEqual(diagnosticNeeded([sat(1150, 620, 530), entry({ exam: "ielts" })]), ["ielts-reading"]);
    assert.deepEqual(diagnosticNeeded([entry({ exam: "act" })]), ["sat-rw", "sat-math"]);
  });
});
