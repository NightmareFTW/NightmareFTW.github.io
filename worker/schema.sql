-- NightmareFTW accounts (Cloudflare D1). Apply with:
--   wrangler d1 execute nftw-accounts --file=worker/schema.sql --remote

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  pass_hash     TEXT NOT NULL,
  pass_salt     TEXT NOT NULL,
  created       INTEGER NOT NULL,
  -- Bumped on password reset/recovery so any session token issued before
  -- that moment is rejected immediately instead of staying valid for 90 days.
  token_version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY,
  blob    TEXT NOT NULL DEFAULT '{}',
  updated INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS resets (
  token   TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resets_expires ON resets(expires);

-- One-time recovery codes (reset the password without email).
CREATE TABLE IF NOT EXISTS recovery (
  user_id   TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recovery_user ON recovery(user_id);

-- Fixed-window rate-limit counters for the auth endpoints (per client IP,
-- and per target email for login), so they can't be brute-forced.
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

-- Warframe Build Creator / Showcase: public, user-submitted builds (unlike
-- `settings`, which is one private blob per account). `data` is a JSON blob
-- the frontend owns the shape of (mod/arcane picks, forma, notes) — the
-- Worker never reads inside it, just stores and returns it.
CREATE TABLE IF NOT EXISTS builds (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  author     TEXT NOT NULL,   -- display-name snapshot, so listing builds needs no join
  category   TEXT NOT NULL,   -- 'warframe' | 'weapon' | 'companion'
  subject    TEXT NOT NULL,   -- e.g. "Excalibur Prime", matched against data/warframe/items.json slugs
  title      TEXT NOT NULL,
  data       TEXT NOT NULL,
  likes      INTEGER NOT NULL DEFAULT 0,
  created    INTEGER NOT NULL,
  updated    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_builds_category ON builds(category, subject);
CREATE INDEX IF NOT EXISTS idx_builds_user ON builds(user_id);
CREATE INDEX IF NOT EXISTS idx_builds_created ON builds(created);

-- One row per (build, user) who liked it — the primary key itself is what
-- stops a user liking the same build twice.
CREATE TABLE IF NOT EXISTS build_likes (
  build_id TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  PRIMARY KEY (build_id, user_id)
);
