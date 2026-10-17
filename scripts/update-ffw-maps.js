/* Far Far West — maps & collectibles scraper.
   Pulls each region's terrain image and its points of interest (collectibles,
   secrets, objectives, ore, loot…) from wikily.gg/far-far-west/maps/<region> into
   data/far-far-west/maps.json. POI x/y are in a 0-1000 normalised image space, so
   the tool plots them directly.

   wikily.gg migrated from the old farfarwest.wikily.gg subdomain (which now
   301s here) to a single wikily.gg/<game>/... domain, and switched the map
   from a plain "pois" array embedded in the page to a dictionary-encoded
   "points" structure (parallel arrays + a names/ids/categories lookup table,
   likely to keep the payload small) rendered through a real Leaflet map. The
   region list itself is discovered from the page's own regionLinks rather
   than hardcoded, since the game has added regions since this scraper was
   first written (Hellfire, not in the original 8). Run locally + by a
   GitHub Action. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const BASE = "https://wikily.gg/far-far-west/maps";
const OUT = path.join(__dirname, "..", "data", "far-far-west", "maps.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
// Entry point used only to discover the current region list; any valid slug works.
const SEED_SLUG = "far-west";

// Known category slug -> this site's own POI "kind" taxonomy (see
// games/far-far-west/maps.js CATS) so the legend keeps its friendly names
// and colours. Anything unrecognised still renders fine (maps.js falls back
// to a capitalised label + grey dot for an unknown kind).
const CATEGORY_KIND = {
  "region-secrets": "secret", "music-discs": "disc", graves: "grave",
  "quest-objectives": "objective", npcs: "npc", challenges: "challenge",
  "treasure-chests": "loot", throwables: "pickup", "fast-travel": "traversal",
  "ore-spawns": "ore", medallions: "medallion", "spawn-points": "spawn",
};
const kindOf = (slug) => CATEGORY_KIND[slug] || String(slug || "").replace(/s$/, "") || "loot";

const getHtml = (url) => execFileSync("curl", ["-sL", "--retry", "3", "--retry-delay", "2", "--retry-all-errors", "--max-time", "40", "-A", UA, url], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };

// Returns the substring starting at the "{" right after needle, up to its
// matching "}" (brace-depth counting, string-aware so a literal "}" inside a
// quoted value doesn't end it early).
function balancedObjectAfter(s, needle) {
  const p = s.indexOf(needle);
  if (p < 0) return null;
  const start = s.indexOf("{", p + needle.length);
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && !--depth) return s.slice(start, i + 1);
  }
  return null;
}

// Next.js App Router streams its RSC payload as self.__next_f.push([1,"ID:JSON\n..."])
// chunks; each decoded line is "<rowId>:<json>". The map component's props
// (width/height/imageUrl/heading/points/regionLinks/…) sit at varying nesting
// depths depending on the page (a region with no map yet renders a different
// wrapper around the same data), so rather than assume a fixed shape we just
// pull each field straight out of the one line that has "points" in it.
function mapPropsFromHtml(html) {
  let rsc = "";
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
    try { rsc += JSON.parse(m[1]); } catch {}
  }
  const line = rsc.split("\n").find((l) => l.includes('"points":{"names"'));
  if (!line) return null;
  const pointsRaw = balancedObjectAfter(line, '"points":');
  const dims = line.match(/"width":(\d+),"height":(\d+),"imageUrl":"([^"]+)"/);
  const heading = (line.match(/"heading":"([^"]*)"/) || [])[1];
  const rlMatch = line.match(/"regionLinks":(\[.*?\](?=,"activeRegionSlug"))/);
  let points = null;
  try { points = pointsRaw && JSON.parse(pointsRaw); } catch {}
  let regionLinks = [];
  try { regionLinks = rlMatch && JSON.parse(rlMatch[1]); } catch {}
  if (!points || !dims) return null;
  return { points, width: Number(dims[1]), height: Number(dims[2]), imageUrl: dims[3], heading, regionLinks: regionLinks || [] };
}

function decodePois(points, width, height) {
  const n = points.x.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const label = points.names.values[points.names.index[i]] || "";
    const catSlug = points.categories.values[points.categories.index[i]];
    const x = Math.round((points.x[i] / width) * 1000 * 10) / 10;
    const y = Math.round((points.y[i] / height) * 1000 * 10) / 10;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    out.push({ kind: kindOf(catSlug), label, x, y });
  }
  return out;
}

function run() {
  const seed = mapPropsFromHtml(getHtml(`${BASE}/${SEED_SLUG}`));
  if (!seed || !Array.isArray(seed.regionLinks) || !seed.regionLinks.length) {
    throw new Error("could not discover region list from seed page");
  }
  const regions = seed.regionLinks.map((r) => ({ slug: r.href.split("/").filter(Boolean).pop(), name: r.name }));

  const maps = [];
  for (const { slug, name } of regions) {
    const props = slug === SEED_SLUG ? seed : mapPropsFromHtml(getHtml(`${BASE}/${slug}`));
    const pois = props ? decodePois(props.points, props.width, props.height) : [];
    if (pois.length) maps.push({ slug, name: props.heading || name, terrain: props.imageUrl || "", pois });
    console.log(`${(props?.heading || name).padEnd(16)} ${pois.length} POIs`);
    sleep(600);
  }
  if (!maps.length) throw new Error("no maps parsed — keeping previous file");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: BASE, maps }));
  console.log(`\nWrote ${maps.length} maps, ${maps.reduce((n, m) => n + m.pois.length, 0)} POIs.`);
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
