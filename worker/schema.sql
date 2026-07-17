-- NightmareFTW accounts (Cloudflare D1). Apply with:
--   wrangler d1 execute nftw-accounts --file=worker/schema.sql --remote

CREATE TABLE IF NOT EXISTS users (
  id        TEXT PRIMARY KEY,
  email     TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  created   INTEGER NOT NULL
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
