/* Demonologist — Demon Reference.
   Renders data/demonologist/data.json (scraped from the Demonologist Wiki).
   Searchable, evidence-filterable grid of demons with their 3-evidence combo and
   key strength/weakness tells. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("dr-root");
const evBar = document.getElementById("dr-evidence");
let DATA = null, evFilter = "all", query = "";
const labelOf = (id) => (DATA.evidences.find((e) => e.id === id) || {}).label || id;

function card(d) {
  const chips = d.evidence.map((ev) => `<span class="ev-chip">${esc(labelOf(ev))}</span>`).join("");
  return `<div class="dr-card">
    <div class="dr-head"><span class="dr-name">${esc(d.name)}</span></div>
    <div class="ghost-evidence">${chips}</div>
    ${d.strengths ? `<p class="dr-tell"><b class="dr-str">Strength</b> ${esc(d.strengths)}</p>` : ""}
    ${d.weaknesses ? `<p class="dr-tell"><b class="dr-wk">Weakness</b> ${esc(d.weaknesses)}</p>` : ""}
  </div>`;
}

function render() {
  const q = query.toLowerCase();
  const list = DATA.demons.filter((d) =>
    (evFilter === "all" || d.evidence.includes(evFilter)) &&
    (!q || d.name.toLowerCase().includes(q)));
  root.innerHTML = list.length
    ? `<div class="dr-grid">${list.map(card).join("")}</div>`
    : `<p class="no-results">No demons match.</p>`;
}

function renderTabs() {
  evBar.innerHTML = `<button class="filter-btn${evFilter === "all" ? " active" : ""}" data-ev="all">All</button>` +
    DATA.evidences.map((e) => `<button class="filter-btn${evFilter === e.id ? " active" : ""}" data-ev="${e.id}">${esc(e.label)}</button>`).join("");
  evBar.querySelectorAll("[data-ev]").forEach((b) =>
    b.addEventListener("click", () => { evFilter = b.dataset.ev; renderTabs(); render(); }));
}

document.getElementById("dr-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/demonologist/data.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("dr-updated").textContent = `${DATA.demons.length} demons · ${DATA.evidences.length} evidence types · updated ${upd}`;
    renderTabs();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the demon data yet — the updater hasn't published it.</p>`;
  }
})();
