/* Disney Dreamlight Valley — items (ingredients) scraper.
   Parses the Dreamlight Valley Wiki "Ingredients" table into
   data/dreamlight-valley/items.json — every farmable ingredient with its
   cooking category, biome location, prices, energy, grow time and source.
   Best-effort HTML scrape; re-run if the source layout changes.
   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");

const SOURCE = "https://dreamlightvalleywiki.com/Ingredients";
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "items.json");

const clean = (s) => s.replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&#160;|&nbsp;/g, " ")
  .replace(/\s+/g, " ").trim();
const num = (s) => parseInt(clean(s).replace(/[^\d]/g, ""), 10) || 0;

// Known biomes/realms used to extract clean filter facets from the messy
// "Location"/"Sources" text (which sometimes also contains plant names).
const BIOMES = [
  "Peaceful Meadow", "Dazzle Beach", "Forest of Valor", "Glade of Trust",
  "Sunlit Plateau", "Frosted Heights", "Forgotten Lands", "Wild Tangle",
  "Glittering Dunes", "Overlook", "The Promenade", "The Docks", "The Grasslands",
  "Ancient's Landing", "Moana Realm",
];
const biomesIn = (text) => BIOMES.filter((b) => text.includes(b));

async function run() {
  const html = await (await fetch(SOURCE, { headers: { "User-Agent": "Mozilla/5.0 NightmareFTW-bot" } })).text();
  const table = (html.match(/<table[\s\S]*?<\/table>/) || [""])[0];
  const trs = table.match(/<tr[\s\S]*?<\/tr>/g) || [];
  const rows = [];

  for (const tr of trs) {
    const c = [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1]);
    if (c.length < 11) continue;
    const name = clean(c[1]);
    if (!name || /^name$/i.test(name)) continue; // header
    const location = clean(c[9]) || "—";
    const source = clean(c[10]) || "—";
    rows.push({
      name,
      category: clean(c[2]),
      sell: num(c[4]),
      energy: num(c[5]),
      growTime: clean(c[6]) || "—",
      location,
      source,
      biomes: biomesIn(`${location} ${source}`),
    });
  }

  const seen = new Set();
  const unique = rows.filter((r) => (seen.has(r.name) ? false : seen.add(r.name)));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: SOURCE, count: unique.length, items: unique }));
  console.log(`Wrote ${unique.length} items -> ${OUT}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
