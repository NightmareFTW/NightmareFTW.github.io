/* Vampire Survivors — Pickups Database.
   Every non-weapon pickup that can drop from light sources, filterable and
   sortable by DLC. A card links to pickup.html; browsing here is already an
   unambiguous choice, so it never needs the disambiguation popup that guide
   text linking to a pickup does.
   Data: data/vampire-survivors/pickups.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let DATA = null, query = "", fDlc = "", sortBy = "dlc";

const els = {
  controls: document.getElementById("vpk-controls"),
  list: document.getElementById("vpk-list"),
  progress: document.getElementById("vpk-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search pickups…" autocomplete="off" value="${esc(query)}">
    <select id="f-dlc" class="sort-select">${opt("", "All DLCs", fDlc)}${DATA.dlcs.map((d) => opt(d, d, fDlc)).join("")}</select>
    <select id="f-sort" class="sort-select">${opt("dlc", "Sort: DLC", sortBy)}${opt("name", "Sort: Name", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-dlc").addEventListener("change", (e) => { fDlc = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
}

function card(p) {
  return `<a class="vs-card" href="pickup.html?slug=${encodeURIComponent(p.slug)}">
    <span class="pw-card-img"><img src="${esc(p.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(p.name)}">${esc(p.name)}</span></span>
      ${p.caption ? `<span class="vs-card-weapon">${esc(p.caption)}</span>` : ""}
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(p.dlcName)}</span>
        ${p.rarity ? `<span class="ev-chip">Rarity ${esc(p.rarity)}</span>` : ""}
      </span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.pickups.filter((p) => !fDlc || p.dlcName === fDlc);
  if (query) list = list.filter((p) => p.name.toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  // "dlc" sort order already comes pre-sorted from the data file

  els.progress.innerHTML = `<b>${list.length}</b> of ${DATA.count} pickups`;

  if (sortBy === "dlc" && !query) {
    const byDlc = {};
    list.forEach((p) => (byDlc[p.dlcName] = byDlc[p.dlcName] || []).push(p));
    els.list.innerHTML = DATA.dlcs.filter((d) => byDlc[d] && byDlc[d].length).map((d) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(d)}</h3><span class="ms-sec-count">${byDlc[d].length}</span></div>
        <div class="vs-grid">${byDlc[d].map(card).join("")}</div>
      </section>`).join("") || `<p class="no-results">No pickups match.</p>`;
  } else {
    els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No pickups match.</p>`;
  }
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/vampire-survivors/pickups.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("vpk-updated").textContent = `${DATA.count} pickups · ${DATA.dlcs.length} DLCs · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load pickup data.</p>`;
  }
})();
