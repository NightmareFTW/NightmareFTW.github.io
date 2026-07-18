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

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };

const ITER = 150000;
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

export default {
  async fetch(req, env) {
    if (!env.DB) return json(env, { error: "Database binding 'DB' is missing" }, 500);
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env) });

    try {
      // (Mantém toda a tua lógica de endpoints aqui...)
      // [Inserir a lógica dos if(req.method...) que tinhas no original aqui]
      
      // -- Exemplo de Signup corrigido para o bloco Catch --
      if (req.method === "POST" && url.pathname === "/auth/signup") {
        const { email, password } = await readJson(req);
        // ... tua lógica de validação ...
        // ... teus await env.DB.prepare(...).run() ...
      }
      
      // ... RESTO DO TEU CÓDIGO ...

    } catch (e) {
      console.error("ERRO_DETALHADO:", e); // Aparece no Wrangler Tail
      return json(env, { error: "server_error", details: e.message }, 500); // Aparece no Navegador
    }

    return json(env, { error: "not_found" }, 404);
  },
};