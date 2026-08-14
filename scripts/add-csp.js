/* Content-Security-Policy stamper.
   GitHub Pages can't set custom HTTP response headers, so the only way to ship
   a CSP here is a <meta http-equiv="Content-Security-Policy"> tag in every
   page's <head> — this inserts/updates it.

   The policy is deliberately generated from an explicit allowlist of the
   external hosts the site's own code actually talks to (see ALLOW below),
   rather than hand-copied into every file, so it can't silently drift from
   reality as pages are added. It can't stop every injection on its own
   (script-src still needs 'unsafe-inline' because of the site's many inline
   <script>/onclick handlers), but it blocks loading a SCRIPT FILE from any
   other origin, restricts where fetch/XHR can send data (connect-src), and
   removes whole classes of embedding/plugin attack surface (object-src,
   frame-src, base-uri) — real defense in depth on top of proper escaping,
   not a replacement for it.

   Idempotent: run it after any page/route change (CI does this on every
   push, right alongside the cache-buster stamp). Node 18+, no dependencies. */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set([".git", "node_modules", ".github", "worker", "scripts", "data", "graphify-out"]);

const ALLOW = {
  // Google Fonts: the stylesheet comes from googleapis, the actual font
  // files it references come from gstatic.
  style: ["https://fonts.googleapis.com"],
  font: ["https://fonts.gstatic.com"],
  // The accounts/sync Worker, GitHub's API + OAuth (login + gist sync), and
  // Warframe's public worldstate API (fetched client-side, live, on the
  // Warframe tool pages).
  connect: ["https://nftw-auth.nightmareftw.workers.dev", "https://api.github.com", "https://github.com", "https://api.warframestat.us"],
  // The one embedded third-party iframe (Outlast Trials interactive maps).
  frame: ["https://outlast.fex.dev"],
};

// Every game's assets/screenshots pull from a different third-party host
// (Steam CDN, Fandom wikis, Game8, DiceBear avatars, dozens more) — an
// exhaustive allowlist here would be unmaintainable and break on every new
// source. Images can't execute script, so https: is an acceptable width for
// this one directive; every other directive stays a tight, explicit list.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  `style-src 'self' 'unsafe-inline' ${ALLOW.style.join(" ")}`,
  `font-src 'self' ${ALLOW.font.join(" ")}`,
  "img-src 'self' data: https:",
  `connect-src 'self' ${ALLOW.connect.join(" ")}`,
  `frame-src ${ALLOW.frame.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ") + ";";

const TAG = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
const EXISTING_RE = /\n?\s*<meta http-equiv="Content-Security-Policy"[^>]*>/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.name !== ".") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (e.isFile() && e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

let changed = 0, missingCharset = [];
for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = html.replace(EXISTING_RE, "");
  if (/<meta charset="UTF-8">/.test(html)) {
    html = html.replace(/<meta charset="UTF-8">/, `<meta charset="UTF-8">\n  ${TAG}`);
  } else {
    missingCharset.push(path.relative(ROOT, file));
    continue;
  }
  if (html !== before) { fs.writeFileSync(file, html); changed++; }
}

console.log(`CSP tag applied to ${changed} file(s).`);
if (missingCharset.length) {
  console.log(`\n${missingCharset.length} file(s) had no "<meta charset=\"UTF-8\">" to anchor on, skipped:`);
  for (const m of missingCharset) console.log("  " + m);
}
