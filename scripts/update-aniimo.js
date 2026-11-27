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
     (The interactive world map lives separately: data/aniimo/map.json is
     built by scripts/update-aniimo-map.js from Game8's map, not here.)
   - data/aniimo/community-codes.json — player-submitted "Face Codes"
     (character-appearance import strings, distinct from redeemable gift
     codes — see this repo's data/codes/aniimo.json for those) scraped from
     Game8's public Face Codes Sharing Board comment thread. This is
     genuinely user-generated forum content, not stable wiki/editorial data
     like everything else this scraper writes: comments are anonymous (no
     attribution beyond a link back to the original comment), a fair chunk
     of the thread is chatter rather than an actual code ("anyone got a
     gojo one yet"), and codes may stop working after a patch with no way
     for us to verify that. buildCommunityCodes() below only keeps comments
     whose body contains a 14-20 char hex string (every real code observed
     on the board is exactly 16 hex chars; the range gives a little slack)
     — plain chatter comments are dropped. The "Character" tab is the only
     one with a source right now; "Photo Studio" and "Base" setups don't
     have an equivalent sharing board yet (the game launched 2026-09-16),
     so those tabs ship with an empty entries array and a "coming soon"
     note for the UI to show — see games/aniimo/codes.js.
   - data/aniimo/builds.json — a real per-Aniimo build guide (which two
     Skills to equip, which Held Item, stat priority and personality),
     sourced from Game8's own "List of All Builds" page — the site's
     established primary source for this kind of attributed "best X"
     content.
     Covers 46 of the 86 tracked Aniimo; the rest simply don't have a
     published build yet. A handful of rows are for a "Prismana <name>"
     entry — the creature's top-tier awakened form, not a separate roster
     entry in creatures.json — those are kept as their own build (tagged
     formTag: "Prismana") linked to the base creature's slug, since a
     creature can have both a base and a Prismana build. A few rows name
     an Aniimo (e.g. Irisalis, Somniwing) that wiki.aniimo.com hasn't
     documented yet — those ship with slug: null and render as plain text
     rather than a dead link.
   - data/aniimo/homeland.json — a full reproduction of darksteelhyren's
     "RV / Homeland Guide" on Steam Community: a set-it-and-forget-it route
     through every RV (Homeland base) level, with the author's own
     screenshots. Unlike everything else this scraper writes, this is one
     community member's own guide, not aggregated wiki/editorial data —
     credit (name, profile link, source link) is carried in the JSON and
     kept front-and-center on the page itself (games/aniimo/homeland.js),
     per the guide's own terms of reuse. The guide's markup is already
     heading-driven (Note/Warning/Production/Farm-Tree Summary/Aniimo
     Summary/Visual, plus "Lesson:"-prefixed asides and an Overview/Closing
     words), so parseSteamGuideHTML() below classifies and structures each
     subsection by that heading text alone — nothing is re-authored or
     summarized. See the function's own comment for the exact schema.

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
const OUT_CODES = path.join(OUT_DIR, "community-codes.json");
const OUT_BUILDS = path.join(OUT_DIR, "builds.json");
const OUT_HOMELAND = path.join(OUT_DIR, "homeland.json");
const GAME8_FACE_CODES_URL = "https://game8.co/games/Aniimo/archives/623911";
const GAME8_BUILDS_URL = "https://game8.co/games/Aniimo/archives/624315";

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
// Named Alpha/Omega Aniimo boss-encounter markers are cross-referenced
// against the creature database by name so the map can link straight to
// that Aniimo's page; every other marker (chests, resources, eggs,
// challenges, quest waypoints, landmarks) is kept as-is since it isn't a
// creature encounter.
// See the header comment (data/aniimo/community-codes.json) for what this
// is and why it's handled differently from the rest of this scraper.
const CODE_RE = /\b[0-9A-Fa-f]{14,20}\b/;
function parseFaceCodeComments(html) {
  const items = [...html.matchAll(/<div class="c-commentItem" id="anchor_comment_(\d+)">([\s\S]*?)<div class="c-commentItem__footer">/g)];
  const out = [];
  for (const [, id, block] of items) {
    const dateM = block.match(/c-commentItem__date">([^<]*)</);
    const bodyM = block.match(/c-commentItem__body">([\s\S]*?)<\/div>/);
    if (!bodyM) continue;
    const imgM = bodyM[1].match(/<img src="([^"]+)"/);
    const text = bodyM[1].replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    const codeM = text.match(CODE_RE);
    if (!codeM) continue; // plain chatter, not an actual code
    out.push({
      code: codeM[0],
      image: imgM ? imgM[1] : null,
      postedAgo: dateM ? dateM[1].trim() : null,
      sourceUrl: `${GAME8_FACE_CODES_URL}#anchor_comment_${id}`,
    });
  }
  return out;
}

function buildCommunityCodes() {
  const html = getText(GAME8_FACE_CODES_URL, { timeout: 30 });
  if (!html) { console.warn("game8.co face codes board fetch failed, skipping community codes rebuild"); return; }
  const character = parseFaceCodeComments(html);

  fs.writeFileSync(OUT_CODES, JSON.stringify({
    updated: new Date().toISOString(),
    note: "These are player-submitted community codes (face/photo/base import strings), not redeemable gift codes — see this game's Codes tab on the hub for those. We can't verify a code still works or who posted it beyond a link back to the original comment.",
    tabs: {
      character: {
        label: "Character (Face Codes)",
        source: GAME8_FACE_CODES_URL,
        entries: character,
      },
      photoStudio: {
        label: "Photo Studio",
        source: null,
        entries: [],
        note: "No community sharing board for Photo Studio codes exists yet.",
      },
      base: {
        label: "Base",
        source: null,
        entries: [],
        note: "No community sharing board for Base codes exists yet.",
      },
    },
  }, null, 2));
  console.log(`Wrote ${character.length} community Face Codes to ${OUT_CODES}.`);
}

// See the header comment (data/aniimo/builds.json) for sourcing notes.
function parseBuilds(html, creatures) {
  const byName = new Map(creatures.map((c) => [c.name.toLowerCase(), c]));
  const clean = (s) => s.replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const linkItems = (block) => [...block.matchAll(/<div class='align'><a class='a-link' href=[^>]+><img[^>]*data-src='([^']+)'[^>]*\/>\s*([^<]+)<\/a>/g)]
    .map((m) => ({ name: clean(m[2]), icon: m[1] }));

  const start = html.indexOf("<tbody>");
  const end = html.indexOf("</tbody>");
  if (start < 0 || end < 0) return [];
  const rows = html.slice(start, end).split("<tr>").slice(1);

  const builds = [];
  for (const row of rows) {
    const nameM = row.match(/<td class="center">([\s\S]*?)<\/td>/);
    if (!nameM) continue;
    const rawName = clean(nameM[1]);
    const iconM = nameM[1].match(/data-src='([^']+)'/);
    const formTag = /^Prismana\s+/.test(rawName) ? "Prismana" : null;
    const bareName = rawName.replace(/^Prismana\s+/, "");
    const creature = byName.get(bareName.toLowerCase());

    const rest = row.slice(nameM.index + nameM[0].length);
    const parts = rest.split('<hr class="a-table__line">');
    if (parts.length < 4) continue;
    const [skillsBlock, itemBlock, statBlock, persBlock] = parts;

    builds.push({
      name: rawName,
      slug: creature ? creature.slug : null,
      formTag,
      icon: iconM ? iconM[1] : null,
      skills: linkItems(skillsBlock),
      heldItem: linkItems(itemBlock)[0] || null,
      statPriority: clean(statBlock).replace(/^Stat Priority:\s*/, ""),
      personality: clean(persBlock).replace(/^Personality:\s*/, ""),
    });
  }
  return builds;
}

function buildAniimoBuilds(creatures) {
  const html = getText(GAME8_BUILDS_URL, { timeout: 30 });
  if (!html) { console.warn("game8.co builds list fetch failed, skipping builds rebuild"); return; }
  const builds = parseBuilds(html, creatures);
  if (builds.length < 10) { console.warn("parsed too few Aniimo builds, skipping builds rebuild"); return; }

  fs.writeFileSync(OUT_BUILDS, JSON.stringify({
    updated: new Date().toISOString(),
    source: GAME8_BUILDS_URL,
    count: builds.length,
    builds,
  }, null, 2));
  console.log(`Wrote ${builds.length} Aniimo builds to ${OUT_BUILDS}.`);
}

// ---- Homeland (RV) Guide — darksteelhyren's guide, reproduced with credit --
const STEAM_GUIDE_URL = "https://steamcommunity.com/sharedfiles/filedetails/?id=3806795108";
const STEAM_GUIDE_AUTHOR = "darksteelhyren";
const STEAM_GUIDE_AUTHOR_URL = "https://steamcommunity.com/id/Zetajezu";

const decodeEntities = (s) => String(s || "")
  .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

// One subSectionDesc's raw inner HTML -> {images, items}. Author's own
// "<br>"-separated lines become items: "-" prefixed = bullet, "N) Name"
// (optionally "N.M)") = numbered — with any immediately-following "-"
// lines as its sub-steps (Production entries: a craft/building name plus
// its "Set X to Y" steps) — anything else is a plain text line. A stray
// "100%>" is the guide's own typo (a literal ">" beside the number, not
// a broken tag); collapsed back to "100%" so it doesn't read as a glitch.
function homelandPrepLines(rawHtml) {
  const raw = String(rawHtml || "")
    .replace(/<a class="modalContentLink"[\s\S]*?<img[^>]*\ssrc="([^"]+)"[^>]*>[\s\S]*?<\/a>/g, "\n[[IMG:$1]]\n")
    .replace(/<img[^>]*\ssrc="([^"]+)"[^>]*>/g, "\n[[IMG:$1]]\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "");
  return raw.split("\n").map((l) => decodeEntities(l).trim().replace(/100%>$/, "100%"));
}

function homelandGroupLines(lines) {
  const images = [];
  const items = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) { i++; continue; }
    const mImg = /^\[\[IMG:(.+)\]\]$/.exec(line);
    if (mImg) { images.push(mImg[1]); i++; continue; }
    const mNum = /^(\d+(?:\.\d+)?)\)\s*(.+)$/.exec(line);
    if (mNum) {
      const sub = [];
      i++;
      while (i < lines.length && (lines[i].startsWith("-") || (lines[i] === "" && i + 1 < lines.length && lines[i + 1].startsWith("-")))) {
        if (lines[i]) sub.push(lines[i].slice(1).trim());
        i++;
      }
      items.push({ kind: "numbered", num: mNum[1], text: mNum[2], sub });
      continue;
    }
    if (line.startsWith("-")) { items.push({ kind: "bullet", text: line.slice(1).trim() }); i++; continue; }
    items.push({ kind: "text", text: line });
    i++;
  }
  return { images, items };
}

// Every top-level <div class="subSection[ detailBox]"> on the guide page is
// Overview, one RV level's setup ("RV7 (==> RV8)"), a "Lesson: X" aside, or
// the closing FAQ ("Closing words") — classified by title text alone. Each
// is split on its own "<div class='bb_h1'>Heading</div>" markers (Note,
// Warning, Production, Farm/Tree Summary, Aniimo Summary, Visual, or the
// FAQ's own "Prismana?"-style headings) into {heading, images, items}
// blocks — see games/aniimo/homeland.js for how these render.
function parseSteamGuideHTML(html) {
  const containerStart = html.indexOf('class="guide subSections"');
  if (containerStart < 0) return [];
  const containerEnd = html.indexOf("commentthread_area", containerStart);
  const container = containerEnd > containerStart ? html.slice(containerStart, containerEnd) : html.slice(containerStart);

  const subRe = /<div class="subSection(?: detailBox)?"[^>]*>\s*<div class="subSectionTitle">\s*([\s\S]*?)\s*<\/div>\s*<div class="subSectionDesc">\s*([\s\S]*?)\s*<div style="clear: both"><\/div>\s*<\/div>\s*<\/div>/g;

  const sections = [];
  for (const m of container.matchAll(subRe)) {
    const title = decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim();
    if (!title) continue;

    const parts = m[2].split(/<div class="bb_h1">(.*?)<\/div>/);
    const blocks = [];
    const lead = homelandGroupLines(homelandPrepLines(parts[0]));
    if (lead.images.length || lead.items.length) blocks.push({ heading: null, ...lead });
    for (let i = 1; i < parts.length; i += 2) {
      blocks.push({ heading: decodeEntities(parts[i]).trim(), ...homelandGroupLines(homelandPrepLines(parts[i + 1] || "")) });
    }

    const mRv = /^RV(\d+)\s*\(==>\s*RV(\d+)\)$/.exec(title);
    if (mRv) sections.push({ type: "rv", level: Number(mRv[1]), next: Number(mRv[2]), blocks });
    else if (title.startsWith("Lesson:")) sections.push({ type: "lesson", title: title.slice("Lesson:".length).trim(), blocks });
    else if (title === "Overview") sections.push({ type: "overview", blocks });
    else if (title === "Closing words") sections.push({ type: "closing", blocks });
  }
  return sections;
}

function buildHomelandGuide() {
  const html = getText(STEAM_GUIDE_URL, { timeout: 30 });
  if (!html) { console.warn("Steam Homeland guide fetch failed, skipping homeland guide rebuild"); return; }
  const sections = parseSteamGuideHTML(html);
  const rvSections = sections.filter((s) => s.type === "rv");
  if (rvSections.length < 10) { console.warn("parsed too few Homeland RV steps, skipping homeland guide rebuild"); return; }

  fs.writeFileSync(OUT_HOMELAND, JSON.stringify({
    updated: new Date().toISOString(),
    source: STEAM_GUIDE_URL,
    title: "RV / Homeland Guide",
    description: "A simplified guide to progressing through the RV / Homeland portion of Aniimo",
    author: STEAM_GUIDE_AUTHOR,
    authorUrl: STEAM_GUIDE_AUTHOR_URL,
    maxLevel: Math.max(...rvSections.map((s) => s.level)),
    sections,
  }, null, 2));
  console.log(`Wrote Homeland guide (${rvSections.length} RV steps) to ${OUT_HOMELAND}.`);
}

// A new creature lands in the roster before the official wiki publishes its
// detail page. We surface it from the roster's own searchKey (name, art,
// element, role, stage, description) and flag dataPending so the UI can show a
// "full stats coming soon" state; a later run fills in stats/skills/evolution.
function partialCreature(entryId, sk) {
  return {
    slug: slugify(sk.name),
    entryId,
    number: sk.entryId,
    name: sk.name,
    description: sk.description || "",
    icon: sk.imageUrl || "",
    elements: (sk.attributes || []).map(attrName),
    role: roleName((sk.position || [])[0]),
    stage: STAGE_NAMES[sk.currentStage] || "",
    gender: [],
    baseStats: { hp: null, physicalAttack: null, magicAttack: null, physicalDefense: null, magicDefense: null, haste: null, total: null },
    images: { male: sk.imageUrl || "", female: "", noGender: "", illustration: "", background: "" },
    mobility: null,
    traits: [],
    skills: {},
    evolution: null,
    habitats: [],
    resonanceTraining: [],
    dataPending: true,
  };
}

function run() {
  const homeHtml = getText(`${BASE}/`, { timeout: 30 });
  if (!homeHtml) throw new Error("could not fetch wiki.aniimo.com homepage");
  const homePayload = parseNuxtPayload(homeHtml);
  const roster = homePayload && homePayload.data && homePayload.data["aniimo-wiki-list-en"];
  if (!roster || !roster.length) throw new Error("could not parse the Aniimo roster list");

  const skByEntry = new Map();
  for (const r of roster) { const sk = r.searchKey; if (sk && sk.entryId != null && !skByEntry.has(sk.entryId)) skByEntry.set(sk.entryId, sk); }
  const entryIds = [...skByEntry.keys()];
  console.log(`Roster: ${entryIds.length} Aniimo. Fetching detail pages…`);

  // Keep any full data we already have. The official wiki adds new creatures
  // to the roster before publishing their detail page, and during a content
  // rollout it serves the existing detail pages inconsistently, so a transient
  // miss must never downgrade a creature we already scraped in full: fall back
  // to the previous full entry, and only emit a "pending" stub for a creature
  // that is genuinely new (in the roster, no detail page, never scraped).
  const existingByEntry = new Map();
  try {
    for (const c of JSON.parse(fs.readFileSync(OUT_FILE, "utf8")).creatures) existingByEntry.set(c.entryId, c);
  } catch { /* first run — no previous file */ }

  const creatures = [];
  let fullCount = 0, pendingCount = 0;
  for (const entryId of entryIds) {
    const html = getText(`${BASE}/item/${entryId}/basic-form`, { timeout: 25, retries: 2 });
    const creature = html ? parseCreature(entryId, html) : null;
    if (creature) { creatures.push(creature); fullCount++; process.stdout.write("."); continue; }
    const prev = existingByEntry.get(entryId);
    if (prev && !prev.dataPending) { creatures.push(prev); process.stdout.write("="); continue; }
    const sk = skByEntry.get(entryId);
    if (sk) { creatures.push(partialCreature(entryId, sk)); pendingCount++; process.stdout.write("~"); continue; }
    console.warn(`[${entryId}] no detail page and no roster entry, skipping`);
  }
  console.log(`\n${fullCount} full · ${pendingCount} pending (new, awaiting a detail page) · ${creatures.length}/${entryIds.length} total.`);
  if (creatures.length < entryIds.length * 0.5) throw new Error("built fewer than half the roster — keeping previous data");

  // Pending (new) creatures sort to the end; everything else by dex number.
  creatures.sort((a, b) => (a.dataPending ? 1 : 0) - (b.dataPending ? 1 : 0) || a.number.localeCompare(b.number, undefined, { numeric: true }));

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
  buildCommunityCodes();
  buildAniimoBuilds(creatures);
  buildHomelandGuide();
}

if (require.main === module) {
  try { run(); } catch (e) { require("./lib/keep")([OUT_FILE, OUT_REGIONS, OUT_CODES, OUT_BUILDS, OUT_HOMELAND], e); }
} else {
  module.exports = {
    unflattenDevalue, parseNuxtPayload, parseCreature, buildRegions, slugify,
    parseFaceCodeComments, buildCommunityCodes,
    parseBuilds, buildAniimoBuilds,
    parseSteamGuideHTML, buildHomelandGuide,
  };
}
