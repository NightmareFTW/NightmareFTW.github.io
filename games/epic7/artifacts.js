/* Epic Seven — Artifacts Database.
   Every artifact, filterable/sortable by class restriction — not
   spoiler-sensitive, so nothing is hidden by default. A card links to
   artifact.html for the full skill effect, stats, how to acquire and
   recommended heroes.
   Data: data/epic7/artifacts.json (source: epic7db.com). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let DATA = null, query = "", fCategory = "", sortBy = "category";

const els = {
  controls: document.getElementById("ea-controls"),
  list: document.getElementById("ea-list"),
  progress: document.getElementById("ea-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search artifacts…" autocomplete="off" value="${esc(query)}">
    <select id="f-category" class="sort-select">${opt("", "All classes", fCategory)}${DATA.categories.map((c) => opt(c, c, fCategory)).join("")}</select>
    <select id="f-sort" class="sort-select">${opt("category", "Sort: Class", sortBy)}${opt("name", "Sort: Name", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-category").addEventListener("change", (e) => { fCategory = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
}

function card(a) {
  return `<a class="vs-card" href="artifact.html?slug=${encodeURIComponent(a.slug)}">
    <span class="pw-card-img"><img src="${esc(a.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(a.name)}">${esc(a.name)}</span></span>
      ${a.base && a.base.effect ? `<span class="vs-card-weapon">${esc(a.base.effect)}</span>` : ""}
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(a.category)}</span>
        ${a.grade ? `<span class="ev-chip">${esc(a.grade)}★</span>` : ""}
      </span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.artifacts.filter((a) => !fCategory || a.category === fCategory);
  if (query) list = list.filter((a) => a.name.toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  // "category" sort order already comes pre-sorted from the data file

  els.progress.innerHTML = `<b>${list.length}</b> of ${DATA.count} artifacts`;

  if (sortBy === "category" && !query) {
    const byCat = {};
    list.forEach((a) => (byCat[a.category] = byCat[a.category] || []).push(a));
    els.list.innerHTML = DATA.categories.filter((c) => byCat[c] && byCat[c].length).map((c) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(c)}</h3><span class="ms-sec-count">${byCat[c].length}</span></div>
        <div class="vs-grid">${byCat[c].map(card).join("")}</div>
      </section>`).join("") || `<p class="no-results">No artifacts match.</p>`;
  } else {
    els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No artifacts match.</p>`;
  }
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/epic7/artifacts.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("ea-updated").textContent = `${DATA.count} artifacts · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load artifact data.</p>`;
  }
})();
