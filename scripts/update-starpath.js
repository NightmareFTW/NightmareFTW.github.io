/* Disney Dreamlight Valley — Star Path scraper.
   Parses the current Star Path's full weekly duty table from the DDV Wiki
   (fandom) into data/dreamlight-valley/starpath.json: every duty with its
   quantity, token reward and instructions, grouped by week.

   Which season is "current" is discovered automatically from the wiki's own
   "Star Path" index page (its Seasons table, matched against today's date)
   — this used to be a STAR_PATH_PAGE constant someone had to remember to
   bump every ~6-8 weeks, and it went 3+ months stale when nobody did.
   FALLBACK_PAGE/FALLBACK_SEASON below are only used if that lookup fails for
   any reason (wiki page restructured, network hiccup); keep them roughly
   current as a safety net, but they're no longer load-bearing for
   correctness the way the old hardcoded constant was.
   Node 18+, no deps. */

const fs = require("fs");
const path = require("path");
const { getJson } = require("./lib/http");

const INDEX_PAGE = "Star Path";
const FALLBACK_PAGE = "Haunting Elegance Star Path";
const FALLBACK_SEASON = { name: "Haunting Elegance", number: 25, theme: "Witches, vampires, ghosts, skeletons", start: "2026-09-23", end: "2026-12-07" };
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "starpath.json");

function fetchWikitext(page) {
  const api = `https://disneydreamlightvalley.fandom.com/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`;
  const json = getJson(api);
  return json && json.parse ? json.parse.wikitext["*"] : null;
}

// Wiki dates come as "September 23, 2026", "December 10,2025" (no space
// after the comma) or with an ordinal suffix like "28th, 2024" or even a
// typo'd one ("1th, 2023") — strip any st/nd/rd/th and normalize spacing
// before handing it to Date().
function parseWikiDate(s) {
  const cleaned = s.trim().replace(/(\d+)(st|nd|rd|th)/i, "$1").replace(/,(\S)/, ", $1");
  const d = new Date(cleaned);
  return isNaN(d) ? null : d;
}
const iso = (d) => d.toISOString().slice(0, 10);

// Convert wikitext to readable plain text.
function clean(s) {
  return s
    .replace(/\{\{il\|([^|}]+)(\|[^}]*)?\}\}/g, "$1")   // {{il|Scallop}} -> Scallop
    .replace(/\{\{Token\|[^}]*\}\}/g, "")                // drop token icon
    .replace(/\{\{icon\|[^}]*\}\}/g, "")                 // drop icons
    .replace(/\{\{[^}]*\}\}/g, "")                       // drop any other template
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, "$1")         // [[A|B]] -> B
    .replace(/\[\[([^\]]+)\]\]/g, "$1")                  // [[A]] -> A
    .replace(/'''?/g, "")                                // bold/italics
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Find whichever season's [start, end] window contains `now` by reading the
// wiki's own Seasons table on the "Star Path" index page, rather than
// trusting a hardcoded page title. Returns the season's page title, its
// already-fetched wikitext (so run() doesn't fetch it twice) and a season
// metadata object — or null if the table couldn't be read or nothing
// currently spans `now` (e.g. a brief gap between seasons).
function discoverCurrentSeason(now = new Date()) {
  const indexWikitext = fetchWikitext(INDEX_PAGE);
  if (!indexWikitext) return null;

  const rowRe = /\{\{Token\|[^}]*\}\}\s*\[\[([^\]|]+)\]\]\s*\n\|([^\n]+)\n\|([^\n]+)/g;
  const rows = [];
  let m;
  while ((m = rowRe.exec(indexWikitext))) rows.push({ page: m[1].trim(), start: parseWikiDate(m[2]), end: parseWikiDate(m[3]) });
  if (!rows.length) return null;

  const idx = rows.findIndex((r) => r.start && r.end && now >= r.start && now <= r.end);
  if (idx === -1) return null;
  const row = rows[idx];
  const name = row.page.replace(/\s*Star Path$/i, "");
  // Rows are newest-first and the table has run unbroken since the first
  // season, so "Nth from the end" is the season number.
  const number = rows.length - idx;

  const wikitext = fetchWikitext(row.page);
  if (!wikitext) return null;

  // Short theme blurb from the page's own Description section — cut at the
  // first dash/period/exclamation so it reads like a label, not a sentence
  // (e.g. "Witches, vampires, ghosts, skeletons", not the full paragraph).
  let theme = "";
  const desc = wikitext.match(/==\s*Description\s*==\s*\n([^\n]+)/i);
  if (desc) {
    const plain = clean(desc[1]);
    theme = (plain.match(/^[^–\-.!]+/) || [plain])[0].trim();
    if (theme.length < 8) theme = (plain.match(/^[^.!]*[.!]/) || [plain])[0].replace(/[.!]$/, "").trim();
    if (theme.length > 70) theme = theme.slice(0, theme.lastIndexOf(" ", 67)) + "…";
  }

  return { page: row.page, wikitext, season: { name, number, theme, start: iso(row.start), end: iso(row.end) } };
}

async function run() {
  const discovered = discoverCurrentSeason();
  const page = discovered ? discovered.page : FALLBACK_PAGE;
  const season = discovered ? discovered.season : FALLBACK_SEASON;
  const wikitext = discovered ? discovered.wikitext : fetchWikitext(page);
  if (!wikitext) throw new Error(`could not fetch "${page}"`);

  // Pick the wikitable that contains "Week 1".
  const tables = wikitext.match(/\{\|[\s\S]*?\|\}/g) || [];
  const table = tables.find((t) => /Week 1/.test(t));
  if (!table) throw new Error("duties table not found");

  const weeks = [];
  let current = null;
  // Rows are separated by "|-"
  for (const rawRow of table.split(/\n\|-/)) {
    const weekHdr = rawRow.match(/Week\s+(\d+)\s*<small>\s*\(([^)]+)\)/i) || rawRow.match(/Week\s+(\d+)/i);
    if (weekHdr && /colspan/.test(rawRow)) {
      current = { week: +weekHdr[1], unlocks: weekHdr[2] ? clean(weekHdr[2]) : "", duties: [] };
      weeks.push(current);
      continue;
    }
    if (!current) continue;
    // Cells may be on their own line ("\n|") or inline ("||"). Normalise then split.
    const cells = rawRow.replace(/\|\|/g, "\n|").split(/\n\|/).slice(1).map((c) => c.replace(/^\|/, ""));
    if (cells.length < 4) continue;
    const name = clean(cells[0]);
    if (!name || /^Duties$/i.test(name)) continue;
    current.duties.push({
      name,
      qty: clean(cells[1]),
      tokens: clean(cells[2]).replace(/[^\d]/g, "") || clean(cells[2]),
      how: clean(cells.slice(3).join(" ")),
    });
  }

  const total = weeks.reduce((s, w) => s + w.duties.length, 0);
  const source = `https://disneydreamlightvalley.fandom.com/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ season, updated: new Date().toISOString(), source, count: total, weeks }));
  console.log(`Wrote ${total} duties across ${weeks.length} weeks (Season ${season.number}: ${season.name}) -> ${OUT}`);
}

run().catch((e) => require("./lib/keep")(OUT, e));
