const fs = require("fs");
const path = require("path");
const { officialName } = require("./ddv-official");
const { wikitext, imageUrls, sections, galleries } = require("./lib/ddv-fandom");

async function buildCatalogue({ page, out, label }) {
  let items = [];
  for (let attempt = 1; attempt <= 3 && items.length < 100; attempt++) {
    if (attempt > 1) {
      console.warn(`${label}: only ${items.length} parsed, retrying (${attempt}/3)…`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
    items = parseCatalogue(wikitext(page));
  }
  if (items.length < 100) throw new Error(`only ${items.length} ${label} parsed — keeping previous file`);

  const urls = imageUrls(items.map((i) => i.file));
  for (const i of items) { i.img = urls[i.file] || ""; delete i.file; }

  const themes = [...new Set(items.map((i) => i.theme))].sort();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({
    updated: new Date().toISOString(),
    source: `https://disneydreamlightvalley.fandom.com/wiki/${encodeURIComponent(page)}`,
    count: items.length, themes, items,
  }));
  console.log(`Wrote ${items.length} ${label} across ${themes.length} themes (${items.filter((i) => i.img).length} images, ${items.filter((i) => i.name_pt !== i.name).length} PT names).`);
}

function parseCatalogue(wt) {
  const seen = new Set();
  const items = [];
  for (const { heading, body } of sections(wt)) {
    if (!heading) continue;
    for (const { file, name } of galleries(body)) {
      if (!name || name.length < 2 || seen.has(name)) continue;
      seen.add(name);
      items.push({ name, name_pt: officialName(name) || name, file, theme: heading });
    }
  }
  return items;
}

module.exports = { buildCatalogue };
