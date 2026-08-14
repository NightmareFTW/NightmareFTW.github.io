/* NightmareFTW auth + sync Worker (Cloudflare).

   One Worker, deployed to the existing URL (nftw-auth.nightmareftw.workers.dev),
   that keeps the old "Sign in with GitHub" OAuth exchange AND adds native
   email + password accounts stored in a Cloudflare D1 database. Each account
   holds one JSON "settings" blob — the same nftw:* data the site keeps in
   localStorage (hub pins/checklists, Murdoku boards & solved cases, future
   games). The static site talks to this over CORS with a bearer token.

   Endpoints
     POST /?code=…                 legacy GitHub OAuth code→token exchange
     POST /auth/signup  {email,password}          -> { token, email }
     POST /auth/login   {email,password}          -> { token, email }
     GET  /auth/me      (Bearer)                  -> { email }
     POST /auth/reset-request {email}             -> { ok:true } (always)
     POST /auth/reset   {token,password}          -> { ok:true }
     GET  /data         (Bearer)                  -> { blob, updated }
     PUT  /data         (Bearer) {blob}           -> { ok:true, updated }

   Secrets/vars (wrangler):
     CLIENT_ID, CLIENT_SECRET   GitHub OAuth app (existing)
     SESSION_SECRET             random string, signs the session JWTs
     ALLOW_ORIGIN               e.g. https://nightmareftw.github.io
     RESEND_API_KEY, FROM_EMAIL (optional) enables password-reset emails
     SITE_URL                   e.g. https://nightmareftw.github.io (reset links)
   Binding: DB -> the D1 database (see schema.sql). */

const enc = new TextEncoder();
const dec = new TextDecoder();
const now = () => Math.floor(Date.now() / 1000);

// ---- base64url ----
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };

// ---- password hashing (PBKDF2-HMAC-SHA256) ----
// 100k is the Cloudflare Workers cap for WebCrypto PBKDF2 (higher throws
// NotSupportedError). Must stay equal for hashing and verifying.
const ITER = 100000;
async function pbkdf2(password, salt) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITER }, key, 256);
  return b64u(bits);
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: await pbkdf2(password, salt), salt: b64u(salt) };
}
async function checkPassword(password, saltB64, hashB64) {
  const h = await pbkdf2(password, unb64u(saltB64));
  return timingSafeEq(h, hashB64);
}
function timingSafeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

// ---- session JWT (HS256) ----
async function hmacKey(secret) { return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
async function signToken(payload, secret) {
  const head = b64u(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const data = head + "." + body;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(data));
  return data + "." + b64u(sig);
}
async function verifyToken(token, secret) {
  const p = (token || "").split("."); if (p.length !== 3) return null;
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), unb64u(p[2]), enc.encode(p[0] + "." + p[1]));
  if (!ok) return null;
  let payload; try { payload = JSON.parse(dec.decode(unb64u(p[1]))); } catch { return null; }
  if (payload.exp && now() > payload.exp) return null;
  return payload;
}
const randToken = () => b64u(crypto.getRandomValues(new Uint8Array(24)));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : randToken());
const normEmail = (e) => String(e || "").trim().toLowerCase();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;

// ---- rate limiting (fixed window, backed by D1) ----
// Cheap brute-force/credential-stuffing guard for the unauthenticated auth
// endpoints. Not perfectly race-free under heavy concurrency (D1 doesn't give
// us a cross-request transaction here), but that only ever makes a window
// slightly generous, never bypassable outright — good enough for this scale.
function clientIp(req) {
  return req.headers.get("CF-Connecting-IP") || (req.headers.get("X-Forwarded-For") || "").split(",")[0].trim() || "unknown";
}
async function checkRateLimit(env, key, windowSeconds, limit) {
  const windowStart = Math.floor(now() / windowSeconds) * windowSeconds;
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END,
       window_start = excluded.window_start
     RETURNING count, window_start`
  ).bind(key, windowStart).first();
  const retryAfter = row.window_start + windowSeconds - now();
  return { ok: row.count <= limit, retryAfter: Math.max(1, retryAfter) };
}
function tooManyRequests(env, retryAfter) {
  return new Response(JSON.stringify({ error: "rate_limited" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter), ...corsHeaders(env) },
  });
}

// ---- recovery codes (one-time backup codes; no email needed to reset) ----
// High-entropy random codes (~60 bits) so a fast SHA-256 hash is safe to store.
const RC_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
function genRecoveryCode() {
  const b = crypto.getRandomValues(new Uint8Array(12));
  let s = "";
  for (let i = 0; i < 12; i++) { s += RC_ALPHABET[b[i] % RC_ALPHABET.length]; if (i % 4 === 3 && i < 11) s += "-"; }
  return s; // e.g. ABCD-EFGH-JKMN
}
const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
async function sha256hex(s) { const buf = await crypto.subtle.digest("SHA-256", enc.encode(s)); return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
async function makeRecoveryCodes(env, userId, n = 10) {
  await env.DB.prepare("DELETE FROM recovery WHERE user_id=?").bind(userId).run();
  const codes = [], stmts = [];
  for (let i = 0; i < n; i++) { const c = genRecoveryCode(); codes.push(c); stmts.push(env.DB.prepare("INSERT INTO recovery (user_id,code_hash,used) VALUES (?,?,0)").bind(userId, await sha256hex(normCode(c)))); }
  await env.DB.batch(stmts);
  return codes;
}

// ---- responses ----
// No "|| *" fallback: if ALLOW_ORIGIN is ever unset, browsers get no
// Access-Control-Allow-Origin header at all and simply can't read the
// response cross-origin — a safe default-closed failure, not a wildcard
// that would silently open the API to every origin on a misconfiguration.
function corsHeaders(env) {
  const h = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
  };
  if (env.ALLOW_ORIGIN) h["Access-Control-Allow-Origin"] = env.ALLOW_ORIGIN;
  return h;
}
const json = (env, obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...corsHeaders(env) } });

async function auth(req, env) {
  const h = req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const payload = await verifyToken(m[1], env.SESSION_SECRET);
  if (!payload || !payload.uid) return null;
  // Reject tokens issued before the account's last password reset/recovery —
  // closes the window where a stolen token would otherwise keep working for
  // its full 90-day life even after the legitimate owner "secured" the
  // account by changing the password.
  const u = await env.DB.prepare("SELECT token_version FROM users WHERE id=?").bind(payload.uid).first();
  if (!u || (u.token_version || 0) !== (payload.tv || 0)) return null;
  return payload;
}
async function readJson(req) { try { return await req.json(); } catch { return {}; } }

// ---- optional password-reset email (Resend) ----
async function sendResetEmail(env, email, link) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.FROM_EMAIL, to: email, subject: "Reset your NightmareFTW password",
      html: `<p>Someone asked to reset the password for your NightmareFTW account.</p>
             <p><a href="${link}">Reset your password</a> (valid for 1 hour).</p>
             <p>If this wasn't you, you can ignore this email.</p>`,
    }),
  });
  return r.ok;
}

export default {
  async fetch(req, env) {
    if (!env.DB) return json(env, { error: "Database binding 'DB' is missing" }, 500);

    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env) });

    try {
      // ---- legacy: GitHub OAuth code -> access_token exchange ----
      const code = url.searchParams.get("code");
      if (req.method === "POST" && code && !url.pathname.startsWith("/auth") && url.pathname !== "/data") {
        try {
          const r = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, code }),
          });
          const data = await r.json();
          return json(env, data, r.ok ? 200 : 400);
        } catch (e) { return json(env, { error: "exchange_failed" }, 502); }
      }

      // ---- signup ----
      if (req.method === "POST" && url.pathname === "/auth/signup") {
        const rl = await checkRateLimit(env, `signup:${clientIp(req)}`, 3600, 8);
        if (!rl.ok) return tooManyRequests(env, rl.retryAfter);
        const { email, password } = await readJson(req);
        const e = normEmail(email);
        if (!validEmail(e)) return json(env, { error: "invalid_email" }, 400);
        if (!password || String(password).length < 8) return json(env, { error: "weak_password" }, 400);
        const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(e).first();
        if (exists) return json(env, { error: "email_taken" }, 409);
        const { hash, salt } = await hashPassword(String(password));
        const id = uuid();
        await env.DB.prepare("INSERT INTO users (id,email,pass_hash,pass_salt,created,token_version) VALUES (?,?,?,?,?,0)").bind(id, e, hash, salt, now()).run();
        await env.DB.prepare("INSERT INTO settings (user_id,blob,updated) VALUES (?, '{}', ?)").bind(id, now()).run();
        const recovery = await makeRecoveryCodes(env, id);
        const token = await signToken({ uid: id, tv: 0, exp: now() + 60 * 60 * 24 * 90 }, env.SESSION_SECRET);
        return json(env, { token, email: e, recovery });
      }

      // ---- login ----
      if (req.method === "POST" && url.pathname === "/auth/login") {
        const { email, password } = await readJson(req);
        const e = normEmail(email);
        // Two independent limits: per source IP (stops one attacker grinding
        // through many accounts) and per target email (stops a distributed
        // attack grinding through many IPs against one account).
        const rlIp = await checkRateLimit(env, `login:${clientIp(req)}`, 900, 12);
        if (!rlIp.ok) return tooManyRequests(env, rlIp.retryAfter);
        if (e) {
          const rlEmail = await checkRateLimit(env, `login:email:${e}`, 900, 8);
          if (!rlEmail.ok) return tooManyRequests(env, rlEmail.retryAfter);
        }
        const u = await env.DB.prepare("SELECT id,pass_hash,pass_salt,token_version FROM users WHERE email=?").bind(e).first();
        const ok = u && await checkPassword(String(password || ""), u.pass_salt, u.pass_hash);
        if (!ok) return json(env, { error: "bad_credentials" }, 401);
        const token = await signToken({ uid: u.id, tv: u.token_version || 0, exp: now() + 60 * 60 * 24 * 90 }, env.SESSION_SECRET);
        return json(env, { token, email: e });
      }

      // ---- who am I ----
      if (req.method === "GET" && url.pathname === "/auth/me") {
        const s = await auth(req, env); if (!s) return json(env, { error: "unauthorized" }, 401);
        const u = await env.DB.prepare("SELECT email FROM users WHERE id=?").bind(s.uid).first();
        return u ? json(env, { email: u.email }) : json(env, { error: "unauthorized" }, 401);
      }

      // ---- password reset: request ----
      if (req.method === "POST" && url.pathname === "/auth/reset-request") {
        const rl = await checkRateLimit(env, `reset:${clientIp(req)}`, 3600, 8);
        if (!rl.ok) return tooManyRequests(env, rl.retryAfter);
        const { email } = await readJson(req);
        const e = normEmail(email);
        const u = validEmail(e) ? await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(e).first() : null;
        if (u) {
          const token = randToken();
          await env.DB.prepare("INSERT INTO resets (token,user_id,expires) VALUES (?,?,?)").bind(token, u.id, now() + 3600).run();
          const link = `${env.SITE_URL || env.ALLOW_ORIGIN || ""}/reset.html?token=${token}`;
          await sendResetEmail(env, e, link);
        }
        return json(env, { ok: true });
      }

      // ---- password reset: apply ----
      if (req.method === "POST" && url.pathname === "/auth/reset") {
        const { token, password } = await readJson(req);
        if (!password || String(password).length < 8) return json(env, { error: "weak_password" }, 400);
        const row = await env.DB.prepare("SELECT user_id,expires FROM resets WHERE token=?").bind(String(token || "")).first();
        if (!row || row.expires < now()) return json(env, { error: "invalid_token" }, 400);
        const { hash, salt } = await hashPassword(String(password));
        // Bump token_version so any session token issued before this reset
        // (e.g. one an attacker stole, which is often *why* the password is
        // being reset) stops being accepted right away.
        await env.DB.prepare("UPDATE users SET pass_hash=?, pass_salt=?, token_version=token_version+1 WHERE id=?").bind(hash, salt, row.user_id).run();
        await env.DB.prepare("DELETE FROM resets WHERE user_id=?").bind(row.user_id).run();
        return json(env, { ok: true });
      }

      // ---- recover the account with a one-time recovery code ----
      if (req.method === "POST" && url.pathname === "/auth/recover") {
        const rl = await checkRateLimit(env, `recover:${clientIp(req)}`, 3600, 8);
        if (!rl.ok) return tooManyRequests(env, rl.retryAfter);
        const { email, code, password } = await readJson(req);
        if (!password || String(password).length < 8) return json(env, { error: "weak_password" }, 400);
        const e = normEmail(email);
        const u = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(e).first();
        const ch = await sha256hex(normCode(code));
        const row = u ? await env.DB.prepare("SELECT rowid AS rid FROM recovery WHERE user_id=? AND code_hash=? AND used=0").bind(u.id, ch).first() : null;
        if (!row) return json(env, { error: "bad_recovery" }, 400);
        const { hash, salt } = await hashPassword(String(password));
        const updated = await env.DB.prepare("UPDATE users SET pass_hash=?, pass_salt=?, token_version=token_version+1 WHERE id=? RETURNING token_version")
          .bind(hash, salt, u.id).first();
        // Issue a fresh set (this wipes the used code and any leftovers), so the
        // user can always recover again and never runs out of codes.
        const recovery = await makeRecoveryCodes(env, u.id);
        const token = await signToken({ uid: u.id, tv: updated.token_version, exp: now() + 60 * 60 * 24 * 90 }, env.SESSION_SECRET);
        return json(env, { token, email: e, recovery });
      }

      // ---- regenerate recovery codes (authenticated) — invalidates old ones ----
      if (req.method === "POST" && url.pathname === "/auth/recovery-codes") {
        const s = await auth(req, env); if (!s) return json(env, { error: "unauthorized" }, 401);
        const recovery = await makeRecoveryCodes(env, s.uid);
        return json(env, { recovery });
      }

      // ---- how many unused recovery codes remain (authenticated) ----
      if (req.method === "GET" && url.pathname === "/auth/recovery-count") {
        const s = await auth(req, env); if (!s) return json(env, { error: "unauthorized" }, 401);
        const r = await env.DB.prepare("SELECT COUNT(*) AS c FROM recovery WHERE user_id=? AND used=0").bind(s.uid).first();
        return json(env, { count: r ? r.c : 0 });
      }

      // ---- settings blob: read ----
      if (req.method === "GET" && url.pathname === "/data") {
        const s = await auth(req, env); if (!s) return json(env, { error: "unauthorized" }, 401);
        const row = await env.DB.prepare("SELECT blob,updated FROM settings WHERE user_id=?").bind(s.uid).first();
        return json(env, { blob: row ? row.blob : "{}", updated: row ? row.updated : 0 });
      }

      // ---- settings blob: write ----
      if (req.method === "PUT" && url.pathname === "/data") {
        const s = await auth(req, env); if (!s) return json(env, { error: "unauthorized" }, 401);
        const body = await readJson(req);
        let blob = body && body.blob;
        if (typeof blob !== "string") blob = JSON.stringify(blob || {});
        if (blob.length > 1_000_000) return json(env, { error: "too_large" }, 413);
        const t = now();
        await env.DB.prepare("INSERT INTO settings (user_id,blob,updated) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET blob=excluded.blob, updated=excluded.updated")
          .bind(s.uid, blob, t).run();
        return json(env, { ok: true, updated: t });
      }

    } catch (e) {
      // Full detail goes to the Cloudflare dashboard's log only — never to the
      // client. Returning e.message here would hand out internal error
      // strings (stack fragments, D1/driver details) to anyone who can
      // trigger an exception.
      console.error("worker error:", e);
      return json(env, { error: "server_error" }, 500);
    }

    return json(env, { error: "not_found" }, 404);
  },
};