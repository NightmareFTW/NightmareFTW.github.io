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

// ---- responses ----
function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOW_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
const json = (env, obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...corsHeaders(env) } });

async function auth(req, env) {
  const h = req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const payload = await verifyToken(m[1], env.SESSION_SECRET);
  return payload && payload.uid ? payload : null;
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
    // Verificação de segurança: verificar se a ligação à base de dados existe
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
        const { email, password } = await readJson(req);
        const e = normEmail(email);
        if (!validEmail(e)) return json(env, { error: "invalid_email" }, 400);
        if (!password || String(password).length < 8) return json(env, { error: "weak_password" }, 400);
        const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(e).first();
        if (exists) return json(env, { error: "email_taken" }, 409);
        const { hash, salt } = await hashPassword(String(password));
        const id = uuid();
        await env.DB.prepare("INSERT INTO users (id,email,pass_hash,pass_salt,created) VALUES (?,?,?,?,?)").bind(id, e, hash, salt, now()).run();
        await env.DB.prepare("INSERT INTO settings (user_id,blob,updated) VALUES (?, '{}', ?)").bind(id, now()).run();
        const token = await signToken({ uid: id, exp: now() + 60 * 60 * 24 * 90 }, env.SESSION_SECRET);
        return json(env, { token, email: e });
      }

      // ---- login ----
      if (req.method === "POST" && url.pathname === "/auth/login") {
        const { email, password } = await readJson(req);
        const e = normEmail(email);
        const u = await env.DB.prepare("SELECT id,pass_hash,pass_salt FROM users WHERE email=?").bind(e).first();
        const ok = u && await checkPassword(String(password || ""), u.pass_salt, u.pass_hash);
        if (!ok) return json(env, { error: "bad_credentials" }, 401);
        const token = await signToken({ uid: u.id, exp: now() + 60 * 60 * 24 * 90 }, env.SESSION_SECRET);
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
        await env.DB.prepare("UPDATE users SET pass_hash=?, pass_salt=? WHERE id=?").bind(hash, salt, row.user_id).run();
        await env.DB.prepare("DELETE FROM resets WHERE user_id=?").bind(row.user_id).run();
        return json(env, { ok: true });
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
      // Log detalhado para o console da Cloudflare
      console.error("ERRO_DETALHADO:", e);
      // Resposta detalhada para o navegador (para debug)
      return json(env, { error: "server_error", detail: String(e && e.message || e) }, 500);
    }

    return json(env, { error: "not_found" }, 404);
  },
};