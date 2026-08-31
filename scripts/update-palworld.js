/* Palworld — Pal database + passive skills scraper.

   Source: wikily.gg's Palworld Paldex (data-mined directly from the game's
   own tables, same family of site already used for Far Far West on this
   site). Like update-ffw-builds.js, the real per-pal/per-skill data lives in
   the page's Next.js RSC payload (self.__next_f.push([1,"..."]) chunks), not
   in the static HTML — so we pull it out with the same rscOf/balancedObj
   technique instead of needing a headless browser.

   Two outputs:
   - data/palworld/pals.json — every Pal (291 as of this writing, includes
     all elemental/boss variants), stats, work suitability, drops, skills,
     innate passives, and breeding rank. Plus a top-level "breedingOverrides"
     table: exclusive parent-pair combos that bypass the normal rank-average
     formula (e.g. specific pals only obtainable from one exact pairing).
   - data/palworld/passive-skills.json — the full universal passive-skill
     pool (~420, ranks -3..5) with description + structured effect values,
     used both by the Passive Skills reference tool and to compute each
     Pal's "recommended build" (passives aren't Pal-specific in Palworld —
     any pal can carry any inheritable passive — so the recommendation is a
     scored pick from this shared pool, not a fabricated per-pal secret).

   Run by .github/workflows/update-palworld.yml (daily). Node 18+, curl. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const BASE = "https://wikily.gg/palworld";
const OUT_DIR = path.join(__dirname, "..", "data", "palworld");
const OUT_PALS = path.join(OUT_DIR, "pals.json");
const OUT_SKILLS = path.join(OUT_DIR, "passive-skills.json");
const ICON_BASE = "https://r2.wikily.gg/images/palworld/icons";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const getHtml = (url) => { try { return execFileSync("curl", ["-sL", "--retry", "3", "--retry-delay", "2", "--retry-all-errors", "--max-time", "40", "-A", UA, url], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); } catch { return ""; } };
const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const clean = (s) => (s || "").replace(/\r\n/g, " ").replace(/\s+/g, " ").trim();
const stripEnum = (s) => (s || "").split("::").pop();
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const icon = (name) => (name ? `${ICON_BASE}/${name}.webp` : "");

function rscOf(html) {
  let rsc = "";
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) { try { rsc += JSON.parse(m[1]); } catch {} }
  return rsc;
}
function balancedObj(s, fromKey) {
  const p = s.indexOf(fromKey); if (p < 0) return null;
  let i = s.indexOf("{", p), depth = 0;
  for (let j = i; j < s.length; j++) { if (s[j] === "{") depth++; else if (s[j] === "}" && !--depth) { try { return JSON.parse(s.slice(i, j + 1)); } catch { return null; } } }
  return null;
}
function balancedArr(s, fromKey) {
  const p = s.indexOf(fromKey); if (p < 0) return null;
  let i = s.indexOf("[", p), depth = 0;
  for (let j = i; j < s.length; j++) { if (s[j] === "[") depth++; else if (s[j] === "]" && !--depth) { try { return JSON.parse(s.slice(i, j + 1)); } catch { return null; } } }
  return null;
}

const WORK_KEYS = ["EmitFlame", "Watering", "Seeding", "GenerateElectricity", "Handcraft", "Collection", "Deforest", "Mining", "OilExtraction", "ProductMedicine", "Cool", "Transport", "MonsterFarm"];

function elementsOf(p) {
  return [p.ElementType1, p.ElementType2].map(stripEnum).filter((e) => e && e !== "None");
}
function workOf(p) {
  const out = {};
  for (const k of WORK_KEYS) { const v = p[`WorkSuitability_${k}`]; if (typeof v === "number" && v > 0) out[k] = v; }
  return out;
}

function pieceFromIndex(p) {
  return {
    name: p.OverrideNameTextIDEnglish || p.OverrideNameTextID,
    dex: `${p.ZukanIndex}${p.ZukanIndexSuffix || ""}`,
    elements: elementsOf(p),
    work: workOf(p),
    combiRank: p.CombiRank,
    icon: icon(p.icon),
  };
}

function detailFor(name) {
  const slug = slugify(name);
  const html = getHtml(`${BASE}/pals/${slug}/`);
  const rsc = rscOf(html);
  const pal = balancedObj(rsc, '"pal":{');
  if (!pal) return null;

  const passives = [pal.PassiveSkill1, pal.PassiveSkill2, pal.PassiveSkill3, pal.PassiveSkill4].filter((s) => s && s !== "None");
  const drops = (pal.drops || []).map((d) => ({ item: d.ItemId, rate: d.Rate, min: d.min, max: d.Max, icon: icon(d.icon) }));
  const skills = (pal.actionSkills || []).map((s) => ({
    name: s.ActionName,
    level: s.Level,
    desc: clean(s.ActionDescription),
    element: stripEnum(s.Details && s.Details.Element),
    power: s.Details ? s.Details.DisplayPower : null,
  }));

  return {
    slug,
    dex: `${pal.ZukanIndex}${pal.ZukanIndexSuffix || ""}`,
    elements: elementsOf(pal),
    rarity: pal.Rarity,
    price: pal.Price,
    isBoss: !!pal.IsBoss, isTowerBoss: !!pal.IsTowerBoss, isRaidBoss: !!pal.IsRaidBoss,
    stats: { hp: pal.Hp, attack: pal.MeleeAttack, shotAttack: pal.ShotAttack, defense: pal.Defense, support: pal.Support, craftSpeed: pal.CraftSpeed },
    work: workOf(pal),
    bestWork: stripEnum(pal.BestWorkSuitability),
    description: clean(pal.description),
    partnerSkill: clean(pal.PartnerSkillDesc),
    innatePassives: passives,
    drops,
    skills,
    combiRank: pal.CombiRank,
    icon: icon(pal.icon),
  };
}

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ---- Pal roster (index page RSC has every Pal, incl. variants not in the
  // capped 100-item SEO list) ------------------------------------------------
  const indexRsc = rscOf(getHtml(`${BASE}/pals/`));
  const rawList = balancedArr(indexRsc, '"palList":[');
  if (!rawList || !rawList.length) throw new Error("no pal list parsed — keeping previous data");
  const names = new Set(rawList.map((p) => p.OverrideNameTextIDEnglish || p.OverrideNameTextID));

  // Collect breeding overrides (exclusive parent-pair combos) up front from
  // the index data — every pal's breedingList entry, deduped by parent pair.
  // A handful of very-recently-added pals resolve to an internal ID rather
  // than a display name on the wiki's own data; skip those rather than show
  // a broken combo.
  const overrideMap = new Map();
  for (const p of rawList) {
    for (const b of p.breedingList || []) {
      if (!names.has(b.ParentTribeA) || !names.has(b.ParentTribeB) || !names.has(b.ChildCharacterID)) continue;
      const key = [b.ParentTribeA, b.ParentTribeB].sort().join("|");
      overrideMap.set(key, { a: b.ParentTribeA, b: b.ParentTribeB, child: b.ChildCharacterID });
    }
  }
  const breedingOverrides = [...overrideMap.values()];

  // ---- Enrich every pal from its detail page (stats, drops, skills, etc) --
  const pals = [];
  let enriched = 0;
  for (const p of rawList) {
    const name = p.OverrideNameTextIDEnglish || p.OverrideNameTextID;
    if (!name) continue;
    const base = pieceFromIndex(p);
    const detail = detailFor(name);
    if (detail) { Object.assign(base, detail); enriched++; }
    else base.slug = slugify(name);
    // The game's own client ships stubs for not-yet-revealed Pals (generic
    // 100-everywhere stats, no real flavor text) — skip those rather than
    // show a broken "Unidentified Pal" card.
    if (base.description === "en_text" || /T_Hidden_icon/.test(base.icon || "")) { sleep(150); continue; }
    pals.push(base);
    sleep(150);
  }
  pals.sort((a, b) => (a.dex || "").localeCompare(b.dex, undefined, { numeric: true }));

  fs.writeFileSync(OUT_PALS, JSON.stringify({
    updated: new Date().toISOString(),
    source: `${BASE}/pals/`,
    count: pals.length,
    breedingFormula: "floor((parent1.combiRank + parent2.combiRank + 1) / 2), then the closest combiRank on the full roster (ties favor the lower rank) — unless the exact parent pair is in breedingOverrides.",
    breedingOverrides,
    pals,
  }));
  console.log(`palworld pals: ${pals.length} total, ${enriched} enriched with full detail, ${breedingOverrides.length} breeding overrides.`);

  // ---- Universal passive-skill pool ---------------------------------------
  const skillsRsc = rscOf(getHtml(`${BASE}/skills/`));
  const rawSkills = balancedArr(skillsRsc, '"allPassiveSkills":[');
  if (!rawSkills || !rawSkills.length) throw new Error("no passive skills parsed — keeping previous data");

  const passiveSkills = rawSkills.map((s) => ({
    name: s.name,
    description: clean(s.description),
    rank: s.rank,
    effects: s.effects || {},
    exclusiveTo: (s.pals || []).map((p) => p.englishName || p.name),
    // equip.pal=false means this isn't a normal breedable Pal passive at all —
    // it's restricted to Rare-spawn / World Tree / mutation Pals (a different
    // acquisition system), even though it has no exclusiveTo Pal list.
    availableToPals: !!(s.equip && s.equip.pal),
  }));

  fs.writeFileSync(OUT_SKILLS, JSON.stringify({
    updated: new Date().toISOString(),
    source: `${BASE}/skills/`,
    count: passiveSkills.length,
    passiveSkills,
  }));
  console.log(`palworld passive skills: ${passiveSkills.length}.`);
}

try { run(); } catch (e) { require("./lib/keep")([OUT_PALS, OUT_SKILLS], e); }
