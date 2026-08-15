/* Cloudflare Web Analytics stamper.
   Inserts the site's Cloudflare Web Analytics beacon (privacy-friendly,
   cookieless — https://www.cloudflare.com/web-analytics/) right before
   </body> in every page. Idempotent: run it after any page/route change
   (CI does this on every push, right alongside the CSP/cache-buster
   stamps). Node 18+, no dependencies. */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set([".git", "node_modules", ".github", "worker", "scripts", "data", "graphify-out"]);

// The site token from the Cloudflare dashboard (Analytics & Logs > Web
// Analytics) — not a secret, it's shipped in the client-side snippet by
// design (it only identifies which site's dashboard to report into).
const TOKEN = "b0fc25d6ec3948f58b0a240fab9e9500";
const TAG = `<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${TOKEN}"}'></script><!-- End Cloudflare Web Analytics -->`;
const EXISTING_RE = /\s*<!-- Cloudflare Web Analytics -->[\s\S]*?<!-- End Cloudflare Web Analytics -->/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.name !== ".") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (e.isFile() && e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

let changed = 0, missingBody = [];
for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = html.replace(EXISTING_RE, "");
  if (/<\/body>/.test(html)) {
    html = html.replace(/<\/body>/, `  ${TAG}\n</body>`);
  } else {
    missingBody.push(path.relative(ROOT, file));
    continue;
  }
  if (html !== before) { fs.writeFileSync(file, html); changed++; }
}

console.log(`Cloudflare Web Analytics tag applied to ${changed} file(s).`);
if (missingBody.length) {
  console.log(`\n${missingBody.length} file(s) had no "</body>" to anchor on, skipped:`);
  for (const m of missingBody) console.log("  " + m);
}
