/* Disney Dreamlight Valley — items / resources scraper.
   Merges several Dreamlight Valley Fandom wiki collection pages into
   data/dreamlight-valley/items.json:
   - Ingredients (cooking ingredients, grouped by food category)
   - Gems (gems & minerals: sell price, location)
   - Fish (sell price, energy, biomes, catch conditions)
   - Foraging (flowers, sell price, location)
   - Crafting materials
   Every entry gets a biome list and a best-effort DLC tag.
   Best-effort wikitext scrape; re-run if a source's layout changes.
   Node 18+, no dependencies. */

const fs = require("fs");
const path = require("path");
const { translateName } = require("./ddv-translate");
const { officialName } = require("./ddv-official");
const { wikitext, imageUrls, clean, sections, tables, parseTable, fileAndName } = require("./lib/ddv-fandom");
// Official in-game PT-BR name when the game has one, else the best-effort translator.
const ptName = (name) => officialName(name) || translateName(name);

// Official PT-BR region/biome names + location terms, from the game's LocDB.
let LOC = { biomes: {}, terms: {} };
try { LOC = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dreamlight-valley", "locations-pt.json"), "utf8")); } catch { /* keep empty */ }
const LOC_PAIRS = [...Object.entries(LOC.biomes || {}), ...Object.entries(LOC.terms || {})]
  .sort((a, b) => b[0].length - a[0].length);
function translateLocation(s) {
  if (!s) return s;
  let out = s;
  for (const [en, pt] of LOC_PAIRS) {
    const esc = en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = /[A-Za-z0-9]$/.test(en) ? new RegExp("\\b" + esc + "\\b", "g") : new RegExp(esc, "g");
    out = out.replace(re, pt);
  }
  return out;
}

// Core crafting materials (woods, ores, refined goods) — finite & well known,
// kept as a curated fallback so these always exist even if a scrape misses them.
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
  ["Rope", "Crafted from Fiber"],
  ["Pearl", "Fishing the dark/gold ripples"],
  ["Empty Vial", "Crafted from Glass"],
  ["Dark Wood", "Shake trees in Glade of Trust & Forest of Valor"],
  ["Dry Wood", "Shake trees in Dazzle Beach, Sunlit Plateau & Forgotten Lands"],
  ["Dream Shard", "Mining nodes, dig spots & fishing (all biomes, rare)"],
  ["Gold Nugget", "Mining (Forgotten Lands, Sunlit Plateau)"],
  ["Brick", "Crafted from Clay + Coal Ore"],
  ["Gold Ingot", "Crafted from Gold Nugget + Coal Ore"],
  ["Tinkering Parts", "Found while digging & in chests"],
  ["Soil", "Digging spots (all biomes)"],
  ["Vitalys Crystal", "Mining (Wild Tangle, Eternity Isle)"],
  ["Limestone", "Mining (The Grasslands, Eternity Isle)"],
  ["Marble", "Mining (Ancient's Landing, Eternity Isle)"],
  ["Snowball", "Frosted Heights"],
];
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "items.json");

const num = (s) => parseInt(clean(s).replace(/[^\d]/g, ""), 10) || 0;
// Strip footnote refs and stray trailing punctuation from item names.
const sname = (n) => clean(n).replace(/\[\d+\]/g, "").replace(/\s*[.•·*]+\s*$/, "").trim();

// Each DLC realm and the biomes that belong to it. An item whose only known
// biomes all fall inside one realm is tagged with that realm's DLC.
const REGIONS = [
  { dlc: "A Rift in Time", biomes: ["Wild Tangle", "Glittering Dunes", "The Promenade", "The Docks", "The Grasslands", "Ancient's Landing", "The Overlook", "Overlook", "The Wastes", "The Oasis", "The Borderlands", "The Plains"] },
  { dlc: "Storybook Vale", biomes: ["The Bind", "Mythopia", "Everafter", "Stardust Port", "Dream Castle", "The Library of Lore"] },
  { dlc: "Wishblossom Mountains", biomes: ["Wishing Alps", "Glamour Gulch", "Pixie Acres"] },
  { dlc: "Mount Olympus", biomes: ["Mount Olympus", "The Elysian Fields", "The Statue's Shadow", "The Fiery Plains"] },
];
const BIOMES = [
  "Peaceful Meadow", "Dazzle Beach", "Forest of Valor", "Glade of Trust",
  "Sunlit Plateau", "Frosted Heights", "Forgotten Lands", "Moana Realm", "Plaza",
  ...REGIONS.flatMap((r) => r.biomes),
];
const biomesIn = (text) => BIOMES.filter((b) => text.includes(b));
const dlcOf = (biomes) => {
  if (!biomes.length) return null;
  for (const r of REGIONS) {
    const set = new Set(r.biomes);
    if (biomes.every((b) => set.has(b))) return r.dlc;
  }
  return null;
};
const isLimited = (text) => /seasonal|star ?path|limited|event|valentine|halloween|festive|lunar/i.test(text);

const mk = (name, category, sell, location, extra = {}) => {
  const biomes = biomesIn(location);
  return {
    name, name_pt: ptName(name), category, sell, energy: extra.energy || 0, growTime: extra.growTime || "—",
    location: location || "—", location_pt: translateLocation(location || "—"),
    source: extra.source || "—", source_pt: translateLocation(extra.source || "—"),
    img: extra.file || "", biomes, dlc: dlcOf(biomes), limited: extra.limited || isLimited(location) || isLimited(name),
  };
};

// Pull every wikitable row off a collection page: auto-detects the
// name/acquisition/biome/energy/sell columns by header keyword and uses the
// section heading as the item's category (collection pages are already
// grouped that way — e.g. Ingredients (collection) has one table per food
// group). Returns raw rows (name/file/category/location/energy/sell) —
// callers turn those into the final item shape with mk().
function rowsFromPage(page, { category: fixedCategory, source } = {}) {
  const wt = wikitext(page);
  const out = [];
  for (const { heading, body } of sections(wt)) {
    for (const t of tables(body)) {
      const { headers, rows } = parseTable(t);
      if (!headers.length) continue;
      const hdr = headers.map((h) => h.toLowerCase());
      const nameI = hdr.findIndex((h) => /ingredient|item|^name$/.test(h));
      if (nameI < 0) continue;
      const acqI = hdr.findIndex((h) => /acquisition|found/.test(h));
      const biomeI = hdr.findIndex((h) => /biome|location/.test(h));
      const condI = hdr.findIndex((h) => /condition/.test(h));
      const enI = hdr.findIndex((h) => /energy/.test(h));
      const sellI = hdr.findIndex((h) => /sell/.test(h));
      for (const r of rows) {
        const { file, name: linkedName } = fileAndName(r[nameI] || "");
        const name = sname(linkedName || r[nameI] || "");
        if (!name || /^name$/i.test(name)) continue;
        const location = [biomeI, acqI, condI].filter((i) => i >= 0).map((i) => clean(r[i] || "")).filter(Boolean).join(", ");
        out.push({
          name, file, category: fixedCategory || heading || "Item",
          location, source: source || "—",
          energy: enI >= 0 ? num(r[enI]) : 0, sell: sellI >= 0 ? num(r[sellI]) : 0,
        });
      }
    }
  }
  return out;
}

async function run() {
  const rows = [];

  for (const r of rowsFromPage("Ingredients (collection)", { source: "Gardening / Foraging" })) {
    rows.push(mk(r.name, r.category, r.sell, r.location, { source: r.source, energy: r.energy, file: r.file }));
  }
  for (const r of rowsFromPage("Gems", { category: "Gem / Mineral", source: "Mining" })) {
    rows.push(mk(r.name, r.category, r.sell, r.location, { source: r.source, file: r.file }));
  }
  for (const r of rowsFromPage("Fish (collection)", { category: "Fish", source: "Fishing" })) {
    rows.push(mk(r.name, r.category, r.sell, r.location, { source: r.source, energy: r.energy, file: r.file }));
  }
  for (const r of rowsFromPage("Foraging (collection)", { source: "Foraging" })) {
    rows.push(mk(r.name, r.category, r.sell, r.location, { source: r.source, file: r.file }));
  }
  for (const r of rowsFromPage("Crafting", { category: "Crafting Material", source: "Crafting" })) {
    rows.push(mk(r.name, r.category, r.sell, r.location, { source: r.source, file: r.file }));
  }

  // Fallback curated materials (ensures core woods/ores exist even if scrape misses them).
  for (const [name, location] of MATERIALS) {
    rows.push(mk(name, "Crafting Material", 0, location, { source: "Gathering / crafting" }));
  }

  // De-dupe by name (first source wins → richer data kept).
  const seen = new Set();
  const unique = rows.filter((r) => (seen.has(r.name) ? false : seen.add(r.name)));
  if (unique.length < 100) throw new Error(`only ${unique.length} items parsed — keeping previous file`);

  const urls = imageUrls(unique.map((r) => r.img));
  for (const r of unique) r.img = urls[r.img] || "";

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const catCount = (file) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dreamlight-valley", file), "utf8")).count || 0; } catch { return 0; } };
  fs.writeFileSync(OUT, JSON.stringify({
    updated: new Date().toISOString(), source: "https://disneydreamlightvalley.fandom.com/wiki/Ingredients_(collection)",
    count: unique.length, furnitureCount: catCount("furniture.json"), clothingCount: catCount("clothing.json"),
    biomesPt: LOC.biomes || {}, items: unique,
  }));
  const byCat = {};
  unique.forEach((r) => (byCat[r.category] = (byCat[r.category] || 0) + 1));
  console.log(`Wrote ${unique.length} items. By category:`, byCat);
}

run().catch((e) => require("./lib/keep")(OUT, e));
