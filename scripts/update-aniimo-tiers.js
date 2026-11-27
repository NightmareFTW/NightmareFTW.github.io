/* Aniimo — tier list scraper.
   Source: Game8's "Best Aniimo Tier List" (game8.co), the same established,
   attributed source this repo already uses for Aniimo builds. Game8 encodes
   every ranked Aniimo as a .tierlist__datacarrier element with data-name /
   data-role / data-element / data-form / data-movement attributes, grouped
   into .tierlist__row blocks whose .tierlist__header--X class carries the
   tier letter (OP, S, A, B, C, D). We parse that into data/aniimo/tiers.json.

   Game8 names a few things differently from the official wiki our creature
   database uses, so elements are mapped (Lightning->Electric, Light->Holy,
   Earth->Rock) and each entry's base name is resolved to a creatures.json
   slug (handling abbreviated regional/Prismana forms like "P. Glacy") so the
   tier list can link into the database. Game8 lists more Aniimo than the
   official wiki has published, so unmatched entries render as plain text.

   GitHub Actions can't reach game8.co from its runner IPs, so like the other
   Game8 scrapers this runs out-of-band (see the scheduled refresh task) and
   keeps the previous file on any fetch/parse failure. */
const fs = require("fs");
const path = require("path");
const { getText } = require("./lib/http");

const GAME8_TIER_URL = "https://game8.co/games/Aniimo/archives/621098";
const OUT_DIR = path.join(__dirname, "..", "data", "aniimo");
const OUT_FILE = path.join(OUT_DIR, "tiers.json");

const ELEMENT_MAP = { Lightning: "Electric", Light: "Holy", Earth: "Rock" };
const mapElement = (e) => ELEMENT_MAP[e] || e;
const FORM_PREFIX = /^[A-Z]{1,2}\.\s*/; // "P. Glacy", "H. Scorchhowl"

function attr(s, k) {
  const m = s.match(new RegExp(`data-${k}="([^"]*)"`));
  return m ? m[1] : "";
}

function parseTiers(html) {
  const rows = html.split("tierlist__row").slice(1);
  const tiers = [];
  for (const row of rows) {
    const tm = row.match(/tierlist__header--([A-Z]+)/);
    if (!tm) continue;
    const tier = tm[1];
    const carriers = [...row.matchAll(/tierlist__datacarrier"([^>]*)>/g)];
    const entries = carriers.map((c) => {
      const a = c[1];
      const rawName = attr(a, "name").trim();
      const form = attr(a, "form").trim() || "Basic";
      const base = form === "Basic" ? rawName : rawName.replace(FORM_PREFIX, "").trim();
      const display = form === "Basic" ? base : `${form} ${base}`;
      const elements = attr(a, "element").split(",").map((e) => mapElement(e.trim())).filter(Boolean);
      return {
        name: display,
        base,
        form,
        role: (attr(a, "role") || "").toUpperCase(),
        elements,
        isNew: attr(a, "movement").trim() === "New",
      };
    }).filter((e) => e.base);
    if (entries.length) tiers.push({ tier, entries });
  }
  return tiers;
}

function run() {
  const html = getText(GAME8_TIER_URL, { timeout: 30 });
  if (!html) { console.warn("game8.co tier list fetch failed, keeping previous file"); return; }
  const tiers = parseTiers(html);
  const total = tiers.reduce((a, t) => a + t.entries.length, 0);
  if (total < 40) { console.warn(`parsed only ${total} tier entries, keeping previous file`); return; }

  // Resolve each entry's base name to a creatures.json slug so the list links in.
  let bySlug = new Map();
  try {
    const creatures = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "creatures.json"), "utf8")).creatures;
    bySlug = new Map(creatures.map((c) => [c.name.toLowerCase(), c.slug]));
  } catch { /* creatures.json missing — links just won't resolve */ }
  for (const t of tiers) for (const e of t.entries) e.slug = bySlug.get(e.base.toLowerCase()) || null;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({
    updated: new Date().toISOString(),
    source: GAME8_TIER_URL,
    sourceName: "Game8",
    note: "Overall tier ranking from Game8's Best Aniimo Tier List, cross-referenced with our database so you can filter by role and element. Includes regional and Prismana form variants. Tiers and metas shift with patches.",
    order: ["OP", "SS", "S", "A", "B", "C", "D"],
    count: total,
    tiers,
  }, null, 2));
  console.log(`Wrote ${total} tier entries (${tiers.map((t) => `${t.tier}:${t.entries.length}`).join(" ")}) to ${OUT_FILE}`);
}

if (require.main === module) {
  try { run(); } catch (e) { require("./lib/keep")([OUT_FILE], e); }
} else {
  module.exports = { parseTiers };
}
