/* Demonologist — demons, evidence & tools scraper (demonologist.fandom.com).
   Builds data/demonologist/data.json:
   - evidences: the 7 evidence types
   - demons: each demon's 3-evidence combo + short strengths/weaknesses (the "tells")
   - tools: each tool's function + price
   Powers the Evidence Checker, Demon Reference and Equipment Guide. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "..", "data", "demonologist", "data.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const WIKI = "https://demonologist.fandom.com/wiki/";

const get = (slug) => { try { return execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" "${WIKI}${encodeURIComponent(slug)}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); } catch { return ""; } };
const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const clean = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/&#160;|&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#039;/g, "'").replace(/&quot;/g, '"').replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
const ib = (h, src) => { const m = h.match(new RegExp('data-source="' + src + '"[\\s\\S]{0,120}?pi-data-value[^>]*>([\\s\\S]*?)<\\/div>', "i")); return m ? clean(m[1]) : ""; };
const short = (s, n) => { s = clean(s); return s.length > n ? s.slice(0, s.lastIndexOf(" ", n)) + "…" : s; };

const EVID = [
  { id: "emf", label: "EMF Level 5", key: "EMF 5" },
  { id: "fingerprints", label: "Fingerprints", key: "Fingerprints" },
  { id: "easel", label: "Easel Canvas Drawing", key: "Easel Canvas" },
  { id: "freezing", label: "Freezing Temperatures", key: "Freezing" },
  { id: "esg", label: "ESG Ghost Reaction", key: "ESG" },
  { id: "ectoplasm", label: "Ectoplasm Stains", key: "Ectoplasm" },
  { id: "spiritbox", label: "Spirit Box Response", key: "Spirit Box" },
];
const TOOLS = ["EMF", "Thermometer", "Spirit Box", "UV Light", "Easel Canvas", "ESG", "Ectoplasma Glass",
  "Candle", "Crucifix", "Salt Barrier", "Salt Gun", "Fulu", "Sanity Pills", "Sledgehammer", "Pocket Watch",
  "Photo Camera", "Tripod Camera", "Flashlight"];
const TOOL_EVID = { EMF: "emf", Thermometer: "freezing", "Spirit Box": "spiritbox", "UV Light": "fingerprints", "Easel Canvas": "easel", ESG: "esg", "Ectoplasma Glass": "ectoplasm" };

function demonsWithEvidence() {
  const h = get("Ghosts");
  const table = (h.match(/<table[\s\S]*?<\/table>/g) || [])[0];
  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => clean(c[1])));
  const colId = rows[0].map((hh) => { for (const e of EVID) if (hh.indexOf(e.key) === 0) return e.id; return null; });
  const out = [];
  for (const row of rows.slice(1)) {
    if (!row.length || !row[0]) continue;
    const ev = []; for (let i = 1; i < row.length; i++) if (row[i] && colId[i]) ev.push(colId[i]);
    if (ev.length >= 2) out.push({ name: row[0], evidence: ev });
  }
  return out;
}

function run() {
  const demons = demonsWithEvidence();
  if (!demons.length) throw new Error("no demons parsed — keeping previous file");
  for (const d of demons) {
    const h = get(d.name); sleep(150);
    d.tagline = short(ib(h, "title"), 90);
    d.strengths = short(ib(h, "strengths") || ib(h, "strength"), 150);
    d.weaknesses = short(ib(h, "weaknesses") || ib(h, "weakness"), 150);
    console.log(`${d.name.padEnd(13)} [${d.evidence.join(",")}]  ${d.strengths ? "✓" : "·"}/${d.weaknesses ? "✓" : "·"}`);
  }
  const tools = [];
  for (const name of TOOLS) {
    const h = get(name.replace(/ /g, "_")); sleep(150);
    const desc = short(ib(h, "Description") || ib(h, "description"), 200);
    const priceM = h.match(/Price[\s\S]{0,40}?\$?([\d,]{2,7})/);
    tools.push({ name, evidence: TOOL_EVID[name] || null, desc, price: priceM ? "$" + priceM[1] : "" });
    console.log(`tool ${name.padEnd(16)} ${desc ? "✓" : "·"} ${tools[tools.length - 1].price}`);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://demonologist.fandom.com/", evidences: EVID.map((e) => ({ id: e.id, label: e.label })), demons, tools }));
  console.log(`\nWrote ${demons.length} demons, ${tools.length} tools.`);
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
