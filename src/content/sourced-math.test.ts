import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bankTasks, toQuestion } from "./bank/tasks";
import { freshLadderState, mathPractice, sourceCoverage } from "./bank/math-lessons";
import { drawLadder, startTier } from "./math-ladder";
import { isCorrect, parseNumberSet } from "../lib/answers";
import { TaskSchema } from "./bank/schema";

const sourced = bankTasks().filter((t) => t.source !== "original");

describe("imported math exercises", () => {
  it("keeps source, license and revision on every rendered question", () => {
    assert.equal(sourced.length, 67);
    for (const t of sourced) {
      assert.ok(t.attribution?.sha256);
      assert.equal(t.license, "CC BY 4.0");
      const q = toQuestion(t);
      assert.equal(q.source?.url, t.source);
      assert.match(q.source!.note, /не официальное/);
      assert.ok(isCorrect(q, (t.answer as string[])[0]), t.id);
    }
  });
  it("rejects source tasks without attribution or falsely labelled original", () => {
    assert.equal(TaskSchema.safeParse({ ...sourced[0], attribution: undefined }).success, false);
    assert.equal(TaskSchema.safeParse({ ...sourced[0], source: "original" }).success, false);
  });
  it("does not label elementary equations as advanced merely because of their chapter", () => {
    assert.equal(sourced.find((t) => t.attribution?.exercise === "fs-id2382990")!.tier, 2);
    assert.equal(sourced.find((t) => t.attribution?.exercise === "fs-id2486495")!.tier, 3);
    assert.equal(sourced.find((t) => t.attribution?.exercise === "fs-id1276816")!.tier, 6);
  });
  it("requires the complete root set, with equivalent fractions and any order", () => {
    const t = sourced.find((x) => x.attribution?.exercise === "fs-id1417836")!;
    const q = toQuestion(t);
    assert.ok(isCorrect(q, "1.5; -3/2"));
    assert.ok(isCorrect(q, "{-1.5, 1.5}"));
    assert.equal(isCorrect(q, "1.5"), false);
    assert.equal(isCorrect(q, "-1.5; 1.5; 0"), false);
    assert.equal(parseNumberSet("2;;3"), null);
    assert.equal(parseNumberSet("Infinity; 2"), null);
  });
  it("prefers unseen sourced exercises at the same difficulty, without recycling recent ones", () => {
    const input = {
      pool: [{ id: "original", tier: 4 }, { id: "source", tier: 4, sourced: true }],
      slots: [{ tier: 4 as const, role: "current" as const }],
      history: new Map(), now: "2026-10-25T10:00:00Z", seed: "source-priority", maxRetries: 0,
    };
    assert.equal(drawLadder(input).picks[0].task.id, "source");
    input.history.set("source", [{ at: input.now, outcome: "clean" }]);
    assert.equal(drawLadder(input).picks[0].task.id, "original");
  });
  it("builds source-only practice at the student's current difficulty", () => {
    for (const score of [400, 550, 650, 750]) {
      const state = freshLadderState(startTier(score), 6, "2026-10-25T10:00:00Z");
      const lesson = mathPractice("sat-math.nonlinear-equations", state, `source-${score}`, 8, true);
      assert.ok(lesson.questions.length > 0, String(score));
      assert.ok(lesson.questions.every((q) => q.source));
      assert.ok(lesson.taskTiers.every((t) => t >= state.start - 1 && t <= state.start + 1));
      assert.ok(lesson.taskTiers.some((t) => t >= state.start));
      if (score === 750) assert.ok(lesson.taskTiers.filter((t) => t >= 5).length / lesson.taskTiers.length >= 0.75);
    }
  });
  it("reports missing coverage instead of silently giving a 750 student easy source tasks", () => {
    const state = freshLadderState(5, 6, "2026-10-25T10:00:00Z");
    const coverage = sourceCoverage("sat-math.linear-equations-one", 5);
    assert.ok(coverage.total > 0);
    assert.equal(coverage.suitable, 0);
    const lesson = mathPractice("sat-math.linear-equations-one", state, "gap", 8, true);
    assert.equal(lesson.questions.length, 0);
    assert.match(lesson.theory[0].body, /пока нет/);
  });
});
