import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DIAGNOSTIC_SIZE, diagnosticItems, levelFromDiagnostic } from "./diagnostic";
import { DIAGNOSTIC_SECTIONS } from "./exams";

describe("diagnostic", () => {
  for (const section of DIAGNOSTIC_SECTIONS) {
    it(`${section}: 12 tasks, 4 per level, from several skills, mixed order`, () => {
      const items = diagnosticItems(section);
      assert.equal(items.length, DIAGNOSTIC_SIZE);
      for (const level of ["easy", "medium", "hard"] as const) assert.equal(items.filter((i) => i.difficulty === level).length, 4);
      assert.ok(new Set(items.map((i) => i.skill)).size >= 4);
      assert.equal(new Set(items.map((i) => i.question.prompt + JSON.stringify(i.question.passages))).size, items.length);
      assert.deepEqual(items.slice(0, 3).map((i) => i.difficulty), ["easy", "medium", "hard"]);
    });
  }

  it("weights harder tasks more", () => {
    const all = (correct: boolean[]) => levelFromDiagnostic(diagnosticItems("sat-math").map((i, k) => ({ difficulty: i.difficulty, correct: correct[k] })));
    assert.equal(all(Array(12).fill(true)), "hard");
    assert.equal(all(Array(12).fill(false)), "easy");
    // Only the four easy tasks right: 4 of 24 points.
    assert.equal(levelFromDiagnostic(diagnosticItems("sat-math").map((i) => ({ difficulty: i.difficulty, correct: i.difficulty === "easy" }))), "easy");
    // Easy and medium right, hard wrong: 12 of 24 points — medium.
    assert.equal(levelFromDiagnostic(diagnosticItems("sat-math").map((i) => ({ difficulty: i.difficulty, correct: i.difficulty !== "hard" }))), "medium");
  });
});
