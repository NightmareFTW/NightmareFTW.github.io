/* Epic Seven — Heroes + Artifacts scraper.

   Source: game8.co (an existing, non-bot-protected guide site already used
   by this repo for Honkai: Star Rail — see scripts/update-hsr-builds.js).
   Epic Seven's own official strategy site (epic7.onstove.com) guards its
   real hero-detail/usage-statistics API behind a bot-management JS
   challenge that returns a "Challenge Validation" page instead of data for
   any non-browser request — deliberately blocking exactly this kind of
   automated access — so it is not used here, and no attempt is made to
   defeat that protection.

   No MediaWiki-style API exists for Game8, so this is plain regex-based
   HTML scraping (same technique as the HSR scripts) rather than a
   templated-wiki parse. Every hero/artifact page is laid out consistently
   as a run of `<h2>{Name} - {Section}</h2>` blocks, so sections are sliced
   by heading text rather than by guessing table position.

   Writes:
   - data/epic7/heroes.json — every hero (~245): grade/element/class/zodiac,
     rating, stats (CP/Atk/HP/Spd/Def/crit/etc, all as scraped), strengths/
     weaknesses, skills, awakening bonuses, and recommended artifacts
     (resolved to this file's own artifact slugs by name where possible).
   - data/epic7/artifacts.json — every artifact: rating, class-restriction
     category, skill effect (base/max), stats, and recommended heroes
     (resolved to this file's own hero slugs by name where possible).

   Run by .github/workflows/update-epic7.yml (weekly). Node 18+, curl. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const BASE = "https://game8.co/games/Epic-Seven";
const HERO_LIST_URLS = [
  `${BASE}/archives/272475`, // 5-star
  `${BASE}/archives/272476`, // 4-star
  `${BASE}/archives/272477`, // 3-star
];
const ARTIFACT_HUB_URL = `${BASE}/archives/272470`;
const OUT_DIR = path.join(__dirname, "..", "data", "epic7");
const OUT_HEROES = path.join(OUT_DIR, "heroes.json");
const OUT_ARTIFACTS = path.join(OUT_DIR, "artifacts.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
// A hard `timeout` wrapper backstops curl's own --max-time in case a
// request stalls at the network layer in a way curl's flag doesn't
// reliably catch (~430 pages get fetched here — one bad request eating
// minutes would otherwise drag the whole run out unpredictably).
const getHtml = (url) => { try { return execFileSync("timeout", ["25", "curl", "-sL", "--retry", "1", "--retry-delay", "1", "--retry-all-errors", "--max-time", "15", "-A", UA, url], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); } catch { return ""; } };
const decode = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const cleanCell = (s) => decode(String(s || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const absolutize = (href) => (href.startsWith("http") ? href : `https://game8.co${href}`);

// ---- generic HTML helpers ---------------------------------------------------
// A Game8 hero/artifact page runs as a sequence of `<h2>{Name} - {Section}</h2>`
// blocks — slicing by heading TEXT is far more robust across ~380 differently
// named pages than guessing table position/order.
function section(html, label) {
  const re = new RegExp(`<h2[^>]*>[^<]*-\\s*${label}\\s*</h2>([\\s\\S]*?)(?=<h2[^>]*>|$)`, "i");
  const m = html.match(re);
  return m ? m[1] : "";
}
function subsection(html, h3label) {
  const re = new RegExp(`<h3[^>]*>\\s*${h3label}[^<]*</h3>([\\s\\S]*?)(?=<h3[^>]*>|<h2[^>]*>|$)`, "i");
  const m = html.match(re);
  return m ? m[1] : "";
}
function listItems(html) {
  return [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => cleanCell(m[1])).filter(Boolean);
}
// A bare key/value table: <tr><th>Key</th><td>Value</td></tr> repeated.
// Rows are split out first (a plain, reliably-bounded <tr>...</tr> match)
// before checking each one individually for the th+td pair — matching
// th/td across the whole table in one regex risks the capture bleeding
// past a row that doesn't fit the pattern (e.g. the header-only
// <th></th><th>★6</th> "which grade is this" row atop a hero's stats
// table, which has no <td> at all) into the next row's own cells.
function kvTable(html) {
  const out = {};
  for (const row of html.match(/<tr>[\s\S]*?<\/tr>/g) || []) {
    const m = row.match(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/);
    if (!m) continue;
    const k = cleanCell(m[1]);
    if (k) out[k] = cleanCell(m[2]);
  }
  return out;
}
// The secondary hero-stats table pairs a <th>Label</th><th>Label2</th>
// header row with a <td>Value</td><td>Value2</td> row right after it
// (rather than each label sitting next to its own value).
function pairedStatsTable(html) {
  const out = {};
  const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
  for (let i = 0; i < rows.length - 1; i++) {
    const headers = [...rows[i].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => cleanCell(m[1]));
    if (!headers.length || !headers.every(Boolean) || /<td/.test(rows[i])) continue;
    const values = [...rows[i + 1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => cleanCell(m[1]));
    if (values.length !== headers.length) continue;
    headers.forEach((h, idx) => { out[h] = values[idx]; });
    i++;
  }
  return out;
}
// Every `<a href=".../archives/N">...<img.../>NAME</a>` in a block of HTML —
// covers roster lists and "recommended X" grids alike. A name's apostrophe
// (e.g. "Barthez's Orbuculum") sits in the link's own TEXT here, not inside
// a quoted attribute, so decode() renders it correctly — parsing the (here
// occasionally malformed) `alt=` attribute instead would truncate at the
// embedded quote.
function extractLinks(html) {
  const out = [];
  for (const m of html.matchAll(/<a[^>]*\shref=['"]?([^'"\s>]+)['"]?[^>]*>([\s\S]*?)<\/a>/g)) {
    if (!/\/archives\/\d+/.test(m[1])) continue;
    const name = cleanCell(m[2].replace(/<img[^>]*>/g, ""));
    if (name) out.push({ name, url: absolutize(m[1]) });
  }
  return out;
}
// The 2-column "name link + free text" table used for a hero's Recommended
// Artifacts: <tr><th><a ...>NAME</a></th><td>REASON</td></tr>.
function nameReasonTable(html) {
  const out = [];
  for (const m of html.matchAll(/<tr>\s*<th[^>]*>\s*<a[^>]*\shref=['"]?([^'"\s>]+)['"]?[^>]*>([\s\S]*?)<\/a>\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g)) {
    const name = cleanCell(m[2].replace(/<img[^>]*>/g, ""));
    if (!name) continue;
    out.push({ name, reason: cleanCell(m[3]) });
  }
  return out;
}
// A single named entity followed on the next row by its description — used
// for both a hero's Skills (name row, then a "Skill Effect:" row) and an
// artifact's Skill Effect (Base)/(Max) (label row, then a text row).
function nameThenTextRows(html) {
  const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
  const out = [];
  for (let i = 0; i < rows.length - 1; i++) {
    if (/<td/.test(rows[i]) || !/<th/.test(rows[i])) continue;
    const nameCell = (rows[i].match(/<th[^>]*>([\s\S]*?)<\/th>/) || [])[1] || "";
    const name = cleanCell(nameCell.replace(/<img[^>]*>/g, ""));
    const textCell = (rows[i + 1].match(/<td[^>]*>([\s\S]*?)<\/td>/) || [])[1];
    if (!name || textCell == null) continue;
    out.push({ name, text: cleanCell(textCell).replace(/^Skill Effect:\s*/i, "") });
    i++;
  }
  return out;
}

// ---- hero roster (5/4/3-star list pages) ------------------------------------
function heroRoster(html) {
  const out = [];
  for (const t of html.match(/<table[\s\S]*?<\/table>/g) || []) {
    const rows = t.match(/<tr>[\s\S]*?<\/tr>/g) || [];
    if (rows.length < 2 || !/hero/i.test(cleanCell(rows[0])) || !/grade/i.test(cleanCell(rows[0]))) continue;
    for (const r of rows.slice(1)) {
      const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
      if (cells.length < 4) continue;
      const link = extractLinks(cells[0])[0];
      if (!link) continue;
      const icon = (cells[0].match(/data-src=['"]([^'"]+)['"]/) || [])[1] || null;
      out.push({ name: link.name, url: link.url, icon, grade: Number(cleanCell(cells[1])) || null, element: cleanCell(cells[2]), rating: cleanCell(cells[3]) });
    }
  }
  return out;
}

// ---- artifact roster (single hub page, grouped by class heading) -----------
function artifactRoster(html) {
  const headings = [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)].map((m) => ({ pos: m.index, text: cleanCell(m[1]) }));
  const out = [];
  for (const tm of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const t = tm[0];
    if (!/List of Artifacts/.test(t)) continue;
    const heading = [...headings].reverse().find((h) => h.pos < tm.index && /^List of .+ Artifacts$/i.test(h.text));
    const category = heading ? heading.text.replace(/^List of\s*/i, "").replace(/\s*Artifacts$/i, "").trim() : "Any Class";
    for (const cellHtml of [...t.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1])) {
      const link = extractLinks(cellHtml)[0];
      if (!link) continue;
      const icon = (cellHtml.match(/data-src=['"]([^'"]+)['"]/) || [])[1] || null;
      out.push({ name: link.name, url: link.url, icon, category });
    }
  }
  return out;
}

// ---- hero detail page --------------------------------------------------------
function parseHero(html, base) {
  const ratingSec = section(html, "Rating");
  const overall = (cleanCell(ratingSec).match(/Overall Rating\s*([\d.]+\s*\/\s*10)/i) || [])[1] || "";
  const strengths = listItems(subsection(ratingSec, "Strengths"));
  const weaknesses = listItems(subsection(ratingSec, "Weakness"));

  const recommendedArtifacts = nameReasonTable(section(html, "Recommended Artifacts"));

  const statsSec = section(html, "Stats");
  const basic = kvTable(subsection(statsSec, "Basic Information"));
  const statTables = (subsection(statsSec, "Stats \\(at Max Lv\\.\\)").match(/<table[\s\S]*?<\/table>/g) || []);
  const stats = Object.assign({}, kvTable(statTables[0] || ""), pairedStatsTable(statTables[1] || ""));

  const skills = nameThenTextRows(subsection(section(html, "Skills and Specialty"), "Skills"))
    .map((s) => ({ name: s.name, effect: s.text }));

  const awakenTable = (section(html, "Awakening").match(/<table[\s\S]*?<\/table>/) || [""])[0];
  const awakening = [];
  for (const r of (awakenTable.match(/<tr>[\s\S]*?<\/tr>/g) || []).slice(1)) {
    const cells = [...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => cleanCell(m[1].replace(/<hr[^>]*>/g, " / ")));
    if (cells.length === 3) awakening.push({ level: cells[0], main: cells[1], additional: cells[2] });
  }

  return {
    name: base.name,
    slug: slugify(base.name),
    icon: base.icon,
    grade: base.grade,
    element: basic.Element || base.element,
    class: basic.Class || "",
    zodiac: basic.Zodiac || "",
    rating: overall || base.rating,
    stats,
    strengths,
    weaknesses,
    skills,
    awakening,
    recommendedArtifacts,
  };
}

// ---- artifact detail page -----------------------------------------------------
function parseArtifact(html, base) {
  const sec1 = section(html, "Rating and Category");
  const info = kvTable(sec1);
  const recommendedHeroes = extractLinks(subsection(sec1, "Recommended Heroes")).map((h) => ({ name: h.name }));

  const sec2 = section(html, "Skill and Stats");
  const skillRows = nameThenTextRows(subsection(sec2, "Skill Effect"));
  const skillEffectBase = (skillRows.find((s) => /base/i.test(s.name)) || {}).text || "";
  const skillEffectMax = (skillRows.find((s) => /max/i.test(s.name)) || {}).text || "";
  const stats = kvTable(subsection(sec2, "Stats"));

  return {
    name: base.name,
    slug: slugify(base.name),
    icon: base.icon,
    category: base.category,
    rating: info.Rating || "",
    skillEffectBase,
    skillEffectMax,
    stats,
    recommendedHeroes,
  };
}

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Fetching artifact hub page…");
  const artifactBases = artifactRoster(getHtml(ARTIFACT_HUB_URL));
  console.log(`artifact roster: ${artifactBases.length}`);

  console.log("Fetching hero list pages…");
  const heroBaseMap = new Map();
  for (const url of HERO_LIST_URLS) {
    for (const h of heroRoster(getHtml(url))) if (!heroBaseMap.has(h.name)) heroBaseMap.set(h.name, h);
    sleep(300);
  }
  const heroBases = [...heroBaseMap.values()];
  console.log(`hero roster: ${heroBases.length}`);
  if (!heroBases.length || !artifactBases.length) throw new Error("empty roster — keeping previous data");

  const heroes = [];
  for (const base of heroBases) {
    const html = getHtml(base.url);
    if (html) heroes.push(parseHero(html, base));
    sleep(200);
  }
  console.log(`parsed ${heroes.length}/${heroBases.length} heroes`);

  const artifacts = [];
  for (const base of artifactBases) {
    const html = getHtml(base.url);
    if (html) artifacts.push(parseArtifact(html, base));
    sleep(200);
  }
  console.log(`parsed ${artifacts.length}/${artifactBases.length} artifacts`);

  // Cross-resolve names -> slugs both ways now that both full lists exist.
  const heroSlugByName = new Map(heroes.map((h) => [h.name, h.slug]));
  const artifactSlugByName = new Map(artifacts.map((a) => [a.name, a.slug]));
  for (const h of heroes) for (const a of h.recommendedArtifacts) a.slug = artifactSlugByName.get(a.name) || null;
  for (const a of artifacts) for (const h of a.recommendedHeroes) h.slug = heroSlugByName.get(h.name) || null;

  heroes.sort((a, b) => (b.grade - a.grade) || a.name.localeCompare(b.name));
  artifacts.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  fs.writeFileSync(OUT_HEROES, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://game8.co/games/Epic-Seven/archives/272396",
    count: heroes.length,
    grades: [...new Set(heroes.map((h) => h.grade))].sort((a, b) => b - a),
    elements: [...new Set(heroes.map((h) => h.element))].filter(Boolean).sort(),
    classes: [...new Set(heroes.map((h) => h.class))].filter(Boolean).sort(),
    heroes,
  }));
  fs.writeFileSync(OUT_ARTIFACTS, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://game8.co/games/Epic-Seven/archives/272470",
    count: artifacts.length,
    categories: [...new Set(artifacts.map((a) => a.category))].sort(),
    artifacts,
  }));
  console.log(`\nWrote ${heroes.length} heroes, ${artifacts.length} artifacts.`);
}

try { run(); } catch (e) { require("./lib/keep")([OUT_HEROES, OUT_ARTIFACTS], e); }
