-- آیهٔ روز | Aya of the Day — D1 schema
-- npx wrangler d1 execute aya-of-day --remote --file=./db/schema.sql

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS channels (
  id         TEXT PRIMARY KEY,          -- telegram | bale | eitaa | rubika | twitter
  enabled    INTEGER NOT NULL DEFAULT 0,
  config     TEXT NOT NULL DEFAULT '',  -- AES-GCM encrypted JSON blob
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- قفل اتمیک روزانه: جلوگیری از ارسال تکراری توسط تیک‌های متوالی cron
CREATE TABLE IF NOT EXISTS daily_locks (
  day_key    TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sends (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  day_key     TEXT NOT NULL,
  ref         TEXT NOT NULL,            -- "2:255"
  surah       INTEGER NOT NULL,
  ayah        INTEGER NOT NULL,
  surah_name  TEXT,
  arabic      TEXT,
  translation TEXT,
  message     TEXT,
  trigger     TEXT NOT NULL,            -- cron | manual | test
  status      TEXT NOT NULL,            -- ok | partial | failed
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sends_created ON sends (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sends_day     ON sends (day_key);

CREATE TABLE IF NOT EXISTS deliveries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  send_id    INTEGER NOT NULL,
  channel    TEXT NOT NULL,
  ok         INTEGER NOT NULL,
  detail     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_deliveries_send ON deliveries (send_id);

CREATE TABLE IF NOT EXISTS logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  level      TEXT NOT NULL,             -- info | warn | error
  message    TEXT NOT NULL,
  meta       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs (created_at DESC);
