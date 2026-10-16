/**
 * Seeds the database.
 *
 *   npm run db:seed     — create/refresh content, keep existing user data
 *   npm run db:reset    — delete the database file first, then seed
 *
 * Two jobs:
 *
 *   1. Catalogue content — courses, lessons, questions, curated resources,
 *      opportunities, achievements. Idempotent: re-running updates in place.
 *   2. A demo account with 37 days of plausible history, so the product looks
 *      like something someone has been using rather than an empty shell. This
 *      matters for a live demo: the dashboard has to mean something on the first
 *      screen.
 */

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { ACHIEVEMENTS, COURSES, OPPORTUNITIES } from "./content";
import { applySchema, one, run, scalar } from "../src/lib/db";
import { addDays, nowIso, todayIso } from "../src/lib/date";
import { hashPassword } from "../src/lib/password";
import { generateRoadmap } from "../src/lib/roadmap";
import { ensureTodaySteps } from "../src/lib/steps";
import { XP_AWARDS, levelFor } from "../src/lib/xp";

const RESET = process.argv.includes("--reset");

const DEMO = {
  email: "alex@365step.app",
  password: "demo1234",
  name: "Alex",
  role: "school" as const,
  grade: "10",
  country: "Kazakhstan",
  dailyMinutes: 20,
  skillLevel: "beginner" as const,
  interests: ["engineering", "physics", "math"],
  secondary: ["research", "portfolio", "scholarship"],
  goalSlug: "get-into-university",
  goalTitle: "Get into a top engineering university",
  goalCategory: "admissions",
  /** Day 37 of 365. */
  daysIn: 36,
  streakDays: 12,
};

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

// ---------------------------------------------------------------- content ----

async function seedCourses(): Promise<void> {
  let courseCount = 0;
  let lessonCount = 0;
  let questionCount = 0;
  let resourceCount = 0;

  for (let ci = 0; ci < COURSES.length; ci++) {
    const course = COURSES[ci];

    const existing = await one<{ id: string }>("SELECT id FROM courses WHERE slug = ?", [
      course.slug,
    ]);
    const courseId = existing ? String(existing.id) : randomUUID();

    const values = [
      course.track,
      course.title,
      course.subtitle,
      course.description,
      course.difficulty,
      JSON.stringify(course.subjects),
      JSON.stringify(course.audiences),
      JSON.stringify(course.goalSlugs),
      course.accent,
      ci,
    ];

    if (existing) {
      await run(
        `UPDATE courses SET track = ?, title = ?, subtitle = ?, description = ?,
             difficulty = ?, subjects = ?, audiences = ?, goal_slugs = ?, accent = ?, order_index = ?
           WHERE id = ?`,
        [...values, courseId],
      );
    } else {
      await run(
        `INSERT INTO courses (track, title, subtitle, description, difficulty,
             subjects, audiences, goal_slugs, accent, order_index, id, slug)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...values, courseId, course.slug],
      );
    }
    courseCount++;

    for (let li = 0; li < course.lessons.length; li++) {
      const lesson = course.lessons[li];

      const existingLesson = await one<{ id: string }>(
        "SELECT id FROM lessons WHERE course_id = ? AND slug = ?",
        [courseId, lesson.slug],
      );
      const lessonId = existingLesson ? String(existingLesson.id) : randomUUID();

      const lessonValues = [
        lesson.title,
        lesson.objective,
        lesson.estMinutes,
        lesson.xp ?? XP_AWARDS.lesson,
        lesson.theory,
        lesson.example ?? null,
        lesson.takeaway ?? null,
        li,
      ];

      if (existingLesson) {
        await run(
          `UPDATE lessons SET title = ?, objective = ?, est_minutes = ?, xp = ?,
               theory = ?, example = ?, takeaway = ?, order_index = ?
             WHERE id = ?`,
          [...lessonValues, lessonId],
        );
      } else {
        await run(
          `INSERT INTO lessons (title, objective, est_minutes, xp, theory, example,
               takeaway, order_index, id, course_id, slug)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...lessonValues, lessonId, courseId, lesson.slug],
        );
      }
      lessonCount++;

      // Questions and resources are authored content with no user data attached,
      // so replacing them wholesale keeps them exactly in step with the source.
      await run("DELETE FROM questions WHERE lesson_id = ?", [lessonId]);
      for (let qi = 0; qi < lesson.questions.length; qi++) {
        const q = lesson.questions[qi];
        await run(
          `INSERT INTO questions (id, lesson_id, prompt, options, correct_index, explanation, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            lessonId,
            q.prompt,
            JSON.stringify(q.options),
            q.correctIndex,
            q.explanation,
            qi,
          ],
        );
        questionCount++;
      }

      await run("DELETE FROM resources WHERE lesson_id = ?", [lessonId]);
      for (let ri = 0; ri < (lesson.resources ?? []).length; ri++) {
        const r = (lesson.resources ?? [])[ri];
        await run(
          `INSERT INTO resources (id, lesson_id, course_id, title, source, url,
               duration_min, topic, difficulty, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            lessonId,
            courseId,
            r.title,
            r.source,
            r.url,
            r.durationMin ?? null,
            r.topic ?? null,
            r.difficulty ?? "beginner",
            ri,
          ],
        );
        resourceCount++;
      }
    }
  }

  log(
    `  courses ${courseCount} · lessons ${lessonCount} · questions ${questionCount} · resources ${resourceCount}`,
  );
}

async function seedOpportunities(): Promise<void> {
  const today = todayIso();

  for (let i = 0; i < OPPORTUNITIES.length; i++) {
    const o = OPPORTUNITIES[i];
    // Deadlines are stored as real dates computed from an offset, so every
    // countdown in the demo is live. The UI states they are indicative.
    const deadline = o.deadlineInDays === null ? null : addDays(today, o.deadlineInDays);

    const existing = await one<{ id: string }>("SELECT id FROM opportunities WHERE slug = ?", [
      o.slug,
    ]);
    const id = existing ? String(existing.id) : randomUUID();

    const values = [
      o.title,
      o.organization,
      o.type,
      o.summary,
      o.description,
      JSON.stringify(o.audiences),
      JSON.stringify(o.subjects),
      JSON.stringify(o.goalSlugs),
      JSON.stringify(o.tags),
      JSON.stringify(o.eligibility),
      o.country,
      o.location,
      o.format ?? "in_person",
      deadline,
      o.cost,
      o.minGrade ?? null,
      o.maxGrade ?? null,
      o.officialUrl,
      o.isDemo ? 1 : 0,
      o.sourceNote,
      o.prestige ?? 2,
      i,
    ];

    if (existing) {
      await run(
        `UPDATE opportunities SET title = ?, organization = ?, type = ?, summary = ?,
             description = ?, audiences = ?, subjects = ?, goal_slugs = ?, tags = ?,
             eligibility = ?, country = ?, location = ?, format = ?, deadline = ?,
             cost = ?, min_grade = ?, max_grade = ?, official_url = ?, is_demo = ?,
             source_note = ?, prestige = ?, order_index = ?
           WHERE id = ?`,
        [...values, id],
      );
    } else {
      await run(
        `INSERT INTO opportunities (title, organization, type, summary, description,
             audiences, subjects, goal_slugs, tags, eligibility, country, location,
             format, deadline, cost, min_grade, max_grade, official_url, is_demo,
             source_note, prestige, order_index, id, slug)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...values, id, o.slug],
      );
    }
  }

  const real = OPPORTUNITIES.filter((o) => !o.isDemo).length;
  const demo = OPPORTUNITIES.length - real;
  log(`  opportunities ${OPPORTUNITIES.length} (${real} real programmes · ${demo} demo examples)`);
}

async function seedAchievements(): Promise<void> {
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const a = ACHIEVEMENTS[i];
    const existing = await one<{ id: string }>("SELECT id FROM achievements WHERE code = ?", [
      a.code,
    ]);

    if (existing) {
      await run(
        `UPDATE achievements SET title = ?, description = ?, icon = ?, xp = ?,
             metric = ?, threshold = ?, order_index = ? WHERE id = ?`,
        [a.title, a.description, a.icon, a.xp, a.metric, a.threshold, i, String(existing.id)],
      );
    } else {
      await run(
        `INSERT INTO achievements (id, code, title, description, icon, xp, metric, threshold, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), a.code, a.title, a.description, a.icon, a.xp, a.metric, a.threshold, i],
      );
    }
  }
  log(`  achievements ${ACHIEVEMENTS.length}`);
}

// ------------------------------------------------------------- demo account --

/** The lessons the demo user has already worked through, in order. */
const DEMO_COMPLETED: { course: string; lesson: string; correct: number; total: number }[] = [
  { course: "sat-reading", lesson: "transitions", correct: 4, total: 4 },
  { course: "sat-reading", lesson: "main-idea", correct: 3, total: 3 },
  { course: "sat-math", lesson: "linear-equations", correct: 3, total: 3 },
  { course: "sat-math", lesson: "quadratics", correct: 2, total: 3 },
  { course: "sat-writing", lesson: "comma-splices", correct: 3, total: 3 },
  { course: "sat-writing", lesson: "subject-verb-agreement", correct: 2, total: 3 },
  { course: "sat-math", lesson: "systems", correct: 3, total: 3 },
  { course: "research-fundamentals", lesson: "what-is-research", correct: 3, total: 3 },
  { course: "research-fundamentals", lesson: "finding-a-problem", correct: 2, total: 3 },
  { course: "sat-reading", lesson: "command-of-evidence", correct: 2, total: 3 },
  { course: "project-building", lesson: "choosing-a-project", correct: 3, total: 3 },
  { course: "project-building", lesson: "defining-the-problem", correct: 3, total: 3 },
  { course: "sat-math", lesson: "ratios-percent", correct: 3, total: 3 },
  { course: "research-fundamentals", lesson: "research-question", correct: 2, total: 3 },
];

const DEMO_SAVED = [
  "mit-primes",
  "research-science-institute",
  "regeneron-isef",
  "first-robotics-competition",
];

const DEMO_PROJECTS = [
  {
    name: "Solar tracker for a school greenhouse",
    description:
      "A two-axis solar tracker built from servos and light sensors, logging output against a fixed panel. The fixed panel is the control, which is the part that makes it measurable rather than just built.",
    category: "engineering",
    skills: ["Arduino", "C++", "3D printing", "Data logging"],
    status: "in_progress" as const,
    githubUrl: "https://github.com",
    demoUrl: null,
    daysAgo: 22,
  },
  {
    name: "Bus delay tracker",
    description:
      "Logged arrival times for the school bus over three weeks to test whether cold weather actually increases journey time. It does, by about four minutes below freezing.",
    category: "research",
    skills: ["Python", "Pandas", "Matplotlib"],
    status: "shipped" as const,
    githubUrl: "https://github.com",
    demoUrl: null,
    daysAgo: 9,
  },
];

async function seedDemoUser(): Promise<void> {
  const existing = await one<{ id: string }>("SELECT id FROM users WHERE email = ?", [DEMO.email]);

  if (existing) {
    log("  demo account already present — leaving its history untouched");
    await ensureTodaySteps(String(existing.id));
    return;
  }

  const userId = randomUUID();
  const startDate = addDays(todayIso(), -DEMO.daysIn);

  await run(
    "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)",
    [userId, DEMO.email, await hashPassword(DEMO.password), DEMO.name, `${startDate}T09:00:00.000Z`],
  );

  await run(
    `INSERT INTO profiles (user_id, role, grade, country, daily_minutes, skill_level,
         interests, secondary, onboarded_at, timezone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      DEMO.role,
      DEMO.grade,
      DEMO.country,
      DEMO.dailyMinutes,
      DEMO.skillLevel,
      JSON.stringify(DEMO.interests),
      JSON.stringify(DEMO.secondary),
      `${startDate}T09:05:00.000Z`,
      "UTC",
    ],
  );

  const goalId = randomUUID();
  await run(
    `INSERT INTO goals (id, user_id, slug, title, category, start_date, target_date,
         status, is_primary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1, ?)`,
    [
      goalId,
      userId,
      DEMO.goalSlug,
      DEMO.goalTitle,
      DEMO.goalCategory,
      startDate,
      addDays(startDate, 364),
      `${startDate}T09:05:00.000Z`,
    ],
  );

  await generateRoadmap(userId, goalId, DEMO.goalTitle, DEMO.interests);

  // ---- lesson history, spread across the 36 days -------------------------
  for (let i = 0; i < DEMO_COMPLETED.length; i++) {
    const entry = DEMO_COMPLETED[i];
    const lesson = await one<{ id: string; xp: number; est_minutes: number }>(
      `SELECT l.id, l.xp, l.est_minutes FROM lessons l
         JOIN courses c ON c.id = l.course_id
        WHERE c.slug = ? AND l.slug = ?`,
      [entry.course, entry.lesson],
    );
    if (!lesson) continue;

    // Evenly distributed across the elapsed days, ending a couple of days ago.
    const dayOffset = Math.round((i / DEMO_COMPLETED.length) * (DEMO.daysIn - 2)) + 1;
    const date = addDays(startDate, dayOffset);
    const at = `${date}T18:${String(10 + (i % 40)).padStart(2, "0")}:00.000Z`;

    await run(
      `INSERT INTO lesson_progress (id, user_id, lesson_id, status, correct, total,
           minutes, attempts, completed_at, updated_at)
       VALUES (?, ?, ?, 'completed', ?, ?, ?, 1, ?, ?)`,
      [
        randomUUID(),
        userId,
        String(lesson.id),
        entry.correct,
        entry.total,
        Number(lesson.est_minutes),
        at,
        at,
      ],
    );

    await run(
      `INSERT INTO xp_events (id, user_id, amount, reason, ref_type, ref_id, created_at, day_date)
       VALUES (?, ?, ?, ?, 'lesson', ?, ?, ?)`,
      [
        randomUUID(),
        userId,
        Number(lesson.xp),
        `Lesson: ${entry.lesson}`,
        String(lesson.id),
        at,
        date,
      ],
    );

    if (entry.correct === entry.total) {
      await run(
        `INSERT INTO xp_events (id, user_id, amount, reason, ref_type, ref_id, created_at, day_date)
         VALUES (?, ?, ?, 'Perfect quiz', 'lesson', ?, ?, ?)`,
        [randomUUID(), userId, XP_AWARDS.quizPerfect, String(lesson.id), at, date],
      );
    }

    // Close the matching roadmap task so the roadmap reflects the history.
    await run(
      `UPDATE roadmap_tasks SET status = 'done'
        WHERE ref_type = 'lesson' AND ref_slug = ?
          AND milestone_id IN (
            SELECT m.id FROM roadmap_milestones m
              JOIN learning_paths p ON p.id = m.learning_path_id
             WHERE p.user_id = ?
          )`,
      [`${entry.course}/${entry.lesson}`, userId],
    );
  }

  // Some early roadmap tasks were done off-platform; mark month 1 complete so
  // the roadmap has a genuinely finished milestone to show.
  await run(
    `UPDATE roadmap_tasks SET status = 'done'
      WHERE milestone_id IN (
        SELECT m.id FROM roadmap_milestones m
          JOIN learning_paths p ON p.id = m.learning_path_id
         WHERE p.user_id = ? AND m.month_index = 1
      )`,
    [userId],
  );

  // ---- daily step history ------------------------------------------------
  // The last `streakDays` days before today are consecutive, which is what the
  // streak counter reads. Before that, a couple of gaps — a demo where someone
  // never missed a day is not a believable demo.
  const gapDays = new Set([4, 5, 11, 17, 18, 23]);
  let activeDays = 0;

  for (let day = 1; day <= DEMO.daysIn; day++) {
    const date = addDays(startDate, day - 1);
    const withinStreak = day > DEMO.daysIn - DEMO.streakDays;
    if (!withinStreak && gapDays.has(day)) continue;

    activeDays++;
    const stepCount = 3 + (day % 2);
    let completedCount = 0;

    for (let s = 0; s < stepCount; s++) {
      // Most days are cleared fully; occasionally one step is left undone.
      const done = withinStreak || s < stepCount - (day % 5 === 0 ? 1 : 0);
      const kinds = ["learn", "practice", "build", "opportunity"] as const;
      const kind = kinds[s % kinds.length];
      const minutes = kind === "opportunity" ? 3 : kind === "build" ? 15 : 8;
      const xp =
        kind === "learn"
          ? XP_AWARDS.lesson
          : kind === "practice"
            ? XP_AWARDS.practice
            : kind === "build"
              ? XP_AWARDS.build
              : XP_AWARDS.opportunityReview;

      const at = `${date}T19:${String(5 + s * 7).padStart(2, "0")}:00.000Z`;

      await run(
        `INSERT INTO daily_steps (id, user_id, day_index, step_date, kind, title, context,
             detail, est_minutes, xp, ref_type, ref_slug, status, completed_at, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
        [
          randomUUID(),
          userId,
          day,
          date,
          kind,
          HISTORIC_STEP_TITLES[kind],
          HISTORIC_STEP_CONTEXT[kind],
          "Completed earlier in the journey.",
          minutes,
          xp,
          done ? "done" : "todo",
          done ? at : null,
          s,
        ],
      );

      if (done) {
        completedCount++;
        // Lesson XP was already recorded from lesson_progress above; only award
        // step XP for the kinds that do not duplicate it.
        if (kind !== "learn") {
          await run(
            `INSERT INTO xp_events (id, user_id, amount, reason, ref_type, ref_id, created_at, day_date)
             VALUES (?, ?, ?, ?, 'daily_step', NULL, ?, ?)`,
            [randomUUID(), userId, xp, `Step: ${HISTORIC_STEP_TITLES[kind]}`, at, date],
          );
        }
      }
    }

    if (completedCount === stepCount) {
      await run(
        `INSERT INTO xp_events (id, user_id, amount, reason, ref_type, ref_id, created_at, day_date)
         VALUES (?, ?, ?, 'Daily plan complete', 'daily_plan', ?, ?, ?)`,
        [randomUUID(), userId, XP_AWARDS.dailyPlanComplete, date, `${date}T21:00:00.000Z`, date],
      );
    }

    const dayXp = await scalar(
      "SELECT COALESCE(SUM(amount), 0) FROM xp_events WHERE user_id = ? AND day_date = ?",
      [userId, date],
    );

    await run(
      `INSERT INTO daily_progress (id, user_id, day_date, steps_total, steps_completed, xp_earned, minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), userId, date, stepCount, completedCount, dayXp, completedCount * 9],
    );
  }

  // ---- streak ------------------------------------------------------------
  // Last active yesterday, so today's plan is still open for the demo.
  await run(
    `INSERT INTO streaks (user_id, current_days, longest_days, last_active_date, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      DEMO.streakDays,
      DEMO.streakDays,
      addDays(todayIso(), -1),
      nowIso(),
    ],
  );

  // ---- saved opportunities and their deadlines ---------------------------
  for (const slug of DEMO_SAVED) {
    const opportunity = await one<{ id: string; title: string; deadline: string | null; type: string }>(
      "SELECT id, title, deadline, type FROM opportunities WHERE slug = ?",
      [slug],
    );
    if (!opportunity) continue;

    const savedAt = `${addDays(todayIso(), -(DEMO_SAVED.indexOf(slug) * 4 + 3))}T12:00:00.000Z`;

    await run(
      "INSERT INTO saved_opportunities (id, user_id, opportunity_id, note, created_at) VALUES (?, ?, ?, NULL, ?)",
      [randomUUID(), userId, String(opportunity.id), savedAt],
    );

    await run(
      `INSERT INTO xp_events (id, user_id, amount, reason, ref_type, ref_id, created_at, day_date)
       VALUES (?, ?, ?, 'Saved an opportunity', 'opportunity', ?, ?, ?)`,
      [
        randomUUID(),
        userId,
        XP_AWARDS.opportunitySaved,
        String(opportunity.id),
        savedAt,
        savedAt.slice(0, 10),
      ],
    );

    if (opportunity.deadline !== null) {
      await run(
        `INSERT INTO user_deadlines (id, user_id, opportunity_id, title, due_date, kind, done, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          randomUUID(),
          userId,
          String(opportunity.id),
          String(opportunity.title),
          String(opportunity.deadline),
          String(opportunity.type),
          savedAt,
        ],
      );
    }
  }

  // A deadline the user added by hand, not tied to a saved opportunity.
  await run(
    `INSERT INTO user_deadlines (id, user_id, opportunity_id, title, due_date, kind, done, created_at)
     VALUES (?, ?, NULL, ?, ?, 'exam', 0, ?)`,
    [randomUUID(), userId, "SAT registration closes", addDays(todayIso(), 9), nowIso()],
  );

  // ---- one application in progress ---------------------------------------
  const primes = await one<{ id: string }>("SELECT id FROM opportunities WHERE slug = ?", [
    "mit-primes",
  ]);
  if (primes) {
    const at = `${addDays(todayIso(), -6)}T15:00:00.000Z`;
    await run(
      `INSERT INTO applications (id, user_id, opportunity_id, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, 'preparing', ?, ?, ?)`,
      [
        randomUUID(),
        userId,
        String(primes.id),
        "Working through the problem set. Need two recommendation letters.",
        at,
        at,
      ],
    );
    await run(
      `INSERT INTO xp_events (id, user_id, amount, reason, ref_type, ref_id, created_at, day_date)
       VALUES (?, ?, ?, 'Started an application', 'application', ?, ?, ?)`,
      [
        randomUUID(),
        userId,
        XP_AWARDS.applicationStarted,
        String(primes.id),
        at,
        at.slice(0, 10),
      ],
    );
  }

  // ---- portfolio ---------------------------------------------------------
  for (const project of DEMO_PROJECTS) {
    const at = `${addDays(todayIso(), -project.daysAgo)}T10:00:00.000Z`;
    await run(
      `INSERT INTO projects (id, user_id, name, description, category, skills, status,
           link, github_url, demo_url, started_on, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        userId,
        project.name,
        project.description,
        project.category,
        JSON.stringify(project.skills),
        project.status,
        project.githubUrl,
        project.demoUrl,
        addDays(todayIso(), -project.daysAgo),
        at,
        at,
      ],
    );

    await run(
      `INSERT INTO xp_events (id, user_id, amount, reason, ref_type, ref_id, created_at, day_date)
       VALUES (?, ?, ?, 'Added a project', 'project', NULL, ?, ?)`,
      [randomUUID(), userId, XP_AWARDS.projectAdded, at, at.slice(0, 10)],
    );
  }

  // ---- achievements the history has genuinely earned ---------------------
  const { checkAchievements } = await import("../src/lib/gamification");
  const earned = await checkAchievements(userId);

  // ---- today's plan, left open for the demo ------------------------------
  const steps = await ensureTodaySteps(userId);

  const totalXp = await scalar(
    "SELECT COALESCE(SUM(amount), 0) FROM xp_events WHERE user_id = ?",
    [userId],
  );
  const level = levelFor(totalXp);

  log(
    `  demo account ${DEMO.email} / ${DEMO.password}\n` +
      `    day ${DEMO.daysIn + 1} of 365 · ${activeDays} active days · ${DEMO.streakDays} day streak\n` +
      `    ${totalXp} XP · level ${level.level} (${level.title}) · ${earned.length} achievements\n` +
      `    ${DEMO_COMPLETED.length} lessons · ${DEMO_SAVED.length} saved · ${DEMO_PROJECTS.length} projects\n` +
      `    ${steps.length} steps waiting for today`,
  );
}

const HISTORIC_STEP_TITLES: Record<string, string> = {
  learn: "Daily lesson",
  practice: "Practice set",
  build: "Portfolio work",
  opportunity: "Opportunity review",
};

const HISTORIC_STEP_CONTEXT: Record<string, string> = {
  learn: "SAT prep",
  practice: "Retrieval practice",
  build: "Roadmap",
  opportunity: "Opportunities",
};

// -------------------------------------------------------------------- main ---

async function main(): Promise<void> {
  if (RESET) {
    const file = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "365step.db");
    for (const suffix of ["", "-shm", "-wal"]) {
      const target = `${file}${suffix}`;
      if (fs.existsSync(target)) fs.rmSync(target);
    }
    log(`Removed ${path.relative(process.cwd(), file)}`);
  }

  log("Applying schema…");
  await applySchema();

  log("Seeding content…");
  await seedCourses();
  await seedOpportunities();
  await seedAchievements();

  if (process.env.ENABLE_DEMO === "true") {
    log("Seeding demo account…");
    await seedDemoUser();
  }

  const users = await scalar("SELECT COUNT(*) FROM users");
  log(`\nDone. ${users} user${users === 1 ? "" : "s"} in the database.`);
  log("Start the app with  npm run dev  and use \"Try the demo\" on the landing page.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    process.stderr.write(`\nSeed failed: ${error instanceof Error ? error.stack : String(error)}\n`);
    process.exit(1);
  });
