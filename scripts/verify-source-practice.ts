import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { registerUser } from "../src/lib/accounts";
import { completeLesson, getDoneKeys, getStats } from "../src/lib/game";
import { resolveLesson } from "../src/lib/lesson-access";
import { getDraw, getMathContext } from "../src/lib/mastery";
import { getPlan, saveProfile } from "../src/lib/profile";
import { saveScores } from "../src/lib/scores";
import { findByKey } from "../src/content";
import { isGeneratable } from "../src/lib/content-engine";

const scratch = mkdtempSync(path.join(tmpdir(), "365step-source-check-"));
process.env.SQLITE_PATH = path.join(scratch, "check.db");
delete process.env.DATABASE_URL;
delete process.env.ANTHROPIC_API_KEY;

async function main() {
try {
  const user = await registerUser("source-check@example.test", "test-only-password", "Source check");
  assert.ok(user.ok && user.userId);
  const id = user.userId!;
  const graduation = new Date();
  graduation.setUTCMonth(graduation.getUTCMonth() + 12);
  assert.ok((await saveProfile(id, { country: "usa", field: "cs", grade: 11, graduationMonth: graduation.toISOString().slice(0, 7) })).ok);
  assert.ok((await saveScores(id, { entries: [{ exam: "sat", current: { total: 1450, sections: { math: 750, rw: 700 } }, kind: "official", takenDate: null, source: null, target: 1550, examDate: null }] })).ok);

  const skill = "sat-math.nonlinear-equations";
  const first = await resolveLesson(id, "source", skill, getDoneKeys(id));
  assert.ok(first?.open && first.lesson.questions.length > 0);
  assert.ok(first.lesson.questions.every((q) => q.source));
  const reopened = await resolveLesson(id, "source", skill, getDoneKeys(id));
  assert.deepEqual(reopened!.lesson.questions, first.lesson.questions, "reopening keeps the same draw until grading");
  assert.ok(await getDraw(id, `source/${skill}`));

  const answers = first.lesson.questions.map((q) => q.kind === "choice" ? q.answer : q.answers[0]);
  const outcome = await completeLesson(id, "source", skill, answers);
  assert.ok(outcome.ok);
  assert.equal(outcome.result.correct, answers.length);
  assert.equal(outcome.result.nextHref, "/math-sources");
  assert.equal(await getDraw(id, `source/${skill}`), null);
  assert.ok((await getDoneKeys(id)).has(`source/${skill}`));
  const context = await getMathContext(id, await getPlan(id));
  assert.equal(context.mastery[skill].answered, answers.length);
  assert.ok(context.history.size > 0, "source answers feed spaced review");

  const empty = await resolveLesson(id, "source", "sat-math.statistical-claims", getDoneKeys(id));
  assert.equal(empty!.lesson.questions.length, 0);
  const before = await getStats(id);
  assert.equal((await completeLesson(id, "source", "sat-math.statistical-claims", [])).ok, false);
  assert.equal((await getStats(id)).balance, before.balance, "an empty source set cannot earn points");
  assert.equal(await resolveLesson(id, "source", "unknown", getDoneKeys(id)), null);
  assert.equal(isGeneratable(findByKey("sat-math/linear-equations-one")!), false, "SAT Math cannot fall back to AI generation");
  console.log("Source practice: source-only draw, stable reopens, server grading, score-based selection, progress, spaced review and empty-set protection passed.");
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
