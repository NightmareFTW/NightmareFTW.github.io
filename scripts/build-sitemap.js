/* Generates sitemap.xml by walking the site's real .html pages.
   Skips non-indexable pages: anything with <meta name="robots" content="noindex">,
   plus build/output dirs (graphify-out), the unlinked design-pilot/, 404 and
   template/partial files. Run it after adding pages: `node scripts/build-sitemap.js`.
   (Also safe to wire into the stamp-assets workflow later.) */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://nightmareftw.github.io";
const SKIP_DIRS = new Set([".git", "node_modules", "graphify-out", "design-pilot", "worker", "scripts"]);
const SKIP_FILES = new Set(["404.html", "google-callback.html"]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith(".html") && !SKIP_FILES.has(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}

const pages = [];
for (const f of walk(ROOT)) {
  const html = fs.readFileSync(f, "utf8");
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
  let rel = path.relative(ROOT, f).split(path.sep).join("/");
  // index.html → directory URL (nicer canonical)
  const loc = rel === "index.html" ? "/" : rel.replace(/\/index\.html$/, "/");
  const url = BASE + (loc.startsWith("/") ? loc : "/" + loc);
  const lastmod = fs.statSync(f).mtime.toISOString().slice(0, 10);
  const priority = url === BASE + "/" ? "1.0" : /\/(index\.html|)$/.test(loc) ? "0.8" : "0.6";
  pages.push({ url, lastmod, priority });
}
pages.sort((a, b) => a.url.localeCompare(b.url));

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map((p) => `  <url><loc>${p.url}</loc><lastmod>${p.lastmod}</lastmod><priority>${p.priority}</priority></url>`).join("\n") +
  "\n</urlset>\n";
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
console.log("Wrote sitemap.xml with", pages.length, "URLs.");
