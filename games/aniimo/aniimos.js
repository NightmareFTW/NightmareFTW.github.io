/* Aniimo — Database.
   Every Aniimo, filterable/sortable by element, role and stage. Not
   spoiler-sensitive, so nothing is hidden by default. Cards are tinted by
   element (background gradient, from ELEMENT_COLOR) and show role/stage
   chips plus the base-stat total.
   A card links to aniimo.html for full stats, mobility, traits, skills,
   evolution line, habitats and Resonance Training.
   Data: data/aniimo/creatures.json (source: wiki.aniimo.com, the official
   game wiki). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ELEMENT_COLOR = {
  Fire: "#f2543d", Water: "#3d9bf2", Grass: "#6bbf3f", Electric: "#e0c23a", Ice: "#38b6e0",
  Wind: "#7fd9c4", Dark: "#a866e0", Holy: "#f2e6a3", Rock: "#a9835a",
};
const STAGE_RANK = { Lumin: 1, Gamma: 2, Nova: 3 };

let DATA = null, query = "", fElement = "", fRole = "", fStage = "", sortBy = "number";

const els = {
  controls: document.getElementById("an-controls"),
  list: document.getElementById("an-list"),
  progress: document.getElementById("an-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search Aniimo…" autocomplete="off" value="${esc(query)}">
    <select id="f-element" class="sort-select">${opt("", "All elements", fElement)}${DATA.elements.map((e) => opt(e, e, fElement)).join("")}</select>
    <select id="f-role" class="sort-select">${opt("", "All roles", fRole)}${DATA.roles.map((r) => opt(r, r, fRole)).join("")}</select>
    <select id="f-stage" class="sort-select">${opt("", "All stages", fStage)}${DATA.stages.map((s) => opt(s, s, fStage)).join("")}</select>
    <select id="f-sort" class="sort-select">${opt("number", "Sort: Number", sortBy)}${opt("name", "Sort: Name", sortBy)}${opt("total", "Sort: Total Stats", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-element").addEventListener("change", (e) => { fElement = e.target.value; render(); });
  document.getElementById("f-role").addEventListener("change", (e) => { fRole = e.target.value; render(); });
  document.getElementById("f-stage").addEventListener("change", (e) => { fStage = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
}

function card(c) {
  const elemColor = ELEMENT_COLOR[c.elements[0]] || null;
  const cardStyle = `position:relative;overflow:hidden;${elemColor ? `background:linear-gradient(120deg, ${elemColor}29, ${elemColor}0d 55%, transparent 78%);border-color:${elemColor}4d;` : ""}`;
  return `<a class="vs-card" href="aniimo.html?slug=${encodeURIComponent(c.slug)}" style="${cardStyle}">
    <span class="pw-card-img" style="${elemColor ? `border-color:${elemColor}` : ""}"><img src="${esc(c.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body" style="position:relative;z-index:1">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(c.name)}">${esc(c.name)}</span></span>
      <span class="vs-card-weapon" ${elemColor ? `style="color:${elemColor}"` : ""}>${esc(c.elements.join(" / "))} · ${esc(c.role)}</span>
      <span class="pw-card-chips">
        <span class="ev-chip">No.${esc(c.number)}</span>
        <span class="ev-chip">${esc(c.stage)}</span>
        ${c.baseStats.total != null ? `<span class="ev-chip" style="background:rgba(52,211,153,.18);color:#34d399">${esc(c.baseStats.total)} Total</span>` : ""}
      </span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.creatures.filter((c) =>
    (!fElement || c.elements.includes(fElement)) &&
    (!fRole || c.role === fRole) &&
    (!fStage || c.stage === fStage));
  if (query) list = list.filter((c) => c.name.toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "total") list = [...list].sort((a, b) => (b.baseStats.total || 0) - (a.baseStats.total || 0));
  // "number" sort order already comes pre-sorted from the data file

  els.progress.innerHTML = `<b>${list.length}</b> of ${DATA.count} Aniimo`;
  els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No Aniimo match.</p>`;
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/aniimo/creatures.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("an-updated").textContent = `${DATA.count} Aniimo · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load Aniimo data.</p>`;
  }
})();
