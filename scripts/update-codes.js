/* Auto code updater (run by .github/workflows/update-codes.yml).
   Best-effort: fetches a public listing page per game, extracts code-like
   tokens, and MERGES them into data/codes/<game>.json without deleting
   curated entries. Scraping third-party pages is inherently fragile — if a
   source changes layout the worst case is "no new codes", never data loss.

   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data", "codes");

// Frequently-updated public listing pages (the freshest signal we can get
// without an official codes API).
const SOURCES = {
  epic7: "https://www.pocketgamer.com/epic-seven/codes/",
  nte: "https://game8.co/games/Neverness-to-Everness/archives/593718",
  warframe: "https://www.pcgamesn.com/warframe/codes",
};

// Words that look like codes but aren't.
const BLACKLIST = new Set([
  "HTTPS", "HTML", "CODES", "REDEEM", "CODE", "GAME", "GAMES", "JUNE", "JULY",
  "EPIC", "SEVEN", "WARFRAME", "NEVERNESS", "EVERNESS", "ACTIVE", "EXPIRED",
  "REWARDS", "REWARD", "GUIDE", "UPDATED", "STOVE", "ANDROID", "EVENT",
]);

function extractCodes(html) {
  const text = html.replace(/<[^>]+>/g, " ");
  const found = new Set();
  const re = /\b[A-Z0-9][A-Z0-9_-]{5,29}\b/g;
  let m;
  while ((m = re.exec(text))) {
    const t = m[0];
    if (BLACKLIST.has(t)) continue;
    // Real codes almost always mix letters AND digits — this filters out most
    // shouty words (e.g. "REWARDS", "ANDROID") while keeping codes like E7VTPRESENT.
    if (!/[A-Z]/.test(t) || !/[0-9]/.test(t)) continue;
    found.add(t);
  }
  return [...found];
}

async function run() {
  for (const [game, url] of Object.entries(SOURCES)) {
    const file = path.join(DATA_DIR, `${game}.json`);
    let data = { game, updated: null, source: url, codes: [] };
    if (fs.existsSync(file)) {
      try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
    }
    const existing = new Map((data.codes || []).map((c) => [c.code, c]));

    let html;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 NightmareFTW-bot" } });
      html = await res.text();
    } catch (e) {
      console.warn(`[${game}] fetch failed, keeping existing codes:`, e.message);
      continue;
    }

    const candidates = extractCodes(html);
    let added = 0;
    for (const code of candidates) {
      if (!existing.has(code)) {
        existing.set(code, { code, reward: "See source", expires: null, expired: false });
        added++;
      }
    }

    data.codes = [...existing.values()];
    data.source = url;
    data.updated = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
    console.log(`[${game}] ${added} new candidate code(s); ${data.codes.length} total.`);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
