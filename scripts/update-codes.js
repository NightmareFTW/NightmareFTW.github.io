/* Redemption-code updater for Disney Dreamlight Valley.
   The DDV wiki keeps two clean, dated tables — "Available Codes" and
   "Retired Codes" (Items | Code | Available/Released | Details) — so we can
   scrape an accurate, dated list and mark retired codes as expired. Output is
   sorted newest-first. Other games stay curated (no equally clean source).
   Run by .github/workflows/update-ddv.yml.  Node 18+, no dependencies. */

const fs = require("fs");
const path = require("path");

const SRC = "https://dreamlightvalleywiki.com/Redemption_Codes";
const OUT = path.join(__dirname, "..", "data", "codes", "dreamlight-valley.json");

const clean = (s) => s.replace(/<br\s*\/?>(?=)/gi, " / ").replace(/<[^>]+>/g, " ")
  .replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&amp;/g, "&")
  .replace(/&#39;|&apos;/g, "'").replace(/&#160;|&nbsp;/g, " ").replace(/\[\d+\]/g, "")
  .replace(/\s+/g, " ").trim();

// "June 3, 2026" / "April 30, 2026" -> YYYY-MM-DD (local parts, no TZ shift).
const toISO = (s) => {
  const d = new Date(clean(s));
  return isNaN(d) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Parse one wiki table into rows of cells (raw HTML per cell).
function rowsOf(tableHtml) {
  return (tableHtml.match(/<tr[\s\S]*?<\/tr>/g) || []).map((tr) =>
    [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1]));
}

// Pull the first valid-looking redeem code from the Code cell (it may list alts).
const firstCode = (cell) => {
  const txt = clean(cell).replace(/\s*\/\s*/g, " ");
  const m = txt.match(/\b[A-Z0-9][A-Z0-9_-]{4,29}\b/);
  return m ? m[0] : "";
};
const altCodes = (cell) => clean(cell).split(/\s*\/\s*/).map((s) => s.trim()).filter((s) => /^[A-Z0-9][A-Z0-9_-]{4,29}$/.test(s));

function parseTable(tableHtml, expired) {
  const rows = rowsOf(tableHtml);
  const cols = (rows[0] || []).map(clean);
  const codeI = cols.findIndex((c) => /^code$/i.test(c));
  const itemI = cols.findIndex((c) => /item/i.test(c));
  const dateI = cols.findIndex((c) => /available|released|date/i.test(c));
  const out = [];
  for (const r of rows.slice(1)) {
    if (!r.length) continue;
    const code = firstCode(r[codeI] ?? "");
    if (!code) continue;
    const alts = altCodes(r[codeI] ?? "").filter((c) => c !== code);
    const reward = clean(r[itemI] ?? "") || "Reward";
    out.push({
      code,
      reward: alts.length ? `${reward} (alt: ${alts.join(", ")})` : reward,
      added: dateI >= 0 ? toISO(r[dateI] ?? "") : "",
      expires: null,
      expired,
    });
  }
  return out;
}

async function run() {
  const html = await (await fetch(SRC, { headers: { "User-Agent": "Mozilla/5.0 NightmareFTW-bot" } })).text();
  const tables = html.match(/<table[\s\S]*?<\/table>/g) || [];
  const active = [], retired = [];
  for (const t of tables) {
    const hdr = clean((t.match(/<tr[\s\S]*?<\/tr>/) || [""])[0]).toLowerCase();
    if (!/\bcode\b/.test(hdr)) continue;
    if (/released/.test(hdr)) retired.push(...parseTable(t, true));
    else if (/available/.test(hdr)) active.push(...parseTable(t, false));
  }
  // Newest first within each group; active above retired. Keep only the 12 most
  // recently retired codes (the full retired list is long and rarely useful).
  const byDate = (a, b) => (b.added || "").localeCompare(a.added || "");
  const seen = new Set();
  const codes = [...active.sort(byDate), ...retired.sort(byDate).slice(0, 12)]
    .filter((c) => (seen.has(c.code) ? false : seen.add(c.code)));

  const out = {
    game: "dreamlight-valley",
    updated: new Date().toISOString(),
    source: SRC,
    note: "Redeem in Settings → Help → Redemption code. Codes are case-sensitive; rewards arrive in your in-game mailbox. Newest first; retired codes shown as expired.",
    codes,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${codes.length} DDV codes (${active.length} active, ${retired.length} retired).`);
}

run().catch((e) => { console.error(e); process.exit(1); });
