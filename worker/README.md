# NightmareFTW auth + sync Worker

Backs the hub's accounts: keeps the original **Sign in with GitHub** flow and
adds native **email + password** accounts stored in a Cloudflare **D1** database.
Each account holds one JSON settings blob — the same `nftw:*` data the site keeps
in `localStorage` (hub pins/checklists, Murdoku boards & solved cases, future
games). The static site talks to it over CORS with a bearer session token.

This replaces the Worker currently deployed at
`nftw-auth.nightmareftw.workers.dev` (same name/URL, so the client needs no
change). The GitHub login keeps working exactly as before.

## One-time deploy

Prereqs: a Cloudflare account and the Wrangler CLI (`npm i -g wrangler`, then
`wrangler login`). All commands are run from the `worker/` folder.

```sh
cd worker

# 1) Create the D1 database, then paste the printed database_id into wrangler.toml
wrangler d1 create nftw-accounts

# 2) Create the tables
wrangler d1 execute nftw-accounts --file=schema.sql --remote

# 3) Set the secrets (you'll be prompted to paste each value)
wrangler secret put SESSION_SECRET   # any long random string, e.g. `openssl rand -base64 48`
wrangler secret put CLIENT_ID        # existing GitHub OAuth app client id
wrangler secret put CLIENT_SECRET    # existing GitHub OAuth app client secret

# 4) (optional) password-reset emails — see "Password recovery" below
wrangler secret put RESEND_API_KEY
wrangler secret put FROM_EMAIL

# 5) Deploy
wrangler deploy
```

`ALLOW_ORIGIN` and `SITE_URL` are already set in `wrangler.toml` to
`https://nightmareftw.github.io` (change them if the site moves).

## Password recovery

Reset is wired end-to-end (`/auth/reset-request` → email → `reset.html` →
`/auth/reset`), but sending the email needs a provider. It's built for
[Resend](https://resend.com): set `RESEND_API_KEY` and `FROM_EMAIL` to a sender
on a domain you've verified in Resend. Until those are set, a reset request still
returns success (so the endpoint can't be used to probe which emails are
registered) but no email is sent. Swap `sendResetEmail()` in `src/index.js` if
you prefer a different provider.

## Notes / security

- Passwords are hashed with PBKDF2-HMAC-SHA256 (150k iterations, per-user random
  salt) inside the Worker; the plaintext is never stored or logged.
- Sessions are stateless signed JWTs (HS256 with `SESSION_SECRET`), 90-day
  expiry, kept in the browser's `localStorage` (like the GitHub token).
- CORS is locked to `ALLOW_ORIGIN`.
- `/auth/reset-request` always returns `{ok:true}` to avoid email enumeration.
- The settings blob is capped at ~1 MB per account.

To rotate all sessions, change `SESSION_SECRET` and redeploy (everyone is signed
out). Old reset tokens can be pruned with
`wrangler d1 execute nftw-accounts --command "DELETE FROM resets WHERE expires < strftime('%s','now')" --remote`.
