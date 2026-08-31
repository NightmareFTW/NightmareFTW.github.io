/* Farever — Weapons Guide.
   Simple filterable reference: every weapon type + which classes suit it.
   Data: data/farever/weapons.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Per-weapon-type icons cropped from FareverDB's own extracted game-icon
// atlases (each weapon type's basic-attack icon, data v0.2.0) — real in-game
// art rather than placeholders. "Capture Net" has no dedicated weapon-icon
// atlas in the extracted data yet, so it keeps a hand-drawn glyph.
const IMG_ICON = (file) => `<img src="../../assets/img/farever/weapons/${file}" alt="" loading="lazy">`;
const S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">';
const WEAPON_ICON = {
  Sword: IMG_ICON("sword.png"),
  Axe: IMG_ICON("axe.png"),
  Mace: IMG_ICON("mace.png"),
  Spear: IMG_ICON("spear.png"),
  Shield: IMG_ICON("shield.png"),
  Daggers: IMG_ICON("daggers.png"),
  Bow: IMG_ICON("bow.png"),
  Fists: IMG_ICON("fists.png"),
  Thrown: IMG_ICON("thrown.png"),
  Staff: IMG_ICON("staff.png"),
  Book: IMG_ICON("book.png"),
  Halos: IMG_ICON("halos.png"),
  Scepter: IMG_ICON("scepter.png"),
  Crescent: IMG_ICON("crescent.png"),
  "Capture Net": S + '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7"/></svg>',
};
const HAS_IMG = new Set(["Sword", "Axe", "Mace", "Spear", "Shield", "Daggers", "Bow", "Fists", "Thrown", "Staff", "Book", "Halos", "Scepter", "Crescent"]);

let DATA = null, query = "", classFilter = "";
const grid = document.getElementById("fv-grid");
const empty = document.getElementById("fv-empty");

function card(w) {
  const chips = w.classes.length
    ? w.classes.map((c) => `<span class="ev-chip">${esc(c)}</span>`).join(" ")
    : `<span class="ev-chip">Any class</span>`;
  return `<div class="dr-card">
    <div class="dr-head"><span class="dr-head-ico"><span class="cb-weapon-ico${HAS_IMG.has(w.name) ? " has-img" : ""}">${WEAPON_ICON[w.name] || ""}</span><span class="dr-name">${esc(w.name)}</span></span></div>
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
