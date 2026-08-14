/* One-off diagnostic: dumps raw wikitext from the Fandom mirror
   (disneydreamlightvalley.fandom.com) for the pages the DDV scrapers need,
   so the parsers can be rewritten against real, current data without
   needing sandbox network access to the wiki itself. Writes files instead
   of printing to the job log (some pages are tens of KB). Not part of the
   scheduled pipeline — safe to delete once scrapers are fixed. */
const fs = require("fs");
const path = require("path");
const { getJson } = require("./lib/http");

const BASE = "https://disneydreamlightvalley.fandom.com";
const OUT_DIR = path.join(__dirname, "..", "scratch", "ddv-debug");
fs.mkdirSync(OUT_DIR, { recursive: true });

function wikitextOf(page) {
  const api = `${BASE}/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`;
  const json = getJson(api);
  return json && json.parse ? json.parse.wikitext["*"] : `ERROR: ${JSON.stringify(json)}`;
}

const PAGES = ["Furniture", "Clothing", "Companions", "Critters", "Fish (collection)", "Ingredients (collection)", "Ingredients", "Fish"];
for (const page of PAGES) {
  const wt = wikitextOf(page);
  const file = path.join(OUT_DIR, page.replace(/[^a-z0-9]+/gi, "_") + ".wikitext.txt");
  fs.writeFileSync(file, wt);
  console.log(`${page}: ${wt.length} chars -> ${file}`);
}
