/* Disney Dreamlight Valley — full furniture catalogue.
   The wiki's Furniture page lists every piece in per-theme galleries (Aladdin,
   Cinderella, …). We scrape name + thumbnail + theme for all of them and attach
   the official PT-BR name. Written to data/dreamlight-valley/furniture.json and
   lazy-loaded by the Items Database only when the Furniture tab is opened (it's
   large, so it isn't bundled into items.json). Node 18+, no deps. */

const fs = require("fs");
const path = require("path");
const { officialName } = require("./ddv-official");
// Furniture names are proper-noun-heavy, so the best-effort translator mangles
// them ("Ice Cream Stand (2)" -> garbage). Use the official PT-BR name, else keep English.

const SRC = "https://dreamlightvalleywiki.com/Furniture";
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "furniture.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
// Resolve a wiki thumb URL to the original file (other thumb sizes 301-redirect).
const bigImg = (u) => {
  if (!u) return "";
  const t = u.match(/\/images\/thumb\/(.+?\.(?:png|jpe?g))\/\d+px-/i);
  const s = t ? `/images/${t[1]}` : u;
  return s.startsWith("http") ? s : "https://dreamlightvalleywiki.com" + s;
};

async function run() {
  const html = await (await fetch(SRC, { headers: { "User-Agent": UA } })).text();
  const seen = new Set();
  const items = [];
  // Each <h2/h3> heading starts a theme; the galleries under it are that theme.
  for (const part of html.split(/(?=<h[23])/)) {
    const hm = part.match(/<h[23][^>]*>(?:<[^>]+>)*([^<]+)/);
    if (!hm) continue;
    const theme = clean(hm[1]);
    if (!theme || /^(Placing Furniture|Contents|Navigation|Links|Gameplay|References|Trivia|Categories)/i.test(theme)) continue;
    for (const box of part.match(/<li class="gallerybox"[\s\S]*?<\/li>/g) || []) {
      const badged = box.replace(/<div class="gallerycorner"[\s\S]*?<\/div>\s*<\/div>/g, ""); // drop Premium/DLC corner badge
      const name = clean((badged.match(/<a[^>]+title="([^"]+)"/) || [])[1] || "");
      if (!name || name.length < 2 || /\.(png|jpe?g)$|^File:/i.test(name) || seen.has(name)) continue;
      seen.add(name);
      const img = bigImg((badged.match(/<img[^>]+(?:data-src|src)="([^"]+)"/) || [])[1] || "");
      items.push({ name, name_pt: officialName(name) || name, img, theme });
    }
  }
  if (items.length < 100) throw new Error(`only ${items.length} furniture parsed — keeping previous file`);
  const themes = [...new Set(items.map((i) => i.theme))].sort();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: SRC, count: items.length, themes, items }));
  console.log(`Wrote ${items.length} furniture across ${themes.length} themes (${items.filter((i) => i.img).length} images, ${items.filter((i) => i.name_pt !== i.name).length} PT names).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
