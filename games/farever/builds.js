/* Farever — Class Builds.
   3 weapon-based build ideas per class (Warrior, Rogue, Mage, Priest).
   Reuses the shared .cb-* build shell (see games/elden-ring/builds.js for
   the original); re-themed for Farever in CSS. No item icons/numeric stats
   here — Farever doesn't have a stable public API for those yet, so builds
   are described by weapon + role instead. Data: data/farever/builds.json. */

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

const DIFF_LABEL = { beginnerfriendly: "Beginner Friendly", medium: "Medium", hard: "Hard" };

let DATA = null, filter = "all", open = new Set();
const root = document.getElementById("fv-root");

function weaponCard(w) {
  return `<div class="cb-weapon">
    <span class="cb-weapon-ico">${WEAPON_ICON[w.name] || ""}</span>
    <span class="cb-weapon-body">
      ${w.role ? `<span class="cb-weapon-role">${esc(w.role)}</span>` : ""}
      <span class="cb-weapon-name">${esc(w.name)}</span>
      ${w.why ? `<span class="cb-weapon-why">${esc(w.why)}</span>` : ""}
    </span>
  </div>`;
}

function buildCard(b) {
  const isOpen = open.has(b.id);
  return `<article class="cb-build" data-id="${b.id}">
    <button class="cb-build-head" aria-expanded="${isOpen}">
      <div class="cb-build-title">
        <span class="cb-build-tags">
          <span class="role-chip role-${esc(b.class)}">${esc(b.class)}</span>
          <span class="cb-arch">${esc(b.role)}</span>
          <span class="cb-diff cb-diff-${esc(b.difficulty)}">${esc(DIFF_LABEL[b.difficulty] || b.difficulty)}</span>
        </span>
        <span class="cb-name">${esc(b.name)}</span>
      </div>
      <span class="cb-caret">▾</span>
    </button>
    <p class="cb-summary">${esc(b.summary)}</p>
    <div class="cb-detail" ${isOpen ? "" : "hidden"}>
      <div class="cb-sec"><h4 class="cb-sec-h">Weapons</h4>
        <div class="cb-weapon-grid">${(b.weapons || []).map(weaponCard).join("")}</div></div>
      <div class="cb-sec"><h4 class="cb-sec-h">How to play it</h4>
        <ol class="cb-play">${(b.howto || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ol></div>
      <div class="cb-procon">
        <div class="cb-pros"><span class="cb-pc-h">Pros</span><ul>${(b.pros || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
        <div class="cb-cons"><span class="cb-pc-h">Cons</span><ul>${(b.cons || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      </div>
    </div>
  </article>`;
}

function render() {
  let list = DATA.builds;
  if (filter !== "all") list = list.filter((b) => b.class === filter);
  root.innerHTML = list.map(buildCard).join("") || `<p class="no-results">No builds match.</p>`;
  root.querySelectorAll(".cb-build-head").forEach((head) => {
    head.addEventListener("click", () => {
      const card = head.closest(".cb-build"), id = card.dataset.id, willOpen = !open.has(id);
      if (willOpen) open.add(id); else open.delete(id);
      card.classList.toggle("open", willOpen);
      head.setAttribute("aria-expanded", String(willOpen));
      const d = card.querySelector(".cb-detail");
      if (willOpen) d.removeAttribute("hidden"); else d.setAttribute("hidden", "");
    });
  });
}

function buildFilters() {
  const el = document.getElementById("fv-filters");
  const classes = [...new Set(DATA.builds.map((b) => b.class))];
  const chips = [["all", "All classes"]].concat(classes.map((c) => [c, c]));
  el.innerHTML = chips.map(([k, label]) => `<button class="cb-fchip ${k === filter ? "on" : ""}" data-k="${k}">${esc(label)}</button>`).join("");
  el.querySelectorAll(".cb-fchip").forEach((b) => b.addEventListener("click", () => {
    filter = b.dataset.k;
    el.querySelectorAll(".cb-fchip").forEach((x) => x.classList.toggle("on", x === b));
    render();
  }));
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/farever/builds.json?cb=${Date.now()}`)).json();
    document.getElementById("fv-version").textContent = `${DATA.builds.length} builds across ${new Set(DATA.builds.map((b) => b.class)).size} classes`;
    document.getElementById("fv-note").textContent = DATA.note || "";
    buildFilters();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load build data.</p>`;
  }
})();
