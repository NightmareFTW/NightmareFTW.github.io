-- Migration: security hardening for an EXISTING database.
-- (New databases already get this via schema.sql — skip this file for those.)
-- Run once:
--   wrangler d1 execute nftw-accounts --file=worker/migrations/0003_hardening.sql --remote
--
-- token_version: bumped whenever a password is changed via /auth/reset or
-- /auth/recover, so any session token issued before that moment stops
-- working immediately instead of staying valid for its full 90-day life —
-- important if the reset/recover happened because the account was
-- compromised and someone else is holding a stolen token.
--
-- rate_limits: a simple fixed-window counter the Worker uses to throttle
-- /auth/signup, /auth/login, /auth/recover and /auth/reset-request per
-- client IP (and per target email for /auth/login), so those endpoints
-- can't be brute-forced or hammered for credential stuffing.

ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
