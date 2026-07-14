/* The Other Side — evidence, ghosts & equipment scraper (theotherside-game.fandom.com).
   Builds data/the-other-side/data.json:
   - evidences: the 6 evidence types (+ how each is detected)
   - ghosts: each ghost's unique 3-evidence combo
   - tools: the evidence-finding equipment, grouped by which evidence it detects
   Powers the Evidence Checker, Ghost Reference and Equipment Guide. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "..", "data", "the-other-side", "data.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const WIKI = "https://theotherside-game.fandom.com/wiki/";
const get = (slug) => { try { return execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" "${WIKI}${slug}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); } catch { return ""; } };
const clean = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/&#160;|&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
const rows = (t) => [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => clean(c[1])));

// The six evidence types. `rx` matches the label as it appears in both the
// evidence table and the (abbreviated) ghost table; `find` is how it's detected.
const EV = [
  { id: "audio", label: "Audio", rx: /audio/i },
  { id: "emf", label: "EMF 20+", rx: /emf/i },
  { id: "freezing", label: "Freezing Temperatures", rx: /freez/i },
  { id: "radiation", label: "Radiation", rx: /radiation/i },
  { id: "uv", label: "UV", rx: /uv|ultra/i },
  { id: "writing", label: "Writing", rx: /writing/i },
];
const evId = (s) => (EV.find((e) => e.rx.test(s)) || {}).id || null;

// Equipment: the evidence tools, grouped on the wiki under a bold "<Evidence>:" label.
const TOOL_LABEL = { audio: "Audio", emf: "EMF", radiation: "Radiation", freezing: "Temperature", uv: "Ultraviolet", writing: "Writing" };

function run() {
  // ---- Evidence page: 6 evidence types + the 18 ghost combos ----
  const evHtml = get("Evidence_(Identify)");
  const ts = evHtml.match(/<table[\s\S]*?<\/table>/g) || [];
  const descRows = ts[0] ? rows(ts[0]) : [];
  const evidences = EV.map((e) => {
    const row = descRows.find((r) => e.rx.test(r[0] || ""));
    return { id: e.id, label: e.label, desc: row ? (row[1] || "").slice(0, 170) : "" };
  });

  const ghostRows = ts[1] ? rows(ts[1]).slice(1) : [];
  const ghosts = [];
  for (const r of ghostRows) {
    const name = r[0]; if (!name) continue;
    const evidence = [...new Set(r.slice(1).map(evId).filter(Boolean))];
    if (evidence.length) ghosts.push({ name, evidence });
  }
  if (ghosts.length < 5) throw new Error("no ghosts parsed — keeping previous file");

  // ---- Equipment page: evidence tools, parsed from each "<Evidence>:" group ----
  const eqHtml = get("Equipment");
  const tools = [];
  for (const e of EV) {
    const lbl = TOOL_LABEL[e.id];
    const i = eqHtml.indexOf("<b>" + lbl + ":</b>");
    if (i < 0) continue;
    // text between this label and the next evidence group / the blessed-misc sections
    let seg = clean(eqHtml.slice(i + ("<b>" + lbl + ":</b>").length, i + 400));
    seg = seg.split(/(?:Audio|EMF|Radiation|Temperature|Ultraviolet|Writing)\s*:|Blessed items|Miscellaneous items|← click/)[0];
    seg.split(/,|\s+and\s+/i).map((s) => s.trim()).filter((s) => s.length > 2 && s.length < 45)
      .forEach((name) => tools.push({ name, evidence: e.id, desc: (evidences.find((v) => v.id === e.id) || {}).desc || "" }));
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
