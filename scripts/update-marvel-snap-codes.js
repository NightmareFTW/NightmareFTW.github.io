/* Marvel Snap — redeem codes scraper.
   Marvel Snap Zone keeps a clean codes table (code | reward | added | status |
   event), where an empty status means the code is still active. We pull the
   active codes into data/codes/marvel-snap.json (curated-style, but auto-kept
   fresh since codes rotate). Redeemed at the official portal. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const URL = "https://marvelsnapzone.com/codes/";
const OUT = path.join(__dirname, "..", "data", "codes", "marvel-snap.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const getHtml = (url) => execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const clean = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/&#8217;|&#39;|&#039;|&rsquo;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;|&#160;/g, " ").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();

function run() {
  const html = getHtml(URL);
  const active = [], expired = [];
  for (const t of html.match(/<table[\s\S]*?<\/table>/g) || []) {
    for (const r of t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => clean(c[1]));
      const code = cells[0];
      if (!/^[A-Z0-9]{4,}$/.test(code || "")) continue;
      const reward = cells[1] || "Rewards";
      const status = (cells[3] || "").trim();           // "Expired", an expiry date, or empty (active)
      const isExpired = /expired/i.test(status) || /\d{4}\/\d{2}\/\d{2}/.test(status);
      (isExpired ? expired : active).push({ code, reward: reward.slice(0, 120), expires: null, expired: isExpired });
    }
  }
  if (!active.length && !expired.length) throw new Error("no codes parsed — keeping previous file");
  // Active first; include a few recent expired for context.
  const codes = [...active, ...expired.slice(0, 8)];

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    game: "marvel-snap",
    updated: new Date().toISOString(),
    source: "https://marvelsnapzone.com/codes/",
    redeem: "https://marvelsnap.com/redeem-code/",
    note: "Redeem at the official portal: open Settings in-game to find your Snap ID, link it on the portal, then enter the code (case-sensitive) and claim from your in-game inbox. Codes rotate and some have a global use-limit, so grab new ones fast.",
    codes,
  }, null, 2));
  console.log(`Wrote ${active.length} active + ${Math.min(expired.length, 8)} recent expired codes.`);
  active.slice(0, 12).forEach((c) => console.log(`  ${c.code} — ${c.reward}`));
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
