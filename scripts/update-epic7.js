/* Epic Seven — Heroes + Artifacts scraper.

   Source: epic7db.com — a complete, actively-updated Epic Seven database
   (robots.txt allows crawling everything: "User-agent: * / Disallow:").
   It covers the full roster (~384 heroes / ~275 artifacts, matching the
   game's own in-game Hero/Artifact Journal totals) and — crucially — it
   already aggregates real player data itself: hero pages carry a
   "Fribbels Data" section (average stats/gear-set usage % from the
   Fribbels gear optimizer's public hero library) and an "RTA Data"
   section (win rates/stat priorities per rank, programmatically pulled
   from the official RTA pages). That real-usage data is exactly what
   epic7.onstove.com's own "wearingStatus"/"getHeroDetailGame" pages show —
   but onstove.com guards that API behind a bot-management JS challenge
   that blocks non-browser requests, so it is not used directly here.

   epic7db.com's markup is clean and semantic (data-* attributes on
   roster list items, id="section-name" anchors on detail pages), so
   sections are sliced by id/class rather than by guessing table
   position — same regex-based approach as the other scrapers in this
   repo (no HTML parser dependency; see scripts/update-hsr-builds.js).

   Writes:
   - data/epic7/heroes.json — every hero: grade/element/class/zodiac,
     PvP/PvE tier + Guild War meta flags, base stats, skills, Fribbels
     data (average stats, gear-set use rates, top builds, recommended
     artifacts with real usage %), RTA data per rank (win rate, stat
     priority, gear-set win rates, synergies/counters), exclusive
     equipment, awakenings, memory imprints.
   - data/epic7/artifacts.json — every artifact: category/grade,
     description, base/max effect + stats, how to acquire, recommended
     heroes (cross-linked to this file's own hero slugs).

   Run by .github/workflows/update-epic7.yml (weekly). Node 18+, curl. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const BASE = "https://epic7db.com";
const HEROES_URL = `${BASE}/heroes`;
const ARTIFACTS_URL = `${BASE}/artifacts`;
const OUT_DIR = path.join(__dirname, "..", "data", "epic7");
const OUT_HEROES = path.join(OUT_DIR, "heroes.json");
const OUT_ARTIFACTS = path.join(OUT_DIR, "artifacts.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
// A hard `timeout` wrapper backstops curl's own --max-time in case a
// request stalls at the network layer in a way curl's flag doesn't
// reliably catch (~660 pages get fetched here — one bad request eating
// minutes would otherwise drag the whole run out unpredictably).
const getHtml = (url) => {
  try {
    const html = execFileSync("timeout", ["25", "curl", "-sL", "--retry", "1", "--retry-delay", "1", "--retry-all-errors", "--max-time", "15", "-A", UA, url], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
    // Every detail page ends its real content with a sitewide "all
    // heroes" quick-nav widget; dropping it keeps later regexes from
    // ever matching content outside the page's own subject.
    const cut = html.indexOf("<h4>All Epic Seven Heroes</h4>");
    return cut === -1 ? html : html.slice(0, cut);
  } catch { return ""; }
};
const decode = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&#0*39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const cleanCell = (s) => decode(String(s || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const slugFromUrl = (url) => (url.match(/\/(heroes|artifacts)\/([^/?#]+)/) || [])[2] || "";

// ---- generic slicing helpers ------------------------------------------------
// Splits `html` into chunks starting at each occurrence of `startRe`
// (global), each chunk running up to the next occurrence (or end of
// string) — used for any run of sibling blocks (skills, awakenings,
// gear-set entries, RTA rank blocks, ...) that share a fixed opening tag
// but have no reliably-matchable closing tag of their own.
function splitBlocks(html, startRe) {
  const starts = [...html.matchAll(startRe)];
  return starts.map((m, i) => html.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : html.length));
}
// A named `id="X"` section's content, bounded by the next section id in
// `order` that actually appears after it (sections are optional per
// hero/artifact, so this walks forward past any missing ones).
function sectionById(html, id, order) {
  const sm = html.match(new RegExp(`<[a-z0-9]+[^>]*\\bid=["']${id}["'][^>]*>`, "i"));
  if (!sm) return "";
  const start = sm.index + sm[0].length;
  let end = html.length;
  for (let i = order.indexOf(id) + 1; i < order.length; i++) {
    const nm = html.match(new RegExp(`<[a-z0-9]+[^>]*\\bid=["']${order[i]}["'][^>]*>`, "i"));
    if (nm && nm.index > start) { end = nm.index; break; }
  }
  return html.slice(start, end);
}
// A `<ul class="stats">`-style list of `<li>Label: Value</li>` rows
// (skipping any `<li><h4>Header</h4></li>` divider rows, which don't
// match the "Label: Value" shape).
function statList(html) {
  const out = [];
  for (const m of html.matchAll(/<li>(?:<img[^>]*>)?\s*([A-Za-z][A-Za-z .'’]*?):\s*([^<]+?)\s*<\/li>/g)) {
    out.push({ label: cleanCell(m[1]), value: cleanCell(m[2]) });
  }
  return out;
}
// A `<div class="resource">...<a href=".../resources/x">NAME (N)</a>` cost list.
function costList(html) {
  return [...html.matchAll(/<div class="resource">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g)].map((m) => cleanCell(m[1])).filter(Boolean);
}
// A `<div class="set"><ul class="gearsets"><li><h4>Set N (X% ... Rate)</h4></li>
// <li class="gearset">...NAME</li>...</ul></div>` block, repeated.
function gearSets(html, rateLabel) {
  return splitBlocks(html, /<div class="set">/g).map((block) => {
    const rate = (block.match(new RegExp(`\\(([\\d.]+)%\\s*${rateLabel}\\)`)) || [])[1];
    const sets = [...block.matchAll(/<li class="gearset">([\s\S]*?)<\/li>/g)].map((m) => cleanCell(m[1]));
    return rate ? { rate: Number(rate), sets } : null;
  }).filter(Boolean);
}
// `<li><a href=".../heroes/slug">...NAME</a></li>` links inside any list —
// used for RTA synergies/counters (name + slug only, no stat badges).
function heroLinkList(html) {
  return [...html.matchAll(/<a[^>]*\shref=["']([^"']*\/heroes\/[^"'?#]+)["'][^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => ({ name: cleanCell(m[2].replace(/<img[^>]*>/g, "")), slug: slugFromUrl(m[1]) }))
    .filter((h) => h.name);
}

// ---- hero + artifact rosters (data-* attributes on the list pages) ---------
// Both /heroes and any embedded `<ul class="hero-list">` (e.g. an
// artifact's "Hero Recommendations") share this exact <li> shape.
function heroRoster(html) {
  const out = [];
  for (const m of html.matchAll(/<li class="hero" data-name="([^"]*)" data-class="([^"]*)" data-element="([^"]*)" data-stars="([^"]*)" data-zodiac="([^"]*)"[^>]*>([\s\S]*?)<\/li>/g)) {
    const url = (m[6].match(/<a href="([^"]+)"/) || [])[1];
    const icon = (m[6].match(/<img class="hero-avatar" src="([^"]+)"/) || [])[1];
    if (!url) continue;
    out.push({ name: decode(m[1]), class: decode(m[2]), element: decode(m[3]), grade: Number(m[4]) || null, zodiac: decode(m[5]), url: `${BASE}${url}`.replace(`${BASE}${BASE}`, BASE), icon: icon ? `${BASE}${icon}` : null, slug: slugFromUrl(url) });
  }
  return out;
}
function artifactRoster(html) {
  const out = [];
  for (const m of html.matchAll(/<li class="artifact" data-name="([^"]*)" data-class="([^"]*)" data-stars="([^"]*)"[^>]*>([\s\S]*?)<\/li>/g)) {
    const url = (m[4].match(/<a href="([^"]+)"/) || [])[1];
    const icon = (m[4].match(/<img src="([^"]+)"/) || [])[1];
    if (!url) continue;
    const cls = decode(m[2]);
    out.push({ name: decode(m[1]), category: cls === "Any" ? "Common" : `${cls} Exclusive`, grade: Number(m[3]) || null, url: `${BASE}${url}`.replace(`${BASE}${BASE}`, BASE), icon: icon ? `${BASE}${icon}` : null, slug: slugFromUrl(url) });
  }
  return out;
}

// ---- hero detail page --------------------------------------------------------
const HERO_SECTIONS = ["top", "skills", "fribbels", "artifacts", "rta", "exclusive-equipment", "awakenings", "memory-imprints"];

function parseHeader(html) {
  const top = sectionById(html, "top", HERO_SECTIONS);
  const tiers = [...top.matchAll(/<div class="tier">\s*<h4>([^<]+)<\/h4>[\s\S]*?alt="([^"]+)"/g)].reduce((o, m) => (o[m[1].toLowerCase()] = m[2], o), {});
  const gwMeta = [...top.matchAll(/is currently meta for (offense|defense) in Guild Wars/g)].map((m) => m[1]);
  return { pvpTier: tiers.pvp || null, pveTier: tiers.pve || null, gwMeta };
}
function parseBaseStats(html) {
  const top = sectionById(html, "top", HERO_SECTIONS);
  const list = statList((top.match(/<ul class="stats">[\s\S]*?<\/ul>/) || [""])[0]);
  return list.reduce((o, s) => (o[s.label] = s.value, o), {});
}
function parseSkills(html) {
  const sec = sectionById(html, "skills", HERO_SECTIONS);
  return splitBlocks(sec, /<div class="skill accordion[^"]*">/g).map((block) => {
    const name = cleanCell((block.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1]);
    if (!name) return null;
    const cooldown = cleanCell((block.match(/<div class="cooldown">([\s\S]*?)<\/div>/) || [])[1]) || null;
    const soulGain = cleanCell((block.match(/<div class="soul-gain">([\s\S]*?)<\/div>/) || [])[1]) || null;
    const statusEffects = [...block.matchAll(/<img[^>]*alt="([^"]+)"[^>]*title="([^"]+)"/g)].map((m) => decode(m[2]));
    const bottom = (block.match(/<div class="bottom">([\s\S]*?)<\/div>\s*<\/div>/) || [])[1];
    const effect = cleanCell(bottom);
    const soulburn = cleanCell((block.match(/<div class="soulburn">([\s\S]*?)<\/div>/) || [])[1]) || null;
    return { name, cooldown, soulGain, statusEffects, effect, soulburn };
  }).filter(Boolean);
}
function parseFribbelsMain(html) {
  const fribbels = sectionById(html, "fribbels", HERO_SECTIONS);
  const mainHtml = fribbels.split(/Top Fribbels Builds/)[0];
  const statsBlock = (mainHtml.match(/<div class="stats">\s*<ul>([\s\S]*?)<\/ul>/) || [""])[0];
  const averageStats = statList(statsBlock).reduce((o, s) => (o[s.label] = s.value, o), {});
  const gear = mainHtml.slice(mainHtml.indexOf('<div class="gear">'));
  return { averageStats, gearSets: gearSets(gear, "Use Rate") };
}
function parseFribbelsBuilds(html) {
  const fribbels = sectionById(html, "fribbels", HERO_SECTIONS);
  const parts = fribbels.split(/Top Fribbels Builds/);
  if (parts.length < 2) return [];
  return splitBlocks(parts[1], /<div class="rta-data">/g).map((block) => {
    const statsBlock = (block.match(/<div class="stats">\s*<ul>([\s\S]*?)<\/ul>/) || [""])[0];
    const stats = statList(statsBlock).reduce((o, s) => (o[s.label] = s.value, o), {});
    const setNames = [...block.matchAll(/<li class="gearset">([\s\S]*?)<\/li>/g)].map((m) => cleanCell(m[1]));
    const artMatch = block.match(/<a href="([^"]*\/artifacts\/[^"]+)"[^>]*>[\s\S]*?<h5[^>]*>([\s\S]*?)<\/h5>/);
    const artifact = artMatch ? { name: cleanCell(artMatch[2]), slug: slugFromUrl(artMatch[1]) } : null;
    return Object.keys(stats).length ? { stats, gearSets: setNames, artifact } : null;
  }).filter(Boolean);
}
function parseRecommendedArtifacts(html) {
  const sec = sectionById(html, "artifacts", HERO_SECTIONS);
  return [...sec.matchAll(/<a href="([^"]*\/artifacts\/[^"]+)" class="artifact">([\s\S]*?)<\/a>/g)].map((m) => {
    const name = cleanCell((m[2].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1]);
    const rate = (m[2].match(/Used by ([\d.]+)% of players/) || [])[1];
    return { name, slug: slugFromUrl(m[1]), usageRate: rate ? Number(rate) : null };
  }).filter((a) => a.name);
}
function parseRta(html) {
  const sec = sectionById(html, "rta", HERO_SECTIONS);
  return splitBlocks(sec, /<div class="rta-data" data-rank="([a-z]+)"/g).map((block) => {
    const rank = (block.match(/data-rank="([a-z]+)"/) || [])[1];
    const winRate = (block.match(/Win Rate:\s*([\d.]+)%/) || [])[1];
    if (!rank || !winRate) return null;
    const statsBlock = (block.match(/<div class="stats">\s*<ul>([\s\S]*?)<\/ul>/) || [""])[0];
    const statPriority = statList(statsBlock).reduce((o, s) => (o[s.label] = s.value, o), {});
    const picksIdx = block.indexOf('<div class="picks">');
    const gearHtml = block.slice(block.indexOf('<div class="gear">'), picksIdx > -1 ? picksIdx : undefined);
    // synergies/counters are two sibling divs with no nested <div> of their
    // own, so bound each by the next known marker's start rather than by
    // counting closing tags (which would run past "synergies" looking for
    // two consecutive </div> and swallow "counters" along with it).
    const picksHtml = picksIdx > -1 ? block.slice(picksIdx) : "";
    const cntIdx = picksHtml.indexOf('<div class="counters">');
    const synergiesHtml = picksHtml.slice(0, cntIdx > -1 ? cntIdx : undefined);
    const countersHtml = cntIdx > -1 ? picksHtml.slice(cntIdx) : "";
    return {
      rank,
      winRate: Number(winRate),
      lowSample: /very low/i.test(block),
      statPriority,
      gearSets: gearSets(gearHtml, "Win Rate"),
      synergies: heroLinkList(synergiesHtml),
      counters: heroLinkList(countersHtml),
    };
  }).filter(Boolean);
}
function parseExclusiveEquipment(html) {
  const sec = sectionById(html, "exclusive-equipment", HERO_SECTIONS);
  return splitBlocks(sec, /<div class="equipment">/g).map((block) => {
    const name = cleanCell((block.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1]);
    if (!name) return null;
    const stat = cleanCell((block.match(/<h4>([\s\S]*?)<\/h4>/) || [])[1]);
    const minRoll = (block.match(/Min Roll:\s*([\d.]+%)/) || [])[1] || null;
    const maxRoll = (block.match(/Max Roll:\s*([\d.]+%)/) || [])[1] || null;
    const skillImprovements = splitBlocks(block, /<div class="skill">/g).map((s) => {
      // The optional "Recommended" badge is its own <h4>, sitting before the
      // real skill name's <h4> inside .skill-content — scope to that div so
      // the badge text is never mistaken for the skill name.
      const content = (s.match(/<div class="skill-content">([\s\S]*?)<\/div>/) || [""])[0];
      return {
        recommended: /<div class="recommended">/.test(s),
        skill: cleanCell((content.match(/<h4>([\s\S]*?)<\/h4>/) || [])[1]),
        effect: cleanCell((content.match(/<p>([\s\S]*?)<\/p>/) || [])[1]),
      };
    }).filter((s) => s.skill);
    return { name, stat, minRoll, maxRoll, skillImprovements };
  }).filter(Boolean);
}
function parseAwakenings(html) {
  const sec = sectionById(html, "awakenings", HERO_SECTIONS);
  return splitBlocks(sec, /<div class="awakening">/g).map((block) => {
    const level = (block.match(/alt="(\d+) stars"/) || [])[1];
    if (!level) return null;
    return { level: Number(level), stats: statList(block), cost: costList(block) };
  }).filter(Boolean);
}
function parseMemoryImprints(html) {
  const sec = sectionById(html, "memory-imprints", HERO_SECTIONS);
  return splitBlocks(sec, /<div class="memory-imprint">/g).map((block) => {
    const type = cleanCell((block.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1]);
    if (!type) return null;
    const tiers = [...block.matchAll(/<li><img[^>]*alt="([A-Z]+)"[^>]*>\s*([\s\S]*?)<\/li>/g)].map((m) => ({ grade: m[1], value: cleanCell(m[2]) }));
    return { type, tiers };
  }).filter(Boolean);
}
function parseHero(html, base) {
  return {
    name: base.name,
    slug: base.slug,
    icon: base.icon,
    grade: base.grade,
    element: base.element,
    class: base.class,
    zodiac: base.zodiac,
    ...parseHeader(html),
    baseStats: parseBaseStats(html),
    skills: parseSkills(html),
    fribbels: { ...parseFribbelsMain(html), topBuilds: parseFribbelsBuilds(html) },
    recommendedArtifacts: parseRecommendedArtifacts(html),
    rta: parseRta(html),
    exclusiveEquipment: parseExclusiveEquipment(html),
    awakenings: parseAwakenings(html),
    memoryImprints: parseMemoryImprints(html),
  };
}

// ---- artifact detail page -----------------------------------------------------
function parseArtifact(html, base) {
  const description = cleanCell((html.match(/<h1>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/) || [])[1]);
  const baseBlock = (html.match(/<div class="base">([\s\S]*?)<\/div>\s*<\/div>\s*<div class="max">/) || [])[1] || "";
  const maxBlock = (html.match(/<div class="max">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/) || [])[1] || "";
  const effectAndStats = (block) => ({
    effect: cleanCell((block.match(/<p>([\s\S]*?)<\/p>/) || [])[1]),
    attack: Number((block.match(/<div class="attack">[\s\S]*?<p>([\d,]+)<\/p>/) || [])[1] || 0) || null,
    health: Number((block.match(/<div class="health">[\s\S]*?<p>([\d,]+)<\/p>/) || [])[1] || 0) || null,
  });
  const howToAcquire = cleanCell((html.match(/<h2[^>]*>How to Acquire[\s\S]*?<\/h2>\s*<p class="side-story">([\s\S]*?)<\/p>/) || [])[1]) || null;
  const heroListHtml = (html.match(/<ul class="hero-list">([\s\S]*?)<\/ul>/) || [""])[0];
  const recommendedHeroes = heroRoster(heroListHtml).map((h) => ({ name: h.name, slug: h.slug, element: h.element, class: h.class, grade: h.grade }));

  return {
    name: base.name,
    slug: base.slug,
    icon: base.icon,
    category: base.category,
    grade: base.grade,
    description,
    base: effectAndStats(baseBlock),
    max: effectAndStats(maxBlock),
    howToAcquire,
    recommendedHeroes,
  };
}

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Fetching hero roster…");
  const heroBases = heroRoster(getHtml(HEROES_URL));
  console.log(`hero roster: ${heroBases.length}`);

  console.log("Fetching artifact roster…");
  const artifactBases = artifactRoster(getHtml(ARTIFACTS_URL));
  console.log(`artifact roster: ${artifactBases.length}`);
  if (!heroBases.length || !artifactBases.length) throw new Error("empty roster — keeping previous data");

  const heroes = [];
  for (const base of heroBases) {
    const html = getHtml(base.url);
    if (html) heroes.push(parseHero(html, base));
    sleep(150);
  }
  console.log(`parsed ${heroes.length}/${heroBases.length} heroes`);

  const artifacts = [];
  for (const base of artifactBases) {
    const html = getHtml(base.url);
    if (html) artifacts.push(parseArtifact(html, base));
    sleep(150);
  }
  console.log(`parsed ${artifacts.length}/${artifactBases.length} artifacts`);

  // Cross-resolve names -> slugs both ways now that both full lists exist
  // (a hero/artifact's own page sometimes omits a slug the roster has,
  // e.g. an artifact recommended by a hero page before that artifact's
  // own page was fetched — reconcile against the final roster).
  const heroSlugByName = new Map(heroes.map((h) => [h.name, h.slug]));
  const artifactSlugByName = new Map(artifacts.map((a) => [a.name, a.slug]));
  for (const h of heroes) {
    for (const a of h.recommendedArtifacts) if (!a.slug) a.slug = artifactSlugByName.get(a.name) || null;
    for (const r of h.rta) { for (const s of r.synergies) if (!s.slug) s.slug = heroSlugByName.get(s.name) || null; for (const c of r.counters) if (!c.slug) c.slug = heroSlugByName.get(c.name) || null; }
    for (const b of h.fribbels.topBuilds) if (b.artifact && !b.artifact.slug) b.artifact.slug = artifactSlugByName.get(b.artifact.name) || null;
  }
  for (const a of artifacts) for (const h of a.recommendedHeroes) if (!h.slug) h.slug = heroSlugByName.get(h.name) || null;

  heroes.sort((a, b) => (b.grade - a.grade) || a.name.localeCompare(b.name));
  artifacts.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  fs.writeFileSync(OUT_HEROES, JSON.stringify({
    updated: new Date().toISOString(),
    source: HEROES_URL,
    count: heroes.length,
    grades: [...new Set(heroes.map((h) => h.grade))].sort((a, b) => b - a),
    elements: [...new Set(heroes.map((h) => h.element))].filter(Boolean).sort(),
    classes: [...new Set(heroes.map((h) => h.class))].filter(Boolean).sort(),
    heroes,
  }));
  fs.writeFileSync(OUT_ARTIFACTS, JSON.stringify({
    updated: new Date().toISOString(),
    source: ARTIFACTS_URL,
    count: artifacts.length,
    categories: [...new Set(artifacts.map((a) => a.category))].sort(),
    artifacts,
  }));
  console.log(`\nWrote ${heroes.length} heroes, ${artifacts.length} artifacts.`);
}

if (require.main === module) {
  try { run(); } catch (e) { require("./lib/keep")([OUT_HEROES, OUT_ARTIFACTS], e); }
} else {
  module.exports = { heroRoster, artifactRoster, parseHero, parseArtifact };
}
