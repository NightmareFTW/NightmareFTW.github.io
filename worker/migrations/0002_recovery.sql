-- Migration: add one-time recovery codes to an EXISTING database.
-- (New databases already get this via schema.sql — skip this file for those.)
-- Run once:
--   wrangler d1 execute nftw-accounts --file=migrations/0002_recovery.sql --remote

CREATE TABLE IF NOT EXISTS recovery (
  user_id   TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recovery_user ON recovery(user_id);
