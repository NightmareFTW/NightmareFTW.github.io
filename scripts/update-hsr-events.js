/* Honkai: Star Rail — event calendar scraper.
   Parses Game8's "All Events and Schedule" page into
   data/honkai-star-rail/events.json. Handles the two schedule layouts Game8 uses:
   the "◆ Event | Dates" ongoing table and the "Event | Duration: …" upcoming
   table. Powers the Event Calendar. Run locally + by a GitHub Action. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const URL = "https://game8.co/games/Honkai-Star-Rail/archives/408749";
const OUT = path.join(__dirname, "..", "data", "honkai-star-rail", "events.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const getHtml = (url) => execSync(`curl -sL -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const cellText = (c) => decode(c.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// "06/01" or "07/03/2026" -> ISO (year defaults to the current year).
function iso(mmdd) {
  const m = (mmdd || "").match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (!m) return null;
  const y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : new Date().getUTCFullYear();
  return `${y}-${String(+m[1]).padStart(2, "0")}-${String(+m[2]).padStart(2, "0")}`;
}

function run() {
  const html = getHtml(URL);
  const events = [];
  const seen = new Set();
  const add = (name, start, end, note) => {
    name = name.replace(/^[◆●\s]+/, "").trim();
    if (!name || name.length < 3 || seen.has(name)) return;
    seen.add(name);
    events.push({ name: name.slice(0, 60), start, end, startISO: iso(start), endISO: /\d{1,2}\/\d{1,2}/.test(end) ? iso(end) : null, note: (note || "").slice(0, 140) });
  };

  for (const tm of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const tbl = tm[0];
    const hasBullet = /◆/.test(tbl);
    const hasDuration = /Schedule\s*&amp;\s*Summary|Duration:/i.test(tbl);
    if (!hasBullet && !hasDuration) continue;
    for (const r of tbl.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => cellText(m[1]));
      if (cells.length < 2) continue;
      if (hasBullet) {
        const dateCell = cells.find((c) => /\d{1,2}\/\d{1,2}|Permanent|End of/i.test(c));
        const nameCell = cells.find((c) => /◆/.test(c));
        if (!dateCell || !nameCell) continue;
        const dm = dateCell.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*[-–]\s*(.+)/);
        add(nameCell, dm ? dm[1] : dateCell, dm ? dm[2].trim() : "", "");
      } else {
        const dur = cells.find((c) => /Duration:/i.test(c));
        const nameCell = cells.find((c) => c !== dur && !/^Event$/i.test(c) && c.length > 2);
        if (!dur || !nameCell) continue;
        const dates = [...dur.matchAll(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g)].map((m) => m[0]);
        if (!dates.length) continue;
        const end = dates[1] || (/End of[^.]*|TBA/i.exec(dur) || [""])[0].trim();
        const note = dur.split(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/).pop().replace(/^[\s\-–]+/, "").trim();
        add(nameCell, dates[0], end, note);
      }
    }
  }
  events.sort((a, b) => ((a.startISO || "9999") < (b.startISO || "9999") ? -1 : 1));
  if (!events.length) throw new Error("no events parsed — keeping previous file");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: URL, events }));
  console.log(`Wrote ${events.length} events.`);
  events.forEach((e) => console.log(`  ${(e.startISO || e.start).padEnd(12)} -> ${(e.endISO || e.end || "?").padEnd(14)} ${e.name}`));
}
try { run(); } catch (e) { console.error(e.message); process.exit(1); }
