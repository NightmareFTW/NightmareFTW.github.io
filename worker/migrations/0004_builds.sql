-- Migration: Warframe Build Creator / Showcase (public builds).
-- (New databases already get this via schema.sql — skip this file for those.)
-- Run once:
--   wrangler d1 execute nftw-accounts --file=worker/migrations/0004_builds.sql --remote
--
-- Unlike `settings` (one private JSON blob per account, synced across that
-- account's own devices), `builds` is public: any visitor can list/read
-- rows, only the owning account can create/delete its own. `data` is a JSON
-- blob the frontend owns the shape of (mod/arcane picks, forma, notes) — the
-- Worker never looks inside it, just stores and returns it as-is.

CREATE TABLE IF NOT EXISTS builds (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  author     TEXT NOT NULL,
  category   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  title      TEXT NOT NULL,
  data       TEXT NOT NULL,
  likes      INTEGER NOT NULL DEFAULT 0,
  created    INTEGER NOT NULL,
  updated    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_builds_category ON builds(category, subject);
CREATE INDEX IF NOT EXISTS idx_builds_user ON builds(user_id);
CREATE INDEX IF NOT EXISTS idx_builds_created ON builds(created);

CREATE TABLE IF NOT EXISTS build_likes (
  build_id TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  PRIMARY KEY (build_id, user_id)
);
