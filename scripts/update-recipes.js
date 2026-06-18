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

const FULL_LIST = "https://www.crystal-dreams.us/?page_id=13228";
const VALUES = "https://www.nintendolife.com/guides/disney-dreamlight-valley-recipes-ingredients-sell-prices-star-ratings-full-list";
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "recipes.json");

const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&")
  .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
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
    const ingredients = c.slice(2).filter((x) => x && x !== "—").map((n) => ({ q: 1, name: n, name_pt: translateName(n) }));
    recipes.push({ name, name_pt: translateName(name), stars, ingredients, sell: 0, energy: 0 });
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

  // 3) Tag DLC recipes via DLC-only ingredients from items.json.
  try {
    const items = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dreamlight-valley", "items.json"), "utf8")).items || [];
    // Generic/staple ingredients exist in the base game too — ignore them so a
    // base recipe isn't mis-tagged DLC just because the wiki lists one DLC source.
    const GENERIC = new Set(["poultry", "seafood", "fish", "any vegetable", "any fish",
      "vegetable", "fruit", "ham", "egg", "milk", "butter", "cheese", "spice"]);
    const dlcByItem = new Map(items.filter((i) => i.dlc).map((i) => [i.name.toLowerCase(), i.dlc]));
    for (const r of recipes) {
      const hit = r.ingredients.map((i) => i.name.toLowerCase())
        .find((n) => dlcByItem.has(n) && !GENERIC.has(n));
      r.dlc = hit ? dlcByItem.get(hit) : null;
    }
  } catch { recipes.forEach((r) => (r.dlc = null)); }

  const seen = new Set();
  const unique = recipes.filter((r) => (seen.has(r.name) ? false : seen.add(r.name)));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: FULL_LIST, count: unique.length, recipes: unique }));
  console.log(`Wrote ${unique.length} recipes (${unique.filter((r) => r.dlc).length} DLC, ${unique.filter((r) => r.sell).length} with values).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
