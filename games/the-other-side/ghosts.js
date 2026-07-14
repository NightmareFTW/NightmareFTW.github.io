/* The Other Side — Ghost Reference.
   Renders data/the-other-side/data.json (scraped from the wiki). Searchable,
   evidence-filterable grid of ghosts with their 3-evidence combo. Vanilla JS. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("gr-root");
const evBar = document.getElementById("gr-evidence");
let DATA = null, evFilter = "all", query = "";
const labelOf = (id) => (DATA.evidences.find((e) => e.id === id) || {}).label || id;

function card(g) {
  const chips = g.evidence.map((ev) => `<span class="ev-chip">${esc(labelOf(ev))}</span>`).join("");
  return `<div class="dr-card">
    <div class="dr-head"><span class="dr-name">${esc(g.name)}</span></div>
    <div class="ghost-evidence">${chips}</div>
    ${g.strengths ? `<p class="dr-tell"><b class="dr-str">Strength</b> ${esc(g.strengths)}</p>` : ""}
    ${g.weaknesses ? `<p class="dr-tell"><b class="dr-wk">Weakness</b> ${esc(g.weaknesses)}</p>` : ""}
  </div>`;
}

function render() {
  const q = query.toLowerCase();
  const list = DATA.ghosts.filter((g) =>
    (evFilter === "all" || g.evidence.includes(evFilter)) &&
    (!q || g.name.toLowerCase().includes(q)));
  root.innerHTML = list.length
    ? `<div class="dr-grid">${list.map(card).join("")}</div>`
    : `<p class="no-results">No ghosts match.</p>`;
}

function renderTabs() {
  evBar.innerHTML = `<button class="filter-btn${evFilter === "all" ? " active" : ""}" data-ev="all">All</button>` +
    DATA.evidences.map((e) => `<button class="filter-btn${evFilter === e.id ? " active" : ""}" data-ev="${e.id}">${esc(e.label)}</button>`).join("");
  evBar.querySelectorAll("[data-ev]").forEach((b) =>
    b.addEventListener("click", () => { evFilter = b.dataset.ev; renderTabs(); render(); }));
}

document.getElementById("gr-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/the-other-side/data.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("gr-updated").textContent = `${DATA.ghosts.length} ghosts · ${DATA.evidences.length} evidence types · updated ${upd}`;
    renderTabs();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the ghost data yet — the updater hasn't published it.</p>`;
  }
})();
