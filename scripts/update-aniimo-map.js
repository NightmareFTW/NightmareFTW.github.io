/* Aniimo — interactive world map scraper.
   Source: Game8's Aniimo Interactive Map (game8.co), the same established,
   attributed Game8 data this repo already uses for Aniimo builds and the tier
   list. Game8 serves the whole map as one JSON document at
   /api/tool_structural_mappings/847.json: three full-image areas (Breezy
   Plains, Whisperwake Isles, Astra) and ~3,200 pinned coordinates — Aniimo
   spawns, chests, Lumin Amber, eggs, Pathfinder Challenges, points of
   interest and more — each with its own icon, region, description and a link
   back to the Game8 entry.

   Coordinate system: pins are stored on a 0–256 grid, with the Y axis
   measured from the BOTTOM of the image, so we normalise to top-left
   fractions as x/256 and (256 − y)/256. (Verified by overlaying the pins on
   each area image: with the Y-flip, Crescent Bay, Cloudreach Falls, etc. land
   exactly on their labelled islands; without it they scatter into open
   ocean.) A handful of Breezy Plains coordinates come through malformed with
   a stray comma ("104.88,85,56" for "104.88,85.56"); we repair those.

   Each Aniimo pin's name is resolved to a creatures.json slug (handling the
   regional/form prefixes Game8 uses, e.g. "Flowerfield Skippy",
   "Highland Pomegg", "Nighttime Susuta") so the map links into our database.
   Game8 pins more Aniimo than the official wiki has published, so unmatched
   ones render as plain pins with their Game8 source link.

   GitHub Actions can't reach game8.co from its runner IPs, so like the other
   Game8 scrapers this runs out-of-band (see the scheduled refresh task) and
   keeps the previous file on any fetch/parse failure. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { getText } = require("./lib/http");

const MAP_API_URL = "https://game8.co/api/tool_structural_mappings/847.json";
const MAP_PAGE_URL = "https://game8.co/games/Aniimo/tools/395"; // human-facing map page (attribution link)
const OUT_DIR = path.join(__dirname, "..", "data", "aniimo");
const OUT_FILE = path.join(OUT_DIR, "map.json");
const GRID = 256; // Game8 stores pin coordinates on a 0–256 grid.

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Repair a Game8 coordinate string into [x, y] fractions (top-left origin), or
// null if it can't be parsed. Handles the malformed 3-part form ("a,b,c" → the
// author meant "a, b.c").
function parseCoord(raw) {
  let parts = String(raw).split(",").map((s) => s.trim());
  if (parts.length === 3) parts = [parts[0], `${parts[1]}.${parts[2]}`];
  if (parts.length !== 2) return null;
  const x = parseFloat(parts[0]), y = parseFloat(parts[1]);
  if (!isFinite(x) || !isFinite(y)) return null;
  return [x / GRID, (GRID - y) / GRID]; // Y measured from image bottom → flip.
}

// Minimal JPEG dimension reader (SOF0/1/2/…): scan marker segments for the
// first start-of-frame and read its height/width. Avoids an ImageMagick
// dependency in CI. Returns { width, height } or null.
function jpegSize(buf) {
  if (!buf || buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    // SOF0–SOF15 except the DHT/JPG/DAC markers (0xc4, 0xc8, 0xcc).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

// Fetch just enough of an image to read its header (binary-safe; getText is
// utf8-only). Square fallback keeps the scraper working if the probe fails.
function imageSize(url) {
  try {
    const buf = execFileSync("curl", ["-sL", "--max-time", "30", "-r", "0-131071", url], { maxBuffer: 8 * 1024 * 1024 });
    return jpegSize(buf) || { width: 2000, height: 2000 };
  } catch {
    return { width: 2000, height: 2000 };
  }
}

function buildCategories(doc, coords) {
  // classification → { group, order } from the document's grouping.
  const meta = new Map();
  (doc.classificationGroups || []).forEach((g, gi) => {
    (g.classifications || []).forEach((c, ci) => {
      const name = c.title || c.name || c;
      meta.set(name, { group: g.groupName || "", order: gi * 100 + ci });
    });
  });
  // A representative icon per classification = its first pin's icon.
  const iconFor = new Map();
  for (const c of coords) {
    if (c.classification && !iconFor.has(c.classification) && c.pinIcon) iconFor.set(c.classification, c.pinIcon);
  }
  const names = [...new Set(coords.map((c) => c.classification).filter(Boolean))];
  return names
    .map((name) => {
      const m = meta.get(name) || { group: "", order: 999 };
      return { id: slugify(name), name, group: m.group, order: m.order, icon: iconFor.get(name) || "" };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...rest }) => rest);
}

function run() {
  const body = getText(MAP_API_URL, { timeout: 40 });
  if (!body) { console.warn("game8.co map fetch failed, keeping previous file"); return; }
  let doc;
  try { doc = JSON.parse(body); } catch { console.warn("map JSON parse failed, keeping previous file"); return; }
  const coords = (doc.coordinateArraySchema && doc.coordinateArraySchema.coordinates) || [];
  if (coords.length < 500) { console.warn(`only ${coords.length} coordinates, keeping previous file`); return; }

  const categories = buildCategories(doc, coords);

  // Cross-reference Aniimo pins to our creature database by base name.
  let bySlug = new Map();
  try {
    const creatures = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "creatures.json"), "utf8")).creatures;
    bySlug = new Map(creatures.map((c) => [c.name.toLowerCase(), c.slug]));
  } catch { /* creatures.json missing — links just won't resolve */ }
  const resolveSlug = (title) => {
    const t = String(title).trim().toLowerCase();
    if (bySlug.has(t)) return bySlug.get(t);                 // exact ("Skippy")
    const last = t.split(/\s+/).pop();                       // regional/form prefix ("Highland Pomegg")
    return bySlug.get(last) || null;
  };

  const areaMeta = (doc.areas || []).map((a) => ({ title: a.title, url: a.url }));
  const areas = areaMeta.map((a) => {
    const size = imageSize(a.url);
    const markers = [];
    for (const c of coords) {
      if (c.area !== a.title) continue;
      const xy = parseCoord(c.coordinate);
      if (!xy) continue;
      const isAniimo = c.classification === "Aniimo";
      markers.push({
        id: String(c.id),
        name: c.title || c.classification || "Pin",
        x: xy[0],
        y: xy[1],
        categoryId: slugify(c.classification || "other"),
        group: c.classification || "",
        region: c.region || "",
        img: c.pinIcon || "",
        desc: (c.description || "").trim(),
        source: c.url || "",
        creatureSlug: isAniimo ? resolveSlug(c.title) : null,
      });
    }
    return { id: slugify(a.title), name: a.title, mapImage: a.url, mapWidth: size.width, mapHeight: size.height, markers };
  }).filter((a) => a.markers.length);

  const count = areas.reduce((n, a) => n + a.markers.length, 0);
  if (!areas.length || count < 500) { console.warn(`only ${count} markers across ${areas.length} areas, keeping previous file`); return; }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({
    updated: new Date().toISOString(),
    source: MAP_PAGE_URL,
    sourceName: "Game8",
    attribution: "Map images and pin data from Game8's Aniimo Interactive Map.",
    categories,
    count,
    areas,
  }, null, 2));
  console.log(`Wrote ${count} markers across ${areas.length} areas (${areas.map((a) => `${a.name}:${a.markers.length}`).join(", ")}) to ${OUT_FILE}`);
}

if (require.main === module) {
  try { run(); } catch (e) { require("./lib/keep")([OUT_FILE], e); }
} else {
  module.exports = { parseCoord, jpegSize, buildCategories };
}
