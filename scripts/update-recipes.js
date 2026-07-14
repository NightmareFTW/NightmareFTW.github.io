/* Disney Dreamlight Valley — recipe scraper.
   Builds the most complete recipe list by combining two guides:
   - Crystal Dreams: the full recipe list incl. DLC (stars + ingredients)
   - Nintendo Life: sell price + energy for the recipes it covers
   Then tags DLC recipes via DLC-only ingredients from items.json.
   Best-effort HTML scrape; re-run if a source's layout changes.
   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");
const { translateName } = require("./ddv-translate");
const { officialName } = require("./ddv-official");
// Official in-game PT-BR name when the game has one, else the best-effort translator.
const ptName = (name) => officialName(name) || translateName(name);

const FULL_LIST = "https://www.crystal-dreams.us/?page_id=13228";
const VALUES = "https://www.nintendolife.com/guides/disney-dreamlight-valley-recipes-ingredients-sell-prices-star-ratings-full-list";
const IMAGES = "https://dreamlightvalleywiki.com/Meals"; // Image + Name per meal
const WIKI = "https://dreamlightvalleywiki.com";
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "recipes.json");

// First <img> URL in a chunk of raw HTML, bumped to a crisper thumb.
const imgUrl = (rawCell) => {
  const m = (rawCell || "").match(/<img[^>]+src="([^"]+)"/);
  if (!m) return "";
  // Resolve the wiki thumb to the original file (other thumb sizes 301-redirect).
  const t = m[1].match(/\/images\/thumb\/(.+?\.(?:png|jpe?g|gif))\/\d+px-/i);
  const u = t ? `/images/${t[1]}` : m[1];
  return u.startsWith("http") ? u : WIKI + u;
};
// "Dreamlight Valley" is the base game; the rest are DLC realms. Normalize the
// wiki's "Eternity Isle" to the DLC pack name used elsewhere on the site.
const dlcOfCollection = (c) => {
  if (!c || /dreamlight valley/i.test(c)) return null;
  if (/eternity isle/i.test(c)) return "A Rift in Time";
  return c;
};
// Map lower-cased meal name -> { img, dlc } from the wiki Meals table (Image,
// Name, ..., Collection columns). Collection is authoritative for the realm.
async function mealMeta() {
  const map = new Map();
  const html = await get(IMAGES);
  for (const t of html.match(/<table[\s\S]*?<\/table>/g) || []) {
    if (!/>\s*Image\s*</i.test(t) || !/Ingredients/i.test(t)) continue;
    for (const tr of t.match(/<tr[\s\S]*?<\/tr>/g) || []) {
      const cells = [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1]);
      if (cells.length < 2) continue;
      const name = clean(cells[1]);
      if (!name || /^name$/i.test(name)) continue;
      const meta = { img: imgUrl(cells[0]), dlc: dlcOfCollection(clean(cells[cells.length - 1])) };
      map.set(name.toLowerCase(), meta);
      map.set(norm(name), meta); // accent/punctuation-insensitive fallback key
    }
  }
  return map;
}

const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&")
  .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
// Accent- & punctuation-insensitive key for matching names across sources.
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const get = async (url) => (await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 NightmareFTW-bot" } })).text());
const rowsOf = (html) => {
  // Parse rows from ALL tables on the page (some guides split into several).
  const tables = html.match(/<table[\s\S]*?<\/table>/g) || [];
  return tables.flatMap((t) => (t.match(/<tr[\s\S]*?<\/tr>/g) || []).map((tr) =>
    [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((m) => clean(m[1]))));
};

async function run() {
  // 1) Full recipe list (stars + ingredients), incl. DLC.
  const recipes = [];
  for (const c of rowsOf(await get(FULL_LIST))) {
    if (c.length < 3) continue;
    const stars = parseInt(c[0], 10);
    if (!Number.isFinite(stars)) continue; // skip header
    const name = c[1].replace(/^\d+\s+/, "").trim();
    if (!name) continue;
    const ingredients = c.slice(2).filter((x) => x && x !== "—").map((n) => ({ q: 1, name: n, name_pt: ptName(n) }));
    recipes.push({ name, name_pt: ptName(name), stars, ingredients, sell: 0, energy: 0 });
  }

  // 2) Sell price + energy from the second guide, merged by name.
  const values = new Map();
  for (const c of rowsOf(await get(VALUES))) {
    if (c.length < 5 || /recipe name/i.test(c[0])) continue;
    values.set(c[0].toLowerCase(), {
      sell: parseInt(c[3].replace(/[^\d]/g, ""), 10) || 0,
      energy: parseInt(c[4].replace(/[^\d]/g, ""), 10) || 0,
    });
  }
  for (const r of recipes) {
    const v = values.get(r.name.toLowerCase());
    if (v) { r.sell = v.sell; r.energy = v.energy; }
  }

  // 3) Authoritative DLC realm + image from the wiki Meals table (by name).
  let meta = new Map();
  try { meta = await mealMeta(); } catch { /* keep empty */ }
  for (const r of recipes) {
    const m = meta.get(r.name.toLowerCase()) || meta.get(norm(r.name));
    r.img = m ? m.img : "";
    r.dlc = m ? m.dlc : null;
  }

  // 4) Fallback DLC tag for recipes the Meals table didn't cover: infer from a
  //    DLC-exclusive ingredient (ignoring staples that also exist base-game).
  try {
    const items = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dreamlight-valley", "items.json"), "utf8")).items || [];
    const GENERIC = new Set(["poultry", "seafood", "fish", "any vegetable", "any fish",
      "vegetable", "fruit", "ham", "egg", "milk", "butter", "cheese", "spice"]);
    const dlcByItem = new Map(items.filter((i) => i.dlc).map((i) => [i.name.toLowerCase(), i.dlc]));
    for (const r of recipes) {
      if (r.dlc || meta.has(r.name.toLowerCase())) continue; // trust the Meals table
      const hit = r.ingredients.map((i) => i.name.toLowerCase())
        .find((n) => dlcByItem.has(n) && !GENERIC.has(n));
      if (hit) r.dlc = dlcByItem.get(hit);
    }
  } catch { /* leave fallbacks untagged */ }

  const seen = new Set();
  const unique = recipes.filter((r) => (seen.has(r.name) ? false : seen.add(r.name)));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: FULL_LIST, count: unique.length, recipes: unique }));
  console.log(`Wrote ${unique.length} recipes (${unique.filter((r) => r.dlc).length} DLC, ${unique.filter((r) => r.sell).length} with values, ${unique.filter((r) => r.img).length} with images).`);
}

run().catch((e) => require("./lib/keep")(OUT, e));
