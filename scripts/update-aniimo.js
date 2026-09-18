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
     tab), evolution line, habitats (region names), and Resonance Training.
   - data/aniimo/regions.json — every region name referenced in the
     creatures' own habitats, merged with the official site's own
     name/description/art for the regions it currently showcases (most
     don't have official art yet), plus which Aniimo live in each.
   - data/aniimo/map.json — real map markers (chests, resources, eggs,
     Pathfinder Challenges, quest waypoints, landmarks, and named Alpha
     Aniimo boss encounters) with actual pixel-position coordinates on the
     game's real world map image, plus that image's own URL. Source:
     gmtreks.com's Aniimo interactive map — an official-adjacent guide site
     (Lighthouse Studio Inc. / GameTrek) with a fully open robots.txt and a
     Terms of Use that only restricts account registration/"the Service"
     (Japan residents) and reverse-engineering their software; it has no
     notice against reusing the map data itself, which ships unauthenticated
     in the plain server-rendered page (no private API call involved) and is
     served from a wildcard-CORS, hotlink-friendly image CDN. Every marker
     that names an actual Aniimo (the 5 named Alpha encounters) is cross-
     referenced against creatures.json by name so the map and database can
     link to each other; regular (non-Alpha) Aniimo aren't pinned anywhere
     in-game, so those still rely on the habitat/region data above. See the
     technical note below for how this payload is decoded, and
     games/aniimo/map.js for how it's rendered — always credit GameTrek
     (gmtreks.com) wherever this data is shown, per their Terms of Use.

   Technical note: gmtreks.com is a React Router 7 (Remix) app, which streams
   its loader data to the client as a single-line "turbo-stream" payload (a
   flat array-of-refs format, structurally similar to but not the same as
   devalue's) via `window.__reactRouterContext.streamController.enqueue(...)`
   in the initial HTML. Adding the `turbo-stream` npm package isn't an option
   (this repo has zero dependencies), so `unflattenTurboStream()` below is a
   small, dependency-free reimplementation of its unflatten algorithm —
   verified byte-for-byte identical output against the real
   `turbo-stream` package's own decoder on this site's own payload. It only
   supports what this payload actually uses (plain objects/arrays/primitives
   plus Date/Set/Map/RegExp/BigInt/URL/null-prototype objects).

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
const OUT_MAP = path.join(OUT_DIR, "map.json");
const GMTREKS_MAP_URL = "https://gmtreks.com/aniimo/map/idyll";
const GMTREKS_ATTRIBUTION = "Map imagery and marker data courtesy of GameTrek (gmtreks.com).";

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

// ---- minimal turbo-stream unflatten (see file header) ----------------------
const TS_HOLE = -1, TS_NAN = -2, TS_NEG_INF = -3, TS_NEG_ZERO = -4, TS_NULL = -5, TS_POS_INF = -6, TS_UNDEFINED = -7;
function unflattenTurboStream(line) {
  const values = JSON.parse(line);
  if (!Array.isArray(values) || !values.length) throw new Error("unflattenTurboStream: expected a non-empty array");
  const hydrated = Array(values.length);
  function hydrate(index) {
    switch (index) {
      case TS_UNDEFINED: return undefined;
      case TS_NULL: return null;
      case TS_NAN: return NaN;
      case TS_POS_INF: return Infinity;
      case TS_NEG_INF: return -Infinity;
      case TS_NEG_ZERO: return -0;
    }
    if (index in hydrated) return hydrated[index];

    const value = values[index];
    if (!value || typeof value !== "object") { hydrated[index] = value; return value; }

    if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        const [type, b, c] = value;
        switch (type) {
          case "D": { const d = new Date(b); hydrated[index] = d; return d; }
          case "U": { const u = new URL(b); hydrated[index] = u; return u; }
          case "B": { const n = BigInt(b); hydrated[index] = n; return n; }
          case "R": { const r = new RegExp(b, c); hydrated[index] = r; return r; }
          case "S": { const set = new Set(); hydrated[index] = set; for (let i = 1; i < value.length; i++) set.add(hydrate(value[i])); return set; }
          case "M": {
            const map = new Map(); hydrated[index] = map;
            for (let i = 1; i < value.length; i += 2) map.set(hydrate(value[i]), hydrate(value[i + 1]));
            return map;
          }
          case "N": {
            const obj = Object.create(null); hydrated[index] = obj;
            for (const key of Object.keys(b)) obj[hydrate(Number(key.slice(1)))] = hydrate(b[key]);
            return obj;
          }
          case "Z": { const r = hydrate(b); hydrated[index] = r; return r; }
          default:
            throw new Error(`unflattenTurboStream: unsupported type "${type}"`);
        }
      }
      const arr = new Array(value.length);
      hydrated[index] = arr;
      for (let i = 0; i < value.length; i++) { if (value[i] !== TS_HOLE) arr[i] = hydrate(value[i]); }
      return arr;
    }

    const obj = {};
    hydrated[index] = obj;
    for (const key of Object.keys(value)) obj[hydrate(Number(key.slice(1)))] = hydrate(value[key]);
    return obj;
  }
  return hydrate(0);
}

function parseTurboStreamPayload(html) {
  const m = html.match(/streamController\.enqueue\((".*?")\)/s);
  if (!m) return null;
  let raw;
  try { raw = JSON.parse(m[1]); } catch { return null; }
  const line = raw.split("\n")[0];
  if (!line) return null;
  try { return unflattenTurboStream(line); } catch { return null; }
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
    count: regions.length,
    regions,
  }, null, 2));
  console.log(`Wrote ${regions.length} regions to ${OUT_REGIONS} (${official.length} with official art).`);
}

// The real interactive map (see file header for sourcing/ethics notes).
// Named Alpha Aniimo boss-encounter markers are cross-referenced against the
// creature database by name so the map can link straight to that Aniimo's
// page; every other marker (chests, resources, eggs, challenges, quest
// waypoints, landmarks) is kept as-is since it isn't a creature encounter.
function buildMap(creatures) {
  const html = getText(GMTREKS_MAP_URL, { timeout: 30 });
  if (!html) { console.warn("gmtreks.com fetch failed, skipping map rebuild"); return; }

  const payload = parseTurboStreamPayload(html);
  const mapData = payload && payload.loaderData && payload.loaderData.map;
  if (!mapData || !Array.isArray(mapData.mapMarkers) || !mapData.mapMarkers.length) {
    console.warn("could not parse gmtreks.com map payload, skipping map rebuild");
    return;
  }

  const byName = new Map(creatures.map((c) => [c.name.toLowerCase(), c]));
  const decodeCategoryId = (id) => { try { return Buffer.from(id, "base64").toString("utf8"); } catch { return id; } };
  const categories = mapData.markerCategories.map((c) => {
    const decoded = decodeCategoryId(c.id);
    const group = decoded.includes("---") ? decoded.split("---")[0] : null;
    return { id: c.id, name: c.name, group, icon: c.iconUrl || "" };
  });
  const groupById = new Map(categories.map((c) => [c.id, c.group]));

  const { mapWidth, mapHeight } = mapData.mapMeta || {};
  const markers = mapData.mapMarkers
    .filter((m) => mapWidth && mapHeight)
    .map((m) => {
      const bareName = m.name.replace(/^Alpha\s+/, "");
      const creature = byName.get(m.name.toLowerCase()) || byName.get(bareName.toLowerCase());
      return {
        id: m.id,
        name: m.name,
        categoryId: m.categoryId,
        group: groupById.get(m.categoryId) || null,
        x: m.posX / mapWidth,
        y: m.posY / mapHeight,
        creatureSlug: creature ? creature.slug : null,
      };
    });

  const bgImage = mapData.mapStyleSpecification && mapData.mapStyleSpecification.sources
    && mapData.mapStyleSpecification.sources["background-image"];
  if (!bgImage || !bgImage.url) { console.warn("gmtreks.com map has no background image, skipping map rebuild"); return; }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_MAP, JSON.stringify({
    updated: new Date().toISOString(),
    source: GMTREKS_MAP_URL,
    attribution: GMTREKS_ATTRIBUTION,
    mapImage: bgImage.url,
    mapWidth,
    mapHeight,
    categories,
    count: markers.length,
    markers,
  }, null, 2));
  console.log(`Wrote ${markers.length} map markers to ${OUT_MAP}`);
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
  buildMap(creatures);
}

if (require.main === module) {
  try { run(); } catch (e) { require("./lib/keep")([OUT_FILE, OUT_REGIONS, OUT_MAP], e); }
} else {
  module.exports = {
    unflattenDevalue, parseNuxtPayload, parseCreature, buildRegions, slugify,
    unflattenTurboStream, parseTurboStreamPayload, buildMap,
  };
}
