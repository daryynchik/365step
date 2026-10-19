import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ANSWER_TOLERANCE_MS,
  applyDelta,
  calibratedRating,
  canMatch,
  eloDelta,
  expectedScore,
  GRACE_MS,
  leader,
  levelForRound,
  matchDifficulty,
  matchWindow,
  resolveRound,
  type RoundState,
} from "./race-rules";
import { listeningItems, raceTasks, raceTasksOf } from "./race-tasks";

describe("Elo", () => {
  it("a win raises the rating and a loss lowers it", () => {
    assert.ok(eloDelta(1000, 1000, 1, 20) > 0);
    assert.ok(eloDelta(1000, 1000, 0, 20) < 0);
    assert.equal(eloDelta(1000, 1000, 0.5, 20), 0);
  });

  it("beating a stronger opponent gives more, losing to a weaker one costs more", () => {
    assert.ok(eloDelta(1000, 1300, 1, 20) > eloDelta(1000, 1000, 1, 20));
    assert.ok(eloDelta(1000, 1000, 1, 20) > eloDelta(1000, 700, 1, 20));
    assert.ok(eloDelta(1300, 1000, 0, 20) < eloDelta(1000, 1000, 0, 20));
    assert.ok(Math.abs(expectedScore(1200, 1000) + expectedScore(1000, 1200) - 1) < 1e-9);
  });

  it("is zero-sum between equally experienced players and never drops below the floor", () => {
    assert.equal(eloDelta(1100, 950, 1, 20) + eloDelta(950, 1100, 0, 20), 0);
    assert.equal(applyDelta(110, -40), 100);
  });

  it("moves faster while a rating settles", () => {
    assert.ok(eloDelta(1000, 1000, 1, 0) > eloDelta(1000, 1000, 1, 30));
  });
});

describe("matchmaking", () => {
  it("starts close and widens with waiting, up to a limit", () => {
    assert.equal(matchWindow(0), 100);
    assert.equal(matchWindow(10_000), 200);
    assert.equal(matchWindow(10 * 60_000), 400);
    assert.ok(canMatch({ rating: 1000, waitMs: 0 }, { rating: 1090, waitMs: 0 }));
    assert.ok(!canMatch({ rating: 1000, waitMs: 0 }, { rating: 1250, waitMs: 0 }));
    assert.ok(canMatch({ rating: 1000, waitMs: 20_000 }, { rating: 1250, waitMs: 0 }), "the longer wait decides");
    assert.ok(!canMatch({ rating: 800, waitMs: 10 * 60_000 }, { rating: 1300, waitMs: 10 * 60_000 }), "beginners never meet the strongest");
  });
});

describe("difficulty", () => {
  it("follows both ratings: easy for beginners, hard for the strong", () => {
    assert.equal(matchDifficulty(700, 760), 0);
    assert.equal(matchDifficulty(1100, 1100), 1);
    assert.equal(matchDifficulty(1500, 1600), 2);
  });

  it("changes smoothly between levels", () => {
    const share = (d: number) => {
      let hard = 0;
      for (let i = 0; i < 1000; i++) if (levelForRound(d, i / 1000) === "medium") hard++;
      return hard / 1000;
    };
    assert.equal(share(0), 0);
    assert.ok(Math.abs(share(0.25) - 0.25) < 0.01);
    assert.ok(Math.abs(share(0.75) - 0.75) < 0.01);
    assert.equal(levelForRound(2, 0.99), "hard");
  });
});

describe("rounds", () => {
  const base = (over: Partial<RoundState> = {}): RoundState => ({
    opensMs: 1000,
    durationMs: 60_000,
    start: [1000, 1000],
    answers: [null, null],
    ...over,
  });

  it("the first right answer wins once the other side cannot beat it", () => {
    const r = base({ answers: [{ correct: true, atMs: 6000 }, null] });
    assert.deepEqual(resolveRound(r, 5999 + 1), { done: true, winner: 0 }, "B had as much time and did not answer");
    assert.deepEqual(resolveRound(base({ answers: [{ correct: true, atMs: 6000 }, { correct: false, atMs: 4000 }] }), 6001), { done: true, winner: 0 });
  });

  it("measures reaction from each student's own start, so a slow connection is not a handicap", () => {
    // A got the question at 1000 and answered at 9000 (8 s). B got it at 3000 and answered at 10000 (7 s).
    const r = base({ start: [1000, 3000], answers: [{ correct: true, atMs: 9000 }, { correct: true, atMs: 10_000 }] });
    assert.deepEqual(resolveRound(r, 10_000), { done: true, winner: 1 });
    // Before B answers, A's right answer waits until B has had 8 s too.
    const waiting = base({ start: [1000, 3000], answers: [{ correct: true, atMs: 9000 }, null] });
    assert.deepEqual(resolveRound(waiting, 10_500), { done: false });
    assert.deepEqual(resolveRound(waiting, 11_000), { done: true, winner: 0 });
  });

  it("a student who never fetched the question starts the clock at the grace limit", () => {
    const r = base({ start: [1000, null], answers: [{ correct: true, atMs: 3000 }, null] });
    assert.deepEqual(resolveRound(r, 1000 + GRACE_MS + 1999), { done: false });
    assert.deepEqual(resolveRound(r, 1000 + GRACE_MS + 2000), { done: true, winner: 0 });
  });

  it("nobody moves when both are wrong or time runs out", () => {
    assert.deepEqual(resolveRound(base({ answers: [{ correct: false, atMs: 2000 }, { correct: false, atMs: 3000 }] }), 3000), { done: true, winner: null });
    const one = base({ answers: [{ correct: false, atMs: 2000 }, null] });
    assert.deepEqual(resolveRound(one, 30_000), { done: false }, "the other can still answer");
    assert.deepEqual(resolveRound(one, 1000 + 60_000 + ANSWER_TOLERANCE_MS + 1), { done: true, winner: null });
    assert.deepEqual(resolveRound(base(), 1000 + 60_000 + ANSWER_TOLERANCE_MS + 1), { done: true, winner: null });
  });

  it("the leader wins when the race is cut short", () => {
    assert.equal(leader(3, 2), 0);
    assert.equal(leader(1, 4), 1);
    assert.equal(leader(2, 2), null);
  });
});

describe("calibration", () => {
  it("rates harder questions higher", () => {
    const all = (correct: boolean) => calibratedRating(["easy", "easy", "medium", "medium", "hard", "hard"].map((level) => ({ level: level as "easy", correct })));
    assert.equal(all(false), 700);
    assert.equal(all(true), 1300);
    assert.ok(calibratedRating([{ level: "hard", correct: true }]) > calibratedRating([{ level: "easy", correct: true }]));
  });
});

describe("race questions", () => {
  it("uses only objectively checked SAT and IELTS sections, each with answer, explanation, topic and level", () => {
    const tasks = [...raceTasks().values()];
    assert.ok(tasks.length > 1500);
    for (const t of tasks) {
      assert.ok(["sat-math", "sat-rw", "ielts-reading", "ielts-listening"].includes(t.section), t.id);
      assert.ok(t.question.explanation.length > 20 && t.topic && t.difficulty && t.timeMs >= 30_000, t.id);
      if (t.question.kind === "choice") assert.ok(t.question.answer >= 0 && t.question.answer < t.question.options.length, t.id);
      else assert.ok(t.question.answers.length > 0, t.id);
    }
    for (const section of ["sat-math", "sat-rw", "ielts-reading", "ielts-listening"] as const) {
      for (const level of ["easy", "medium", "hard"] as const) assert.ok(raceTasksOf(section, level).length >= 15, `${section} ${level}`);
    }
  });

  it("every Listening question has a recording, played the same number of times by both", () => {
    for (const item of listeningItems()) {
      const t = raceTasks().get(`ielts-listening.${item.id}`)!;
      assert.ok(t.audio && t.audio.ms > 2000 && t.audio.plays === 2, item.id);
      assert.ok(t.timeMs > t.audio.ms * 2, item.id);
      assert.equal(new Set(item.choices).size, item.choices.length, item.id);
    }
  });
});
