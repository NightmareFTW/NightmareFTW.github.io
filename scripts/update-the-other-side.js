/* The Other Side — evidence, ghosts & equipment scraper (theotherside-game.fandom.com).
   Builds data/the-other-side/data.json:
   - evidences: the 7 evidence types (+ how each is detected)
   - ghosts: each ghost's unique 3-evidence combo
   - tools: the evidence-finding equipment, grouped by which evidence it detects
   Powers the Evidence Checker, Ghost Reference and Equipment Guide. Node 18+, curl.

   Ghost-type pages don't share a wiki category (each only self-tags its own
   name), and the per-game "Evidence (Identify)" page only lists the 7
   evidence types now — the old combined ghost-combo table moved onto each
   ghost's own page. So GHOST_NAMES below is a hand-checked list of every
   actual ghost-type page (cross-referenced against the wiki's full
   Special:AllPages namespace-0 listing, which excludes story/map pages like
   "12 Ravenwood Lane (Gary)"); a future new ghost type needs a one-line add
   here, same as new codes/presets need an entry elsewhere on this site. */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.join(__dirname, "..", "data", "the-other-side", "data.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
// Fetching wiki pages directly now gets a Cloudflare Turnstile challenge
// (cf-mitigated: challenge) that curl can't solve — but Fandom's MediaWiki
// API (action=parse&prop=text, the same rendered article HTML a direct page
// load would give) isn't behind that same check, so go through it instead.
const API = "https://theotherside-game.fandom.com/api.php";
const get = (slug) => {
  try {
    const body = execFileSync("curl", ["-sL", "--retry", "3", "--retry-delay", "2", "--retry-all-errors", "--max-time", "40", "-A", UA,
      `${API}?action=parse&page=${encodeURIComponent(slug)}&format=json&prop=text`], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
    const j = JSON.parse(body);
    return (j.parse && j.parse.text && j.parse.text["*"]) || "";
  } catch { return ""; }
};
const clean = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/&#160;|&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
const rows = (t) => [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => clean(c[1])));

// The seven evidence types (Ghost Orb added since this last ran). `rx` matches
// the label as it appears in the evidence table, a ghost's own Evidence
// section and the Equipment page's tool list.
const EV = [
  { id: "audio", label: "Audio", rx: /audio/i },
  { id: "emf", label: "EMF 20+", rx: /emf/i },
  { id: "freezing", label: "Freezing Temperatures", rx: /freez/i },
  { id: "orb", label: "Ghost Orbs", rx: /orb/i },
  { id: "radiation", label: "Radiation", rx: /radiation/i },
  { id: "uv", label: "UV", rx: /uv|ultra/i },
  { id: "writing", label: "Writing", rx: /writing/i },
];
const evId = (s) => (EV.find((e) => e.rx.test(s)) || {}).id || null;

const GHOST_NAMES = [
  "Ataphoi", "Banshee", "Bhoot", "Demon", "Doppelganger", "Hupia", "Iblis", "Marid",
  "Nasnas", "Phantom", "Poltergeist", "Puca", "Revenant", "Shura", "Skia", "Sluagh",
  "Strigoi", "Tantalus", "Tariaksuq", "The Echo", "The Forgotten", "Wewe Gombel",
  "Wiederganger", "Wisp", "Wraith",
];

// A ghost's own page has an "Evidence" section: a single <p> naming its 3
// evidence types in bold, e.g. "<b>Audio</b> (...) | <b>EMF 20+</b> (...) | ...".
function ghostEvidence(html) {
  const i0 = html.indexOf('id="Evidence"');
  if (i0 < 0) return [];
  const i = html.indexOf("</h2>", i0);
  if (i < 0) return [];
  const seg = html.slice(i, i + 800);
  const m = seg.match(/<p>([\s\S]*?)<\/p>/);
  if (!m) return [];
  return [...new Set([...m[1].matchAll(/<b>([^<]+)<\/b>/g)].map((x) => evId(x[1])).filter(Boolean))];
}

function run() {
  // ---- Evidence (Identify) page: the 7 evidence type descriptions ----
  const evHtml = get("Evidence_(Identify)");
  const ts = evHtml.match(/<table[\s\S]*?<\/table>/g) || [];
  const descRows = ts[0] ? rows(ts[0]) : [];
  if (descRows.length < 6) throw new Error("evidence table missing/short — keeping previous file");
  const evidences = EV.map((e) => {
    const row = descRows.find((r) => e.rx.test(r[0] || ""));
    return { id: e.id, label: e.label, desc: row ? (row[1] || "").slice(0, 170) : "" };
  });

  // ---- Each ghost's own page: its 3-evidence combo ----
  const ghosts = [];
  for (const name of GHOST_NAMES) {
    const html = get(name);
    const evidence = ghostEvidence(html);
    if (evidence.length === 3) ghosts.push({ name, evidence });
    else console.warn(`  ${name}: got ${evidence.length} evidence (expected 3), skipped`);
  }
  if (ghosts.length < 15) throw new Error(`only parsed ${ghosts.length} ghosts — keeping previous file`);

  // ---- Equipment page: evidence tools, one <li><b>Label:</b> tools</li> per type ----
  const eqHtml = get("Equipment");
  const TOOL_LABEL = { audio: "Audio", emf: "EMF", orb: "Ghost Orb", radiation: "Radiation", freezing: "Temperature", uv: "Ultraviolet", writing: "Writing" };
  const tools = [];
  for (const e of EV) {
    const lbl = TOOL_LABEL[e.id];
    const m = eqHtml.match(new RegExp(`<li><b>${lbl}:<\\/b>\\s*([^<]*)<\\/li>`));
    if (!m) continue;
    clean(m[1]).split(/,|\s+and\s+/i).map((s) => s.trim()).filter((s) => s.length > 2 && s.length < 60)
      .forEach((toolName) => tools.push({ name: toolName, evidence: e.id, desc: (evidences.find((v) => v.id === e.id) || {}).desc || "" }));
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://theotherside-game.fandom.com/",
    evidences, ghosts, tools,
  }));
  console.log(`Wrote ${ghosts.length} ghosts, ${evidences.length} evidence, ${tools.length} tools.`);
  ghosts.forEach((g) => console.log(`  ${g.name.padEnd(16)} [${g.evidence.join(", ")}]`));
  tools.forEach((t) => console.log(`  tool ${t.name.padEnd(34)} finds ${t.evidence}`));
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
