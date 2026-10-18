/* Palworld — Pal database + passive skills scraper.

   Source: wikily.gg's Palworld Paldex (same family of site already used for
   Far Far West on this site; see scripts/update-ffw-maps.js for more on the
   wikily.gg migration). Unlike Far Far West's maps, Palworld's pal and
   skill pages no longer embed structured game data in the page's RSC
   payload at all — only the already-rendered display markup. So instead of
   decoding a data structure, this scrapes the rendered page's own text
   (leaf text nodes, in document order, pulled straight from the curl'd
   HTML — no headless browser needed, it's still fully server-rendered),
   anchored on the section's own on-page labels ("HP", "Melee Attack",
   "Work suitability", "Possible drops", …) rather than fixed positions, so
   a stray ad slot or layout tweak between fields doesn't throw the parse
   off.

   Known gaps versus the old RSC-data-driven version (the site no longer
   exposes these in a scrapable form, so rather than guess we just drop
   them): isBoss/isTowerBoss/isRaidBoss flags, drop item/skill icons
   (pal.js/pals.js already render these with onerror fallbacks, so a
   missing icon degrades gracefully), per-skill description text, and
   breedingOverrides (exclusive non-formula parent pairs) — the breeding
   calculator now always falls back to the rank-average formula, which was
   already how the vast majority of combos resolved before.

   Two outputs:
   - data/palworld/pals.json — every Pal (~285, includes elemental/boss
     variants), stats, work suitability, drops, skills, innate passives,
     and breeding rank (combiRank, read straight off each pal's own
     "Breeding power" stat).
   - data/palworld/passive-skills.json — the full universal passive-skill
     pool (one page lists all of them with description + rank), with each
     skill's exclusiveTo list built from which pals this same crawl found
     it listed as an innate passive on.

   Run by .github/workflows/update-palworld.yml (daily). Node 18+, curl. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const BASE = "https://wikily.gg/palworld";
const SITEMAP_PARTS = 4; // https://wikily.gg/palworld/sitemap.xml lists this many "pages-N" parts
const OUT_DIR = path.join(__dirname, "..", "data", "palworld");
const OUT_PALS = path.join(OUT_DIR, "pals.json");
const OUT_SKILLS = path.join(OUT_DIR, "passive-skills.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const getHtml = (url) => { try { return execFileSync("curl", ["-sL", "--retry", "3", "--retry-delay", "2", "--retry-all-errors", "--max-time", "40", "-A", UA, url], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); } catch { return ""; } };
const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const decodeEntities = (s) => s
  .replace(/&amp;/g, "&").replace(/&#x27;|&apos;|&#8217;/g, "’").replace(/&quot;/g, '"')
  .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&times;/g, "×");
const clean = (s) => decodeEntities(String(s || "")).replace(/\s+/g, " ").trim();

const ELEMENTS = new Set(["Neutral", "Fire", "Water", "Grass", "Electric", "Ice", "Ground", "Dark", "Dragon"]);
const WORK_LABEL_TO_KEY = {
  Kindling: "EmitFlame", Watering: "Watering", Planting: "Seeding", Electricity: "GenerateElectricity",
  Handiwork: "Handcraft", Gathering: "Collection", Lumbering: "Deforest", Mining: "Mining",
  "Oil Extraction": "OilExtraction", "Medicine Production": "ProductMedicine", Cooling: "Cool",
  Transporting: "Transport", Farming: "MonsterFarm",
};

// Leaf text nodes, in document order — every distinct label/value on these
// pages already sits in its own tag, so this reconstructs the same flat
// sequence a browser's innerText would, without needing a browser.
function leafTexts(html) {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  const out = [];
  const re = />([^<]+)</g;
  let m;
  while ((m = re.exec(noScript))) {
    const t = clean(m[1]);
    if (t) out.push(t);
  }
  return out;
}
const pageTitle = (html) => clean(((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "").split("|")[0]);
const portraitIcon = (html) => (html.match(/https:\/\/img\.wikily\.gg\/unsafe\/[^"]+/) || [])[0] || "";

function idxOf(tokens, label, from = 0) {
  const re = new RegExp(`^${label}$`, "i");
  for (let i = from; i < tokens.length; i++) if (re.test(tokens[i])) return i;
  return -1;
}
const numAt = (tokens, i) => (i < 0 ? null : Number(String(tokens[i]).replace(/,/g, "")) || 0);

function parsePal(html, slug) {
  const t = leafTexts(html);
  const dexMatch = html.match(/Paldeck No\.?\s*(\d+)/i);
  if (!dexMatch) return null;
  const dex = dexMatch[1];

  const headerIdx = t.findIndex((x) => new RegExp(`paldeck no\\.? *${dex}`, "i").test(x));
  let cur = headerIdx >= 0 ? headerIdx + 2 : 0; // +1 skips the "Paldeck No. NNN" token, +1 more skips the pal's own name token right after it
  const elements = [];
  if (ELEMENTS.has(t[cur])) { elements.push(t[cur]); cur++; }
  if (ELEMENTS.has(t[cur])) { elements.push(t[cur]); cur++; }

  const sizeIdx = idxOf(t, "size", cur);
  const size = sizeIdx >= 0 ? t[sizeIdx + 1] : null;
  const rarityIdx = idxOf(t, "rarity", cur);
  const rarity = numAt(t, rarityIdx + 1);

  // Description: the one free-text paragraph between the level range and
  // the first "HP" stat label.
  const hp1Idx = idxOf(t, "hp", cur);
  const levelIdx = t.findIndex((x, i) => i >= cur && /^level \d/i.test(x));
  const description = levelIdx >= 0 && hp1Idx > levelIdx + 1 ? t[levelIdx + 1] : "";

  // Detailed Stats block — anchored on "Melee Attack", which only appears
  // once, unlike HP/Attack/Defense/Stamina/Work Speed (also in the header
  // summary) so this reliably lands on the real stats table, not the one
  // above it.
  const meleeIdx = idxOf(t, "melee attack", cur);
  const hpIdx = meleeIdx >= 0 ? meleeIdx - 2 : -1; // "HP" label sits 2 tokens before "Melee Attack" label
  const statLabelIdx = (label, from) => idxOf(t, label, from);
  const stats = {
    hp: numAt(t, hpIdx + 1),
    attack: numAt(t, meleeIdx + 1),
    shotAttack: numAt(t, statLabelIdx("attack", meleeIdx + 1) + 1),
    defense: numAt(t, statLabelIdx("defense", meleeIdx) + 1),
    support: numAt(t, statLabelIdx("support", meleeIdx) + 1),
    craftSpeed: numAt(t, statLabelIdx("work speed", meleeIdx) + 1),
  };

  // Skills × Work
  const activeIdx = idxOf(t, "active skills", cur);
  const passiveIdx = idxOf(t, "passive skills", activeIdx + 1);
  const statsHeadingIdx = idxOf(t, "^stats$", 0) >= 0 ? idxOf(t, "stats", activeIdx) : t.findIndex((x, i) => i > activeIdx && /^stats$/i.test(x));
  const skillsEnd = passiveIdx >= 0 ? passiveIdx : statsHeadingIdx;
  const skills = [];
  if (activeIdx >= 0 && skillsEnd > activeIdx) {
    for (let i = activeIdx + 1; i + 2 < skillsEnd; i += 3) {
      const name = t[i], lvTok = t[i + 1], meta = t[i + 2];
      const lvM = /^lv\s*(\d+)/i.exec(lvTok || "");
      const metaM = /^([A-Za-z]+)(?:\s*·\s*Power\s*(\d+))?/i.exec(meta || "");
      if (!lvM || !metaM) break;
      skills.push({ name, level: Number(lvM[1]), element: metaM[1], power: metaM[2] ? Number(metaM[2]) : null, desc: "" });
    }
  }
  const innatePassives = [];
  if (passiveIdx >= 0 && statsHeadingIdx > passiveIdx) {
    for (let i = passiveIdx + 1; i + 1 < statsHeadingIdx; i += 2) {
      if (/^stats$/i.test(t[i])) break;
      innatePassives.push(t[i]);
    }
  }

  // Work suitability
  const workIdx = idxOf(t, "work suitability", cur);
  const matchupIdx = idxOf(t, "element matchup", workIdx + 1);
  const work = {};
  if (workIdx >= 0 && matchupIdx > workIdx) {
    for (let i = workIdx + 1; i + 1 < matchupIdx; i += 2) {
      const key = WORK_LABEL_TO_KEY[t[i]];
      const v = Number(t[i + 1]);
      if (key && Number.isFinite(v)) work[key] = v;
    }
  }
  const bestWork = Object.keys(work).sort((a, b) => work[b] - work[a])[0] || null;

  // Properties table (Price only lives here, everything else is a repeat)
  const priceIdx = idxOf(t, "price", matchupIdx);
  const price = numAt(t, priceIdx + 1);

  // Partner skill description (name isn't part of the old schema)
  const partnerIdx = idxOf(t, "partner skill", cur);
  const partnerSkillDesc = partnerIdx >= 0 ? clean(t[partnerIdx + 2] || "") : "";

  // Possible drops: repeating [×, qty, rate%, item], with the odd "Lv N-M"
  // gating line dropped (not part of the old schema either).
  const dropsIdx = idxOf(t, "possible drops", priceIdx);
  const spawnsIdx = idxOf(t, "spawns × breeding", dropsIdx + 1);
  const drops = [];
  if (dropsIdx >= 0) {
    const segEnd = spawnsIdx >= 0 ? spawnsIdx : t.length;
    const seg = t.slice(dropsIdx + 1, segEnd).filter((x) => !/^lv\s/i.test(x));
    for (let i = 0; i + 3 < seg.length; i += 4) {
      if (seg[i] !== "×") { i -= 3; continue; }
      const qty = seg[i + 1], rate = parseFloat(seg[i + 2]), item = seg[i + 3];
      if (!item || !Number.isFinite(rate)) break;
      const [min, max] = String(qty).includes("-") ? qty.split("-").map(Number) : [Number(qty), Number(qty)];
      drops.push({ item, rate, min, max });
    }
  }

  return {
    slug, dex, elements, rarity, size, price,
    stats, work, bestWork,
    description: clean(description),
    partnerSkill: partnerSkillDesc,
    innatePassives, drops, skills,
    combiRank: stats && numAt(t, idxOf(t, "breeding power", cur) + 1),
    icon: portraitIcon(html),
  };
}

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ---- Roster discovery via the public sitemap (the old index-page RSC
  // array no longer exists — the list page is now a client-rendered
  // virtualised grid) -----------------------------------------------------
  const slugs = new Set();
  for (let i = 0; i < SITEMAP_PARTS; i++) {
    const xml = getHtml(`${BASE}/sitemap.xml?part=pages-${i}`);
    for (const m of xml.matchAll(/<loc>https:\/\/wikily\.gg\/palworld\/pals\/([a-z0-9-]+)<\/loc>/g)) slugs.add(m[1]);
    sleep(200);
  }
  if (!slugs.size) throw new Error("no pal list parsed — keeping previous data");

  const pals = [];
  const passiveOwners = new Map(); // passive name -> [pal name]
  let failed = 0;
  for (const slug of slugs) {
    const html = getHtml(`${BASE}/pals/${slug}`);
    const name = pageTitle(html);
    const pal = name ? parsePal(html, slug) : null;
    if (!pal || !pal.dex) { failed++; sleep(150); continue; }
    pal.name = name;
    for (const p of pal.innatePassives) {
      if (!passiveOwners.has(p)) passiveOwners.set(p, []);
      passiveOwners.get(p).push(name);
    }
    pals.push(pal);
    sleep(150);
  }
  pals.sort((a, b) => (a.dex || "").localeCompare(b.dex, undefined, { numeric: true }));

  fs.writeFileSync(OUT_PALS, JSON.stringify({
    updated: new Date().toISOString(),
    source: `${BASE}/pals/`,
    count: pals.length,
    breedingFormula: "floor((parent1.combiRank + parent2.combiRank + 1) / 2), then the closest combiRank on the full roster (ties favor the lower rank). The site's own exclusive-pair exceptions (breedingOverrides) aren't scrapable from the current page markup, so the calculator always uses the formula now.",
    breedingOverrides: [],
    pals,
  }));
  console.log(`palworld pals: ${pals.length} parsed, ${failed} failed.`);

  // ---- Universal passive-skill pool (one page lists all of them) --------
  const skillsHtml = getHtml(`${BASE}/skills/passive`);
  const st = leafTexts(skillsHtml);
  const startIdx = idxOf(st, "passive skills", 0) >= 0 ? idxOf(st, "passive skills", 0) : 0;
  const passiveSkills = [];
  for (let i = startIdx; i < st.length - 2; i++) {
    const rankM = /^rank\s*(-?\d+)$/i.exec(st[i + 2] || "");
    if (!rankM) continue;
    const name = st[i], description = clean(st[i + 1]);
    if (!name || name.length > 60 || /^rank/i.test(name)) continue;
    passiveSkills.push({
      name, description, rank: Number(rankM[1]),
      effects: {}, // no longer scrapable structured; description already states it in prose
      exclusiveTo: [...new Set(passiveOwners.get(name) || [])],
      availableToPals: true,
    });
    i += 2;
  }
  if (!passiveSkills.length) throw new Error("no passive skills parsed — keeping previous data");

  fs.writeFileSync(OUT_SKILLS, JSON.stringify({
    updated: new Date().toISOString(),
    source: `${BASE}/skills/passive`,
    count: passiveSkills.length,
    passiveSkills,
  }));
  console.log(`palworld passive skills: ${passiveSkills.length}.`);
}

try { run(); } catch (e) { require("./lib/keep")([OUT_PALS, OUT_SKILLS], e); }
