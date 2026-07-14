/* Honkai: Star Rail — meta team comps scraper.
   Pulls Game8's "Best Team Comps by Element" (the current meta teams, with the
   DPS/Support/Sustain roles and portraits) into data/honkai-star-rail/teams.json.
   Powers the Meta Builds tool. Run locally + by a GitHub Action. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const URL = "https://game8.co/games/Honkai-Star-Rail/archives/409824";
const TIER_URL = "https://game8.co/games/Honkai-Star-Rail/archives/409604";
const OUT = path.join(__dirname, "..", "data", "honkai-star-rail", "teams.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const ELEMENTS = ["Quantum", "Lightning", "Fire", "Ice", "Wind", "Imaginary", "Physical"];

const getHtml = (url) => execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const cleanName = (alt) => decode(alt).replace(/^.*?[-–]\s*/, "").trim(); // "Star Rail - Archer" -> "Archer"
const stripTags = (s) => decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

// One Game8 table holds several team variants for a DPS, each introduced by a
// full-width header row (the label: "F2P", "Hypercarry Team", …). Split on those.
function parseTeams(tbl) {
  const labels = [...tbl.matchAll(/<th[^>]*colspan[^>]*>([\s\S]*?)<\/th>/gi)];
  const out = [];
  for (let i = 0; i < labels.length; i++) {
    const label = stripTags(labels[i][1]) || "Team";
    const segStart = labels[i].index + labels[i][0].length;
    const segEnd = i + 1 < labels.length ? labels[i + 1].index : tbl.length;
    const seg = tbl.slice(segStart, segEnd);
    const roles = [...seg.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => stripTags(m[1]));
    const members = [];
    for (const td of seg.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)) {
      const alt = (td[1].match(/alt=["']([^"']+)["']/) || [])[1];
      if (!alt) continue;
      const img = (td[1].match(/data-src=["']([^"']+)["']/) || [])[1] || "";
      members.push({ name: cleanName(alt), role: roles[members.length] || "", img });
    }
    if (members.length >= 3) out.push({ label, members: members.slice(0, 4) });
  }
  return out;
}

function run() {
  const html = getHtml(URL);
  const version = (getHtml(TIER_URL).match(/(\d\.\d)\s*Tier\s*List/i) || [])[1] || "";
  const elements = [];

  for (let i = 0; i < ELEMENTS.length; i++) {
    const el = ELEMENTS[i];
    const start = html.indexOf(`${el} Team Comps`);
    if (start < 0) continue;
    // Section runs until the next element heading or the story-teams section.
    const next = ELEMENTS.slice(i + 1).map((e) => html.indexOf(`${e} Team Comps`, start + 1)).filter((x) => x > 0);
    const stop = Math.min(html.indexOf("Best Story Teams", start + 1), ...(next.length ? next : [Infinity]));
    const section = html.slice(start, stop > 0 ? stop : undefined);
    const teams = [...section.matchAll(/<table[^>]*class=['"][^'"]*a-table[^'"]*['"][\s\S]*?<\/table>/g)]
      .flatMap((m) => parseTeams(m[0]));
    if (teams.length) elements.push({ element: el, teams });
  }

  if (!elements.length) throw new Error("no team comps parsed — keeping previous file");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: URL, version, elements }));
  const total = elements.reduce((n, e) => n + e.teams.length, 0);
  console.log(`Wrote ${elements.length} elements, ${total} team comps (v${version}).`);
  for (const e of elements) console.log(`  ${e.element}: ${e.teams.map((t) => t.label + " [" + t.members.map((m) => m.name).join(", ") + "]").join("  ")}`);
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
