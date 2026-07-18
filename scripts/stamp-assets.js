/* Cache-buster stamper.
   GitHub Pages serves our CSS/JS with a long-lived cache, so a deploy could
   leave visitors running yesterday's script until they hard-refreshed. This
   rewrites every local <script src> / <link href> in the site's HTML to carry
   ?v=<content hash>, so the URL changes exactly when the file does — new code
   is picked up immediately, unchanged files stay cached.

   Idempotent: run it after any CSS/JS edit (CI does this on every push).
   Node 18+, no dependencies. */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
// Not part of the deployed site: build tooling, the worker, and the generated
// graphify knowledge-graph artifacts.
const SKIP_DIRS = new Set([".git", "node_modules", ".github", "worker", "scripts", "data", "graphify-out"]);
const hashes = new Map();

const shortHash = (file) => {
  if (hashes.has(file)) return hashes.get(file);
  const h = crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
  hashes.set(file, h);
  return h;
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.name !== ".") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (e.isFile() && e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

// Resolve a reference as the browser would: "/a/b.js" from the site root,
// anything else relative to the page. Returns null for external URLs.
function resolveRef(ref, htmlFile) {
  if (/^(?:[a-z]+:)?\/\//i.test(ref) || ref.startsWith("data:")) return null;
  const clean = ref.split(/[?#]/)[0];
  if (!clean) return null;
  const abs = clean.startsWith("/") ? path.join(ROOT, clean) : path.resolve(path.dirname(htmlFile), clean);
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? abs : null;
}

const REF = /(\b(?:src|href)=")([^"]+\.(?:js|css))((?:\?[^"]*)?)(")/gi;

let changed = 0, stamped = 0, missing = new Set();

// i18n.js injects auth.js itself, so that URL needs stamping too — and it has
// to happen BEFORE the HTML pass, since rewriting i18n.js changes its own hash.
const i18n = path.join(ROOT, "assets", "js", "i18n.js");
const auth = path.join(ROOT, "assets", "js", "auth.js");
if (fs.existsSync(i18n) && fs.existsSync(auth)) {
  const src = fs.readFileSync(i18n, "utf8");
  const out = src.replace(/(["'])(\/assets\/js\/auth\.js)(?:\?v=[^"']*)?\1/g, `$1$2?v=${shortHash(auth)}$1`);
  if (out !== src) { fs.writeFileSync(i18n, out); changed++; console.log("stamped the auth.js injection inside i18n.js"); }
}

for (const html of walk(ROOT)) {
  const before = fs.readFileSync(html, "utf8");
  const after = before.replace(REF, (m, pre, ref, _query, post) => {
    const target = resolveRef(ref, html);
    if (!target) { if (!/^(?:[a-z]+:)?\/\//i.test(ref)) missing.add(`${path.relative(ROOT, html)} -> ${ref}`); return m; }
    stamped++;
    return `${pre}${ref}?v=${shortHash(target)}${post}`;
  });
  if (after !== before) { fs.writeFileSync(html, after); changed++; }
}

console.log(`Stamped ${stamped} references across ${changed} changed file(s).`);
if (missing.size) {
  console.log(`\n${missing.size} reference(s) point at a file that doesn't exist:`);
  for (const m of missing) console.log("  " + m);
}
