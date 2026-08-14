/* Disney Dreamlight Valley — animals (critters + companions).
   Two datasets from the Fandom wiki (disneydreamlightvalley.fandom.com):
   - Critters: each wild species with its biome/DLC, favourite food, how to
     approach it, and its colour variants with the weekly day/hour schedule
     (from the Critters page's species table + schedule table).
   - Companions: every obtainable companion grouped by how you get it
     (critter feeding / quest / Star Path / event / Founder's Pack /
     Premium Shop), with images.
   Official PT-BR names attached. Writes data/dreamlight-valley/animals.json.
   Node 18+, no deps. */

const fs = require("fs");
const path = require("path");
const { officialName } = require("./ddv-official");
const { wikitext, imageUrls, clean, sections, tables, parseTable, fileAndName } = require("./lib/ddv-fandom");

const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "animals.json");
const pt = (n) => officialName(n) || n;

const REGIONS = {
  "A Rift in Time": ["Wild Tangle", "Glittering Dunes", "Ancient's Landing", "The Overlook", "Overlook", "The Promenade", "The Docks", "The Grasslands", "The Wastes", "The Oasis", "The Borderlands", "The Plains"],
  "Storybook Vale": ["Everafter", "Mythopia", "The Bind", "The Library of Lore"],
  "Wishblossom Mountains": ["Wishing Alps", "Glamour Gulch", "Pixie Acres"],
  "Mount Olympus": ["Mount Olympus", "The Elysian Fields", "The Statue's Shadow", "The Fiery Plains"],
};
const dlcOf = (biome) => Object.keys(REGIONS).find((d) => REGIONS[d].some((b) => (biome || "").includes(b))) || null;

const DAY_FULL = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

// ---- PT-BR translation of free-text food / approach strings ----
const PHRASES = {
  "Fish and Seafood": "Peixe e Marisco", "Spices & Herbs": "Especiarias e Ervas",
  "Vegetable-Based": "à base de Vegetais", "Dairy and Oil": "Laticínios e Óleo",
  "Meals": "Refeições", "Meal": "Refeição", "Desserts": "Sobremesas", "Dessert": "Sobremesa",
  "Vegetables": "Vegetais", "Vegetable": "Vegetal", "Fruit": "Fruta", "Grains": "Cereais",
  "Spices": "Especiarias", "Herbs": "Ervas", "Seafood": "Marisco", "Gems": "Gemas", "Gem": "Gema",
  "Flowers": "Flores", "Flower": "Flor",
  "Green": "Verdes", "Yellow": "Amarelas", "White": "Brancas", "Red": "Vermelhas", "Blue": "Azuis",
  "Pink": "Cor-de-rosa", "Purple": "Roxas", "Orange": "Laranjas", "Black": "Pretas", "Brown": "Castanhas",
  "For example": "Por exemplo", "No special approaching method.": "Sem método de aproximação especial.",
};
let FOODMAP = null;
function buildFoodMap(officialEntries, texts) {
  const all = texts.join(" | ");
  const relevant = officialEntries.filter(([en]) => all.includes(en));
  const map = {}; for (const [k, v] of [...relevant, ...Object.entries(PHRASES)]) map[k] = v;
  FOODMAP = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
}
function translateFood(s) {
  if (!s || !FOODMAP) return s;
  let out = s.replace(/(\d)\s*-?\s*Star/gi, "$1 estrelas");
  for (const [en, ptt] of FOODMAP) {
    const e = en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(/[a-z0-9]$/i.test(en) ? new RegExp(`\\b${e}\\b`, "gi") : new RegExp(e, "gi"), ptt);
  }
  return out.replace(/\s+([,.;])/g, "$1").replace(/\s+/g, " ").trim();
}

const SOURCE_BY_HEADING = {
  "Critter Companions": "Critter",
  "Quest Reward Companions": "Quest Reward",
  "Star Path Reward Companions": "Star Path",
  "Events Reward Companions": "Event",
  "Editions Pack Reward Companions": "Founder's Pack",
  "Premium Shop Companions": "Premium",
};

function parseCompanions(wt) {
  const companions = [];
  const seen = new Set();
  const fileByName = {};
  for (const { heading, body } of sections(wt)) {
    const source = SOURCE_BY_HEADING[heading];
    if (!source) continue;
    for (const t of tables(body)) {
      const { rows } = parseTable(t);
      for (const r of rows) {
        const { file, name } = fileAndName(r[0] || "");
        if (!name || seen.has(name)) continue;
        seen.add(name);
        if (file) fileByName[name] = file;
        const obtain = r.slice(1).map(clean).filter(Boolean).join(" · ");
        companions.push({ name, name_pt: pt(name), img: file || `${name}.png`, source, obtain });
      }
    }
  }
  return { companions, fileByName };
}

function parseCritters(wt, fileByName) {
  const allTables = tables(wt);
  const speciesT = parseTable(allTables[0] || "");
  const scheduleT = parseTable(allTables[1] || "");

  const species = speciesT.rows.map((r) => {
    const { name } = fileAndName(r[0] || "");
    return {
      name, name_pt: pt(name), biome: clean(r[1] || ""), dlc: null,
      favoriteFood: clean(r[2] || ""), feeding: clean(r[3] || ""),
      img: fileByName[name] || (name ? `${name}.png` : ""), variants: [],
    };
  }).filter((s) => s.name);

  const singular = (n) => n.replace(/Geese/i, "Goose").replace(/Pegasi/i, "Pegasus").replace(/xes$/i, "x").replace(/ies$/i, "y").replace(/([^u])s$/i, "$1");
  const dayCols = scheduleT.headers.map((h, i) => ({ h, i })).filter(({ h }) => DAY_FULL[h]);
  for (const r of scheduleT.rows) {
    const vname = clean(r[0] || "");
    if (!vname) continue;
    const vbiome = clean(r[1] || "");
    const schedule = dayCols.map(({ h, i }) => ({ day: DAY_FULL[h], hours: clean(r[i] || "") })).filter((s) => s.hours);
    const variant = { name: vname, name_pt: pt(vname), img: fileByName[vname] || `${vname}.png`, schedule };
    const key = singular(vname.split(" ").slice(0, -1).join(" ") || vname);
    const sp = species.find((s) => {
      const skey = singular(s.name).split(" ").pop();
      return skey && new RegExp(`\\b${skey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(vname);
    });
    if (sp) {
      sp.variants.push(variant);
      // Species-table biome is a jumbled multi-location blurb for groups that
      // span several regions (Monkeys, Capybaras, Cobras, Owls, Pegasi, Baby
      // Dragons) — the schedule table's per-variant biome is clean, so prefer
      // it as soon as we see one.
      if (vbiome && (!sp._cleanBiome || sp.biome.length > 60)) { sp.biome = vbiome; sp._cleanBiome = true; }
    }
  }
  for (const s of species) { delete s._cleanBiome; s.dlc = dlcOf(s.biome); }
  return species;
}

async function run() {
  let compWt = "", crittersWt = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) { console.warn(`animals: retrying wiki fetch (${attempt}/3)…`); await new Promise((r) => setTimeout(r, 3000 * attempt)); }
    compWt = wikitext("Companions");
    crittersWt = wikitext("Critters");
    if (compWt && crittersWt) break;
  }

  const { companions, fileByName } = parseCompanions(compWt);
  const species = parseCritters(crittersWt, fileByName);
  if (!species.length) throw new Error("no critters parsed — keeping previous file");

  // ---- Translate the free-text food / approach strings to official PT-BR ----
  try {
    const officialEntries = Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dreamlight-valley", "official-ptbr.json"), "utf8")));
    const texts = species.flatMap((s) => [s.favoriteFood, s.feeding]);
    buildFoodMap(officialEntries, texts);
    for (const s of species) { s.favoriteFood_pt = translateFood(s.favoriteFood); s.feeding_pt = translateFood(s.feeding); }
  } catch (e) { console.warn("food translation skipped:", e.message); }

  // ---- Resolve every image filename (species, variants, companions) in one batch ----
  const allFiles = [
    ...species.map((s) => s.img), ...species.flatMap((s) => s.variants.map((v) => v.img)),
    ...companions.map((c) => c.img),
  ];
  const urls = imageUrls(allFiles);
  for (const s of species) {
    s.img = urls[s.img] || "";
    for (const v of s.variants) v.img = urls[v.img] || "";
    if (!s.img && s.variants[0]) s.img = s.variants[0].img; // group icon fallback (species itself has no wiki image)
  }
  for (const c of companions) c.img = urls[c.img] || "";

  const withVars = species.filter((s) => s.variants.length);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://disneydreamlightvalley.fandom.com/wiki/Critters", critters: species, companions }));
  console.log(`Wrote ${species.length} critter species (${withVars.length} with variants, ${species.reduce((n, s) => n + s.variants.length, 0)} variants) + ${companions.length} companions.`);
}

run().catch((e) => require("./lib/keep")(OUT, e));
