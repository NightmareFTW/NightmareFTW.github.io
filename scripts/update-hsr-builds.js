/* Honkai: Star Rail — per-character build scraper.
   For every character that appears in Game8's team comps, fetches their Game8
   page and pulls the build summary (role, best Light Cone, relic set + planar
   ornament, main stats, substat priority) into data/honkai-star-rail/builds.json.
   Powers the Character Builds tool. Run locally + by a GitHub Action. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const TEAMS_URL = "https://game8.co/games/Honkai-Star-Rail/archives/409824";
const TIER_URL = "https://game8.co/games/Honkai-Star-Rail/archives/409604";
const OUT = path.join(__dirname, "..", "data", "honkai-star-rail", "builds.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const getHtml = (url) => { try { return execSync(`curl -sL -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); } catch { return ""; } };
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const cleanName = (alt) => decode(alt).replace(/^.*?[-–]\s*/, "").trim(); // "Star Rail - Archer" -> "Archer"

// name -> { url, img } for every character linked from the team-comps page.
function roster(html) {
  const map = {};
  const re = /href=['"]?(https:\/\/game8\.co\/games\/Honkai-Star-Rail\/archives\/\d+)['"]?>\s*<img[^>]*alt=['"]([^'"]+)['"][^>]*data-src=['"]([^'"]+)['"]/g;
  for (const m of html.matchAll(re)) {
    const name = cleanName(m[2]);
    if (name && !map[name]) map[name] = { url: m[1], img: m[3] };
  }
  return map;
}

function parseBuilds(html, name) {
  const builds = [];
  for (const tm of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const t = tm[0];
    if (!/Best Light Cone/i.test(t)) continue; // only the build-summary tables
    const pre = html.slice(Math.max(0, tm.index - 500), tm.index);
    const hd = [...pre.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)].pop();
    const role = hd ? decode(hd[1].replace(/<[^>]+>/g, "")).replace(/'s\b/gi, "").replace(new RegExp(name, "i"), "").replace(/Build/i, "").trim() : "";
    const lc = (t.match(/alt="(?:Star Rail - )?([^"]+?) Light Cone"/) || [])[1] || "";
    const sets = [...t.matchAll(/<a[^>]*archives\/\d+[^>]*>\s*<img[^>]*alt="([^"]+)"/g)].map((m) => decode(m[1]))
      .filter((a) => !/Light Cone$/.test(a) && !/^Star Rail - /.test(a));
    const flatCells = [...t.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " "));
    const mainCell = flatCells.find((c) => /Body\s*:/i.test(c)) || "";
    const ms = mainCell.match(/Body\s*:\s*(.*?)\s*Feet\s*:\s*(.*?)\s*Sphere\s*:\s*(.*?)\s*Rope\s*:\s*(.*?)\s*$/i);
    const subCell = flatCells.find((c) => /★/.test(c)) || "";
    const subs = [...subCell.matchAll(/([A-Za-z][A-Za-z% ]*?)\s*(★+)/g)].map((m) => `${m[1].trim()} ${m[2]}`);
    const build = {
      role: role || "Build",
      lightCone: lc,
      relicSet: sets[0] || "",
      ornament: sets[1] || "",
      mainStats: ms ? { body: ms[1].trim(), feet: ms[2].trim(), sphere: ms[3].trim(), rope: ms[4].trim() } : null,
      subStats: subs.join(", "),
    };
    if (build.lightCone || build.relicSet || build.mainStats) builds.push(build);
  }
  return builds;
}

function run() {
  const teamsHtml = getHtml(TEAMS_URL);
  if (!teamsHtml) throw new Error("could not fetch team comps page");
  const version = (getHtml(TIER_URL).match(/(\d\.\d)\s*Tier\s*List/i) || [])[1] || "";
  const map = roster(teamsHtml);
  const names = Object.keys(map);
  const characters = {};
  let n = 0;
  for (const name of names) {
    const html = getHtml(map[name].url);
    const builds = parseBuilds(html, name);
    if (builds.length) { characters[name] = { img: map[name].img, builds }; n++; }
    console.log(`${name}: ${builds.length} build(s)`);
    sleep(250);
  }
  if (!n) throw new Error("no builds parsed — keeping previous file");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://game8.co/games/Honkai-Star-Rail/", version, characters }));
  console.log(`\nWrote builds for ${n}/${names.length} characters (v${version}).`);
}
try { run(); } catch (e) { console.error(e.message); process.exit(1); }
