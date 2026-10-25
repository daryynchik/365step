# Math practice from real open sources

This change continues `feature/sat-math-ladder` at `975ac61`. Its existing
topics, original task IDs, scores, mastery tables and progress are preserved.

## What is connected

67 existing exercises from OpenStax **College Algebra 2e**, covering seven
skills. Conditions, numbers and answer keys are imported from the textbook,
not authored by an AI. The selection includes linear equations/functions,
systems, nonlinear equations/functions, proportional relationships and
probability. It is not an official SAT question bank, and it does not cover
all 19 SAT Math skills or all six internal difficulty steps.

The source-only collection opens from **Path → Задачи из открытых источников**
at `/math-sources`. These lessons use the student's current section score and
per-skill mastery, save the question draw before grading, record attempts for
spaced review, and return to the collection on completion. An exercise with
several roots requires all roots, in any order. These sets cannot be completed
or earn points when no suitable source questions are available.

Source tasks also participate in ordinary adaptive Math practice. At the same
step, unseen sourced exercises are preferred to unseen original exercises.
Recently solved source tasks do not take precedence over fresh originals.
The previous original bank remains in place; it is not relabelled as sourced.
AI generation of additional SAT Math practice is disabled. Other subjects'
generation is unchanged. Textbook exercises are excluded from timed races;
their multi-root answers are not SAT grid-ins.

## Exact source and license

- Repository: https://github.com/openstax/osbooks-college-algebra-bundle
- Pinned revision: `4922e46ebc04326979e19392ccc2384cb8b9076c`
- License at that revision:
  https://github.com/openstax/osbooks-college-algebra-bundle/blob/4922e46ebc04326979e19392ccc2384cb8b9076c/LICENSE
- License text: `docs/licenses/openstax-cc-by-4.0.txt`
- Credit shown with every question:
  **© Rice University, OpenStax. Access for free at openstax.org.**

This deliberately imports an older **CC BY 4.0** snapshot, not the repository's
current HEAD, whose license differs. Never update the revision without a new
license and content review. Each task retains the original module and exercise
ID, source URL, revision, license URL and SHA-256 of the exact source module.
The manifest records reviewed topic and difficulty assignments. Those steps
are 365step's internal ordering, not official SAT score calibration.

Changes to the material: MathML is converted to grouped text; a shared exercise
instruction is included with the problem. Variable assignments are removed
from numeric answer keys; rational roots are normalized and duplicate roots
collapsed. The exercise wording and numbers are not rewritten. Some textbook
keys give only a final answer, not a full worked explanation; the UI says so.

## Reproduce the import

Requires Python 3's standard library; no AI key or account is used.

```sh
pnpm bank:import:openstax
pnpm bank:index
python3 scripts/import-openstax.py --check
pnpm validate:content
pnpm verify:sources
```

The first command downloads only the ten modules listed in
`scripts/sources/openstax-math.json`, into ignored `work/openstax-cache/`.
It verifies every module hash before writing any output. Once cached, `--check`
is entirely offline and compares the committed JSON with a fresh extraction.
`--cache-dir /absolute/path` supports an existing source cache. Extraction fails
on unsupported diagrams, tables, external references or ambiguous answers;
it never guesses omitted information. New exercise IDs must be reviewed and
added to the manifest explicitly. Do not loosen the filters to inflate counts.

Content validation checks provenance against the manifest, numeric answer
formats, duplicate questions and topic/tier metadata. For 29 source equations,
it also independently substitutes every accepted root into the original
equation. That check verifies the stated roots; it is not a general proof that
every possible real root has been found. The complete root lists come from
the pinned textbook answer keys.

## 1609SAT and AlikhanPrep

Both sites were checked on 25 October 2026. Their exercise pages require login.
The app links to their public landing/catalog pages; it does not bypass login,
download restricted question banks or claim their content was imported.
External answers do not automatically update 365step mastery.

## Remaining coverage from the earlier branch

The earlier ladder branch is work in progress. Before this change its complete
unit suite had three failures: the 650/750 difficulty separation, the share of
steps 5–6 for a 750 student, and missing steps in several skills. The source
import does not manufacture or relabel problems to hide these gaps. The new
source-only collection reports unavailable levels explicitly. Completing the
whole 19-skill advanced bank requires more reviewed source material.
