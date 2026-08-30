/* Farever — Weapons Guide.
   Simple filterable reference: every weapon type + which classes suit it.
   Data: data/farever/weapons.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let DATA = null, query = "", classFilter = "";
const grid = document.getElementById("fv-grid");
const empty = document.getElementById("fv-empty");

function card(w) {
  const chips = w.classes.length
    ? w.classes.map((c) => `<span class="ev-chip">${esc(c)}</span>`).join(" ")
    : `<span class="ev-chip">Any class</span>`;
  return `<div class="dr-card">
    <div class="dr-head"><span class="dr-name">${esc(w.name)}</span></div>
    <div>${chips}</div>
    <p class="dr-tell">${esc(w.tell)}</p>
  </div>`;
}

function render() {
  let list = DATA.weapons;
  if (classFilter) list = list.filter((w) => w.classes.includes(classFilter));
  if (query) list = list.filter((w) => w.name.toLowerCase().includes(query) || w.tell.toLowerCase().includes(query));
  grid.innerHTML = list.map(card).join("");
  empty.style.display = list.length ? "none" : "block";
}

function buildFilters() {
  const el = document.getElementById("fv-filters");
  const classes = [...new Set(DATA.weapons.flatMap((w) => w.classes))].sort();
  el.innerHTML = [["", "All classes"]].concat(classes.map((c) => [c, c])).map(([k, label]) =>
    `<button class="filter-btn ${k === classFilter ? "active" : ""}" data-k="${esc(k)}">${esc(label)}</button>`).join("");
  el.querySelectorAll(".filter-btn").forEach((b) => b.addEventListener("click", () => {
    classFilter = b.dataset.k;
    el.querySelectorAll(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
    render();
  }));
}

document.getElementById("fv-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/farever/weapons.json?cb=${Date.now()}`)).json();
    document.getElementById("fv-updated").textContent = `${DATA.weapons.length} weapon types`;
    buildFilters();
    render();
  } catch (e) {
    grid.innerHTML = `<p class="tool-note">Couldn't load weapon data.</p>`;
  }
})();
