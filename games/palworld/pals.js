/* Palworld — Pal Database.
   Searchable/filterable grid of every Pal; each card links to pal.html?slug=…
   for the full page (stats, drops, skills, recommended builds).
   Data: data/palworld/pals.json (scripts/update-palworld.js, wikily.gg). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const WORK_LABEL = {
  EmitFlame: "Kindling", Watering: "Watering", Seeding: "Planting", GenerateElectricity: "Electricity",
  Handcraft: "Handiwork", Collection: "Gathering", Deforest: "Lumbering", Mining: "Mining",
  OilExtraction: "Oil Extraction", ProductMedicine: "Medicine", Cool: "Cooling", Transport: "Transporting", MonsterFarm: "Farming",
};
const ELEMENT_CLASS = (e) => `pw-el pw-el-${e.toLowerCase()}`;

let DATA = null, query = "", fElement = "", fWork = "", bossOnly = false;
const els = {
  controls: document.getElementById("pw-controls"),
  grid: document.getElementById("pw-grid"),
  count: document.getElementById("pw-count"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  const elements = [...new Set(DATA.pals.flatMap((p) => p.elements))].sort();
  const works = Object.keys(WORK_LABEL);
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search Pal…" autocomplete="off" value="${esc(query)}">
    <select id="f-element" class="sort-select">${opt("", "All elements", fElement)}${elements.map((e) => opt(e, e, fElement)).join("")}</select>
    <select id="f-work" class="sort-select">${opt("", "Any work suitability", fWork)}${works.map((w) => opt(w, WORK_LABEL[w], fWork)).join("")}</select>
    <label class="pw-boss-toggle"><input type="checkbox" id="f-boss" ${bossOnly ? "checked" : ""}> Bosses only</label>`;
  const on = (id, ev, fn) => document.getElementById(id).addEventListener(ev, fn);
  on("f-search", "input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  on("f-element", "change", (e) => { fElement = e.target.value; render(); });
  on("f-work", "change", (e) => { fWork = e.target.value; render(); });
  on("f-boss", "change", (e) => { bossOnly = e.target.checked; render(); });
}

function card(p) {
  const workBadges = Object.entries(p.work || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([k, v]) => `<span class="ev-chip" title="${esc(WORK_LABEL[k] || k)}">${esc(WORK_LABEL[k] || k)} ${v}</span>`).join("");
  return `<a class="pw-card${p.isBoss ? " pw-is-boss" : ""}" href="pal.html?slug=${encodeURIComponent(p.slug)}">
    <span class="pw-card-img"><img src="${esc(p.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name">${esc(p.name)}</span><span class="pw-dex">#${esc(p.dex)}</span></span>
      <span class="pw-card-chips">${(p.elements || []).map((e) => `<span class="${ELEMENT_CLASS(e)}">${esc(e)}</span>`).join("")}${p.isBoss ? '<span class="ev-chip confirmed">Boss</span>' : ""}</span>
      <span class="pw-card-work">${workBadges}</span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.pals.filter((p) =>
    (!query || p.name.toLowerCase().includes(query)) &&
    (!fElement || p.elements.includes(fElement)) &&
    (!fWork || (p.work || {})[fWork] > 0) &&
    (!bossOnly || p.isBoss));
  els.count.textContent = `${list.length} of ${DATA.count} Pals`;
  els.grid.innerHTML = list.map(card).join("") || `<p class="no-results">No Pals match.</p>`;
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/palworld/pals.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("pw-updated").textContent = `${DATA.count} Pals · updated ${upd} · source: wikily.gg`;
    buildControls();
    render();
  } catch (e) {
    els.grid.innerHTML = `<p class="tool-note">Couldn't load the Pal database.</p>`;
  }
})();
