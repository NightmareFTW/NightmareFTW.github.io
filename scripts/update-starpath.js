/* Disney Dreamlight Valley — Star Path scraper.
   Parses the current Star Path's full weekly duty table from the DDV Wiki
   (fandom) into data/dreamlight-valley/starpath.json: every duty with its
   quantity, token reward and instructions, grouped by week.
   Update STAR_PATH_PAGE when a new season begins. Node 18+, no deps. */

const fs = require("fs");
const path = require("path");
const { getJson } = require("./lib/http");

const STAR_PATH_PAGE = "Godly Glamor Star Path";
const SEASON = { name: "Godly Glamor", number: 23, theme: "Mount Olympus / Greek gods", start: "2026-06-03", end: "2026-07-28" };
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "starpath.json");

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

async function run() {
  const api = `https://disneydreamlightvalley.fandom.com/api.php?action=parse&page=${encodeURIComponent(STAR_PATH_PAGE)}&prop=wikitext&format=json`;
  const json = getJson(api);
  const wikitext = json.parse.wikitext["*"];

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
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ season: SEASON, updated: new Date().toISOString(), source: api, count: total, weeks }));
  console.log(`Wrote ${total} duties across ${weeks.length} weeks -> ${OUT}`);
}

run().catch((e) => require("./lib/keep")(OUT, e));
