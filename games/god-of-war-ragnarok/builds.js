/* God of War Ragnarök — Meta Builds.
   Top armor sets and loadouts, presented like the in-game gear screen:
   - the 6 stats as gauges,
   - armor pieces + weapon/runic/shield/relic loadout arranged around a Kratos
     figure (the gear menu),
   - the defining set perk, key skills, how to play it, how to get it, pros/cons.
   Reuses the shared .cb-* build components; theming is overridden for GoW in CSS.
   Data: data/god-of-war-ragnarok/builds.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// GoW's six stats + colour for the gauges / skill branches.
const STATS = [
  ["strength", "Strength", "#ff5b5b"],
  ["runic", "Runic", "#6aa8ff"],
  ["defense", "Defense", "#9fb3c8"],
  ["vitality", "Vitality", "#6fcf8a"],
  ["cooldown", "Cooldown", "#c98cff"],
  ["luck", "Luck", "#fcd34d"],
];
const STAT_COL = (k) => (STATS.find(([key]) => key === k) || [])[2] || "#cdaa53";

const I = {
  perk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z"/></svg>',
};

// Stylised Kratos figure for the gear diagram.
const BODY_SVG = `<svg class="cb-body-svg" viewBox="0 0 120 300" aria-hidden="true">
  <defs><linearGradient id="gwBody" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#cdaa53" stop-opacity="0.30"/>
    <stop offset="1" stop-color="#3b6fb5" stop-opacity="0.30"/></linearGradient></defs>
  <g fill="url(#gwBody)" stroke="rgba(255,255,255,0.28)" stroke-width="1">
    <circle cx="60" cy="24" r="15"/>
    <path d="M44 40h32l6 14 14 8v30l-12-5-3 22h-6l-2 30-5 56h-9l-4-50-4 50h-9l-5-56-2-30h-6l-3-22-12 5V62l14-8z"/>
  </g>
  <g stroke="rgba(205,170,83,0.5)" stroke-width="0.9" fill="none" opacity="0.8">
    <path d="M40 58 L60 70 L80 58"/><path d="M60 70v150"/></g>
</svg>`;

const primaryStat = (b) => STATS.map(([k]) => k).reduce((a, k) => (b.stats[k] || 0) > (b.stats[a] || 0) ? k : a, "strength");

let DATA = null, filter = "all", open = new Set();
const root = document.getElementById("cb-root");

function statBars(b, max) {
  const prim = primaryStat(b);
  return `<div class="cb-attrs">${STATS.map(([k, label, col]) => {
    const v = b.stats[k] || 0;
    const pct = Math.max(4, Math.round((v / max) * 100));
    const isP = k === prim;
    return `<div class="cb-attr ${isP ? "is-primary" : ""}">
      <span class="cb-attr-name">${label}${isP ? ' <span class="cb-prim">★</span>' : ""}</span>
      <span class="cb-attr-track"><span class="cb-attr-fill" style="width:${pct}%;background:${col}"></span></span>
      <span class="cb-attr-val" style="color:${col}">${v}</span>
    </div>`;
  }).join("")}</div>`;
}

function skillTree(b) {
  const branches = (b.skills || []).map((p) => {
    const col = STAT_COL(/blade/i.test(p.tree) ? "strength" : /spear/i.test(p.tree) ? "luck" : /shield/i.test(p.tree) ? "defense" : "runic");
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

function slotBox(label, item, why) {
  if (!item) return `<div class="cb-slotbox is-empty"><span class="cb-slot-label">${esc(label)}</span><span class="cb-slot-empty">+</span></div>`;
  return `<div class="cb-slotbox"><span class="cb-slot-label">${esc(label)}</span>
    <span class="cb-slot-item">${esc(item)}</span>
    ${why ? `<span class="cb-slot-why">${esc(why)}</span>` : ""}</div>`;
}
function gearDiagram(b) {
  const left = (b.armor || []).map((a) => slotBox(a.slot, a.piece, a.perk)).join("");
  const right = (b.loadout || []).map((l) => slotBox(l.slot, l.name, l.why)).join("");
  const fig = b.armorImg
    ? `<img class="gw-kratos" src="${esc(b.armorImg)}" alt="Kratos wearing ${esc(b.name)}" loading="lazy" onerror="this.style.display='none'">`
    : BODY_SVG;
  return `<div class="cb-body-map">
    <div class="cb-body-col cb-side-left">${left}</div>
    <div class="cb-body-fig"><span class="cb-body-arm-l">ARMOR</span>${fig}<span class="cb-body-arm-r">LOADOUT</span></div>
    <div class="cb-body-col cb-side-right">${right}</div>
  </div>`;
}

function section(title, inner) {
  return `<div class="cb-sec"><h4 class="cb-sec-h">${title}</h4>${inner}</div>`;
}

function buildCard(b, max) {
  const isOpen = open.has(b.id);
  const tags = (b.tags || []).map((t) => `<span class="cb-tag">${esc(t)}</span>`).join("");
  const playstyle = `<ol class="cb-play">${(b.playstyle || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ol>`;
  const proCon = `<div class="cb-procon">
      <div class="cb-pros"><span class="cb-pc-h">Pros</span><ul>${(b.pros || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      <div class="cb-cons"><span class="cb-pc-h">Cons</span><ul>${(b.cons || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
    </div>`;
  const diff = (b.difficulty || "").split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");

  return `<article class="cb-build ${isOpen ? "open" : ""}" data-id="${b.id}">
    <button class="cb-build-head" aria-expanded="${isOpen}">
      <div class="cb-build-title">
        <span class="cb-os">${esc(b.archetype)}</span>
        <span class="cb-name">${esc(b.name)}</span>
        <span class="cb-build-tags"><span class="cb-diff cb-diff-${diff}">${esc(b.difficulty)}</span></span>
      </div>
      <span class="cb-caret">▾</span>
    </button>
    <p class="cb-summary">${esc(b.summary)}</p>
    ${statBars(b, max)}
    <p class="cb-tags-row">${tags}</p>
    <div class="cb-detail" ${isOpen ? "" : "hidden"}>
      <p class="cb-attrnote">${esc(b.statNote)}</p>
      ${section("Gear screen — armor & loadout", gearDiagram(b))}
      <div class="cb-setperk"><span class="cb-setperk-h">Set perk</span>${esc(b.setPerk)}</div>
      ${section("Key skills to prioritise", skillTree(b))}
      ${section("How to play it", playstyle)}
      ${section("How to get it", `<p class="cb-level">${esc(b.obtain)}</p>`)}
      ${proCon}
    </div>
  </article>`;
}

function render() {
  const max = DATA.statMax || 150;
  let list = DATA.builds;
  if (filter !== "all") list = list.filter((b) => primaryStat(b) === filter);
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
  const used = new Set(DATA.builds.map(primaryStat));
  const chips = [["all", "All builds"]].concat(STATS.filter(([k]) => used.has(k)).map(([k, label]) => [k, label]));
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
    DATA = await (await fetch(`../../data/god-of-war-ragnarok/builds.json?cb=${Date.now()}`)).json();
    document.getElementById("cb-version").textContent = `${DATA.builds.length} meta builds · ${DATA.version}`;
    document.getElementById("cb-note").textContent = DATA.note || "";
    if (DATA.builds[0]) open.add(DATA.builds[0].id);
    buildFilters();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load build data.</p>`;
  }
})();
