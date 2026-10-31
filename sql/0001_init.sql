-- NCID schema 0001_init (SQLite / Cloudflare D1)
-- Run once on a fresh database.
-- Local SQLite: PRAGMA foreign_keys = ON; before testing relationships.

CREATE TABLE participants (
  id_anonim   TEXT PRIMARY KEY,
  age         INTEGER CHECK (age IS NULL OR (age >= 18 AND age <= 120)),
  profession  TEXT NOT NULL,
  expertise   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE identity (
  id_anonim   TEXT PRIMARY KEY REFERENCES participants(id_anonim) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE sessions (
  submission_id       TEXT PRIMARY KEY,
  id_anonim           TEXT NOT NULL UNIQUE REFERENCES participants(id_anonim) ON DELETE CASCADE,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  session_number      INTEGER,
  calibration_px      REAL,
  duration_min        REAL CHECK (duration_min IS NULL OR duration_min >= 0),
  language            TEXT CHECK (language IS NULL OR language IN ('al','en')),
  method              TEXT CHECK (method IS NULL OR method IN ('eyetracking','mouse','mock')),
  browser             TEXT,
  device              TEXT,
  accuracy_pct        REAL CHECK (accuracy_pct IS NULL OR (accuracy_pct >= 0 AND accuracy_pct <= 100)),
  consent_version     TEXT,
  consent_at          TEXT,
  source              TEXT NOT NULL DEFAULT 'worker' CHECK (source IN ('worker','email_fallback','backfill')),
  email_status        TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending','sent','failed','skipped')),
  email_attempts      INTEGER NOT NULL DEFAULT 0,
  email_last_error    TEXT,
  email_next_attempt_at TEXT,
  email_sent_at       TEXT,
  gaze_status         TEXT NOT NULL DEFAULT 'none' CHECK (gaze_status IN ('none','stored','failed')),
  payload_json        TEXT NOT NULL
);

CREATE TABLE modules (
  module_uid      INTEGER PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES sessions(submission_id) ON DELETE CASCADE,
  module_id       TEXT,
  profession      TEXT,
  expertise       TEXT,
  complexity      TEXT,
  preference      TEXT CHECK (preference IS NULL OR preference IN ('A','B','equal')),
  order_index     INTEGER,
  first_version   TEXT CHECK (first_version IS NULL OR first_version IN ('A','B')),
  UNIQUE (session_id, module_id)
);

CREATE TABLE trials (
  trial_uid       INTEGER PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES sessions(submission_id) ON DELETE CASCADE,
  module_uid      INTEGER NOT NULL REFERENCES modules(module_uid) ON DELETE CASCADE,
  version         TEXT NOT NULL CHECK (version IN ('A','B')),
  format          TEXT CHECK (format IS NULL OR format IN ('A','B')),
  reading_s       REAL CHECK (reading_s IS NULL OR reading_s >= 0),
  task_s          REAL CHECK (task_s IS NULL OR task_s >= 0),
  ttff_ms         REAL,
  regressions     INTEGER,
  fixation_ms     REAL,
  fixation_count  INTEGER,
  accuracy_pct    REAL CHECK (accuracy_pct IS NULL OR (accuracy_pct >= 0 AND accuracy_pct <= 100)),
  stimulus_json   TEXT,
  UNIQUE (module_uid, version)
);

CREATE TABLE responses (
  response_uid    INTEGER PRIMARY KEY,
  trial_uid       INTEGER NOT NULL REFERENCES trials(trial_uid) ON DELETE CASCADE,
  question_index  INTEGER NOT NULL,
  question        TEXT NOT NULL,
  chosen          TEXT,
  correct         INTEGER NOT NULL CHECK (correct IN (0,1)),
  time_s          REAL,
  UNIQUE (trial_uid, question_index)
);

CREATE TABLE module_tlx (
  tlx_uid         INTEGER PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES sessions(submission_id) ON DELETE CASCADE,
  module_uid      INTEGER NOT NULL UNIQUE REFERENCES modules(module_uid) ON DELETE CASCADE,
  mental          INTEGER CHECK (mental BETWEEN 0 AND 100),
  physical        INTEGER CHECK (physical BETWEEN 0 AND 100),
  temporal        INTEGER CHECK (temporal BETWEEN 0 AND 100),
  performance     INTEGER CHECK (performance BETWEEN 0 AND 100),
  effort          INTEGER CHECK (effort BETWEEN 0 AND 100),
  frustration     INTEGER CHECK (frustration BETWEEN 0 AND 100),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE gaze_objects (
  submission_id   TEXT PRIMARY KEY REFERENCES sessions(submission_id) ON DELETE CASCADE,
  r2_key          TEXT NOT NULL UNIQUE,
  sample_count    INTEGER NOT NULL CHECK (sample_count >= 0),
  duration_ms     INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  bytes           INTEGER CHECK (bytes IS NULL OR bytes >= 0),
  sha256          TEXT,
  compressed      INTEGER NOT NULL DEFAULT 1 CHECK (compressed IN (0,1)),
  storage         TEXT NOT NULL DEFAULT 'd1' CHECK (storage IN ('r2','d1')),
  data_gz         BLOB,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE email_log (
  email_id        INTEGER PRIMARY KEY,
  submission_id   TEXT NOT NULL REFERENCES sessions(submission_id) ON DELETE CASCADE,
  attempted_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ok              INTEGER NOT NULL CHECK (ok IN (0,1)),
  error           TEXT
);

CREATE TABLE audit_log (
  audit_id        INTEGER PRIMARY KEY,
  at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actor           TEXT NOT NULL,
  action          TEXT NOT NULL,
  submission_id   TEXT,
  detail          TEXT
);

CREATE TABLE deletion_log (
  deletion_id     INTEGER PRIMARY KEY,
  id_anonim       TEXT NOT NULL,
  requested_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  completed_at    TEXT,
  notes           TEXT
);

CREATE TABLE schema_migrations (
  version         TEXT PRIMARY KEY,
  applied_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT INTO schema_migrations (version) VALUES ('0001_init');

CREATE INDEX idx_sessions_email_queue
  ON sessions (email_status, email_next_attempt_at);

CREATE INDEX idx_sessions_created
  ON sessions (created_at);

CREATE INDEX idx_modules_session
  ON modules (session_id);

CREATE INDEX idx_trials_session
  ON trials (session_id);

CREATE INDEX idx_trials_module
  ON trials (module_uid);

CREATE INDEX idx_responses_trial
  ON responses (trial_uid);

CREATE INDEX idx_tlx_session
  ON module_tlx (session_id);

CREATE INDEX idx_participants_profession
  ON participants (profession, expertise);

CREATE VIEW v_session_summary AS
SELECT
  s.submission_id,
  s.id_anonim,
  p.age,
  p.profession,
  p.expertise,
  s.created_at,
  s.duration_min,
  s.calibration_px,
  s.accuracy_pct,
  s.email_status,
  s.gaze_status,
  s.source,
  (SELECT COUNT(*) FROM modules m WHERE m.session_id = s.submission_id) AS module_count
FROM sessions s
JOIN participants p ON p.id_anonim = s.id_anonim;

CREATE VIEW v_trial_metrics AS
SELECT
  s.submission_id,
  s.id_anonim,
  p.age,
  p.profession,
  p.expertise,
  m.module_id,
  m.complexity,
  t.version,
  t.reading_s,
  t.task_s,
  t.ttff_ms,
  t.regressions,
  t.fixation_ms,
  t.fixation_count,
  t.accuracy_pct
FROM trials t
JOIN sessions s     ON s.submission_id = t.session_id
JOIN participants p ON p.id_anonim = s.id_anonim
JOIN modules m      ON m.module_uid = t.module_uid;

CREATE VIEW v_accuracy_by_format AS
SELECT
  p.profession,
  p.expertise,
  t.version,
  COUNT(*) AS n_trials,
  ROUND(AVG(t.accuracy_pct), 1) AS avg_accuracy_pct
FROM trials t
JOIN sessions s     ON s.submission_id = t.session_id
JOIN participants p ON p.id_anonim = s.id_anonim
GROUP BY p.profession, p.expertise, t.version;

CREATE VIEW v_tlx_by_module AS
SELECT
  p.profession,
  p.expertise,
  m.module_id,
  m.complexity,
  COUNT(*) AS n_modules,
  ROUND(AVG((tx.mental + tx.physical + tx.temporal + tx.performance + tx.effort + tx.frustration) / 6.0), 1) AS avg_tlx
FROM module_tlx tx
JOIN modules m      ON m.module_uid = tx.module_uid
JOIN sessions s     ON s.submission_id = tx.session_id
JOIN participants p ON p.id_anonim = s.id_anonim
GROUP BY p.profession, p.expertise, m.module_id, m.complexity;

CREATE VIEW v_email_queue AS
SELECT
  submission_id,
  email_attempts,
  email_next_attempt_at
FROM sessions
WHERE email_status = 'pending'
  AND (email_next_attempt_at IS NULL OR email_next_attempt_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now'));

CREATE VIEW v_gaze_summary AS
SELECT
  g.submission_id,
  g.r2_key,
  g.sample_count,
  g.duration_ms,
  g.bytes,
  g.compressed,
  s.id_anonim,
  p.profession,
  p.expertise
FROM gaze_objects g
JOIN sessions s     ON s.submission_id = g.submission_id
JOIN participants p ON p.id_anonim = s.id_anonim;

CREATE VIEW v_data_quality AS
SELECT
  s.submission_id,
  s.id_anonim,
  CASE WHEN s.calibration_px IS NULL OR s.calibration_px > 150 THEN 1 ELSE 0 END AS calibration_flag,
  CASE WHEN s.duration_min IS NULL OR s.duration_min < 5 THEN 1 ELSE 0 END AS short_session_flag,
  s.gaze_status,
  s.email_status
FROM sessions s;
