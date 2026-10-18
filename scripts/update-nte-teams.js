/* Neverness to Everness — team comps scraper (Prydwen.gg, player-tested).
   Each character's Prydwen page lists named teams as:
     <div class="team-header">Team Name</div> … 4× <div class="avatar nte"><img alt="Char">
   We pull those into data/nte/teams.json so the tier-list tool renders real,
   sourced teams (never invented).

   Prydwen started serving a Cloudflare JS challenge at some point after this
   was first written (confirmed: curl now gets a "Just a moment…" page even
   with a real browser UA, from this machine as much as from CI) — plain curl
   can no longer get past it, so fetching goes through scripts/lib/browser-http.js
   (Playwright) instead. See that file for why this is the one scraper in the
   repo that isn't zero-dependency curl, and what happens in CI (which doesn't
   have Playwright installed). Node 18+. */

const fs = require("fs");
const path = require("path");
const { getHtml, close } = require("./lib/browser-http");

const OUT = path.join(__dirname, "..", "data", "nte", "teams.json");
const BASE = "https://www.prydwen.gg/neverness-to-everness/characters/";

// Display name -> Prydwen slug (a couple of slugs differ from the lowercased name).
const CHARS = ["Lacrimosa", "Hotori", "Nanally", "Sakiri", "Esper Zero", "Chiz", "Daffodil",
  "Baicang", "Jiuyuan", "Hathor", "Haniel", "Fadia", "Mint", "Adler", "Edgar", "Skia", "Aurelia"];
const SLUG = { "Esper Zero": "zero" }; // Prydwen page slugs that differ from the name
const slug = (n) => SLUG[n] || n.toLowerCase().replace(/ /g, "-");

// Prydwen alt-text variants/typos -> canonical names used across this site.
const FIX = { Daffodill: "Daffodil", Zero: "Esper Zero" };
const norm = (n) => FIX[n] || n;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url) => { try { return await getHtml(url); } catch { return ""; } };

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

async function teamsFor(name) {
  let html = "";
  for (let i = 0; i < 4 && !/team-header/.test(html); i++) { if (i) await sleep(8000 + i * 6000); html = await get(BASE + slug(name)); }
  return /team-header/.test(html) ? parseTeams(html, name) : [];
}

async function run() {
  const data = { updated: new Date().toISOString(), source: "https://www.prydwen.gg/neverness-to-everness/", teams: {} };
  let total = 0;
  for (const c of CHARS) {
    const t = await teamsFor(c);
    if (t.length) { data.teams[c] = t; total += t.length; }
    console.log(`${c}: ${t.length} teams  ${t.map((x) => `${x.label}[${x.team.join(", ")}]`).join("  ")}`);
    await sleep(1500);
  }
  await close();
  if (!total) throw new Error("no teams parsed — keeping previous file");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data, null, 0));
  console.log(`\nWrote teams for ${Object.keys(data.teams).length}/${CHARS.length} characters (${total} comps).`);
}
run().catch((e) => { close().finally(() => require("./lib/keep")(OUT, e)); });
