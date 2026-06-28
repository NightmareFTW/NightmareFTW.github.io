/* Far Far West — Maps & Collectibles.
   Renders data/far-far-west/maps.json (scraped from wikily.gg by
   scripts/update-ffw-maps.js). Each region's terrain image with its POIs plotted
   (x/y are 0-1000 normalised → percent), plus a category legend you can toggle.
   Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("fm-root");
const tabsEl = document.getElementById("fm-tabs");

// Friendly label + colour per POI kind; `on` = shown by default (bulk pickups off).
const CATS = {
  secret: { name: "Secrets", color: "#e8c84a", on: true },
  objective: { name: "Objectives", color: "#ff5a5a", on: true },
  disc: { name: "Music Discs", color: "#b482ff", on: true },
  npc: { name: "NPCs", color: "#5bc8e8", on: true },
  medallion: { name: "Medallions", color: "#e0913f", on: true },
  challenge: { name: "Challenges", color: "#ff8a3d", on: true },
  loot: { name: "Loot", color: "#5bd6a0", on: false },
  ore: { name: "Ore", color: "#9aa0a6", on: false },
  pickup: { name: "Pickups", color: "#6c8cff", on: false },
  grave: { name: "Graves", color: "#cfd3da", on: false },
  traversal: { name: "Traversal", color: "#8a8f98", on: false },
  spawn: { name: "Spawn", color: "#ffffff", on: false },
};
const catOf = (k) => CATS[k] || { name: k.charAt(0).toUpperCase() + k.slice(1), color: "#9aa0a6", on: false };

let DATA = null, region = 0;
let active = new Set(Object.keys(CATS).filter((k) => CATS[k].on));

function renderRegion() {
  const m = DATA.maps[region];
  // counts per kind in this region
  const counts = {};
  for (const p of m.pois) counts[p.kind] = (counts[p.kind] || 0) + 1;
  const kinds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  const dots = m.pois.filter((p) => active.has(p.kind)).map((p) => {
    const c = catOf(p.kind);
    return `<span class="fm-dot" style="left:${p.x / 10}%;top:${p.y / 10}%;--c:${c.color}" title="${esc(p.label || c.name)} · ${esc(c.name)}"></span>`;
  }).join("");

  const legend = kinds.map((k) => {
    const c = catOf(k);
    return `<button class="fm-cat${active.has(k) ? " on" : ""}" data-kind="${esc(k)}">
      <span class="fm-swatch" style="--c:${c.color}"></span>${esc(c.name)}<em>${counts[k]}</em>
    </button>`;
  }).join("");

  root.innerHTML = `<div class="fm-layout">
    <div class="fm-mapwrap">
      <img class="fm-terrain" src="${esc(m.terrain)}" alt="${esc(m.name)} map" referrerpolicy="no-referrer" onerror="this.style.display='none'">
      <div class="fm-markers">${dots}</div>
    </div>
    <div class="fm-legend">
      <span class="fm-legend-h">${esc(m.name)} · ${m.pois.length} POIs</span>
      ${legend}
      <button class="mini-btn fm-all" data-all="1">Toggle all</button>
    </div>
  </div>`;

  root.querySelectorAll("[data-kind]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.kind; active.has(k) ? active.delete(k) : active.add(k); renderRegion();
  }));
  root.querySelector("[data-all]").addEventListener("click", () => {
    if (active.size >= kinds.length) active = new Set(); else active = new Set(kinds);
    renderRegion();
  });
}

function renderTabs() {
  tabsEl.innerHTML = DATA.maps.map((m, i) =>
    `<button class="filter-btn${i === region ? " active" : ""}" data-i="${i}">${esc(m.name)}</button>`).join("");
  tabsEl.querySelectorAll("[data-i]").forEach((b) =>
    b.addEventListener("click", () => { region = +b.dataset.i; renderTabs(); renderRegion(); }));
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/far-far-west/maps.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const total = DATA.maps.reduce((n, m) => n + m.pois.length, 0);
    document.getElementById("fm-updated").textContent = `${DATA.maps.length} regions · ${total} collectibles & POIs · updated ${upd}`;
    renderTabs();
    renderRegion();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the maps yet — the updater hasn't published them.</p>`;
  }
})();
