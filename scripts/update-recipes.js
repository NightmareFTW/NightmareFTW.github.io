/* Disney Dreamlight Valley — recipe scraper.
   Parses the Nintendo Life "full recipe list" tables (name, ingredients, stars,
   sell price, energy) into data/dreamlight-valley/recipes.json.
   Best-effort scrape of an HTML guide — re-run if the source layout changes.
   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");

const SOURCE = "https://www.nintendolife.com/guides/disney-dreamlight-valley-recipes-ingredients-sell-prices-star-ratings-full-list";
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "recipes.json");

const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function parseIngredients(str) {
  // "1 Herring 1 Lemon 1 Onion" -> [{q:1,name:"Herring"}, ...]
  const parts = str.split(/\s+(?=\d+\s)/).map((p) => p.trim()).filter(Boolean);
  return parts.map((p) => {
    const m = p.match(/^(\d+)\s+(.+)$/);
    return m ? { q: +m[1], name: m[2].trim() } : { q: 1, name: p };
  });
}

async function run() {
  const html = await (await fetch(SOURCE, { headers: { "User-Agent": "Mozilla/5.0 NightmareFTW-bot" } })).text();
  const rows = [];

  const tableRe = /<table[\s\S]*?<\/table>/g;
  let tm;
  while ((tm = tableRe.exec(html))) {
    const trs = tm[0].match(/<tr[\s\S]*?<\/tr>/g) || [];
    for (const tr of trs) {
      const cells = [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1]);
      if (cells.length < 4) continue;
      const name = clean(cells[0]);
      if (!name || /recipe name/i.test(name)) continue; // skip headers
      const ingredients = parseIngredients(clean(cells[1]));
      const stars = (cells[2].match(/⭐/g) || []).length || (clean(cells[2]).match(/\d/) ? +clean(cells[2]).match(/\d/)[0] : 0);
      const sell = parseInt(clean(cells[3]).replace(/[^\d]/g, ""), 10) || 0;
      const energy = parseInt(clean(cells[4] || "").replace(/[^\d]/g, ""), 10) || 0;
      rows.push({ name, ingredients, stars, sell, energy });
    }
  }

  // de-dupe by name
  const seen = new Set();
  const unique = rows.filter((r) => (seen.has(r.name) ? false : seen.add(r.name)));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: SOURCE, count: unique.length, recipes: unique }));
  console.log(`Wrote ${unique.length} recipes -> ${OUT}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
