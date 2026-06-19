/* Redemption-code updater. Each game pulls from the cleanest structured source
   available and writes data/codes/<game>.json (newest-first):

   - Dreamlight Valley: the wiki's dated Available/Retired tables.
   - Epic Seven: ucngame's code table (newest-first; codes expire fast, so we
     keep the most recent set and link to the official redeem page).

   Games without a clean source (NTE, Warframe) stay curated in their JSON.
   Run by .github/workflows/update-ddv.yml.  Node 18+, no dependencies. */

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "data", "codes");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NightmareFTW-bot";
const get = async (u) => (await (await fetch(u, { headers: { "User-Agent": UA } })).text());

const clean = (s) => s.replace(/<br\s*\/?>/gi, " / ").replace(/<[^>]+>/g, " ")
  .replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&amp;/g, "&")
  .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#?\w+;/g, "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();

const rowsOf = (tableHtml) => (tableHtml.match(/<tr[\s\S]*?<\/tr>/g) || []).map((tr) =>
  [...tr.matchAll(/<t[hd][\s\S]*?>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1]));

function write(game, data) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, `${game}.json`), JSON.stringify(data, null, 2));
}

// ---- Dreamlight Valley (wiki, dated) ---------------------------------------
const SRC_DDV = "https://dreamlightvalleywiki.com/Redemption_Codes";
const toISO = (s) => { const d = new Date(clean(s)); return isNaN(d) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const firstCode = (cell) => (clean(cell).replace(/\s*\/\s*/g, " ").match(/\b[A-Z0-9][A-Z0-9_-]{4,29}\b/) || [])[0] || "";
const altCodes = (cell) => clean(cell).split(/\s*\/\s*/).map((s) => s.trim()).filter((s) => /^[A-Z0-9][A-Z0-9_-]{4,29}$/.test(s));

function parseDDV(tableHtml, expired) {
  const rows = rowsOf(tableHtml);
  const cols = (rows[0] || []).map(clean);
  const codeI = cols.findIndex((c) => /^code$/i.test(c));
  const itemI = cols.findIndex((c) => /item/i.test(c));
  const dateI = cols.findIndex((c) => /available|released|date/i.test(c));
  const out = [];
  for (const r of rows.slice(1)) {
    const code = firstCode(r[codeI] ?? "");
    if (!code) continue;
    const alts = altCodes(r[codeI] ?? "").filter((c) => c !== code);
    const reward = clean(r[itemI] ?? "") || "Reward";
    out.push({ code, reward: alts.length ? `${reward} (alt: ${alts.join(", ")})` : reward, added: dateI >= 0 ? toISO(r[dateI] ?? "") : "", expires: null, expired });
  }
  return out;
}

async function ddv() {
  const html = await get(SRC_DDV);
  const tables = html.match(/<table[\s\S]*?<\/table>/g) || [];
  const active = [], retired = [];
  for (const t of tables) {
    const hdr = clean((t.match(/<tr[\s\S]*?<\/tr>/) || [""])[0]).toLowerCase();
    if (!/\bcode\b/.test(hdr)) continue;
    if (/released/.test(hdr)) retired.push(...parseDDV(t, true));
    else if (/available/.test(hdr)) active.push(...parseDDV(t, false));
  }
  const byDate = (a, b) => (b.added || "").localeCompare(a.added || "");
  const seen = new Set();
  const codes = [...active.sort(byDate), ...retired.sort(byDate).slice(0, 12)].filter((c) => (seen.has(c.code) ? false : seen.add(c.code)));
  write("dreamlight-valley", {
    game: "dreamlight-valley", updated: new Date().toISOString(), source: SRC_DDV,
    note: "Redeem in Settings → Help → Redemption code. Codes are case-sensitive; rewards arrive in your in-game mailbox. Newest first; retired codes shown as expired.",
    codes,
  });
  console.log(`[dreamlight-valley] ${codes.length} codes (${active.length} active, ${retired.length} retired).`);
}

// ---- Epic Seven (ucngame, newest-first) ------------------------------------
const SRC_E7 = "https://ucngame.com/codes/epic-seven-codes/";
const KEEP_E7 = 30;

async function epic7() {
  const html = await get(SRC_E7);
  const table = (html.match(/<table[\s\S]*?<\/table>/g) || []).sort((a, b) => b.length - a.length)[0];
  if (!table) throw new Error("no table");
  const seen = new Set();
  const codes = [];
  for (const r of rowsOf(table).slice(1)) {
    const codeCell = clean(r[0] ?? "");
    const code = (codeCell.match(/^[A-Z0-9][A-Z0-9_<3]{3,29}/) || [])[0];
    if (!code || seen.has(code)) continue;
    seen.add(code);
    codes.push({ code, reward: "Coupon rewards (event / livestream)", added: "", expires: null, expired: false });
    if (codes.length >= KEEP_E7) break;
  }
  write("epic7", {
    game: "epic7", updated: new Date().toISOString(), source: SRC_E7,
    redeem: "https://epic7.onstove.com/en/coupon",
    note: "Redeem on the official Stove coupon page (button below). Epic Seven codes expire fast — newest at the top; some may already be gone.",
    codes,
  });
  console.log(`[epic7] ${codes.length} codes (kept newest ${KEEP_E7}).`);
}

async function run() {
  for (const [name, fn] of [["dreamlight-valley", ddv], ["epic7", epic7]]) {
    try { await fn(); } catch (e) { console.warn(`[${name}] failed:`, e.message); }
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
