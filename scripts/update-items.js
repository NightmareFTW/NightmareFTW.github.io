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
const { officialName } = require("./ddv-official");
// Official in-game PT-BR name when the game has one, else the best-effort translator.
const ptName = (name) => officialName(name) || translateName(name);

// Official PT-BR region/biome names + location terms, from the game's LocDB.
let LOC = { biomes: {}, terms: {} };
try { LOC = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dreamlight-valley", "locations-pt.json"), "utf8")); } catch { /* keep empty */ }
// Replace English biome names and common location terms in a free-text "where"
// string with their official PT-BR equivalents (longest match first).
const LOC_PAIRS = [...Object.entries(LOC.biomes || {}), ...Object.entries(LOC.terms || {})]
  .sort((a, b) => b[0].length - a[0].length);
function translateLocation(s) {
  if (!s) return s;
  let out = s;
  for (const [en, pt] of LOC_PAIRS) {
    const esc = en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Word-bounded where the phrase ends in a letter/digit, so short terms
    // (Seed, Stall) don't match inside other words.
    const re = /[A-Za-z0-9]$/.test(en) ? new RegExp("\\b" + esc + "\\b", "g") : new RegExp(esc, "g");
    out = out.replace(re, pt);
  }
  return out;
}

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
  // Woods (shaken/chopped from trees) — the valley has more than just soft/hardwood.
  ["Dark Wood", "Shake trees in Glade of Trust & Forest of Valor"],
  ["Dry Wood", "Shake trees in Dazzle Beach, Sunlit Plateau & Forgotten Lands"],
  // Other gathered / crafted materials.
  ["Dream Shard", "Mining nodes, dig spots & fishing (all biomes, rare)"],
  ["Gold Nugget", "Mining (Forgotten Lands, Sunlit Plateau)"],
  ["Coal Ore", "Mining (Dazzle Beach, Sunlit Plateau, Glittering Dunes)"],
  ["Brick", "Crafted from Clay + Coal Ore"],
  ["Gold Ingot", "Crafted from Gold Nugget + Coal Ore"],
  ["Tinkering Parts", "Found while digging & in chests"],
  ["Soil", "Digging spots (all biomes)"],
  // Eternity Isle (A Rift in Time) materials.
  ["Vitalys Crystal", "Mining (Wild Tangle, Eternity Isle)"],
  ["Limestone", "Mining (The Grasslands, Eternity Isle)"],
  ["Marble", "Mining (Ancient's Landing, Eternity Isle)"],
  // Frosted Heights / seasonal.
  ["Snowball", "Frosted Heights"],
];
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "items.json");

const clean = (s) => s.replace(/<[^>]+>/g, " ")
  .replace(/&#91;/g, "[").replace(/&#93;/g, "]")
  .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&#160;|&nbsp;/g, " ")
  .replace(/\s+/g, " ").trim();
const num = (s) => parseInt(clean(s).replace(/[^\d]/g, ""), 10) || 0;
const WIKI = "https://dreamlightvalleywiki.com";
// First <img> URL found across a row's raw cells, bumped to a crisper thumb.
const imgFrom = (cells) => {
  for (const c of cells) {
    const m = (c || "").match(/<img[^>]+src="([^"]+)"/);
    if (m) {
      // Resolve the wiki thumb to the original file (thumb sizes other than the
      // one in the page aren't pre-generated and 301-redirect).
      const t = m[1].match(/\/images\/thumb\/(.+?\.(?:png|jpe?g|gif))\/\d+px-/i);
      const u = t ? `/images/${t[1]}` : m[1];
      return u.startsWith("http") ? u : WIKI + u;
    }
  }
  return "";
};
// Strip footnote refs ([4]) and stray trailing punctuation from item names.
const sname = (n) => clean(n).replace(/\[\d+\]/g, "").replace(/\s*[.•·*]+\s*$/, "").trim();

// Each DLC realm and the biomes that belong to it. An item whose only known
// biomes all fall inside one realm is tagged with that realm's DLC.
const REGIONS = [
  { dlc: "A Rift in Time", biomes: ["Wild Tangle", "Glittering Dunes", "The Promenade", "The Docks", "The Grasslands", "Ancient's Landing", "The Overlook", "Overlook"] },
  { dlc: "Storybook Vale", biomes: ["The Bind", "Mythopia", "Everafter", "Stardust Port", "Dream Castle"] },
  { dlc: "Wishblossom Mountains", biomes: ["Wishing Alps", "Glamour Gulch", "Pixie Acres"] },
];
const BIOMES = [
  "Peaceful Meadow", "Dazzle Beach", "Forest of Valor", "Glade of Trust",
  "Sunlit Plateau", "Frosted Heights", "Forgotten Lands", "Moana Realm",
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

// Collect rows from EVERY table on a page that has a "Name" column (auto-detects
// the Name / Sell Price / Location columns). Lets us scrape pages whose data is
// split across many tables (e.g. all fish, seasonal + special).
async function collectFrom(url, category, source, require = []) {
  const out = [];
  for (const rows of await fetchTables(url)) {
    const cols = (rows[0] || []).map(clean);
    const hdr = cols.join(" ").toLowerCase();
    if (!hdr.includes("name")) continue;
    if (require.length && !require.every((k) => hdr.includes(k.toLowerCase()))) continue;
    const nameI = Math.max(0, cols.findIndex((c) => /^name$/i.test(c)));
    const sellI = cols.findIndex((c) => /sell/i.test(c));
    const locI = cols.findIndex((c) => /location/i.test(c));
    const enI = cols.findIndex((c) => /energy/i.test(c));
    for (const r of rows.slice(1)) {
      const name = sname(r[nameI] || "");
      if (!name || /^name$/i.test(name)) continue;
      out.push(mk(name, category, sellI >= 0 ? num(r[sellI]) : 0,
        locI >= 0 ? clean(r[locI]) : "—", { source, energy: enI >= 0 ? num(r[enI]) : 0, img: imgFrom(r) }));
    }
  }
  return out;
}

// Collect from a page where each section <h2/h3> precedes one table; only the
// sections named in `map` are kept, labelled with map[heading] as the category.
async function collectByHeading(url, map, source) {
  const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 NightmareFTW-bot" } })).text();
  const out = [];
  for (const part of html.split(/(?=<h[23])/)) {
    const hm = part.match(/<h[23][^>]*>(?:<[^>]+>)*([^<]+)/);
    if (!hm) continue;
    const conf = map[clean(hm[1])];
    if (!conf) continue;
    const cat = typeof conf === "string" ? conf : conf.category;
    const limited = typeof conf === "object" ? !!conf.limited : false;
    const tm = part.match(/<table[\s\S]*?<\/table>/);
    if (!tm) continue;
    const rows = (tm[0].match(/<tr[\s\S]*?<\/tr>/g) || []).map((tr) =>
      [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1]));
    const cols = (rows[0] || []).map(clean);
    const nameI = Math.max(0, cols.findIndex((c) => /^name$/i.test(c)));
    const sellI = cols.findIndex((c) => /sell/i.test(c));
    const locI = cols.findIndex((c) => /location|found/i.test(c));
    const catI = cols.findIndex((c) => /^category$/i.test(c));
    for (const r of rows.slice(1)) {
      const name = sname(r[nameI] || "");
      if (!name || /^name$/i.test(name)) continue;
      const rowCat = (catI >= 0 && clean(r[catI])) ? clean(r[catI]) : cat;
      out.push(mk(name, rowCat, sellI >= 0 ? num(r[sellI]) : 0, locI >= 0 ? clean(r[locI]) : "—", { source, limited, img: imgFrom(r) }));
    }
  }
  return out;
}

const isLimited = (text) => /seasonal|star ?path|limited|event|valentine|halloween|festive|lunar/i.test(text);
const mk = (name, category, sell, location, extra = {}) => {
  const biomes = biomesIn(location);
  return { name, name_pt: ptName(name), category, sell, energy: extra.energy || 0, growTime: extra.growTime || "—", location: location || "—", location_pt: translateLocation(location || "—"), source: extra.source || "—", source_pt: translateLocation(extra.source || "—"), img: extra.img || "", biomes, dlc: dlcOf(biomes), limited: extra.limited || isLimited(location) || isLimited(name) };
};

async function run() {
  const rows = [];

  // ---- Ingredients ----
  const ingTables = await fetchTables(SRC.ingredients);
  const ing = pickTable(ingTables, ["Cooking Category"]) || ingTables[0];
  for (const c of ing || []) {
    if (c.length < 11) continue;
    const name = sname(c[1]);
    if (!name || /^name$/i.test(name)) continue;
    const location = clean(c[9]) || "—", source = clean(c[10]) || "—";
    const biomes = biomesIn(`${location} ${source}`);
    rows.push({ name, name_pt: ptName(name), category: clean(c[2]), sell: num(c[4]), energy: num(c[5]), growTime: clean(c[6]) || "—", location, location_pt: translateLocation(location), source, source_pt: translateLocation(source), img: imgFrom(c), biomes, dlc: dlcOf(biomes), limited: isLimited(`${location} ${source}`) });
  }

  // ---- Gems / minerals (Image | Name | Sell Price | Location) ----
  const gemTable = pickTable(await fetchTables(SRC.gems), ["Name", "Location"]);
  for (const c of gemTable || []) {
    if (c.length < 4) continue;
    const name = sname(c[1]);
    if (!name || /^name$/i.test(name)) continue;
    rows.push(mk(name, "Gem / Mineral", num(c[2]), clean(c[3]), { source: "Mining", img: imgFrom(c) }));
  }

  // ---- Fish (all tables on the Fish page: main + seasonal + special) ----
  rows.push(...await collectFrom(SRC.fish, "Fish", "Fishing", ["ripples"]));

  // ---- Ancient Machines (Eternity Isle) ----
  rows.push(...await collectFrom("https://dreamlightvalleywiki.com/Ancient_Machines", "Ancient Machine", "Eternity Isle crafting", ["hourglass"]));

  // ---- Timebending page: parts, gifts, fragments, furniture (by section) ----
  rows.push(...await collectByHeading("https://dreamlightvalleywiki.com/Timebending", {
    "Timebending Parts": "Timebending Part", "Gifts": "Gift", "Fragments": "Fragment", "Furniture": "Furniture",
  }, "Eternity Isle"));

  // ---- Snippets (bird / demon / frog) ----
  rows.push(...await collectByHeading("https://dreamlightvalleywiki.com/Snippets", {
    "Snippets": "Snippet",
  }, "Snippet catching"));

  // ---- Flowers / foraging (Image | Name | Sell Price | Max Spawns | Location) ----
  const flowerTable = pickTable(await fetchTables(SRC.flowers), ["Name", "Location"]);
  for (const c of flowerTable || []) {
    if (c.length < 5) continue;
    const name = sname(c[1]);
    if (!name || /^name$/i.test(name)) continue;
    rows.push(mk(name, "Flower", num(c[2]), clean(c[c.length - 1]), { source: "Foraging", img: imgFrom(c) }));
  }

  // ---- Crafting page: materials, enchantments, fences & paving (by section) ----
  rows.push(...await collectByHeading("https://dreamlightvalleywiki.com/Crafting", {
    "Materials": "Crafting Material", "Enchantments": "Enchantment", "Fences & Paving": "Fence / Paving",
  }, "Crafting"));

  // ---- Limited-time ingredients (Star Path / event) ----
  rows.push(...await collectByHeading(SRC.ingredients, {
    "Limited Time Ingredients": { category: "Ingredient", limited: true },
  }, "Limited-time"));

  // Fallback curated materials (ensures core woods/ores exist even if scrape misses them).
  for (const [name, location] of MATERIALS) {
    rows.push(mk(name, "Crafting Material", 0, location, { source: "Gathering / crafting" }));
  }

  // De-dupe by name (first source wins → richer ingredient data kept).
  const seen = new Set();
  const unique = rows.filter((r) => (seen.has(r.name) ? false : seen.add(r.name)));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: SRC.ingredients, count: unique.length, biomesPt: LOC.biomes || {}, items: unique }));
  const byCat = {};
  unique.forEach((r) => (byCat[r.category] = (byCat[r.category] || 0) + 1));
  console.log(`Wrote ${unique.length} items. By category:`, byCat);
}

run().catch((e) => { console.error(e); process.exit(1); });
