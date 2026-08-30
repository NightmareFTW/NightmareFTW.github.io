/* Farever — Weapons Guide.
   Simple filterable reference: every weapon type + which classes suit it.
   Data: data/farever/weapons.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Simple hand-drawn line icons per weapon type — Farever has no stable public
// icon source yet, so these are generic glyphs rather than scraped game art.
const S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">';
const WEAPON_ICON = {
  Sword: S + '<path d="M6 18 18 6"/><path d="M9 15 6 18"/><path d="M15 6l3 3"/></svg>',
  Axe: S + '<path d="M12 20V4"/><path d="M12 6c3-2.5 7-1.5 7 1.5S15.5 11 12 9"/></svg>',
  Mace: S + '<path d="M12 20v-9"/><circle cx="12" cy="7" r="3.2"/><path d="M9.4 4.8 8.2 3.6M14.6 4.8l1.2-1.2M9.4 9.2 8.2 10.4M14.6 9.2l1.2 1.2"/></svg>',
  Spear: S + '<path d="M5 19 16 8"/><path d="M16 8l3.2-1.2L18 10z" fill="currentColor" stroke="none"/></svg>',
  Shield: S + '<path d="M12 3 5.5 6v5c0 5 3 8 6.5 10 3.5-2 6.5-5 6.5-10V6z"/></svg>',
  Daggers: S + '<path d="M6 17 14 9"/><path d="M18 6l-2 2M8 15l-2 2"/><path d="M9 6 17 14"/></svg>',
  Bow: S + '<path d="M7.5 4c-3 3.5-3 12.5 0 16"/><path d="M7.5 4v16"/><path d="M7.5 12H18"/><path d="M15.5 9.2l2.5 2.8-2.5 2.8"/></svg>',
  Fists: S + '<circle cx="9" cy="12" r="1.3"/><circle cx="12.5" cy="10" r="1.3"/><circle cx="16" cy="12" r="1.3"/><path d="M7 14c0 3 2.2 5 6 5s6-2 6-5"/></svg>',
  Thrown: S + '<path d="M12 4l1.8 5.6L19.5 12l-5.7 2.4L12 20l-1.8-5.6L4.5 12l5.7-2.4z"/></svg>',
  Staff: S + '<path d="M12 21V10"/><circle cx="12" cy="6" r="3"/></svg>',
  Book: S + '<path d="M12 6.5c-2-1.4-5-1.8-8-.8v13c3-1 6-.6 8 .8 2-1.4 5-1.8 8-.8v-13c-3-1-6-.6-8 .8z"/><path d="M12 6.5v13"/></svg>',
  Halos: S + '<ellipse cx="12" cy="7.5" rx="6" ry="2.2"/><path d="M12 9.7V20"/></svg>',
  Scepter: S + '<path d="M12 21V11"/><path d="M12 4l3 3-3 3-3-3z"/></svg>',
  Crescent: S + '<path d="M15 4a8 8 0 1 0 0 16 6.4 6.4 0 0 1 0-16z"/></svg>',
  "Capture Net": S + '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7"/></svg>',
};

let DATA = null, query = "", classFilter = "";
const grid = document.getElementById("fv-grid");
const empty = document.getElementById("fv-empty");

function card(w) {
  const chips = w.classes.length
    ? w.classes.map((c) => `<span class="ev-chip">${esc(c)}</span>`).join(" ")
    : `<span class="ev-chip">Any class</span>`;
  return `<div class="dr-card">
    <div class="dr-head"><span class="dr-head-ico"><span class="cb-weapon-ico">${WEAPON_ICON[w.name] || ""}</span><span class="dr-name">${esc(w.name)}</span></span></div>
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
