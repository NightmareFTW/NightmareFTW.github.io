/* Disney Dreamlight Valley — items / resources scraper.
   Merges several Dreamlight Valley Wiki tables into data/dreamlight-valley/items.json:
   - Ingredients (cooking ingredients: category, prices, energy, grow time)
   - Gems (gems, minerals & ores: sell price, location)
   - Fish (sell price, energy, location)
   Every entry gets a biome list and a best-effort DLC tag.
   Best-effort HTML scrape; re-run if a source's layout changes.
   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");
const { translateName } = require("./ddv-translate");

const SRC = {
  ingredients: "https://dreamlightvalleywiki.com/Ingredients",
  gems: "https://dreamlightvalleywiki.com/Gems",
  fish: "https://dreamlightvalleywiki.com/Fish",
  flowers: "https://dreamlightvalleywiki.com/Foraging",
};

// Core crafting materials (woods, ores, refined goods) — finite & well known.
const MATERIALS = [
  ["Softwood", "Shake or chop trees in most biomes"],
  ["Hardwood", "Forest of Valor, Sunlit Plateau, Forgotten Lands, Eternity Isle"],
  ["Stone", "Mining rock nodes (all biomes)"],
  ["Clay", "Mining nodes near water"],
  ["Sand", "Dazzle Beach"],
  ["Glass", "Crafted from Sand + Coal Ore"],
  ["Iron Ore", "Mining nodes (most biomes)"],
  ["Iron Ingot", "Crafted from Iron Ore + Coal Ore"],
  ["Coal Ore", "Mining (Dazzle Beach, Sunlit Plateau, Glittering Dunes)"],
  ["Fiber", "Picked from plant stems while foraging"],
  ["Cloth", "Crafted from Fiber"],
  ["Rope", "Crafted from Fiber"],
  ["Niobium", "Mining (Sunlit Plateau)"],
  ["Cobalt", "Mining (Frosted Heights)"],
  ["Pearl", "Fishing the dark/gold ripples"],
  ["Seashell", "Dazzle Beach shoreline"],
  ["Sponge", "Dazzle Beach underwater"],
  ["Empty Vial", "Crafted from Glass"],
];
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "items.json");

const clean = (s) => s.replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&#160;|&nbsp;/g, " ")
  .replace(/\s+/g, " ").trim();
const num = (s) => parseInt(clean(s).replace(/[^\d]/g, ""), 10) || 0;

const BIOMES = [
  "Peaceful Meadow", "Dazzle Beach", "Forest of Valor", "Glade of Trust",
  "Sunlit Plateau", "Frosted Heights", "Forgotten Lands", "Wild Tangle",
  "Glittering Dunes", "Overlook", "The Promenade", "The Docks", "The Grasslands",
  "Ancient's Landing", "Moana Realm",
];
const biomesIn = (text) => BIOMES.filter((b) => text.includes(b));
const ETERNITY_ISLE = new Set([
  "Wild Tangle", "Glittering Dunes", "The Promenade", "The Docks",
  "The Grasslands", "Ancient's Landing", "The Overlook",
]);
const dlcOf = (biomes) =>
  biomes.length && biomes.every((b) => ETERNITY_ISLE.has(b)) ? "A Rift in Time" : null;

async function fetchTables(url) {
  const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 NightmareFTW-bot" } })).text();
  return (html.match(/<table[\s\S]*?<\/table>/g) || []).map((t) =>
    (t.match(/<tr[\s\S]*?<\/tr>/g) || []).map((tr) =>
      [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1])));
}

// Pick the data table whose header row contains all `cols` keywords; prefer most rows.
function pickTable(tables, cols) {
  return tables
    .filter((rows) => rows.length > 2 && cols.every((k) => clean((rows[0] || []).join(" ")).toLowerCase().includes(k.toLowerCase())))
    .sort((a, b) => b.length - a.length)[0];
}

const isLimited = (text) => /seasonal|star ?path|limited|event|valentine|halloween|festive|lunar/i.test(text);
const mk = (name, category, sell, location, extra = {}) => {
  const biomes = biomesIn(location);
  return { name, name_pt: translateName(name), category, sell, energy: extra.energy || 0, growTime: extra.growTime || "—", location: location || "—", source: extra.source || "—", biomes, dlc: dlcOf(biomes), limited: extra.limited || isLimited(location) };
};

async function run() {
  const rows = [];

  // ---- Ingredients ----
  const ingTables = await fetchTables(SRC.ingredients);
  const ing = pickTable(ingTables, ["Cooking Category"]) || ingTables[0];
  for (const c of ing || []) {
    if (c.length < 11) continue;
    const name = clean(c[1]);
    if (!name || /^name$/i.test(name)) continue;
    const location = clean(c[9]) || "—", source = clean(c[10]) || "—";
    const biomes = biomesIn(`${location} ${source}`);
    rows.push({ name, name_pt: translateName(name), category: clean(c[2]), sell: num(c[4]), energy: num(c[5]), growTime: clean(c[6]) || "—", location, source, biomes, dlc: dlcOf(biomes), limited: isLimited(`${location} ${source}`) });
  }

  // ---- Gems / minerals (Image | Name | Sell Price | Location) ----
  const gemTable = pickTable(await fetchTables(SRC.gems), ["Name", "Location"]);
  for (const c of gemTable || []) {
    if (c.length < 4) continue;
    const name = clean(c[1]);
    if (!name || /^name$/i.test(name)) continue;
    rows.push(mk(name, "Gem / Mineral", num(c[2]), clean(c[3]), { source: "Mining" }));
  }

  // ---- Fish (Image | Name | Sell | Energy | Ripples | Locations | …) ----
  const fishTable = pickTable(await fetchTables(SRC.fish), ["Name", "Ripples", "Locations"]);
  for (const c of fishTable || []) {
    if (c.length < 6) continue;
    const name = clean(c[1]);
    if (!name || /^name$/i.test(name)) continue;
    rows.push(mk(name, "Fish", num(c[2]), clean(c[5]), { energy: num(c[3]), source: "Fishing" }));
  }

  // ---- Flowers / foraging (Image | Name | Sell Price | Max Spawns | Location) ----
  const flowerTable = pickTable(await fetchTables(SRC.flowers), ["Name", "Location"]);
  for (const c of flowerTable || []) {
    if (c.length < 5) continue;
    const name = clean(c[1]);
    if (!name || /^name$/i.test(name)) continue;
    rows.push(mk(name, "Flower", num(c[2]), clean(c[c.length - 1]), { source: "Foraging" }));
  }

  // ---- Crafting materials (curated: woods, ores, refined goods) ----
  for (const [name, location] of MATERIALS) {
    rows.push(mk(name, "Crafting Material", 0, location, { source: "Gathering / crafting" }));
  }

  // De-dupe by name (first source wins → richer ingredient data kept).
  const seen = new Set();
  const unique = rows.filter((r) => (seen.has(r.name) ? false : seen.add(r.name)));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: SRC.ingredients, count: unique.length, items: unique }));
  const byCat = {};
  unique.forEach((r) => (byCat[r.category] = (byCat[r.category] || 0) + 1));
  console.log(`Wrote ${unique.length} items. By category:`, byCat);
}

run().catch((e) => { console.error(e); process.exit(1); });
