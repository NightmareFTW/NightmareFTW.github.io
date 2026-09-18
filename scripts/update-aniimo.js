/* Aniimo — creature ("Aniimo") database scraper.

   Source: wiki.aniimo.com — the OFFICIAL wiki, run by the game's own
   developer/publisher (footer links to pawprintstudio.com). robots.txt
   allows crawling everything ("User-agent: * / Allow: /"), and it's the
   canonical source: base stats, skills, traits, mobility, evolution lines,
   habitats and Resonance Training come straight from the game's own data.

   Aniimo launched 2026-09-16, so this wiki (and the game itself) is only a
   couple of days old as of this writing — several fields are placeholders
   in the game's own CMS right now (e.g. per-hero Homeland Ability capsules,
   evolution unlock conditions), so this scraper just passes through
   whatever the source actually has rather than guessing at the rest.

   Technical note: unlike every other scraper in this repo, wiki.aniimo.com
   ships NO server-rendered content — the page's <body> is just Vue
   hydration placeholders. All data lives in a Nuxt 3 "__NUXT_DATA__"
   payload, serialized with devalue's flat array-of-refs format (the same
   thing Nuxt's own `parsePayload()` feeds to devalue's `parse()`). Adding
   the devalue npm package isn't an option (this repo has zero
   dependencies), so `unflattenDevalue()` below is a small, dependency-free
   reimplementation of devalue's unflatten algorithm — verified byte-for-
   byte identical output against the real `devalue.parse()` on this site's
   own payloads. It only supports what this payload actually uses (plain
   objects/arrays/primitives, Date/Set/Map/RegExp/BigInt/null-prototype
   objects, plus Nuxt's Ref/Reactive-family wrapper types, which we just
   unwrap to their inner value since we don't need Vue reactivity here).

   Writes:
   - data/aniimo/creatures.json — every Aniimo (basic form only; this does
     not attempt to also scrape every regional/morphology variant):
     elements, role, stage, base stats, mobility, traits, skills (grouped by
     tab), evolution line, habitats (region names only — no map coordinates;
     see games/aniimo/map.js for why), and Resonance Training.
   - data/aniimo/regions.json — every region name referenced in the
     creatures' own habitats, merged with the official site's own
     name/description/art for the regions it currently showcases (most
     don't have official art yet), plus which Aniimo live in each.

   Run by .github/workflows/update-aniimo.yml (daily, while the game and
   its wiki are still actively filling in). Node 18+, curl, no dependencies. */
const fs = require("fs");
const path = require("path");
const { getText } = require("./lib/http");

const BASE = "https://wiki.aniimo.com";
const SITE = "https://www.aniimo.com";
const OUT_DIR = path.join(__dirname, "..", "data", "aniimo");
const OUT_FILE = path.join(OUT_DIR, "creatures.json");
const OUT_REGIONS = path.join(OUT_DIR, "regions.json");

// A small, hand-checked set of named environmental mechanics tied to a
// specific region, from Game8's Aniimo interactive-map guide (not a scrape
// of Game8's own map-pin dataset — just a few sentences of write-up text,
// attributed below and kept to the regions it actually names).
const GAME8_MAP_URL = "https://game8.co/games/Aniimo/archives/618730";
const REGION_MECHANICS = {
  Mistwoods: [{ name: "Glimmer Tree", description: "Activating one lights up the path in the area." }],
  "Nimbus Fields": [
    { name: "Peculiar Clouds", description: "Enter these to find treasure: your jumps are higher while inside." },
    { name: "Dandelion Tree", description: "Use the dandelions to reach the peak, which may hide a treasure." },
  ],
};
// The map's own marker categories (label only — Game8's legend doesn't give
// a description for most of these, so this is presented as a plain list of
// known point-of-interest types, not per-location coordinates).
const MAP_POI_TYPES = [
  "Bloom", "Branch", "RV Park", "Sanctum", "Nurture", "Morphling's Memory", "Outpost",
  "Pathfinder Challenge", "Elite Pathfinder Challenge", "Lumin Amber", "Lumin Marking",
  "Lumin Collection", "Vein Abundance", "Vein Crevice", "Alpha Aniimo", "Chests",
];

// ---- minimal devalue unflatten (see file header) ---------------------------
const UNDEFINED = -1, HOLE = -2, NAN = -3, POS_INF = -4, NEG_INF = -5, NEG_ZERO = -6, SPARSE = -7;
function unflattenDevalue(values, revivers = {}) {
  const hydrated = Array(values.length);
  function hydrate(index) {
    if (index === UNDEFINED) return undefined;
    if (index === NAN) return NaN;
    if (index === POS_INF) return Infinity;
    if (index === NEG_INF) return -Infinity;
    if (index === NEG_ZERO) return -0;
    if (index in hydrated) return hydrated[index];

    const value = values[index];
    if (!value || typeof value !== "object") { hydrated[index] = value; return value; }

    if (Array.isArray(value)) {
      if (typeof value[0] === "string" && revivers[value[0]] !== undefined) {
        const result = revivers[value[0]](hydrate(value[1]));
        hydrated[index] = result;
        return result;
      }
      if (typeof value[0] === "string") {
        switch (value[0]) {
          case "Date": { const d = new Date(value[1]); hydrated[index] = d; return d; }
          case "Set": { const s = new Set(); hydrated[index] = s; for (let i = 1; i < value.length; i++) s.add(hydrate(value[i])); return s; }
          case "Map": { const mp = new Map(); hydrated[index] = mp; for (let i = 1; i < value.length; i += 2) mp.set(hydrate(value[i]), hydrate(value[i + 1])); return mp; }
          case "RegExp": { const r = new RegExp(value[1], value[2]); hydrated[index] = r; return r; }
          case "BigInt": { const b = BigInt(value[1]); hydrated[index] = b; return b; }
          case "null": {
            const obj = Object.create(null);
            hydrated[index] = obj;
            for (let i = 1; i < value.length; i += 2) obj[value[i]] = hydrate(value[i + 1]);
            return obj;
          }
          default:
            throw new Error(`unflattenDevalue: unsupported type "${value[0]}"`);
        }
      }
      if (value[0] === SPARSE) {
        const arr = new Array(value[1]);
        hydrated[index] = arr;
        for (let i = 2; i < value.length; i += 2) arr[value[i]] = hydrate(value[i + 1]);
        return arr;
      }
      const arr = new Array(value.length);
      hydrated[index] = arr;
      for (let i = 0; i < value.length; i++) { if (value[i] !== HOLE) arr[i] = hydrate(value[i]); }
      return arr;
    }

    const obj = {};
    hydrated[index] = obj;
    for (const k of Object.keys(value)) obj[k] = hydrate(value[k]);
    return obj;
  }
  return hydrate(0);
}
const parseRevivedData = (data) => { try { return JSON.parse(data); } catch { return data; } };
const NUXT_REVIVERS = {
  ShallowReactive: (d) => d, Reactive: (d) => d, Ref: (d) => d, ShallowRef: (d) => d, NuxtError: (d) => d,
  EmptyShallowRef: (d) => (d === "_" ? undefined : d === "0n" ? 0n : parseRevivedData(d)),
};
NUXT_REVIVERS.EmptyRef = NUXT_REVIVERS.EmptyShallowRef;

function parseNuxtPayload(html) {
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return unflattenDevalue(JSON.parse(m[1]), NUXT_REVIVERS); } catch { return null; }
}

// ---- helpers ----------------------------------------------------------------
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const titleCase = (slug) => String(slug || "").replace(/^[a-z]/, (c) => c.toUpperCase());
const attrName = (slug) => titleCase(String(slug || "").replace(/^attributes-/, ""));
const ROLE_NAMES = { dps: "DPS", heal: "HEAL", sup: "SUPPORT", break: "BREAK", energy: "REGEN" };
const roleName = (slug) => ROLE_NAMES[String(slug || "").replace(/^position-/, "")] || titleCase(slug);
const STAGE_NAMES = { 1: "Lumin", 2: "Gamma", 3: "Nova" };
const TYPE_NAMES = { 0: "Support", 1: "Physical", 2: "Magic" };

function simplifyEvolution(node) {
  if (!node) return null;
  return {
    name: node.name || node.label || "",
    icon: node.icon || "",
    stage: node.stage ?? null,
    condition: node.condition && node.condition.list && node.condition.list.length ? node.condition.list : [],
    children: (node.children || []).map(simplifyEvolution),
  };
}

// Resonance Training ships as a raw CMS-authored HTML table (official,
// first-party content) — parsed into plain rows rather than stored as HTML.
function parseResonanceTable(html) {
  if (!html) return [];
  const rows = [];
  for (const rowHtml of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...rowHtml[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]);
    if (cells.length < 3) continue;
    const clean = (s) => s.replace(/<img[^>]*>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    const costText = clean(cells[2]);
    rows.push({ level: clean(cells[0]), condition: clean(cells[1]), cost: costText });
  }
  return rows;
}

function findComponent(components, title) {
  return (components || []).find((c) => c.props && c.props.title === title) || null;
}

function parseCreature(entryId, html) {
  const payload = parseNuxtPayload(html);
  if (!payload || !payload.data) return null;
  const key = Object.keys(payload.data).find((k) => k.startsWith("aniimo-detail-"));
  const detail = key && payload.data[key];
  if (!detail || !detail.searchKey) return null;

  const sk = detail.searchKey;
  const basicInfo = detail.directories.find((d) => d.title === "Basic Info");
  const abilityDir = detail.directories.find((d) => d.title === "Aniimo Ability");
  const trainingDir = detail.directories.find((d) => d.title === "Aniimo Training");

  const formData = (basicInfo && basicInfo.components[0] && basicInfo.components[0].props.formData) || {};
  const habitatsComp = basicInfo && findComponent(basicInfo.components, "Habitats");
  const habitats = habitatsComp ? (habitatsComp.children || []).map((c) => c.props.title).filter(Boolean) : [];
  const evoComp = basicInfo && findComponent(basicInfo.components, "Evolution");
  const evolution = evoComp && evoComp.children[0] ? simplifyEvolution(evoComp.children[0].props.data) : null;

  const mobilityComp = abilityDir && findComponent(abilityDir.components, "Mobility");
  const mobilityNode = mobilityComp && mobilityComp.children[0];
  const mobility = mobilityNode ? { icon: mobilityNode.props.icon, name: mobilityNode.props.descTitle, description: mobilityNode.props.descContent } : null;

  const traitComp = abilityDir && findComponent(abilityDir.components, "Trait");
  const traits = traitComp ? (traitComp.children || []).map((c) => ({ icon: c.props.icon, name: c.props.descTitle, description: c.props.descContent })) : [];

  const skillComp = abilityDir && findComponent(abilityDir.components, "Skill Details");
  const skills = {};
  if (skillComp && skillComp.props.tabs) {
    for (const tab of skillComp.props.tabs) {
      skills[tab.title] = (tab.children || []).map((c) => ({
        icon: c.props.icon,
        name: c.props.descTitle,
        description: c.props.descContent,
        power: c.props.source.power || null,
        cost: c.props.source.consume && c.props.source.consume !== "0" ? c.props.source.consume : null,
        type: TYPE_NAMES[(c.props.source.type || [])[0]] || null,
      }));
    }
  }

  const trainingComp = trainingDir && findComponent(trainingDir.components, "Resonance Training");
  const resonanceTraining = trainingComp && trainingComp.children[0]
    ? parseResonanceTable(trainingComp.children[0].props.modelValue)
    : [];

  return {
    slug: slugify(sk.name),
    entryId,
    number: sk.entryId,
    name: sk.name,
    description: sk.description || "",
    icon: sk.imageUrl || "",
    elements: (sk.attributes || []).map(attrName),
    role: roleName((sk.position || [])[0]),
    stage: STAGE_NAMES[sk.currentStage] || sk.currentStage || "",
    gender: (formData.gender || []).map(titleCase),
    baseStats: {
      hp: formData.hp ?? null,
      physicalAttack: formData.physicalAttack ?? null,
      magicAttack: formData.magicAttack ?? null,
      physicalDefense: formData.physicalDefense ?? null,
      magicDefense: formData.magicDefense ?? null,
      haste: formData.haste ?? null,
      total: formData.attributeValue ?? null,
    },
    images: {
      male: formData.maleImage || "",
      female: formData.femaleImage || "",
      noGender: formData.noGenderImage || "",
      illustration: formData.illustrationImage || "",
      background: formData.backgroundImage || "",
    },
    mobility,
    traits,
    skills,
    evolution,
    habitats,
    resonanceTraining,
  };
}

// Regions come from two official sources: the game's own marketing site
// (name/description/art for its 6 currently-showcased regions) merged with
// every region name actually referenced in creatures' `habitats` (from the
// wiki) — most of which have no promotional art yet, so they're listed with
// just their name and the Aniimo found there.
function buildRegions(creatures) {
  const mainHtml = getText(`${SITE}/main`, { timeout: 30 });
  const mainPayload = mainHtml && parseNuxtPayload(mainHtml);
  const official = (mainPayload && mainPayload.data && mainPayload.data["worldViewData-pc-en"]) || [];
  const officialByKey = new Map(official.map((r) => [r.englishName.toLowerCase(), r]));
  const mechanicsByKey = new Map(Object.entries(REGION_MECHANICS).map(([k, v]) => [k.toLowerCase(), v]));

  const byName = new Map();
  for (const c of creatures) {
    for (const habitat of c.habitats) {
      if (!byName.has(habitat)) byName.set(habitat, []);
      byName.get(habitat).push({ slug: c.slug, name: c.name, icon: c.icon, elements: c.elements });
    }
  }

  const regions = [...byName.keys()].sort().map((name) => {
    const key = name.replace(/^The\s+/i, "").toLowerCase();
    const off = officialByKey.get(key);
    return {
      name,
      description: (off && off.description) || null,
      image: (off && off.sceneImage) || null,
      mechanics: mechanicsByKey.get(key) || [],
      creatures: byName.get(name).sort((a, b) => a.name.localeCompare(b.name)),
    };
  });

  fs.writeFileSync(OUT_REGIONS, JSON.stringify({
    updated: new Date().toISOString(),
    source: `${SITE}/main`,
    mechanicsSource: GAME8_MAP_URL,
    poiTypes: MAP_POI_TYPES,
    count: regions.length,
    regions,
  }, null, 2));
  console.log(`Wrote ${regions.length} regions to ${OUT_REGIONS} (${official.length} with official art).`);
}

function run() {
  const homeHtml = getText(`${BASE}/`, { timeout: 30 });
  if (!homeHtml) throw new Error("could not fetch wiki.aniimo.com homepage");
  const homePayload = parseNuxtPayload(homeHtml);
  const roster = homePayload && homePayload.data && homePayload.data["aniimo-wiki-list-en"];
  if (!roster || !roster.length) throw new Error("could not parse the Aniimo roster list");

  const entryIds = [...new Set(roster.map((r) => r.searchKey.entryId))];
  console.log(`Roster: ${entryIds.length} Aniimo. Fetching detail pages…`);

  const creatures = [];
  for (const entryId of entryIds) {
    const html = getText(`${BASE}/item/${entryId}/basic-form`, { timeout: 25, retries: 2 });
    if (!html) { console.warn(`[${entryId}] fetch failed, skipping`); continue; }
    const creature = parseCreature(entryId, html);
    if (!creature) { console.warn(`[${entryId}] could not parse detail payload, skipping`); continue; }
    creatures.push(creature);
    process.stdout.write(".");
  }
  console.log(`\nParsed ${creatures.length}/${entryIds.length} Aniimo.`);
  if (creatures.length < entryIds.length * 0.5) throw new Error("parsed fewer than half the roster — keeping previous data");

  creatures.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({
    updated: new Date().toISOString(),
    source: `${BASE}/`,
    count: creatures.length,
    elements: [...new Set(creatures.flatMap((c) => c.elements))].sort(),
    roles: [...new Set(creatures.map((c) => c.role))].filter(Boolean).sort(),
    stages: [...new Set(creatures.map((c) => c.stage))].filter(Boolean),
    creatures,
  }, null, 2));
  console.log(`Wrote ${creatures.length} creatures to ${OUT_FILE}`);

  buildRegions(creatures);
}

if (require.main === module) {
  try { run(); } catch (e) { require("./lib/keep")([OUT_FILE, OUT_REGIONS], e); }
} else {
  module.exports = { unflattenDevalue, parseNuxtPayload, parseCreature, buildRegions, slugify };
}
