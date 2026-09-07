/* Vampire Survivors — Weapons Database.
   Every weapon, evolved form and union, filterable and sortable by DLC —
   unlike characters this isn't spoiler-sensitive, so nothing here is
   hidden by default. A card links to weapon.html for the full evolution
   chain (what it evolves from, what it can still become).
   Data: data/vampire-survivors/weapons.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const TIER_LABEL = { base: "Base", evolution: "Evolution", union: "Union" };

let DATA = null, query = "", fDlc = "", fTier = "", sortBy = "dlc";

const els = {
  controls: document.getElementById("vw-controls"),
  list: document.getElementById("vw-list"),
  progress: document.getElementById("vw-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search weapons…" autocomplete="off" value="${esc(query)}">
    <select id="f-dlc" class="sort-select">${opt("", "All DLCs", fDlc)}${DATA.dlcs.map((d) => opt(d, d, fDlc)).join("")}</select>
    <select id="f-tier" class="sort-select">${opt("", "All types", fTier)}${opt("base", "Base weapons", fTier)}${opt("evolution", "Evolutions", fTier)}${opt("union", "Unions", fTier)}</select>
    <select id="f-sort" class="sort-select">${opt("dlc", "Sort: DLC", sortBy)}${opt("name", "Sort: Name", sortBy)}${opt("tier", "Sort: Type", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-dlc").addEventListener("change", (e) => { fDlc = e.target.value; render(); });
  document.getElementById("f-tier").addEventListener("change", (e) => { fTier = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
}

function tierChip(w) {
  return `<span class="ev-chip${w.tier === "base" ? "" : " confirmed"}">${esc(TIER_LABEL[w.tier] || w.tier)}</span>`;
}

function card(w) {
  return `<a class="vs-card" href="weapon.html?slug=${encodeURIComponent(w.slug)}">
    <span class="pw-card-img">
      <img src="${esc(w.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')">
    </span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(w.name)}">${esc(w.name)}</span></span>
      ${w.caption ? `<span class="vs-card-weapon">${esc(w.caption)}</span>` : ""}
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(w.dlcName)}</span>
        ${tierChip(w)}
        ${w.evolvesInto.length ? `<span class="ev-chip">→ ${esc(w.evolvesInto.length)} evolution${w.evolvesInto.length > 1 ? "s" : ""}</span>` : ""}
      </span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.weapons.filter((w) => !fDlc || w.dlcName === fDlc);
  if (fTier) list = list.filter((w) => w.tier === fTier);
  if (query) list = list.filter((w) => w.name.toLowerCase().includes(query) || (w.caption || "").toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "tier") list = [...list].sort((a, b) => a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name));
  // "dlc" sort order already comes pre-sorted from the data file

  els.progress.innerHTML = `<b>${list.length}</b> of ${DATA.count} weapons`;

  if (sortBy === "dlc" && !query) {
    const byDlc = {};
    list.forEach((w) => (byDlc[w.dlcName] = byDlc[w.dlcName] || []).push(w));
    els.list.innerHTML = DATA.dlcs.filter((d) => byDlc[d] && byDlc[d].length).map((d) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(d)}</h3><span class="ms-sec-count">${byDlc[d].length}</span></div>
        <div class="vs-grid">${byDlc[d].map(card).join("")}</div>
      </section>`).join("") || `<p class="no-results">No weapons match.</p>`;
  } else {
    els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No weapons match.</p>`;
  }
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("vw-updated").textContent = `${DATA.count} weapons · ${DATA.dlcs.length} DLCs · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load weapon data.</p>`;
  }
})();
