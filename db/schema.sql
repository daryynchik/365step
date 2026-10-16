-- ============================================================================
-- 365step — canonical schema
-- ----------------------------------------------------------------------------
-- Written in the SQL subset that is valid in BOTH SQLite and PostgreSQL
-- (Supabase), so there is exactly one source of truth for the schema.
--
-- Conventions that keep it portable:
--   * ids            TEXT (uuid v4 strings) — no dialect-specific serial types
--   * dates          TEXT, ISO 'YYYY-MM-DD'
--   * timestamps     TEXT, ISO 8601 UTC
--   * booleans       INTEGER 0/1 (avoids sqlite/pg boolean coercion drift)
--   * json           TEXT holding a JSON document
-- ============================================================================

-- ---------------------------------------------------------------- identity --

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

-- The answers to onboarding. One row per user; drives every personalisation.
CREATE TABLE IF NOT EXISTS profiles (
  user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('school', 'university', 'graduate')),
  grade         TEXT,            -- e.g. '10' for school, 'year-2' for university
  country       TEXT,
  daily_minutes INTEGER NOT NULL DEFAULT 20,
  skill_level   TEXT NOT NULL DEFAULT 'beginner'
                  CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  interests     TEXT NOT NULL DEFAULT '[]',  -- json array of subject slugs
  secondary     TEXT NOT NULL DEFAULT '[]',  -- json array of extra goal slugs
  onboarded_at  TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC'
);

-- -------------------------------------------------------------------- goals --

CREATE TABLE IF NOT EXISTS goals (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,        -- 'get-into-university', 'improve-sat', ...
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,        -- 'admissions' | 'exam' | 'research' | ...
  start_date  TEXT NOT NULL,
  target_date TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'achieved', 'paused', 'archived')),
  is_primary  INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- ----------------------------------------------------------- roadmap layer --

-- One learning path per goal: the 12-month container the roadmap renders from.
CREATE TABLE IF NOT EXISTS learning_paths (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id     TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  summary     TEXT,
  total_days  INTEGER NOT NULL DEFAULT 365,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paths_user ON learning_paths(user_id);

CREATE TABLE IF NOT EXISTS roadmap_milestones (
  id               TEXT PRIMARY KEY,
  learning_path_id TEXT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  month_index      INTEGER NOT NULL,   -- 1..12
  title            TEXT NOT NULL,      -- 'Foundation', 'SAT', 'Portfolio', ...
  focus            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'upcoming'
                     CHECK (status IN ('done', 'current', 'upcoming')),
  UNIQUE (learning_path_id, month_index)
);

CREATE TABLE IF NOT EXISTS roadmap_tasks (
  id           TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'action'
                 CHECK (kind IN ('learn', 'practice', 'build', 'apply', 'action')),
  ref_type     TEXT,   -- 'course' | 'lesson' | 'opportunity' | null
  ref_slug     TEXT,
  status       TEXT NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('done', 'todo', 'locked')),
  order_index  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON roadmap_tasks(milestone_id);

-- ---------------------------------------------------------- learning layer --

-- A course is one short track, e.g. 'SAT Reading'. `track` groups courses
-- into the families the Learn page shows (SAT, IELTS, Research, Projects).
CREATE TABLE IF NOT EXISTS courses (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  track        TEXT NOT NULL,
  title        TEXT NOT NULL,
  subtitle     TEXT NOT NULL,
  description  TEXT NOT NULL,
  difficulty   TEXT NOT NULL DEFAULT 'beginner'
                 CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  subjects     TEXT NOT NULL DEFAULT '[]',  -- json array, used for matching
  audiences    TEXT NOT NULL DEFAULT '[]',  -- json array of profile roles
  goal_slugs   TEXT NOT NULL DEFAULT '[]',  -- json array of goals it serves
  accent       TEXT NOT NULL DEFAULT 'indigo',
  order_index  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id          TEXT PRIMARY KEY,
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  objective   TEXT NOT NULL,
  est_minutes INTEGER NOT NULL DEFAULT 8,
  xp          INTEGER NOT NULL DEFAULT 20,
  theory      TEXT NOT NULL,          -- short markdown-ish body
  example     TEXT,                   -- worked example
  takeaway    TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE (course_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);

CREATE TABLE IF NOT EXISTS questions (
  id            TEXT PRIMARY KEY,
  lesson_id     TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  prompt        TEXT NOT NULL,
  options       TEXT NOT NULL,        -- json array of strings
  correct_index INTEGER NOT NULL,
  explanation   TEXT NOT NULL,
  order_index   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_questions_lesson ON questions(lesson_id);

-- Curated external material (YouTube, official guides). Watching is never
-- enough on its own — the lesson's quick check is what completes the step.
CREATE TABLE IF NOT EXISTS resources (
  id           TEXT PRIMARY KEY,
  lesson_id    TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  course_id    TEXT REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  source       TEXT NOT NULL,         -- 'YouTube', 'Khan Academy', ...
  url          TEXT NOT NULL,
  duration_min INTEGER,
  topic        TEXT,
  difficulty   TEXT NOT NULL DEFAULT 'beginner',
  order_index  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_resources_lesson ON resources(lesson_id);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress', 'completed')),
  correct      INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  minutes      INTEGER NOT NULL DEFAULT 0,
  attempts     INTEGER NOT NULL DEFAULT 1,
  completed_at TEXT,
  updated_at   TEXT NOT NULL,
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_user ON lesson_progress(user_id);

-- ------------------------------------------------------- the 365 daily plan --

CREATE TABLE IF NOT EXISTS daily_steps (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_index    INTEGER NOT NULL,     -- 1..365
  step_date    TEXT NOT NULL,        -- ISO date
  kind         TEXT NOT NULL CHECK (kind IN ('learn', 'practice', 'build', 'opportunity', 'reflect')),
  title        TEXT NOT NULL,
  context      TEXT NOT NULL,        -- the small line under the kind, e.g. 'SAT Reading'
  detail       TEXT NOT NULL,        -- the actual small action
  est_minutes  INTEGER NOT NULL DEFAULT 10,
  xp           INTEGER NOT NULL DEFAULT 15,
  ref_type     TEXT,                 -- 'lesson' | 'course' | 'opportunity' | 'project'
  ref_slug     TEXT,
  status       TEXT NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('todo', 'done', 'skipped')),
  completed_at TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_steps_user_date ON daily_steps(user_id, step_date);

CREATE TABLE IF NOT EXISTS daily_progress (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_date        TEXT NOT NULL,
  steps_total     INTEGER NOT NULL DEFAULT 0,
  steps_completed INTEGER NOT NULL DEFAULT 0,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  minutes         INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, day_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_user ON daily_progress(user_id);

-- --------------------------------------------------------- gamification ----

CREATE TABLE IF NOT EXISTS xp_events (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  ref_type   TEXT,
  ref_id     TEXT,
  created_at TEXT NOT NULL,
  day_date   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_xp_user ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_day ON xp_events(user_id, day_date);

CREATE TABLE IF NOT EXISTS streaks (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_days     INTEGER NOT NULL DEFAULT 0,
  longest_days     INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  xp          INTEGER NOT NULL DEFAULT 0,
  metric      TEXT NOT NULL,   -- 'steps' | 'streak' | 'lessons' | 'saved' | ...
  threshold   INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at      TEXT NOT NULL,
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_ua_user ON user_achievements(user_id);

-- ------------------------------------------------------- opportunities -----

CREATE TABLE IF NOT EXISTS opportunities (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  organization  TEXT NOT NULL,
  type          TEXT NOT NULL,   -- 'olympiad' | 'research' | 'scholarship' | ...
  summary       TEXT NOT NULL,
  description   TEXT NOT NULL,
  audiences     TEXT NOT NULL DEFAULT '[]',  -- json: school|university|graduate
  subjects      TEXT NOT NULL DEFAULT '[]',  -- json subject slugs
  goal_slugs    TEXT NOT NULL DEFAULT '[]',  -- json goals it advances
  tags          TEXT NOT NULL DEFAULT '[]',  -- json display tags
  eligibility   TEXT NOT NULL DEFAULT '[]',  -- json bullet list
  country       TEXT NOT NULL,
  location      TEXT NOT NULL,
  format        TEXT NOT NULL DEFAULT 'in_person',
  deadline      TEXT,            -- ISO date
  cost          TEXT NOT NULL DEFAULT 'Free',
  min_grade     INTEGER,
  max_grade     INTEGER,
  official_url  TEXT NOT NULL,
  -- Provenance. `is_demo = 1` means an illustrative example, never presented
  -- to the user as a real programme. `source_note` names where facts came from.
  is_demo       INTEGER NOT NULL DEFAULT 0,
  source_note   TEXT,
  prestige      INTEGER NOT NULL DEFAULT 2,
  order_index   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_opp_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opp_deadline ON opportunities(deadline);

CREATE TABLE IF NOT EXISTS saved_opportunities (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  note           TEXT,
  created_at     TEXT NOT NULL,
  UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_opportunities(user_id);

CREATE TABLE IF NOT EXISTS applications (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'preparing'
                   CHECK (status IN ('preparing', 'submitted', 'accepted', 'rejected')),
  notes          TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_app_user ON applications(user_id);

-- Deadlines the user tracks: mirrored from a saved opportunity, or added by hand.
CREATE TABLE IF NOT EXISTS user_deadlines (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id TEXT REFERENCES opportunities(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  due_date       TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'application',
  done           INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dl_user ON user_deadlines(user_id, due_date);

-- ------------------------------------------------------------- portfolio ---

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'other',
  skills      TEXT NOT NULL DEFAULT '[]',   -- json array
  status      TEXT NOT NULL DEFAULT 'idea'
                CHECK (status IN ('idea', 'in_progress', 'shipped', 'paused')),
  link        TEXT,
  github_url  TEXT,
  demo_url    TEXT,
  started_on  TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- ------------------------------------------------------------------ social --

-- One row per unordered pair, stored canonically with user_a < user_b (string
-- comparison of the UUID) so a lookup never has to check both orderings.
-- `requested_by` is whichever of the two actually sent the request.
CREATE TABLE IF NOT EXISTS friendships (
  id           TEXT PRIMARY KEY,
  user_a       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'declined')),
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  responded_at TEXT,
  UNIQUE (user_a, user_b)
);

CREATE INDEX IF NOT EXISTS idx_friendships_a ON friendships(user_a);
CREATE INDEX IF NOT EXISTS idx_friendships_b ON friendships(user_b);

-- ----------------------------------------------------------------- battles --

-- A head-to-head SAT quiz between two friends. `question_ids` is a fixed JSON
-- array chosen once at creation so both players answer exactly the same set —
-- the fairness a battle depends on.
CREATE TABLE IF NOT EXISTS battles (
  id            TEXT PRIMARY KEY,
  challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic         TEXT NOT NULL,             -- 'sat-reading' | 'sat-writing' | 'sat-math' | 'sat-mixed'
  question_ids  TEXT NOT NULL,             -- json array of question ids
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'completed', 'declined', 'expired')),
  winner_id     TEXT REFERENCES users(id),  -- null once completed means a draw
  created_at    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  completed_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_battles_challenger ON battles(challenger_id);
CREATE INDEX IF NOT EXISTS idx_battles_opponent ON battles(opponent_id);

CREATE TABLE IF NOT EXISTS battle_results (
  id           TEXT PRIMARY KEY,
  battle_id    TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correct      INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  seconds      INTEGER NOT NULL DEFAULT 0,
  answers      TEXT NOT NULL DEFAULT '[]',  -- json array of chosen option indices
  submitted_at TEXT NOT NULL,
  UNIQUE (battle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_battle_results_battle ON battle_results(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_results_user ON battle_results(user_id);

-- ------------------------------------------------------- daily SAT challenge --

-- One row per calendar day: a fixed, identical set of SAT questions everyone
-- who plays that day answers, so the leaderboard is a fair comparison.
CREATE TABLE IF NOT EXISTS daily_challenges (
  id             TEXT PRIMARY KEY,
  challenge_date TEXT NOT NULL UNIQUE,
  question_ids   TEXT NOT NULL,   -- json array of question ids
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_challenge_attempts (
  id           TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correct      INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  seconds      INTEGER NOT NULL DEFAULT 0,
  xp_awarded   INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL,
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dca_challenge ON daily_challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_dca_user ON daily_challenge_attempts(user_id);

-- 365step v2: persistent writing studio and friend arena.
CREATE TABLE IF NOT EXISTS studio_submissions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_index INTEGER NOT NULL CHECK(month_index BETWEEN 1 AND 12),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sources TEXT NOT NULL DEFAULT '',
  checklist TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted')),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id, month_index)
);
CREATE TABLE IF NOT EXISTS arena_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  weapon TEXT NOT NULL DEFAULT 'starter',
  shield TEXT NOT NULL DEFAULT 'starter'
);
CREATE TABLE IF NOT EXISTS arena_inventory (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  price INTEGER NOT NULL CHECK(price >= 0),
  purchased_at TEXT NOT NULL,
  PRIMARY KEY(user_id,item_id)
);
CREATE TABLE IF NOT EXISTS arena_duels (
  id TEXT PRIMARY KEY,
  challenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','active','completed','declined','expired')),
  state TEXT NOT NULL,
  turn_id TEXT NOT NULL,
  winner_id TEXT REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  CHECK(challenger_id <> opponent_id)
);
CREATE INDEX IF NOT EXISTS arena_duels_players ON arena_duels(challenger_id,opponent_id,status);
CREATE TABLE IF NOT EXISTS auth_attempts (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_start TEXT NOT NULL
);
