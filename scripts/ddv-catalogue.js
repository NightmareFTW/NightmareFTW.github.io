/* Shared scraper for the big per-theme item catalogues (Furniture, Clothing).
   The wiki lists every piece in galleries grouped by Disney theme (Aladdin,
   Cinderella, …). We grab name + thumbnail + theme and attach the official
   PT-BR name (English fallback — these names are proper-noun heavy, so the
   best-effort translator would mangle them). Node 18+, no deps. */

const fs = require("fs");
const path = require("path");
const { officialName } = require("./ddv-official");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
const bigImg = (u) => {
  if (!u) return "";
  const t = u.match(/\/images\/thumb\/(.+?\.(?:png|jpe?g))\/\d+px-/i);
  const s = t ? `/images/${t[1]}` : u;
  return s.startsWith("http") ? s : "https://dreamlightvalleywiki.com" + s;
};

// Section headings that aren't a real theme.
const SKIP = /^(Collecting|Wearing|Placing|Contents|Navigation|Links|Gameplay|References|Trivia|Categories)/i;

async function buildCatalogue({ src, out, label }) {
  const html = await (await fetch(src, { headers: { "User-Agent": UA } })).text();
  const seen = new Set();
  const items = [];
  for (const part of html.split(/(?=<h[23])/)) {
    const hm = part.match(/<h[23][^>]*>(?:<[^>]+>)*([^<]+)/);
    if (!hm) continue;
    const theme = clean(hm[1]);
    if (!theme || SKIP.test(theme)) continue;
    for (const box of part.match(/<li class="gallerybox"[\s\S]*?<\/li>/g) || []) {
      const badged = box.replace(/<div class="gallerycorner"[\s\S]*?<\/div>\s*<\/div>/g, ""); // drop Premium/DLC corner badge
      const name = clean((badged.match(/<a[^>]+title="([^"]+)"/) || [])[1] || "");
      if (!name || name.length < 2 || /\.(png|jpe?g)$|^File:/i.test(name) || seen.has(name)) continue;
      seen.add(name);
      const img = bigImg((badged.match(/<img[^>]+(?:data-src|src)="([^"]+)"/) || [])[1] || "");
      items.push({ name, name_pt: officialName(name) || name, img, theme });
    }
  }
  if (items.length < 100) throw new Error(`only ${items.length} ${label} parsed — keeping previous file`);
  const themes = [...new Set(items.map((i) => i.theme))].sort();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ updated: new Date().toISOString(), source: src, count: items.length, themes, items }));
  console.log(`Wrote ${items.length} ${label} across ${themes.length} themes (${items.filter((i) => i.img).length} images, ${items.filter((i) => i.name_pt !== i.name).length} PT names).`);
}

module.exports = { buildCatalogue };
