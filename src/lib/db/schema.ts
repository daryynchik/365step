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
