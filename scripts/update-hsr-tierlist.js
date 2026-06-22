/* Honkai: Star Rail — tier list scraper.
   Pulls the main character tier list (with portraits) from Game8 and writes
   data/honkai-star-rail/tier-list.json. Run locally and by a GitHub Action so
   the on-site tier list tracks the live meta. Node 18+ (global fetch), no deps. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const URL = "https://game8.co/games/Honkai-Star-Rail/archives/409604";
const OUT = path.join(__dirname, "..", "data", "honkai-star-rail", "tier-list.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TIER_ORDER = ["SS", "S", "A", "B", "C", "D"];

// Game8 blocks plain Node fetch in some environments; curl is reliable and works
// the same locally and in CI (and avoids a libuv crash from mixing fetch+execSync).
function getHtml(url) {
  return execSync(`curl -sL -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const cleanName = (alt) => decode(alt).replace(/^.*?[-–]\s*/, "").trim(); // "Star Rail - Castorice" -> "Castorice"

function run() {
  const html = getHtml(URL);
  const version = (html.match(/(\d\.\d)\s*Tier\s*List/i) || [])[1] || "";

  // The first table that has tier-rank <th> cells is the main character tier list.
  const table = (html.match(/<table[^>]*>[\s\S]*?<\/table>/g) || []).find((t) => /Tier<\/th>/i.test(t));
  if (!table) throw new Error("tier table not found — keeping previous file");

  const tiers = [];
  for (const m of table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g)) {
    const tier = ((m[1].match(/([A-Za-z0-9]+)\s*Tier/) || [])[1] || "").toUpperCase();
    if (!tier) continue;
    const seen = new Set();
    let chars = [...m[2].matchAll(/<a[^>]*href="([^"]*archives\/[0-9]+)"[^>]*>\s*<img[^>]*alt="([^"]*)"[^>]*data-src="([^"]*)"/g)]
      .map((c) => ({ name: cleanName(c[2]), img: c[3], url: "https://game8.co" + c[1] }));
    if (!chars.length) chars = [...m[2].matchAll(/<img[^>]*alt="([^"]*)"[^>]*data-src="([^"]*)"/g)]
      .map((c) => ({ name: cleanName(c[1]), img: c[2] }));
    chars = chars.filter((c) => c.name && !/Tier$/i.test(c.name) && !seen.has(c.name) && seen.add(c.name));
    if (chars.length) tiers.push({ tier, chars });
  }
  if (!tiers.length) throw new Error("no characters parsed — keeping previous file");
  tiers.sort((a, b) => (TIER_ORDER.indexOf(a.tier) + 1 || 99) - (TIER_ORDER.indexOf(b.tier) + 1 || 99));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: URL, version, tiers }));
  console.log(`Wrote ${tiers.length} tiers, ${tiers.reduce((n, t) => n + t.chars.length, 0)} characters (v${version}).`);
}
try { run(); } catch (e) { console.error(e.message); process.exit(1); }
