/* One-off diagnostic: dreamlightvalleywiki.com now serves a Cloudflare JS
   challenge to curl (confirmed — see PR description), so the DDV scrapers
   need to move to the Fandom mirror (disneydreamlightvalley.fandom.com),
   same as update-starpath.js already does successfully. This prints the
   wikitext structure of the pages the other scrapers need, via the
   MediaWiki API, so the parsers can be rewritten against real data.
   Not part of the scheduled pipeline — safe to delete once scrapers are fixed. */
const { getJson } = require("./lib/http");

const BASE = "https://disneydreamlightvalley.fandom.com";

function wikitextOf(page) {
  const api = `${BASE}/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`;
  const json = getJson(api);
  return json && json.parse ? json.parse.wikitext["*"] : null;
}

function categoryMembers(cat) {
  const api = `${BASE}/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent("Category:" + cat)}&cmlimit=500&format=json`;
  const json = getJson(api);
  return json && json.query ? json.query.categorymembers : null;
}

for (const page of ["Furniture", "Clothing", "Companions", "Critters"]) {
  const wt = wikitextOf(page);
  console.log(`\n\n========== PAGE ${page} ==========`);
  if (!wt) { console.log("NO WIKITEXT / API FAILED"); continue; }
  console.log("length:", wt.length);
  console.log("gallery tags:", (wt.match(/<gallery/g) || []).length);
  console.log("wikitables ({|):", (wt.match(/\{\|/g) || []).length);
  console.log("{{Card templates approx:", (wt.match(/\{\{Card/gi) || []).length);
  console.log("--- first 2000 chars ---");
  console.log(wt.slice(0, 2000));
}

for (const cat of ["Furniture", "Clothing", "Companions", "Critters", "Essentials"]) {
  const members = categoryMembers(cat);
  console.log(`\n\n========== CATEGORY ${cat} ==========`);
  if (!members) { console.log("NO RESULT / API FAILED"); continue; }
  console.log("count:", members.length);
  console.log(members.slice(0, 15).map((m) => `${m.title} (ns=${m.ns})`).join(" | "));
}

for (const page of ["Ingredients", "Gems", "Fish", "Foraging", "Crafting"]) {
  const wt = wikitextOf(page);
  console.log(`\n\n========== PAGE ${page} ==========`);
  if (!wt) { console.log("NO WIKITEXT / API FAILED"); continue; }
  console.log("length:", wt.length);
  console.log("wikitables ({|):", (wt.match(/\{\|/g) || []).length);
  console.log("--- first 1500 chars ---");
  console.log(wt.slice(0, 1500));
}
