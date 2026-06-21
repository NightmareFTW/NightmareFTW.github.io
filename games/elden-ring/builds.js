/* Elden Ring — Meta Builds.
   buildtierlist-style layout: an equipment grid with real item icons
   (weapons / armour / talismans / spells), the full level-150 attribute spread,
   the weapon's Ash of War, how to play it, where to get it and pros/cons.
   Reuses the shared .cb-* build shell; re-themed for Elden Ring in CSS.
   Item icons via the community Elden Ring API. Data: data/elden-ring/builds.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const ATTR_COL = {
  vigor: "#ff5b5b", mind: "#6aa8ff", endurance: "#6fcf8a", strength: "#ff9f43",
  dexterity: "#fcd34d", intelligence: "#4fd0e0", faith: "#e0c070", arcane: "#c98cff",
};
const DMG_STATS = ["strength", "dexterity", "intelligence", "faith", "arcane"];
const primaryStat = (b) => DMG_STATS.reduce((a, k) => (b.stats[k] || 0) > (b.stats[a] || 0) ? k : a, "strength");

let DATA = null, filter = "all", open = new Set();
const root = document.getElementById("er-root");

function statBars(b) {
  const max = 99, prim = primaryStat(b);
  return `<div class="cb-attrs">${DATA.attrOrder.map((k) => {
    const v = b.stats[k] || 0, col = ATTR_COL[k] || "#b8924a", isP = k === prim;
    return `<div class="cb-attr ${isP ? "is-primary" : ""}">
      <span class="cb-attr-name">${esc(DATA.attrLabels[k] || k)}${isP ? ' <span class="cb-prim">★</span>' : ""}</span>
      <span class="cb-attr-track"><span class="cb-attr-fill" style="width:${Math.round((v / max) * 100)}%;background:${col}"></span></span>
      <span class="cb-attr-val" style="color:${col}">${v}</span>
    </div>`;
  }).join("")}</div>`;
}

function itemCard(it) {
  const icon = it.img
    ? `<img class="er-ico-img" src="${esc(it.img)}" alt="" loading="lazy" onerror="this.closest('.er-ico').classList.add('er-ico-none');this.remove()">`
    : "";
  return `<div class="er-item">
    <span class="er-ico ${it.img ? "" : "er-ico-none"}">${icon}</span>
    <span class="er-item-body">
      ${it.slot ? `<span class="er-item-slot">${esc(it.slot)}</span>` : ""}
      <span class="er-item-name">${esc(it.name)}</span>
      ${it.note ? `<span class="er-item-note">${esc(it.note)}</span>` : ""}
    </span>
  </div>`;
}

function col(title, items) {
  if (!items || !items.length) return "";
  return `<div class="er-col"><h5 class="er-col-h">${title}</h5>${items.map(itemCard).join("")}</div>`;
}

function buildCard(b) {
  const isOpen = open.has(b.id);
  const e = b.equipment || {};
  const grid = `<div class="er-equip">
    ${col("Weapons", e.weapons)}
    ${col("Armour", e.armor)}
    ${col("Talismans", e.talismans)}
    ${col("Spells", e.spells)}
  </div>`;
  return `<article class="cb-build er-build ${isOpen ? "open" : ""}" data-id="${b.id}">
    <button class="cb-build-head" aria-expanded="${isOpen}">
      <div class="cb-build-title">
        <span class="cb-build-tags"><span class="er-tier er-tier-${esc(b.tier).toLowerCase()}">${esc(b.tier)}-Tier</span><span class="cb-arch">${esc(b.type)}</span></span>
        <span class="cb-name">${esc(b.name)}</span>
      </div>
      <span class="cb-caret">▾</span>
    </button>
    <p class="cb-summary">${esc(b.summary)}</p>
    <div class="cb-detail" ${isOpen ? "" : "hidden"}>
      <div class="cb-sec"><h4 class="cb-sec-h">Equipment</h4>${grid}</div>
      <div class="cb-sec"><h4 class="cb-sec-h">Stats · Level ${esc(b.level)}</h4>
        ${statBars(b)}
        <p class="cb-attrnote">${esc(b.statNote)}</p></div>
      <div class="cb-setperk"><span class="cb-setperk-h">Weapon skill</span>${esc(b.skill)}</div>
      <div class="cb-sec"><h4 class="cb-sec-h">How to play it</h4>
        <ol class="cb-play">${(b.howto || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ol></div>
      <div class="cb-sec"><h4 class="cb-sec-h">Where to get it</h4><p class="cb-level">${esc(b.obtain)}</p></div>
      <div class="cb-procon">
        <div class="cb-pros"><span class="cb-pc-h">Pros</span><ul>${(b.pros || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
        <div class="cb-cons"><span class="cb-pc-h">Cons</span><ul>${(b.cons || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      </div>
    </div>
  </article>`;
}

function render() {
  let list = DATA.builds;
  if (filter !== "all") list = list.filter((b) => b.tier === filter);
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
  const el = document.getElementById("er-filters");
  const tiers = [...new Set(DATA.builds.map((b) => b.tier))];
  const chips = [["all", "All builds"]].concat(tiers.map((t) => [t, `${t}-Tier`]));
  el.innerHTML = chips.map(([k, label]) => `<button class="cb-fchip ${k === filter ? "on" : ""}" data-k="${k}">${esc(label)}</button>`).join("");
  el.querySelectorAll(".cb-fchip").forEach((b) => b.addEventListener("click", () => {
    filter = b.dataset.k;
    el.querySelectorAll(".cb-fchip").forEach((x) => x.classList.toggle("on", x === b));
    render();
  }));
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/elden-ring/builds.json?cb=${Date.now()}`)).json();
    document.getElementById("er-version").textContent = `${DATA.builds.length} meta builds · ${DATA.version}`;
    document.getElementById("er-note").textContent = DATA.note || "";
    if (DATA.builds[0]) open.add(DATA.builds[0].id);
    buildFilters();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load build data.</p>`;
  }
})();
