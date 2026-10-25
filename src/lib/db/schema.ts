/**
 * The schema, as a string so it ships inside the server bundle instead of being
 * read from disk (serverless file tracing does not reliably include .sql files).
 *
 * Written in the SQL subset that SQLite and PostgreSQL both accept, and every
 * statement is idempotent, so it is applied on every cold start.
 *
 *   ids         TEXT (uuid v4)
 *   dates       TEXT 'YYYY-MM-DD'
 *   timestamps  TEXT ISO 8601, UTC
 *   json        TEXT
 *
 * Course content (lessons, questions, the book) lives in src/content as typed
 * modules, not in the database. Tables only hold what users do.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- One row per finished lesson. lesson_key is "<course>/<lesson>".
CREATE TABLE IF NOT EXISTS lesson_results (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_key    TEXT NOT NULL,
  best_correct  INTEGER NOT NULL DEFAULT 0,
  total         INTEGER NOT NULL DEFAULT 0,
  attempts      INTEGER NOT NULL DEFAULT 1,
  first_done_at TEXT NOT NULL,
  last_done_at  TEXT NOT NULL,
  last_day      TEXT NOT NULL,
  PRIMARY KEY (user_id, lesson_key)
);

-- Points ledger. Positive rows are earnings, negative rows are purchases.
-- Balance = SUM(amount); "earned" (leaderboards, level) = SUM of positives.
CREATE TABLE IF NOT EXISTS points (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  ref        TEXT,
  day        TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id, day);

CREATE TABLE IF NOT EXISTS streaks (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_days     INTEGER NOT NULL DEFAULT 0,
  longest_days     INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  updated_at       TEXT NOT NULL
);

-- Seminar writing: one draft per writing task.
CREATE TABLE IF NOT EXISTS writings (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_key   TEXT NOT NULL,
  body         TEXT NOT NULL DEFAULT '',
  words        INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (user_id, lesson_key)
);

-- One row per unordered pair, user_a < user_b.
CREATE TABLE IF NOT EXISTS friendships (
  id           TEXT PRIMARY KEY,
  user_a       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  responded_at TEXT,
  UNIQUE (user_a, user_b)
);
CREATE INDEX IF NOT EXISTS idx_friendships_a ON friendships(user_a);
CREATE INDEX IF NOT EXISTS idx_friendships_b ON friendships(user_b);

CREATE TABLE IF NOT EXISTS arena_fighters (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  color      TEXT NOT NULL DEFAULT 'blue',
  weapon     TEXT NOT NULL DEFAULT 'wooden-sword',
  shield     TEXT NOT NULL DEFAULT 'plank-shield',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS arena_items (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id      TEXT NOT NULL,
  price        INTEGER NOT NULL,
  purchased_at TEXT NOT NULL,
  PRIMARY KEY (user_id, item_id)
);

-- The hero a student plays in the arena: looks (JSON, lib/arena-rules.ts Look)
-- and the level of each gear slot. arena_fighters and arena_items above belong
-- to the first arena; they are only read once, to convert old purchases.
CREATE TABLE IF NOT EXISTS arena_heroes (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  look       TEXT NOT NULL,
  chosen     INTEGER NOT NULL DEFAULT 0,
  sword      INTEGER NOT NULL DEFAULT 1,
  helmet     INTEGER NOT NULL DEFAULT 1,
  armor      INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

-- Every paid upgrade. The unique key is a second guard against paying twice
-- for the same level.
CREATE TABLE IF NOT EXISTS arena_upgrades (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot       TEXT NOT NULL,
  to_level   INTEGER NOT NULL,
  price      INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, slot, to_level)
);

-- Study races (lib/race.ts). arena_heroes keeps each student's looks; the
-- sword/helmet/armor columns and the duel tables above belong to the old
-- fighting arena and are no longer written.

-- One compensation per student for gear bought in the fighting arena.
CREATE TABLE IF NOT EXISTS arena_refunds (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- Accessories a student owns, and what they wear (JSON: slot -> item id).
CREATE TABLE IF NOT EXISTS arena_wardrobe (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id   TEXT NOT NULL,
  price     INTEGER NOT NULL,
  bought_at TEXT NOT NULL,
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS arena_outfits (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Elo rating, separately for SAT and IELTS.
CREATE TABLE IF NOT EXISTS race_ratings (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track      TEXT NOT NULL,
  rating     INTEGER NOT NULL,
  games      INTEGER NOT NULL DEFAULT 0,
  wins       INTEGER NOT NULL DEFAULT 0,
  calibrated INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, track)
);

-- Students looking for an opponent. Times are epoch milliseconds.
CREATE TABLE IF NOT EXISTS race_queue (
  user_id   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  track     TEXT NOT NULL,
  rating    INTEGER NOT NULL,
  joined_ms BIGINT NOT NULL,
  seen_ms   BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS races (
  id          TEXT PRIMARY KEY,
  track       TEXT NOT NULL,
  mode        TEXT NOT NULL,
  status      TEXT NOT NULL,
  user_a      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating_a    INTEGER NOT NULL,
  rating_b    INTEGER NOT NULL,
  difficulty  REAL NOT NULL,
  pos_a       INTEGER NOT NULL DEFAULT 0,
  pos_b       INTEGER NOT NULL DEFAULT 0,
  round_no    INTEGER NOT NULL DEFAULT 0,
  winner      INTEGER,
  reason      TEXT,
  delta_a     INTEGER NOT NULL DEFAULT 0,
  delta_b     INTEGER NOT NULL DEFAULT 0,
  coins_a     INTEGER NOT NULL DEFAULT 0,
  coins_b     INTEGER NOT NULL DEFAULT 0,
  created_ms  BIGINT NOT NULL,
  finished_ms BIGINT,
  seen_a_ms   BIGINT NOT NULL,
  seen_b_ms   BIGINT NOT NULL,
  day         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_races_a ON races(user_a, status);
CREATE INDEX IF NOT EXISTS idx_races_b ON races(user_b, status);

-- winner: 0 or 1 (side), -1 nobody, NULL not decided yet.
CREATE TABLE IF NOT EXISTS race_rounds (
  race_id     TEXT NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  round_no    INTEGER NOT NULL,
  task_id     TEXT NOT NULL,
  level       TEXT NOT NULL,
  opens_ms    BIGINT NOT NULL,
  duration_ms INTEGER NOT NULL,
  start_a_ms  BIGINT,
  start_b_ms  BIGINT,
  winner      INTEGER,
  resolved_ms BIGINT,
  PRIMARY KEY (race_id, round_no)
);

-- One answer per side per round: a wrong answer cannot be retried.
CREATE TABLE IF NOT EXISTS race_answers (
  race_id   TEXT NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  round_no  INTEGER NOT NULL,
  side      INTEGER NOT NULL,
  response  TEXT NOT NULL,
  correct   INTEGER NOT NULL,
  at_ms     BIGINT NOT NULL,
  PRIMARY KEY (race_id, round_no, side)
);

-- Questions a student has seen in races, so they are not repeated soon.
CREATE TABLE IF NOT EXISTS race_seen (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  seen_ms BIGINT NOT NULL,
  PRIMARY KEY (user_id, task_id)
);

-- Friendly races between friends: no rating change.
CREATE TABLE IF NOT EXISTS race_invites (
  id         TEXT PRIMARY KEY,
  from_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair_a     TEXT NOT NULL,
  pair_b     TEXT NOT NULL,
  track      TEXT NOT NULL,
  status     TEXT NOT NULL,
  race_id    TEXT,
  created_ms BIGINT NOT NULL,
  expires_ms BIGINT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_race_invite_pending ON race_invites(pair_a, pair_b) WHERE status = 'pending';

-- The starting calibration: six questions from easy to hard.
CREATE TABLE IF NOT EXISTS race_calibrations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track      TEXT NOT NULL,
  tasks      TEXT NOT NULL,
  answers    TEXT NOT NULL,
  status     TEXT NOT NULL,
  created_ms BIGINT NOT NULL
);

-- A finished fight. Both loadouts are frozen at fight time so the replay never
-- changes when someone buys new gear later.
CREATE TABLE IF NOT EXISTS duels (
  id               TEXT PRIMARY KEY,
  attacker_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  defender_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attacker_fighter TEXT NOT NULL,
  defender_fighter TEXT NOT NULL,
  seed             INTEGER NOT NULL,
  log              TEXT NOT NULL,
  winner_id        TEXT,
  attacker_points  INTEGER NOT NULL DEFAULT 0,
  defender_points  INTEGER NOT NULL DEFAULT 0,
  day              TEXT NOT NULL,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_duels_attacker ON duels(attacker_id, day);
CREATE INDEX IF NOT EXISTS idx_duels_defender ON duels(defender_id);

-- A duel can only be created after the invited friend accepts. Keep requests
-- separately so pending, declined and cancelled invitations never award points.
CREATE TABLE IF NOT EXISTS arena_requests (
  id          TEXT PRIMARY KEY,
  attacker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  defender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair_a      TEXT NOT NULL,
  pair_b      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  duel_id     TEXT REFERENCES duels(id),
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  answered_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_arena_request_pending
  ON arena_requests(pair_a, pair_b) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_arena_request_defender ON arena_requests(defender_id, status);

-- The three answers a personal plan is built from (see content/plan.ts).
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  country    TEXT NOT NULL,
  field      TEXT NOT NULL,
  grade      INTEGER NOT NULL,
  graduation TEXT NOT NULL,
  start_date TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- The exams the student reported (content/exams.ts ScoresInput), as last saved.
-- The plan reads this; score_history keeps every change.
CREATE TABLE IF NOT EXISTS student_scores (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  payload    TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- One row per exam per change: scores, target and exam date with when they were recorded.
CREATE TABLE IF NOT EXISTS score_history (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam        TEXT NOT NULL,
  total       REAL,
  sections    TEXT NOT NULL DEFAULT '{}',
  taken_date  TEXT,
  source      TEXT,
  target      REAL,
  exam_date   TEXT,
  recorded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_score_history_user ON score_history(user_id, exam, recorded_at);

-- Adaptive level per skill (content/skill-level.ts updateSkill): every 10
-- first-try answers on a skill, the level moves up (>80%) or down (<50%).
CREATE TABLE IF NOT EXISTS skill_stats (
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill          TEXT NOT NULL,
  level          TEXT NOT NULL,
  window_correct INTEGER NOT NULL DEFAULT 0,
  window_total   INTEGER NOT NULL DEFAULT 0,
  answered       INTEGER NOT NULL DEFAULT 0,
  updated_at     TEXT NOT NULL,
  PRIMARY KEY (user_id, skill)
);

-- SAT Math ladder per skill (content/math-ladder.ts). recent: JSON list of
-- {d, o} — answers at or above the step since it last changed.
CREATE TABLE IF NOT EXISTS skill_mastery (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill       TEXT NOT NULL,
  tier        INTEGER NOT NULL,
  base_tier   INTEGER NOT NULL,
  recent      TEXT NOT NULL DEFAULT '[]',
  remediation INTEGER NOT NULL DEFAULT 0,
  answered    INTEGER NOT NULL DEFAULT 0,
  clean       INTEGER NOT NULL DEFAULT 0,
  last_event  TEXT,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, skill)
);

-- Every graded answer on a bank task: what came back when (spaced review,
-- no repeats). outcome: clean | hinted | wrong; retried: right on the second
-- try, after the solution was shown (earns nothing).
CREATE TABLE IF NOT EXISTS task_attempts (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id     TEXT NOT NULL,
  skill       TEXT NOT NULL,
  tier        INTEGER NOT NULL,
  outcome     TEXT NOT NULL,
  retried     INTEGER NOT NULL DEFAULT 0,
  lesson_key  TEXT NOT NULL,
  answered_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_task_attempts_user ON task_attempts(user_id, skill, answered_at);

-- The tasks a practice lesson was given, fixed when it is first opened so the
-- server grades what was shown; removed when the lesson is submitted.
CREATE TABLE IF NOT EXISTS lesson_draws (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_key TEXT NOT NULL,
  payload    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, lesson_key)
);

-- The SAT Math diagnostic's score estimate (200–800), next to its level.
CREATE TABLE IF NOT EXISTS diagnostic_estimates (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section  TEXT NOT NULL,
  estimate REAL NOT NULL,
  taken_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diagnostic_estimates_user ON diagnostic_estimates(user_id, section, taken_at);

-- Diagnostic results, one row per section per attempt. level: easy | medium | hard.
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section  TEXT NOT NULL,
  correct  INTEGER NOT NULL,
  total    INTEGER NOT NULL,
  level    TEXT NOT NULL,
  taken_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diagnostic_user ON diagnostic_results(user_id, section, taken_at);

-- Application deadlines the student tracks (admissions roadmap).
CREATE TABLE IF NOT EXISTS deadlines (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  due_date   TEXT NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deadlines_user ON deadlines(user_id, due_date);

-- Generated practice: new question sets for a lesson's skill, shared by all
-- users so each set is generated (and paid for) once.
CREATE TABLE IF NOT EXISTS practice_sets (
  id         TEXT PRIMARY KEY,
  lesson_key TEXT NOT NULL,
  payload    TEXT NOT NULL,
  source     TEXT NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  day        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_practice_sets_lesson ON practice_sets(lesson_key, created_at);
CREATE INDEX IF NOT EXISTS idx_practice_sets_creator ON practice_sets(created_by, day);

CREATE TABLE IF NOT EXISTS practice_results (
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_id   TEXT NOT NULL REFERENCES practice_sets(id) ON DELETE CASCADE,
  correct  INTEGER NOT NULL,
  total    INTEGER NOT NULL,
  done_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, set_id)
);
`;
