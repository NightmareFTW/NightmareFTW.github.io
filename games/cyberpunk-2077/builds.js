/* Cyberpunk 2077 — Meta Builds.
   Detailed, hand-written meta builds for the current patch, presented with the
   in-game UI in mind so a build is impossible to misread:
   - attribute spread as a gauge panel,
   - perks laid out as a circuit-style skill tree (per attribute branch),
   - cyberware as the in-game body diagram (slots arranged around the body,
     empty slots shown like the game),
   - weapons as inventory slots.
   Data: data/cyberpunk-2077/builds.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Attribute meta: key + label + colour (used for bars and perk branches).
const ATTRS = [
  ["body", "Body", "#ff5b5b"],
  ["reflexes", "Reflexes", "#ff9f43"],
  ["technical", "Technical", "#25d0c0"],
  ["intelligence", "Intelligence", "#6aa8ff"],
  ["cool", "Cool", "#fcd34d"],
];
const colorForTree = (name) => {
  const n = (name || "").toLowerCase();
  const hit = ATTRS.find(([, label]) => n.includes(label.toLowerCase()));
  return hit ? hit[2] : "#caa90a";
};

// In-game cyberware slot layout — left flank / right flank around the body.
const SLOT_LAYOUT = {
  left: ["Frontal Cortex", "Arms", "Skeleton", "Nervous System", "Integumentary System"],
  right: ["Operating System", "Face", "Hands", "Circulatory System", "Legs"],
};

// ---- Inline SVG icons ----------------------------------------------------
const I = {
  longarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9h18l-1 3h-4l-1 2H8l-1-2H4z"/><path d="M9 12v3M6 14h5"/></svg>',
  shortarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h12v4h-3l-1 2H8z"/><path d="M8 12v4h4"/></svg>',
  blade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4 9 15"/><path d="M9 15l-1 4-2-2 3-1"/><path d="M6 17l-2 2"/><path d="M16 4h4v4"/></svg>',
  cyberarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10V6a2 2 0 0 0-4 0v6"/><path d="M10 12V9a2 2 0 0 0-4 0v5a6 6 0 0 0 6 6h1a5 5 0 0 0 5-5v-3a2 2 0 0 0-4 0"/></svg>',
  monowire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6c6 0 6 12 12 12s3-9 6-9"/><circle cx="3" cy="6" r="1.4" fill="currentColor"/></svg>',
  chip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3"/></svg>',
  perk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z"/></svg>',
};
const WEAPON_ICON = (type) => {
  if (type === "blade") return I.blade;
  if (type === "cyberarm") return I.cyberarm;
  if (type === "monowire") return I.monowire;
  if (type === "handgun" || type === "revolver") return I.shortarm;
  return I.longarm; // smg, rifle, shotgun, lmg, sniper, smart
};

// Translucent in-game-style body silhouette for the cyberware diagram.
const BODY_SVG = `<svg class="cb-body-svg" viewBox="0 0 120 300" aria-hidden="true">
  <defs><linearGradient id="cbBody" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ff6a5e" stop-opacity="0.30"/>
    <stop offset="1" stop-color="#25d0c0" stop-opacity="0.28"/></linearGradient></defs>
  <g fill="url(#cbBody)" stroke="rgba(255,255,255,0.28)" stroke-width="1">
    <circle cx="60" cy="26" r="16"/>
    <path d="M52 42h16l4 10 18 10v34l-12-4-2 40-6 60h-10l-4-46-4 46H32l-6-60-2-40-12 4V62l18-10z"/>
  </g>
  <g stroke="rgba(37,208,192,0.5)" stroke-width="0.8" fill="none" opacity="0.7">
    <path d="M60 58v150"/><path d="M40 80h40"/></g>
</svg>`;

const primaryAttr = (b) => ATTRS.map(([k]) => k).reduce((a, k) => b.attributes[k] > b.attributes[a] ? k : a, "body");

let DATA = null, filter = "all", open = new Set();
const root = document.getElementById("cb-root");

// ---- attribute gauge panel ----
function attrBars(b, max) {
  const prim = primaryAttr(b);
  return `<div class="cb-attrs">${ATTRS.map(([k, label, col]) => {
    const v = b.attributes[k] || 3;
    const pct = Math.round((v / max) * 100);
    const isP = k === prim;
    return `<div class="cb-attr ${isP ? "is-primary" : ""}">
      <span class="cb-attr-name">${label}${isP ? ' <span class="cb-prim">★</span>' : ""}</span>
      <span class="cb-attr-track"><span class="cb-attr-fill" style="width:${pct}%;background:${col}"></span></span>
      <span class="cb-attr-val" style="color:${col}">${v}</span>
    </div>`;
  }).join("")}</div>`;
}

// ---- perk skill-tree (circuit branches) ----
function perkTree(b) {
  const branches = (b.perks || []).map((p) => {
    const col = colorForTree(p.tree);
    const nodes = p.picks.map((raw) => {
      const [name, ...rest] = String(raw).split(" — ");
      const desc = rest.join(" — ");
      return `<div class="cb-pnode">
        <span class="cb-pnode-chip" style="color:${col};border-color:${col}">${I.perk}</span>
        <span class="cb-pnode-body"><span class="cb-pnode-name">${esc(name)}</span>${desc ? `<span class="cb-pnode-desc">${esc(desc)}</span>` : ""}</span>
      </div>`;
    }).join("");
    return `<div class="cb-branch">
      <span class="cb-branch-head" style="color:${col};border-color:${col}">${esc(p.tree)}</span>
      <div class="cb-branch-nodes" style="--trace:${col}">${nodes}</div>
    </div>`;
  }).join("");
  return `<div class="cb-tree">${branches}</div>`;
}

// ---- cyberware body diagram ----
function slotBox(slot, cw) {
  const c = cw[slot];
  if (!c) return `<div class="cb-slotbox is-empty"><span class="cb-slot-label">${esc(slot)}</span><span class="cb-slot-empty">+</span></div>`;
  return `<div class="cb-slotbox"><span class="cb-slot-label">${esc(slot)}</span>
    <span class="cb-slot-item">${esc(c.item)}</span>
    <span class="cb-slot-why">${esc(c.why)}</span></div>`;
}
function cyberDiagram(b) {
  const cw = {};
  (b.cyberware || []).forEach((c) => { cw[c.slot] = c; });
  const col = (slots, side) => `<div class="cb-body-col cb-side-${side}">${slots.map((s) => slotBox(s, cw)).join("")}</div>`;
  return `<div class="cb-body-map">
    ${col(SLOT_LAYOUT.left, "left")}
    <div class="cb-body-fig"><span class="cb-body-arm-l">ARMOR</span>${BODY_SVG}<span class="cb-body-arm-r">HEALTH</span></div>
    ${col(SLOT_LAYOUT.right, "right")}
  </div>`;
}

function section(title, inner) {
  return `<div class="cb-sec"><h4 class="cb-sec-h">${title}</h4>${inner}</div>`;
}

function buildCard(b, max) {
  const isOpen = open.has(b.id);
  const tags = (b.tags || []).map((t) => `<span class="cb-tag">${esc(t)}</span>`).join("");
  const weapons = (b.weapons || []).map((w) => `
    <div class="cb-weapon">
      <span class="cb-weapon-ico" title="${esc(w.type)}">${WEAPON_ICON(w.type)}</span>
      <div class="cb-weapon-body">
        <span class="cb-weapon-name">${esc(w.name)} <span class="cb-weapon-role">${esc(w.role)}</span></span>
        <span class="cb-weapon-why">${esc(w.why)}</span>
      </div>
    </div>`).join("");
  const playstyle = `<ol class="cb-play">${(b.playstyle || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ol>`;
  const proCon = `<div class="cb-procon">
      <div class="cb-pros"><span class="cb-pc-h">Pros</span><ul>${(b.pros || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      <div class="cb-cons"><span class="cb-pc-h">Cons</span><ul>${(b.cons || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
    </div>`;
  const diff = (b.difficulty || "").split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");

  return `<article class="cb-build ${isOpen ? "open" : ""}" data-id="${b.id}">
    <button class="cb-build-head" aria-expanded="${isOpen}">
      <div class="cb-build-title">
        <span class="cb-os">${esc(b.os || b.archetype)}</span>
        <span class="cb-name">${esc(b.name)}</span>
        <span class="cb-build-tags"><span class="cb-arch">${esc(b.archetype)}</span><span class="cb-diff cb-diff-${diff}">${esc(b.difficulty)}</span></span>
      </div>
      <span class="cb-caret">▾</span>
    </button>
    <p class="cb-summary">${esc(b.summary)}</p>
    ${attrBars(b, max)}
    <p class="cb-tags-row">${tags}</p>
    <div class="cb-detail" ${isOpen ? "" : "hidden"}>
      <p class="cb-attrnote">${esc(b.attrNote)}</p>
      ${section("Skill tree — key perks", perkTree(b))}
      ${section("Cyberware loadout", cyberDiagram(b))}
      ${section("Weapons", `<div class="cb-weapon-grid">${weapons}</div>`)}
      ${section("How to play it", playstyle)}
      ${section("Leveling order", `<p class="cb-level">${esc(b.leveling)}</p>`)}
      ${proCon}
    </div>
  </article>`;
}

function render() {
  const max = DATA.attrMax || 20;
  let list = DATA.builds;
  if (filter !== "all") list = list.filter((b) => primaryAttr(b) === filter);
  root.innerHTML = list.map((b) => buildCard(b, max)).join("") || `<p class="no-results">No builds match.</p>`;
  root.querySelectorAll(".cb-build-head").forEach((head) => {
    head.addEventListener("click", () => {
      const card = head.closest(".cb-build");
      const id = card.dataset.id;
      const willOpen = !open.has(id);
      if (willOpen) open.add(id); else open.delete(id);
      card.classList.toggle("open", willOpen);
      head.setAttribute("aria-expanded", String(willOpen));
      const detail = card.querySelector(".cb-detail");
      if (willOpen) detail.removeAttribute("hidden"); else detail.setAttribute("hidden", "");
    });
  });
}

function buildFilters() {
  const el = document.getElementById("cb-filters");
  const used = new Set(DATA.builds.map(primaryAttr));
  const chips = [["all", "All builds"]].concat(ATTRS.filter(([k]) => used.has(k)).map(([k, label]) => [k, label]));
  el.innerHTML = chips.map(([k, label]) =>
    `<button class="cb-fchip ${k === filter ? "on" : ""}" data-k="${k}">${esc(label)}</button>`).join("");
  el.querySelectorAll(".cb-fchip").forEach((b) => b.addEventListener("click", () => {
    filter = b.dataset.k;
    el.querySelectorAll(".cb-fchip").forEach((x) => x.classList.toggle("on", x === b));
    render();
  }));
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/cyberpunk-2077/builds.json?cb=${Date.now()}`)).json();
    document.getElementById("cb-version").textContent = `${DATA.builds.length} meta builds · ${DATA.version}`;
    document.getElementById("cb-note").textContent = DATA.note || "";
    if (DATA.builds[0]) open.add(DATA.builds[0].id);
    buildFilters();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load build data.</p>`;
  }
})();
