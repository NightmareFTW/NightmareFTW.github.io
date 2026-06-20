/* Disney Dreamlight Valley — animals (critters + companions).
   Two datasets from the wiki:
   - Critters: each wild species with its biome/DLC, favourite & liked food,
     how to approach it (feeding method), rewards, and its colour variants with
     the weekly day/hour schedule (from the Critter Types + Schedules tables).
   - Companions: every obtainable companion grouped by how you get it
     (Event / Premium shop / Quest reward / Craftable), with images.
   Official PT-BR names attached. Writes data/dreamlight-valley/animals.json.
   Node 18+, no deps. */

const fs = require("fs");
const path = require("path");
const { officialName } = require("./ddv-official");

const WIKI = "https://dreamlightvalleywiki.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT = path.join(__dirname, "..", "data", "dreamlight-valley", "animals.json");

const clean = (s) => s.replace(/<[^>]+>/g, " ").replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&amp;/g, "&")
  .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#160;|&nbsp;/g, " ").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
const sname = (n) => clean(n).replace(/\s+\d+$/, "").trim(); // strip trailing footnote number
const bigImg = (u) => { const t = (u || "").match(/\/images\/thumb\/(.+?\.(?:png|jpe?g))\/\d+px-/i); const s = t ? `/images/${t[1]}` : u; return s && s.startsWith("/") ? WIKI + s : (s || ""); };
const imgFrom = (cellsRaw) => { for (const c of cellsRaw) { const m = (c || "").match(/<img[^>]+(?:data-src|src)="([^"]+)"/); if (m) return bigImg(m[1]); } return ""; };
const pt = (n) => officialName(n) || officialName(sname(n)) || n;

const REGIONS = {
  "A Rift in Time": ["Wild Tangle", "Glittering Dunes", "Ancient's Landing", "The Overlook", "Overlook", "The Promenade", "The Docks", "The Grasslands"],
  "Storybook Vale": ["Everafter", "Mythopia", "The Bind"],
  "Wishblossom Mountains": ["Wishing Alps", "Glamour Gulch", "Pixie Acres"],
};
const dlcOf = (biome) => Object.keys(REGIONS).find((d) => REGIONS[d].some((b) => (biome || "").includes(b))) || null;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function get(url) { return await (await fetch(url, { headers: { "User-Agent": UA } })).text(); }
const tablesOf = (html) => (html.match(/<table[\s\S]*?<\/table>/g) || []).map((t) =>
  (t.match(/<tr[\s\S]*?<\/tr>/g) || []).map((tr) => [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1])));

async function run() {
  const html = await get(`${WIKI}/Critters`);
  const tables = tablesOf(html);

  // ---- Critter Types: one row per species ----
  const typeRows = tables[0] || [];
  const species = [];
  for (const r of typeRows.slice(1)) {
    const name = sname(r[1] || "");
    if (!name || /flowers?$/i.test(name) || /^name$/i.test(name)) continue; // skip Sunbird flower-variant artifact rows
    const biome = clean(r[4] || "");
    species.push({
      name, name_pt: pt(name), biome, dlc: dlcOf(biome),
      favoriteFood: clean(r[2] || ""), likedFood: clean(r[3] || ""),
      feeding: clean(r[5] || ""), favReward: clean(r[6] || ""), likedReward: clean(r[7] || ""),
      img: imgFrom(r), variants: [],
    });
  }

  // ---- Critter Schedules: one row per colour variant ----
  const schedRows = tables[1] || [];
  const cols = (schedRows[0] || []).map(clean);
  const dayIdx = DAYS.map((d) => cols.findIndex((c) => new RegExp(`^${d}$`, "i").test(c)));
  for (const r of schedRows.slice(1)) {
    const vname = sname(r[1] || "");
    if (!vname) continue;
    const schedule = DAYS.map((d, k) => ({ day: d, hours: clean(r[dayIdx[k]] || "") })).filter((s) => s.hours && !/^n\/?a$/i.test(s.hours));
    const variant = { name: vname, name_pt: pt(vname), img: imgFrom(r), schedule };
    // attach to the species whose singular name appears in the variant
    // Match on the distinctive last word of the singularised species name
    // (e.g. "Baby Pegasi" -> "Pegasus" matches "Black Pegasus").
    const singular = (n) => n.replace(/Geese/i, "Goose").replace(/Pegasi/i, "Pegasus").replace(/xes$/i, "x").replace(/ies$/i, "y").replace(/([^u])s$/i, "$1");
    const sp = species.find((s) => { const key = singular(s.name).split(" ").pop(); return new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(vname); });
    if (sp) sp.variants.push(variant);
  }

  // ---- Companions, grouped by how you obtain them ----
  const compHtml = await get(`${WIKI}/Companions`);
  const SECTIONS = {
    "Event Companions": "Event", "Premium Companions": "Premium",
    "Quest Reward Companions": "Quest Reward", "Craftable Companions": "Craftable",
  };
  const OBTAIN = {
    Event: "Event reward (limited-time — returns in rotations/Star Paths)",
    Premium: "Premium Shop (bought with Moonstones)",
    "Quest Reward": "Reward from a quest",
    Craftable: "Crafted at a crafting station",
  };
  const companions = [];
  const seenC = new Set();
  for (const part of compHtml.split(/(?=<h[23])/)) {
    const hm = part.match(/<h[23][^>]*>(?:<[^>]+>)*([^<]+)/);
    if (!hm) continue;
    const source = SECTIONS[clean(hm[1])];
    if (!source) continue;
    for (const box of part.match(/<li class="gallerybox"[\s\S]*?<\/li>/g) || []) {
      const badged = box.replace(/<div class="gallerycorner"[\s\S]*?<\/div>\s*<\/div>/g, "");
      const name = clean((badged.match(/<a[^>]+title="([^"]+)"/) || [])[1] || "");
      if (!name || name.length < 2 || /\.(png|jpe?g)$|^File:/i.test(name) || seenC.has(name)) continue;
      seenC.add(name);
      const img = bigImg((badged.match(/<img[^>]+(?:data-src|src)="([^"]+)"/) || [])[1] || "");
      companions.push({ name, name_pt: pt(name), img, source, obtain: OBTAIN[source] });
    }
  }

  const withVars = species.filter((s) => s.variants.length);
  if (!species.length) throw new Error("no critters parsed — keeping previous file");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: `${WIKI}/Critters`, critters: species, companions }));
  console.log(`Wrote ${species.length} critter species (${withVars.length} with variants, ${species.reduce((n, s) => n + s.variants.length, 0)} variants) + ${companions.length} companions.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
