/* Far Far West — maps & collectibles scraper.
   Pulls each region's terrain image and its points of interest (collectibles,
   secrets, objectives, ore, loot…) from farfarwest.wikily.gg/maps/<region> into
   data/far-far-west/maps.json. POI x/y are in a 0-1000 normalised image space, so
   the tool plots them directly. Run locally + by a GitHub Action. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BASE = "https://farfarwest.wikily.gg/maps";
const OUT = path.join(__dirname, "..", "data", "far-far-west", "maps.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const SLUGS = ["far-west", "desert", "canyon", "woodlands", "far-far-north", "jungle", "area-41", "lobby"];

const getHtml = (url) => execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };

function rscOf(html) {
  let rsc = "";
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) { try { rsc += JSON.parse(m[1]); } catch {} }
  return rsc;
}
function balancedArray(s, fromKey) {
  const p = s.indexOf(fromKey); if (p < 0) return null;
  let i = s.indexOf("[", p), depth = 0;
  for (let j = i; j < s.length; j++) { if (s[j] === "[") depth++; else if (s[j] === "]" && !--depth) return s.slice(i, j + 1); }
  return null;
}

function regionFrom(html, slug) {
  const rsc = rscOf(html);
  // active map name + terrain
  const am = rsc.match(new RegExp(`"active":\\{"slug":"${slug}","name":"([^"]+)","terrainUrl":"([^"]+)"`));
  const name = am ? am[1] : slug;
  const terrain = am ? am[2] : (rsc.match(new RegExp(`"slug":"${slug}"[^}]*?"terrainUrl":"([^"]+)"`)) || [])[1] || "";
  const arr = balancedArray(rsc, '"pois":[');
  let pois = [];
  if (arr) pois = JSON.parse(arr).map((p) => ({ kind: p.kind, label: (p.label || "").trim(), x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }))
    .filter((p) => p.kind && Number.isFinite(p.x) && Number.isFinite(p.y));
  return { slug, name, terrain, pois };
}

function run() {
  const maps = [];
  for (const slug of SLUGS) {
    const r = regionFrom(getHtml(`${BASE}/${slug}`), slug);
    if (r.pois.length) maps.push(r);
    console.log(`${r.name.padEnd(16)} ${r.pois.length} POIs`);
    sleep(600);
  }
  if (!maps.length) throw new Error("no maps parsed — keeping previous file");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: BASE, maps }));
  console.log(`\nWrote ${maps.length} maps, ${maps.reduce((n, m) => n + m.pois.length, 0)} POIs.`);
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
