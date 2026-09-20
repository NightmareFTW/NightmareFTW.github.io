/* Vampire Survivors — Stages Database.
   Every stage (including Adventure sub-stages), filterable and sortable by
   DLC — not spoiler-sensitive, so nothing is hidden by default. A card links
   to stage.html; browsing here is already an unambiguous choice, so it never
   needs the disambiguation popup that guide text linking to a stage does.
   Data: data/vampire-survivors/stages.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let DATA = null, query = "", fDlc = "", sortBy = "dlc";

const els = {
  controls: document.getElementById("vst-controls"),
  list: document.getElementById("vst-list"),
  progress: document.getElementById("vst-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search stages…" autocomplete="off" value="${esc(query)}">
    <select id="f-dlc" class="sort-select">${opt("", "All DLCs", fDlc)}${DATA.dlcs.map((d) => opt(d, d, fDlc)).join("")}</select>
    <select id="f-sort" class="sort-select">${opt("dlc", "Sort: DLC", sortBy)}${opt("name", "Sort: Name", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-dlc").addEventListener("change", (e) => { fDlc = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
}

function card(s) {
  return `<a class="vs-card" href="stage.html?slug=${encodeURIComponent(s.slug)}">
    <span class="pw-card-img"><img src="${esc(s.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(s.name)}">${esc(s.name)}</span></span>
      ${s.theme ? `<span class="vs-card-weapon">${esc(s.theme)}</span>` : ""}
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(s.dlcName)}</span>
        ${s.isAdventure ? `<span class="ev-chip">Adventure</span>` : ""}
        ${s.time ? `<span class="ev-chip">${esc(s.time)}</span>` : ""}
      </span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.stages.filter((s) => !fDlc || s.dlcName === fDlc);
  if (query) list = list.filter((s) => s.name.toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  // "dlc" sort order already comes pre-sorted from the data file

  els.progress.innerHTML = `<b>${list.length}</b> of ${DATA.count} stages`;

  if (sortBy === "dlc" && !query) {
    const byDlc = {};
    list.forEach((s) => (byDlc[s.dlcName] = byDlc[s.dlcName] || []).push(s));
    els.list.innerHTML = DATA.dlcs.filter((d) => byDlc[d] && byDlc[d].length).map((d) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(d)}</h3><span class="ms-sec-count">${byDlc[d].length}</span></div>
        <div class="vs-grid">${byDlc[d].map(card).join("")}</div>
      </section>`).join("") || `<p class="no-results">No stages match.</p>`;
  } else {
    els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No stages match.</p>`;
  }
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/vampire-survivors/stages.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("vst-updated").textContent = `${DATA.count} stages · ${DATA.dlcs.length} DLCs · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load stage data.</p>`;
  }
})();
