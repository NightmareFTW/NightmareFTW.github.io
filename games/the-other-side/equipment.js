/* The Other Side — Equipment Guide.
   Renders data/the-other-side/data.json (scraped from the wiki). Evidence tools
   with which evidence they detect, grouped/sorted by evidence. Vanilla JS. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("eq-root");
let DATA = null, query = "";
const labelOf = (id) => (DATA.evidences.find((e) => e.id === id) || {}).label || id;
const evOrder = (id) => DATA.evidences.findIndex((e) => e.id === id);

function card(t) {
  return `<div class="eq-card${t.evidence ? " eq-evidence" : ""}">
    <div class="eq-head">
      <span class="eq-name">${esc(t.name)}</span>
      ${t.price ? `<span class="eq-price">${esc(t.price)}</span>` : ""}
    </div>
    ${t.evidence ? `<span class="eq-badge">Finds: ${esc(labelOf(t.evidence))}</span>` : `<span class="eq-badge eq-util">Utility</span>`}
    ${t.desc ? `<p class="eq-desc">${esc(t.desc)}</p>` : ""}
  </div>`;
}

function render() {
  const q = query.toLowerCase();
  const list = DATA.tools.filter((t) => !q || t.name.toLowerCase().includes(q) || (t.desc || "").toLowerCase().includes(q));
  // Group by evidence in the evidence order; utility items last.
  list.sort((a, b) => (a.evidence ? evOrder(a.evidence) : 99) - (b.evidence ? evOrder(b.evidence) : 99));
  root.innerHTML = list.length
    ? `<div class="eq-grid">${list.map(card).join("")}</div>`
    : `<p class="no-results">No tools match.</p>`;
}

document.getElementById("eq-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/the-other-side/data.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const ev = DATA.tools.filter((t) => t.evidence).length;
    document.getElementById("eq-updated").textContent = `${DATA.tools.length} tools · ${ev} evidence-finding · updated ${upd}`;
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the equipment yet — the updater hasn't published it.</p>`;
  }
})();
