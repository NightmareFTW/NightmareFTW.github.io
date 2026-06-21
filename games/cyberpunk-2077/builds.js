/* Cyberpunk 2077 — Meta Builds.
   Detailed, hand-written meta builds for the current patch. Each build shows a
   visual attribute distribution (the "skill points" spread), key perks,
   cyberware by slot, weapons (with type icons), playstyle, leveling order and
   pros/cons. Data: data/cyberpunk-2077/builds.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Attribute meta: label + colour (used for the distribution bars).
const ATTRS = [
  ["body", "Body", "#ff5b5b"],
  ["reflexes", "Reflexes", "#ff9f43"],
  ["technical", "Technical", "#25d0c0"],
  ["intelligence", "Intelligence", "#6aa8ff"],
  ["cool", "Cool", "#fcd34d"],
];

// ---- Inline SVG icons ----------------------------------------------------
const I = {
  longarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9h18l-1 3h-4l-1 2H8l-1-2H4z"/><path d="M9 12v3M6 14h5"/></svg>',
  shortarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h12v4h-3l-1 2H8z"/><path d="M8 12v4h4"/></svg>',
  blade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4 9 15"/><path d="M9 15l-1 4-2-2 3-1"/><path d="M6 17l-2 2"/><path d="M16 4h4v4"/></svg>',
  cyberarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10V6a2 2 0 0 0-4 0v6"/><path d="M10 12V9a2 2 0 0 0-4 0v5a6 6 0 0 0 6 6h1a5 5 0 0 0 5-5v-3a2 2 0 0 0-4 0"/></svg>',
  monowire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6c6 0 6 12 12 12s3-9 6-9"/><circle cx="3" cy="6" r="1.4" fill="currentColor"/></svg>',
  chip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3"/></svg>',
  perk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z"/></svg>',
};
const WEAPON_ICON = (type) => {
  if (type === "blade") return I.blade;
  if (type === "cyberarm") return I.cyberarm;
  if (type === "monowire") return I.monowire;
  if (type === "handgun" || type === "revolver") return I.shortarm;
  return I.longarm; // smg, rifle, shotgun, lmg, sniper, smart
};

// Which attribute is this build's primary (highest value)?
const primaryAttr = (b) => ATTRS.map(([k]) => k).reduce((a, k) => b.attributes[k] > b.attributes[a] ? k : a, "body");

let DATA = null, filter = "all", open = new Set();
const root = document.getElementById("cb-root");

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

function section(title, inner) {
  return `<div class="cb-sec"><h4 class="cb-sec-h">${title}</h4>${inner}</div>`;
}

function buildCard(b, max) {
  const isOpen = open.has(b.id);
  const tags = (b.tags || []).map((t) => `<span class="cb-tag">${esc(t)}</span>`).join("");
  const perks = (b.perks || []).map((p) => `
    <div class="cb-perktree">
      <span class="cb-perktree-h">${esc(p.tree)}</span>
      <ul class="cb-perklist">${p.picks.map((x) => `<li>${I.perk}<span>${esc(x)}</span></li>`).join("")}</ul>
    </div>`).join("");
  const cyber = (b.cyberware || []).map((c) => `
    <div class="cb-cyber">
      <span class="cb-cyber-ico">${I.chip}</span>
      <div class="cb-cyber-body">
        <span class="cb-slot">${esc(c.slot)}</span>
        <span class="cb-cyber-item">${esc(c.item)}</span>
        <span class="cb-cyber-why">${esc(c.why)}</span>
      </div>
    </div>`).join("");
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

  return `<article class="cb-build ${isOpen ? "open" : ""}" data-id="${b.id}">
    <button class="cb-build-head" aria-expanded="${isOpen}">
      <div class="cb-build-title">
        <span class="cb-os">${esc(b.os || b.archetype)}</span>
        <span class="cb-name">${esc(b.name)}</span>
        <span class="cb-build-tags"><span class="cb-arch">${esc(b.archetype)}</span><span class="cb-diff cb-diff-${(b.difficulty || "").split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")}">${esc(b.difficulty)}</span></span>
      </div>
      <span class="cb-caret">▾</span>
    </button>
    <p class="cb-summary">${esc(b.summary)}</p>
    ${attrBars(b, max)}
    <p class="cb-tags-row">${tags}</p>
    <div class="cb-detail" ${isOpen ? "" : "hidden"}>
      <p class="cb-attrnote">${esc(b.attrNote)}</p>
      ${section("Perks", perks)}
      ${section("Cyberware", `<div class="cb-cyber-grid">${cyber}</div>`)}
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
  // Only show attribute filters that some build actually uses as primary.
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
    if (DATA.builds[0]) open.add(DATA.builds[0].id); // first one expanded by default
    buildFilters();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load build data.</p>`;
  }
})();
