/* Farever — Dungeons list scraper.

   Source: FareverDB's /dungeons page (https://www.fareverdb.com/dungeons),
   a game-file extraction site for Farever (same family of site as wikily.gg,
   used elsewhere on this site for Palworld/Far Far West). Unlike wikily.gg,
   FareverDB's dungeon listing is plain server-rendered HTML — the structured
   data (name, recommended level, boss, portrait) is right there in the
   markup, no headless browser or Next.js RSC-payload extraction needed.

   Each dungeon card is an <a href="/dungeons/<slug>"> containing a
   .font-display name and a .text-xs.font-num line formatted either as
   "level N<!-- --> · BossName" (revealed) or "level —" alone (a deeper
   dungeon FareverDB hides to avoid spoilers, no boss/portrait yet).

   Only data/farever/dungeons.json's "sections" (the actual dungeon list) is
   regenerated here. The "intro" block (headline + bullet points) and
   Farever's builds.json/weapons.json are hand-authored editorial content —
   FareverDB has no build/loadout data to scrape, and the weapon "tell" /
   build "why" commentary is NightmareFTW's own analysis, so those stay
   hand-curated (same policy as Warframe's codes).

   Run by .github/workflows/update-farever.yml (daily). Node 18+, curl. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const URL = "https://www.fareverdb.com/dungeons";
const OUT = path.join(__dirname, "..", "data", "farever", "dungeons.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const getHtml = (url) => execFileSync("curl", ["-sL", "--retry", "3", "--retry-delay", "2", "--retry-all-errors", "--max-time", "40", "-A", UA, url], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeEntities(s) {
  return String(s || "").replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, ent) => {
    if (ent[0] === "#") {
      const code = ent[1] === "x" || ent[1] === "X" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    const key = ent.toLowerCase();
    return NAMED[key] !== undefined ? NAMED[key] : m;
  });
}
const clean = (s) => decodeEntities(String(s || "").replace(/<!--[\s\S]*?-->/g, "")).replace(/\s+/g, " ").trim();

function parseDungeons(html) {
  const re = /<a[^>]+href="\/dungeons\/([a-z0-9_]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const seen = new Set();
  const items = [];
  let m;
  while ((m = re.exec(html))) {
    const [, slug, block] = m;
    // The page also has a sidebar nav list (name+slug only, no card markup) —
    // only "font-display" blocks are the real dungeon cards.
    if (!/font-display/.test(block) || seen.has(slug)) continue;
    seen.add(slug);

    const nameM = block.match(/font-display[^>]*>([^<]*)</);
    const label = clean(nameM ? nameM[1] : slug);

    const metaM = block.match(/font-num[^>]*>([\s\S]*?)<\/div>/);
    const metaRaw = metaM ? metaM[1] : "";
    const levelM = metaRaw.match(/level\s*(\d+|—)/i);
    const levelStr = levelM ? levelM[1] : null;
    const level = levelStr && levelStr !== "—" ? parseInt(levelStr, 10) : null;
    const bossM = metaRaw.match(/·(?:\s*<!--[\s\S]*?-->\s*)?([^<]+)/);
    const boss = bossM ? clean(bossM[1]) || null : null;

    const imgM = block.match(/<img[^>]+src="([^"]+)"/);
    const image = imgM ? imgM[1] : "";

    items.push({ label, level, boss, image });
  }
  return items;
}

function run() {
  const html = getHtml(URL);
  const items = parseDungeons(html);
  if (!items.length) throw new Error("no dungeon cards parsed — keeping previous data");

  const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const next = {
    ...prev,
    updated: new Date().toISOString(),
    source: URL,
    sections: [{
      title: (prev.sections && prev.sections[0] && prev.sections[0].title) || "Public Dungeons",
      note: (prev.sections && prev.sections[0] && prev.sections[0].note) || "Names, levels and bosses verified against FareverDB's own game-file extraction (not a fan guide guess).",
      items,
    }],
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(next));
  console.log(`farever dungeons: ${items.length} total, ${items.filter((i) => i.level != null).length} revealed.`);
}

try { run(); } catch (e) { require("./lib/keep")([OUT], e); }
