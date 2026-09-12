/* Epic Seven — Heroes Database.
   Every hero, filterable/sortable by grade, element and class — not
   spoiler-sensitive, so nothing is hidden by default. A card links to
   hero.html for the full rating, stats, skills, awakening and recommended
   artifacts.
   Data: data/epic7/heroes.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let DATA = null, query = "", fGrade = "", fElement = "", fClass = "", sortBy = "grade";

const els = {
  controls: document.getElementById("eh-controls"),
  list: document.getElementById("eh-list"),
  progress: document.getElementById("eh-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search heroes…" autocomplete="off" value="${esc(query)}">
    <select id="f-grade" class="sort-select">${opt("", "All grades", fGrade)}${DATA.grades.map((g) => opt(g, `${g}★`, fGrade)).join("")}</select>
    <select id="f-element" class="sort-select">${opt("", "All elements", fElement)}${DATA.elements.map((e) => opt(e, e, fElement)).join("")}</select>
    <select id="f-class" class="sort-select">${opt("", "All classes", fClass)}${DATA.classes.map((c) => opt(c, c, fClass)).join("")}</select>
    <select id="f-sort" class="sort-select">${opt("grade", "Sort: Grade", sortBy)}${opt("name", "Sort: Name", sortBy)}${opt("rating", "Sort: Rating", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-grade").addEventListener("change", (e) => { fGrade = e.target.value; render(); });
  document.getElementById("f-element").addEventListener("change", (e) => { fElement = e.target.value; render(); });
  document.getElementById("f-class").addEventListener("change", (e) => { fClass = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
}

function ratingNum(h) { return parseFloat(h.rating) || 0; }

function card(h) {
  return `<a class="vs-card" href="hero.html?slug=${encodeURIComponent(h.slug)}">
    <span class="pw-card-img"><img src="${esc(h.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(h.name)}">${esc(h.name)}</span></span>
      <span class="vs-card-weapon">${esc(h.class)} · ${esc(h.element)}</span>
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(h.grade)}★</span>
        ${h.rating ? `<span class="ev-chip confirmed">${esc(h.rating)}</span>` : ""}
      </span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.heroes.filter((h) => (!fGrade || String(h.grade) === fGrade) && (!fElement || h.element === fElement) && (!fClass || h.class === fClass));
  if (query) list = list.filter((h) => h.name.toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "rating") list = [...list].sort((a, b) => ratingNum(b) - ratingNum(a));
  // "grade" sort order already comes pre-sorted from the data file

  els.progress.innerHTML = `<b>${list.length}</b> of ${DATA.count} heroes`;

  if (sortBy === "grade" && !query) {
    const byGrade = {};
    list.forEach((h) => (byGrade[h.grade] = byGrade[h.grade] || []).push(h));
    els.list.innerHTML = DATA.grades.filter((g) => byGrade[g] && byGrade[g].length).map((g) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(g)}★ Heroes</h3><span class="ms-sec-count">${byGrade[g].length}</span></div>
        <div class="vs-grid">${byGrade[g].map(card).join("")}</div>
      </section>`).join("") || `<p class="no-results">No heroes match.</p>`;
  } else {
    els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No heroes match.</p>`;
  }
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/epic7/heroes.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("eh-updated").textContent = `${DATA.count} heroes · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load hero data.</p>`;
  }
})();
