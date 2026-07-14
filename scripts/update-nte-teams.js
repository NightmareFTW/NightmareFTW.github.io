/* Neverness to Everness — team comps scraper (Prydwen.gg, player-tested).
   Each character's Prydwen page lists named teams as:
     <div class="team-header">Team Name</div> … 4× <div class="avatar nte"><img alt="Char">
   We pull those into data/nte/teams.json so the tier-list tool renders real,
   sourced teams (never invented). Prydwen rate-limits bursts, so fetches are
   spaced out with retries. Node 18+; uses curl (HTML is server-rendered). */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "..", "data", "nte", "teams.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
const BASE = "https://www.prydwen.gg/neverness-to-everness/characters/";

// Display name -> Prydwen slug (a couple of slugs differ from the lowercased name).
const CHARS = ["Lacrimosa", "Hotori", "Nanally", "Sakiri", "Esper Zero", "Chiz", "Daffodil",
  "Baicang", "Jiuyuan", "Hathor", "Haniel", "Fadia", "Mint", "Adler", "Edgar", "Skia", "Aurelia"];
const SLUG = { "Esper Zero": "zero" }; // Prydwen page slugs that differ from the name
const slug = (n) => SLUG[n] || n.toLowerCase().replace(/ /g, "-");

// Prydwen alt-text variants/typos -> canonical names used across this site.
const FIX = { Daffodill: "Daffodil", Zero: "Esper Zero" };
const norm = (n) => FIX[n] || n;

const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const get = (url) => {
  try { return execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" -H "Accept-Language: en-US,en;q=0.9" "${url}"`, { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 }); } catch { return ""; }
};

// Drop a redundant character name from a team label ("Daffodil Scorch Team"
// -> "Scorch Team", "Hypercarry Aurelia" -> "Hypercarry").
function cleanLabel(label, name) {
  const L = label.toLowerCase(), n = name.toLowerCase();
  if (L.startsWith(n + " ")) return label.slice(name.length + 1).trim();
  if (L.endsWith(" " + n)) return label.slice(0, label.length - name.length - 1).trim();
  return label;
}

function parseTeams(html, name) {
  // Split on the team header; the slice before the first header is the
  // "synergizes with" avatar list, which we drop.
  const blocks = html.split(/<div class="team-header">/).slice(1);
  const out = [];
  for (const b of blocks) {
    const label = cleanLabel(b.slice(0, b.indexOf("</div>")).replace(/<[^>]+>/g, "").trim(), name);
    const alts = [...b.matchAll(/avatar nte[\s\S]{0,160}?alt="([^"]+)"/g)].map((m) => norm(m[1].trim()));
    const team = [...new Set(alts)].slice(0, 4);
    if (!label || team.length < 3) continue;
    const key = [...team].sort().join("|");
    if (out.some((t) => [...t.team].sort().join("|") === key)) continue; // same 4 units, different label
    out.push({ label, team });
  }
  return out;
}

function teamsFor(name) {
  let html = "";
  for (let i = 0; i < 4 && !/team-header/.test(html); i++) { if (i) sleep(20000 + i * 15000); html = get(BASE + slug(name)); }
  return /team-header/.test(html) ? parseTeams(html, name) : [];
}

const data = { updated: new Date().toISOString(), source: "https://www.prydwen.gg/neverness-to-everness/", teams: {} };
let total = 0;
for (const c of CHARS) {
  const t = teamsFor(c);
  if (t.length) { data.teams[c] = t; total += t.length; }
  console.log(`${c}: ${t.length} teams  ${t.map((x) => `${x.label}[${x.team.join(", ")}]`).join("  ")}`);
  sleep(12000);
}
if (!total) require("./lib/keep")(OUT, new Error("no teams parsed — keeping previous file"));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 0));
console.log(`\nWrote teams for ${Object.keys(data.teams).length}/${CHARS.length} characters (${total} comps).`);
