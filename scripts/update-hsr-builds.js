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
// Full roster lives on the rarity list pages — the team-comps page alone misses
// anyone who isn't in a featured comp (e.g. Luka, Moze).
const LIST_URLS = [
  "https://game8.co/games/Honkai-Star-Rail/archives/406579", // 5-star characters
  "https://game8.co/games/Honkai-Star-Rail/archives/406580", // 4-star characters
];
const OUT = path.join(__dirname, "..", "data", "honkai-star-rail", "builds.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const getHtml = (url) => { try { return execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); } catch { return ""; } };
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const cleanName = (alt) => decode(alt).replace(/^.*?[-–]\s*/, "").trim(); // "Star Rail - Archer" -> "Archer"

// Game8 links a character page either by numeric id (archives/447923) or by a
// slug (archives/Boothill-Best-Builds) — accept both or the slug ones go missing.
const ARCHIVE = "https:\\/\\/game8\\.co\\/games\\/Honkai-Star-Rail\\/archives\\/[A-Za-z0-9_-]+";

// name -> { url, img } for every character linked from the team-comps page.
function roster(html) {
  const map = {};
  const re = new RegExp(`href=['"]?(${ARCHIVE})['"]?>\\s*<img[^>]*alt=['"]([^'"]+)['"][^>]*data-src=['"]([^'"]+)['"]`, "g");
  for (const m of html.matchAll(re)) {
    const name = cleanName(m[2]);
    if (name && !map[name]) map[name] = { url: m[1], img: m[3] };
  }
  return map;
}

// Roster from a "N-Star Characters" list page: tables headed Character|Element|Path.
// Note Game8 writes these cells with unquoted href= and single-quoted data-src.
const cleanCell = (s) => decode(String(s || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
function rosterFromList(html) {
  const map = {};
  for (const tm of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const rows = tm[0].match(/<tr[\s\S]*?<\/tr>/g) || [];
    if (rows.length < 3) continue;
    const head = cleanCell(rows[0]);
    if (!/character/i.test(head) || !/(path|element)/i.test(head)) continue;
    for (const r of rows.slice(1)) {
      const cell = (r.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/) || [])[1] || "";
      const a = cell.match(new RegExp(`href=['"]?(${ARCHIVE})['"]?`));
      if (!a) continue;
      const name = cleanCell(cell);
      if (!name || name.length > 28 || map[name]) continue;
      map[name] = { url: a[1], img: (cell.match(/data-src=['"]([^'"]+)['"]/) || [])[1] || "" };
    }
  }
  return map;
}

const rxEsc = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Game8 titles alt characters like "Himeko - Nova", while our roster name is just
// "Nova" — strip the page's own name so roles don't come out as "Himeko -  DPS".
function pageName(html) {
  // the <h1> is Game8's site logo, so use the document title:
  // "Himeko - Nova Best Builds and Teams | Honkai: Star Rail｜Game8" -> "Himeko - Nova"
  const t = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
  return cleanCell(t).split(/[|｜]/)[0].replace(/\s*(?:Best\s+)?(?:Builds?|Teams?|Guide|Kit|Rating|Review)\b.*$/i, "").trim();
}
// "All Recommended Light Cones": name + a rating line that states the rarity and
// often says outright that a cone is "a good 4-star Light Cone" (our F2P pick).
function recommendedCones(html) {
  for (const tm of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const rows = tm[0].match(/<tr[\s\S]*?<\/tr>/g) || [];
    if (!rows.length) continue;
    const head = cleanCell(rows[0]);
    if (!/light cone/i.test(head) || !/recommend|why/i.test(head)) continue;
    const out = [];
    for (const r of rows.slice(1)) {
      const cells = [...r.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => cleanCell(m[1]));
      const cone = cells[0], why = cells[1] || "";
      if (!cone || cone.length > 60) continue;
      out.push({ cone, why, fourStar: /\b4[-\s]?star\b/i.test(why), stars: (why.match(/★+/) || [""])[0].length });
    }
    if (out.length) return out;
  }
  return [];
}

function parseBuilds(html, name, pname) {
  const builds = [];
  for (const tm of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const t = tm[0];
    if (!/Best Light Cone/i.test(t)) continue; // only the build-summary tables
    const pre = html.slice(Math.max(0, tm.index - 500), tm.index);
    const hd = [...pre.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)].pop();
    let role = hd ? decode(hd[1].replace(/<[^>]+>/g, "")).replace(/'s\b/gi, "") : "";
    // strip the page's own character name first ("Himeko - Nova"), then ours
    for (const n of [pname, name].filter(Boolean)) role = role.replace(new RegExp(rxEsc(n), "i"), "");
    role = role.replace(/Build/i, "").replace(/^[\s\-–:]+|[\s\-–:]+$/g, "").trim();
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
  // team-comps roster first (it has good portraits), then fill in everyone else
  // from the full 5★/4★ lists so no character is missed.
  const map = roster(teamsHtml);
  for (const url of LIST_URLS) {
    const listed = rosterFromList(getHtml(url));
    for (const n in listed) if (!map[n]) map[n] = listed[n];
    sleep(250);
  }
  const names = Object.keys(map);
  console.log(`Roster: ${names.length} characters (teams page + 5★/4★ lists).`);
  const characters = {};
  let n = 0;
  for (const name of names) {
    const html = getHtml(map[name].url);
    const pname = pageName(html);
    const builds = parseBuilds(html, name, pname);
    // Round each character out to ~3 options using Game8's own ranked light-cone
    // recommendations: the featured build, the best 4★ (F2P) pick, and the next
    // alternative. Nothing is invented — the cones and wording come from Game8.
    const cones = recommendedCones(html);
    const base = builds[0];
    if (base && cones.length) {
      const used = new Set(builds.map((b) => b.lightCone).filter(Boolean));
      const f2p = cones.find((c) => c.fourStar && !used.has(c.cone));
      if (f2p) { builds.push(Object.assign({}, base, { role: "F2P", lightCone: f2p.cone, note: f2p.why.slice(0, 140) })); used.add(f2p.cone); }
      if (builds.length < 3) {
        const alt = cones.find((c) => !used.has(c.cone));
        if (alt) builds.push(Object.assign({}, base, { role: "Alternative", lightCone: alt.cone, note: alt.why.slice(0, 140) }));
      }
    } else if (!base && cones.length) {
      // no build table on the page — still give the character a usable option
      builds.push({ role: "Recommended", lightCone: cones[0].cone, relicSet: "", ornament: "", mainStats: null, subStats: "", note: cones[0].why.slice(0, 140) });
    }
    if (builds.length) { characters[name] = { img: map[name].img, builds }; n++; }
    console.log(`${name}: ${builds.length} build(s)`);
    sleep(250);
  }
  if (!n) throw new Error("no builds parsed — keeping previous file");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://game8.co/games/Honkai-Star-Rail/", version, characters }));
  console.log(`\nWrote builds for ${n}/${names.length} characters (v${version}).`);
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
