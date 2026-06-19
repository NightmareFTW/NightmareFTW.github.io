/* The Outlast Trials — trials & maps scraper.
   Pulls each Trial's environment + step-by-step objectives and each map's
   screenshot from the Outlast Wiki (Fandom MediaWiki API; the HTML is bot-
   blocked but the API and image CDN are not). Writes data/outlast-trials/
   trials.json (one entry per map, newest map order). Node 18+, no deps. */

const fs = require("fs");
const path = require("path");

const API = "https://outlast.fandom.com/api.php";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT = path.join(__dirname, "..", "data", "outlast-trials", "trials.json");

const TRIALS = ["Kill the Snitch", "Cleanse the Orphans", "Grind the Bad Apples", "Pervert the Futterman",
  "Vindicate the Guilty", "Kill the Politician", "Pleasure the Prosecutor", "Liquidate the Union",
  "Silence the Idol", "Poison the Medicine", "Despoil the Auction", "Rebirth", "Escape"];
// Display order (roughly by release).
const ENV_ORDER = ["Police Station", "Orphanage", "Fun Park", "Toy Factory", "Courthouse", "Shopping Mall",
  "Downtown", "The Suburbs", "Television Studio", "The Docks", "Resort", "Mansion", "Waste Tunnel"];

async function api(params) {
  const u = API + "?" + new URLSearchParams({ format: "json", ...params });
  return await (await fetch(u, { headers: { "User-Agent": UA } })).json();
}
const dewiki = (s = "") => s.replace(/\{\{[\s\S]*?\}\}/g, "").replace(/<ref[\s\S]*?<\/ref>/g, "").replace(/<ref[^>]*\/>/g, "")
  .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/'''?/g, "").replace(/<[^>]+>/g, "").trim();
const field = (w, name) => { const m = w.match(new RegExp("\\|\\s*(?:" + name + ")\\s*=\\s*([\\s\\S]*?)(?:\\n\\s*\\||\\n\\}\\})", "i")); return m ? m[1] : ""; };
const bullets = (s) => dewiki(s).split(/\n?\s*\*+\s*/).map((x) => x.trim()).filter(Boolean);

async function wikitext(title) {
  const j = await api({ action: "parse", page: title, prop: "wikitext" });
  return ((j.parse || {}).wikitext || {})["*"] || "";
}

async function run() {
  const byEnv = {};
  for (const t of TRIALS) {
    const w = await wikitext(t);
    if (!w) continue;
    const env = dewiki(field(w, "environment|map|location")).split("\n")[0].trim();
    // Lead paragraph only: drop infoboxes/templates, then cut at the first
    // ==Section== heading so wiki markup doesn't leak into the intro.
    const lead = w.replace(/\{\{[\s\S]*?\}\}/g, " ").split(/\n==/)[0];
    const intro = dewiki(lead).replace(/==.*?==/g, "").replace(/\s+/g, " ").trim().slice(0, 240);
    const objectives = bullets(field(w, "objectives?")).slice(0, 14);
    if (!env) continue;
    (byEnv[env] = byEnv[env] || []).push({ name: t, intro, objectives });
  }

  // Map screenshots in one query.
  const imgs = {};
  const j = await api({ action: "query", prop: "pageimages", piprop: "original", titles: ENV_ORDER.join("|"), redirects: "1" });
  for (const k in (j.query || {}).pages) {
    const p = j.query.pages[k];
    if (p.original) imgs[p.title] = p.original.source.replace(/\/revision.*$/, "");
  }

  const maps = ENV_ORDER.filter((e) => byEnv[e] || imgs[e]).map((env) => ({ name: env, img: imgs[env] || "", trials: byEnv[env] || [] }));
  if (!maps.some((m) => m.trials.length)) throw new Error("no trials parsed — keeping previous file");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://outlast.fandom.com", maps }, null, 2));
  console.log(`Wrote ${maps.length} maps, ${maps.reduce((n, m) => n + m.trials.length, 0)} trials, ${maps.filter((m) => m.img).length} images.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
