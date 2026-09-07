/* Vampire Survivors — Enemies Database.
   Every enemy, filterable and sortable by DLC — not spoiler-sensitive, so
   nothing is hidden by default. A card links to enemy.html; unlike an
   ambiguous name mentioned inside guide text, a card here is already an
   unambiguous choice (you're browsing the enemy list), so it never needs
   the disambiguation popup that character/weapon guide text does.
   Data: data/vampire-survivors/enemies.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let DATA = null, query = "", fDlc = "", sortBy = "dlc";

const els = {
  controls: document.getElementById("ve-controls"),
  list: document.getElementById("ve-list"),
  progress: document.getElementById("ve-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search enemies…" autocomplete="off" value="${esc(query)}">
    <select id="f-dlc" class="sort-select">${opt("", "All DLCs", fDlc)}${DATA.dlcs.map((d) => opt(d, d, fDlc)).join("")}</select>
    <select id="f-sort" class="sort-select">${opt("dlc", "Sort: DLC", sortBy)}${opt("name", "Sort: Name", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-dlc").addEventListener("change", (e) => { fDlc = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
}

function card(e) {
  const stat = [e.health && `${e.health} HP`, e.damage && `${e.damage} dmg`].filter(Boolean).join(" · ");
  return `<a class="vs-card" href="enemy.html?slug=${encodeURIComponent(e.slug)}">
    <span class="pw-card-img"><img src="${esc(e.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(e.name)}">${esc(e.name)}</span></span>
      ${e.stages ? `<span class="vs-card-weapon">${esc(e.stages)}</span>` : e.theme ? `<span class="vs-card-weapon">${esc(e.theme)}</span>` : ""}
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(e.dlcName)}</span>
        ${stat ? `<span class="ev-chip">${esc(stat)}</span>` : ""}
      </span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.enemies.filter((e) => !fDlc || e.dlcName === fDlc);
  if (query) list = list.filter((e) => e.name.toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  // "dlc" sort order already comes pre-sorted from the data file

  els.progress.innerHTML = `<b>${list.length}</b> of ${DATA.count} enemies`;

  if (sortBy === "dlc" && !query) {
    const byDlc = {};
    list.forEach((e) => (byDlc[e.dlcName] = byDlc[e.dlcName] || []).push(e));
    els.list.innerHTML = DATA.dlcs.filter((d) => byDlc[d] && byDlc[d].length).map((d) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(d)}</h3><span class="ms-sec-count">${byDlc[d].length}</span></div>
        <div class="vs-grid">${byDlc[d].map(card).join("")}</div>
      </section>`).join("") || `<p class="no-results">No enemies match.</p>`;
  } else {
    els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No enemies match.</p>`;
  }
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/vampire-survivors/enemies.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("ve-updated").textContent = `${DATA.count} enemies · ${DATA.dlcs.length} DLCs · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load enemy data.</p>`;
  }
})();
