/* Honkai: Star Rail — warp banner calendar scraper.
   Parses Game8's Banner History page (upcoming → recent) into
   data/honkai-star-rail/banners.json. Each phase lists its featured 5-stars via
   "(Name Banner)" and shares a "Banner Dates:" range. Powers the Warp Calendar.
   Run locally + by a GitHub Action. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const URL = "https://game8.co/games/Honkai-Star-Rail/archives/474951";
const OUT = path.join(__dirname, "..", "data", "honkai-star-rail", "banners.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

const getHtml = (url) => execSync(`curl -sL -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const iso = (s) => {
  const m = (s || "").match(/([A-Z][a-z]{2})\.?\s*(\d{1,2}),?\s*(\d{4})/);
  if (!m || MON[m[1]] == null) return null;
  return new Date(Date.UTC(+m[3], MON[m[1]], +m[2])).toISOString().slice(0, 10);
};

function run() {
  const html = getHtml(URL);
  const flat = decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

  // name -> portrait, reused from the builds/teams data we already scrape.
  const img = {};
  const load = (p, pick) => { try { pick(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "honkai-star-rail", p), "utf8"))); } catch {} };
  load("builds.json", (d) => { for (const n in d.characters) img[n] = d.characters[n].img; });
  load("teams.json", (d) => { for (const e of d.elements) for (const t of e.teams) for (const m of t.members) if (!img[m.name]) img[m.name] = m.img; });
  // Exact name, else any name-token (handles alt forms: "Himeko - Nova" -> Himeko, "Mortenax Blade" -> Blade).
  const portrait = (c) => img[c] || (c.split(/\s*-\s*|\s+/).map((w) => img[w]).find(Boolean)) || "";

  // Segment the flat text by phase / collab headers; each segment shares a date range.
  const markRe = /(?:HSR\s+(\d\.\d)\s+Phase\s+(\d)|(\d\.\d)\s+Fate Collaboration|Fate Collaboration)\s+Banner History/gi;
  const marks = [...flat.matchAll(markRe)];
  const seen = new Set();
  const banners = [];
  let lastV = "";
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const v = m[1] || m[3] || lastV; const phase = m[2] || "";
    if (v) lastV = v;
    const seg = flat.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : m.index + 1200);
    const dm = seg.match(/Banner Dates:\s*([A-Z][a-z.]*\.?\s*\d{1,2},?\s*\d{4})\s*[-–]\s*((?:TBA)|[A-Z][a-z.]*\.?\s*\d{1,2},?\s*\d{4})/);
    const startISO = dm ? iso(dm[1]) : null;
    if (!startISO) continue; // skip undated cross-links / old rows we can't date cleanly
    const chars = [...new Set([...seg.matchAll(/\(([^)]+?) Banner\)/g)].map((x) => decode(x[1])).filter((c) => c && !/Light Cone/i.test(c)))];
    for (const c of chars) {
      const key = c + "|" + startISO;
      if (seen.has(key)) continue;
      seen.add(key);
      banners.push({ version: v, phase, char: c, img: portrait(c), start: dm[1].trim(), end: dm[2].trim(), startISO, endISO: iso(dm[2]) });
    }
  }
  banners.sort((a, b) => (b.startISO < a.startISO ? -1 : b.startISO > a.startISO ? 1 : 0));
  if (!banners.length) throw new Error("no banners parsed — keeping previous file");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: URL, banners }));
  console.log(`Wrote ${banners.length} banners (${banners[banners.length - 1].startISO} → ${banners[0].startISO}).`);
}
try { run(); } catch (e) { console.error(e.message); process.exit(1); }
