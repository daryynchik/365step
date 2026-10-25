import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { freshLadderState, mathPractice, tierCounts } from "./bank/math-lessons";
import { skillsOf } from "./bank/taxonomy";
import {
  drawLadder,
  lessonSlots,
  mathBand,
  newMastery,
  rebaseline,
  reviewDueAt,
  startTier,
  tierFromLegacy,
  updateMastery,
  type Attempt,
  type LadderAnswer,
  type Mastery,
  type Tier,
} from "./math-ladder";

const clean = (tier: number, n = 1): LadderAnswer[] => Array.from({ length: n }, () => ({ tier, outcome: "clean" }));
const wrong = (tier: number, n = 1): LadderAnswer[] => Array.from({ length: n }, () => ({ tier, outcome: "wrong" }));
const hinted = (tier: number, n = 1): LadderAnswer[] => Array.from({ length: n }, () => ({ tier, outcome: "hinted" }));
/** A skill past calibration, so only the regular rules apply. */
const settled = (tier: Tier): Mastery => ({ ...newMastery(tier), answered: 40, clean: 30 });

describe("math ladder: bands and starting steps", () => {
  it("internal bands 200–490, 500–590, 600–690, 700–800", () => {
    assert.equal(mathBand(400).id, "b1");
    assert.equal(mathBand(490).id, "b1");
    assert.equal(mathBand(550).id, "b2");
    assert.equal(mathBand(650).id, "b3");
    assert.equal(mathBand(750).id, "b4");
  });
  it("starting step rises with the Math score", () => {
    assert.deepEqual([350, 400, 550, 650, 700, 750, 790].map(startTier), [1, 2, 3, 4, 5, 5, 6]);
  });
});

describe("math ladder: lesson slots", () => {
  it("mixes the step, one lower and one higher", () => {
    const s = lessonSlots(4, 5, false);
    assert.equal(s.length, 8);
    assert.equal(s.filter((x) => x.role === "current" && x.tier === 4).length, 5);
    assert.equal(s.filter((x) => x.role === "review" && x.tier === 3).length, 1);
    assert.equal(s.filter((x) => x.role === "stretch" && x.tier === 5).length, 2);
  });
  it("the target sets the direction: far target — more stretch, at target — more review", () => {
    assert.equal(lessonSlots(3, 6, false).filter((x) => x.role === "stretch").length, 3);
    assert.equal(lessonSlots(5, 5, false).filter((x) => x.role === "stretch").length, 1);
    assert.equal(lessonSlots(5, 5, false).filter((x) => x.role === "review").length, 2);
  });
  it("at the top there is no step above; at the bottom none below", () => {
    assert.ok(lessonSlots(6, 6, false).every((x) => x.tier >= 5));
    assert.ok(lessonSlots(1, 3, false).every((x) => x.tier <= 2));
  });
  it("remediation: three easier tasks first, then back to the step", () => {
    const s = lessonSlots(5, 6, true);
    assert.deepEqual(s.slice(0, 3).map((x) => x.tier), [4, 4, 4]);
    assert.ok(s.slice(3).every((x) => x.tier === 5 && x.role === "current"));
  });
});

describe("math ladder: adaptation", () => {
  it("one right answer does not raise the step; a series does", () => {
    let m = settled(3);
    m = updateMastery(m, clean(3)).mastery;
    assert.equal(m.tier, 3);
    m = updateMastery(m, clean(3, 6)).mastery;
    assert.equal(m.tier, 3, "7 answers are not yet a series of 8");
    const r = updateMastery(m, clean(3));
    assert.equal(r.mastery.tier, 4);
    assert.equal(r.event?.kind, "up");
  });
  it("hinted answers do not count towards the series", () => {
    let m = settled(3);
    m = updateMastery(m, [...clean(3, 4), ...hinted(3, 4)]).mastery;
    assert.equal(m.tier, 3);
  });
  it("answers below the step neither raise it nor count as errors at the step", () => {
    let m = settled(4);
    m = updateMastery(m, clean(2, 12)).mastery;
    assert.equal(m.tier, 4);
    m = updateMastery(m, wrong(2, 5)).mastery;
    assert.equal(m.remediation, false);
  });
  it("in the first answers on a skill (calibration) six in a row are enough", () => {
    const r = updateMastery(newMastery(3), clean(3, 6));
    assert.equal(r.mastery.tier, 4);
  });
  it("repeated errors: help first, the step stays; the other skills are untouched", () => {
    const r = updateMastery(settled(5), [...wrong(5, 3), ...clean(5, 2)]);
    assert.equal(r.event?.kind, "help");
    assert.equal(r.mastery.tier, 5);
    assert.equal(r.mastery.remediation, true);
  });
  it("after help: back to the step when it goes well, one step down when it does not", () => {
    const helped: Mastery = { ...settled(5), remediation: true };
    const ok = updateMastery(helped, [...clean(4, 3), ...clean(5, 3), ...wrong(5, 2)], true);
    assert.equal(ok.event?.kind, "recovered");
    assert.equal(ok.mastery.tier, 5);
    const bad = updateMastery(helped, [...clean(4, 3), ...wrong(5, 4), ...clean(5, 1)], true);
    assert.equal(bad.event?.kind, "down");
    assert.equal(bad.mastery.tier, 4);
  });
  it("old progress keeps the skill's distance from the section level", () => {
    assert.equal(tierFromLegacy(5, "hard", "hard"), 5);
    assert.equal(tierFromLegacy(5, "hard", "medium"), 4);
    assert.equal(tierFromLegacy(3, "medium", "hard"), 4);
  });
  it("a new score moves a skill with few answers fully, one with many at most near the new start", () => {
    assert.equal(rebaseline({ ...newMastery(3), answered: 4 }, 5).tier, 5);
    assert.equal(rebaseline({ ...settled(3) }, 6).tier, 5);
    assert.equal(rebaseline({ ...settled(5) }, 2).tier, 3);
  });
});

describe("math ladder: spaced review and no repeats", () => {
  const at = (day: number) => new Date(Date.UTC(2026, 9, 1 + day)).toISOString();
  it("a missed task comes back after 2 days, then after 7, then retires", () => {
    assert.equal(reviewDueAt([{ outcome: "clean", at: at(0) }]), null);
    assert.equal(reviewDueAt([{ outcome: "wrong", at: at(0) }]), at(2));
    assert.equal(reviewDueAt([{ outcome: "wrong", at: at(0) }, { outcome: "clean", at: at(3) }]), at(10));
    assert.equal(reviewDueAt([{ outcome: "wrong", at: at(0) }, { outcome: "clean", at: at(3) }, { outcome: "clean", at: at(11) }]), null);
    assert.equal(reviewDueAt([{ outcome: "hinted", at: at(0) }]), at(2), "a hint is a reason to come back too");
  });
  it("recently solved tasks are not drawn again while fresh ones remain; due mistakes are", () => {
    const pool = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, tier: 3 }));
    const history = new Map<string, Attempt[]>([
      ["t0", [{ outcome: "clean", at: at(0) }]],
      ["t1", [{ outcome: "clean", at: at(0) }]],
      ["t2", [{ outcome: "wrong", at: at(0) }]],
    ]);
    const d = drawLadder({ pool, slots: lessonSlots(3, 3, false, 6).map((s) => ({ ...s, tier: 3 as Tier })), history, now: at(5), seed: "x" });
    const ids = d.picks.map((p) => p.task.id);
    assert.ok(!ids.includes("t0") && !ids.includes("t1"));
    assert.ok(ids.includes("t2"));
    assert.equal(d.picks.find((p) => p.task.id === "t2")?.role, "retry");
    assert.equal(new Set(ids).size, ids.length);
  });
});

/** Mean step of a first lesson, over every SAT Math skill. */
function firstLessons(score: number, target: number) {
  const state = freshLadderState(startTier(score), startTier(target), "2026-10-25T09:00:00.000Z");
  const tiers: number[] = [];
  for (const s of skillsOf("sat-math")) tiers.push(...mathPractice(s.id, state, `profile-${score}`).taskTiers);
  return { tiers, mean: tiers.reduce((a, b) => a + b, 0) / tiers.length };
}

describe("first practice sets for SAT Math 400, 550, 650, 750", () => {
  const p400 = firstLessons(400, 550);
  const p550 = firstLessons(550, 680);
  const p650 = firstLessons(650, 750);
  const p750 = firstLessons(750, 800);

  it("are clearly harder for a higher score", () => {
    const means = [p400, p550, p650, p750].map((p) => p.mean);
    for (let i = 1; i < means.length; i++) assert.ok(means[i] - means[i - 1] >= 0.75, `means ${means.map((m) => m.toFixed(2)).join(" < ")}`);
  });
  it("Math 750 gets no basic tasks (steps 1–2) in its first sets; Math 400 gets no hard ones (5–6)", () => {
    assert.equal(p750.tiers.filter((t) => t <= 2).length, 0);
    assert.equal(p400.tiers.filter((t) => t >= 5).length, 0);
  });
  it("Math 750 works mostly on steps 5–6", () => {
    assert.ok(p750.tiers.filter((t) => t >= 5).length / p750.tiers.length >= 0.75);
  });
  it("every skill has tasks on every step (no empty rung)", () => {
    for (const s of skillsOf("sat-math")) {
      const c = tierCounts(s.id);
      for (const t of [1, 2, 3, 4, 5, 6] as Tier[]) assert.ok(c[t] > 0, `${s.id}: no tasks on step ${t}`);
    }
  });
});
