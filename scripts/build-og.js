/* Injects per-page Open Graph + Twitter Card tags into every game/tool page,
   derived from data.js (GAMES): a tool page gets the tool's name + description
   and its game's banner; a game landing gets the game's name + blurb + banner;
   any other game sub-page falls back to game-level tags. The homepage keeps its
   own hand-written tags (index.html is skipped). Idempotent — re-running
   replaces the block between the <!--og--> markers. Run after adding pages:
   `node scripts/build-og.js`. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://nightmareftw.github.io";

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/js/data.js"), "utf8") + "\n;this.__G = GAMES;", ctx);
const GAMES = ctx.__G;
const byId = (id) => GAMES.find((g) => g.id === id) || null;
const toolByHref = {};
GAMES.forEach((g) => g.tools.forEach((t) => { if (t.href) toolByHref[t.href.replace(/^\/+/, "")] = { g, t }; }));

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const abs = (p) => BASE + "/" + String(p).replace(/^\/+/, "");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(path.join(ROOT, "games"))) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/"); // games/<id>/<page>.html
  const m = rel.match(/^games\/([^/]+)\/(.+)\.html$/);
  if (!m) continue;
  const id = m[1], base = m[2];
  const game = byId(id);
  if (!game) continue;

  let title, desc;
  const hit = toolByHref[rel];
  if (hit) { title = hit.t.name + " · " + game.name; desc = hit.t.desc || game.blurb; }
  else if (base === "index") { title = game.name + " · NightmareFTW — tools"; desc = game.blurb; }
  else { title = game.name + " · NightmareFTW"; desc = game.blurb; }

  const image = abs(game.banner);
  const url = BASE + "/" + rel.replace(/\/index\.html$/, "/");
  const block =
    "<!--og-->\n" +
    `  <meta property="og:type" content="website">\n` +
    `  <meta property="og:site_name" content="NightmareFTW">\n` +
    `  <meta property="og:url" content="${esc(url)}">\n` +
    `  <meta property="og:title" content="${esc(title)}">\n` +
    `  <meta property="og:description" content="${esc(desc)}">\n` +
    `  <meta property="og:image" content="${esc(image)}">\n` +
    `  <meta name="twitter:card" content="summary_large_image">\n` +
    `  <meta name="twitter:title" content="${esc(title)}">\n` +
    `  <meta name="twitter:description" content="${esc(desc)}">\n` +
    `  <meta name="twitter:image" content="${esc(image)}">\n` +
    "  <!--/og-->";

  let html = fs.readFileSync(file, "utf8");
  let next;
  if (/<!--og-->[\s\S]*?<!--\/og-->/.test(html)) {
    next = html.replace(/<!--og-->[\s\S]*?<!--\/og-->/, block);
  } else {
    // insert right after the </title>
    next = html.replace(/<\/title>/, "</title>\n  " + block);
  }
  if (next !== html) { fs.writeFileSync(file, next); changed++; }
}
console.log("Open Graph tags written/updated on", changed, "game page(s).");
