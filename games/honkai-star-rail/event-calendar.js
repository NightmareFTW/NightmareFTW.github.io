/* Honkai: Star Rail — Event Calendar.
   Renders data/honkai-star-rail/events.json (scraped from Game8 by
   scripts/update-hsr-events.js) as a Gantt-style timeline with a month axis and
   a live "today" marker. Bars coloured by status. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("ev-root");
const DAY = 864e5;
const ms = (iso) => new Date(iso + "T00:00:00Z").getTime();
const fmt = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" });
const STATUS = { live: "Live", upcoming: "Soon", past: "Ended" };
let DATA = null;

function statusOf(e, today) {
  const s = ms(e.startISO), en = e.endISO ? ms(e.endISO) : Infinity;
  return s > today ? "upcoming" : (en >= today ? "live" : "past");
}

function render() {
  const today = Date.now();
  const events = DATA.events.filter((e) => e.startISO).sort((a, b) => ms(a.startISO) - ms(b.startISO));
  if (!events.length) { root.innerHTML = `<p class="no-results">No events to show.</p>`; return; }

  const starts = events.map((e) => ms(e.startISO));
  const ends = events.map((e) => (e.endISO ? ms(e.endISO) : null)).filter(Boolean);
  const from = Math.min(...starts, today) - 2 * DAY;
  const to = Math.max(...ends, ...starts, today) + 3 * DAY;
  const span = to - from || 1;
  const pct = (t) => ((t - from) / span) * 100;

  // Month gridlines + labels.
  const ticks = [];
  const d = new Date(from); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0);
  if (d.getTime() < from) d.setUTCMonth(d.getUTCMonth() + 1);
  for (; d.getTime() <= to; d.setUTCMonth(d.getUTCMonth() + 1)) {
    ticks.push(`<div class="ev-tick" style="left:${pct(d.getTime())}%"><span>${d.toLocaleDateString(undefined, { month: "short" })}</span></div>`);
  }

  const rows = events.map((e) => {
    const s = ms(e.startISO), en = e.endISO ? ms(e.endISO) : to - 3 * DAY;
    const st = statusOf(e, today);
    const left = Math.max(0, pct(s)), width = Math.max(Math.min(100, pct(en)) - left, 1.5);
    const endLabel = e.endISO ? fmt(e.endISO) : (e.end && /end of/i.test(e.end) ? e.end : "end of patch");
    return `<div class="ev-row">
      <div class="ev-head">
        <span class="ev-name">${esc(e.name)}</span>
        <span class="ev-when">${fmt(e.startISO)} – ${esc(endLabel)}</span>
        <span class="wc-badge wc-b-${st}">${STATUS[st]}</span>
      </div>
      <div class="ev-track">
        <div class="ev-bar ev-${st}" style="left:${left}%;width:${width}%">
          ${e.note ? `<span class="ev-bar-note">${esc(e.note)}</span>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");

  root.innerHTML = `<div class="ev-gantt">
    <div class="ev-axis">${ticks.join("")}<div class="ev-today" style="left:${pct(today)}%"><span>today</span></div></div>
    <div class="ev-today-line" style="left:${pct(today)}%"></div>
    ${rows}
  </div>`;
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/honkai-star-rail/events.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const today = Date.now();
    const live = DATA.events.filter((e) => e.startISO && statusOf(e, today) === "live").length;
    document.getElementById("ev-updated").textContent = `${DATA.events.length} events · ${live} live now · updated ${upd}`;
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the event calendar yet — the updater hasn't published it.</p>`;
  }
})();
