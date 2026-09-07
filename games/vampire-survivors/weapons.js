/* Vampire Survivors — Weapons, Arcanas & Passives Database.
   Four related but distinct catalogues share this one tool (tabs switch
   between them): equip-and-level Weapons (base/evolution/union, each with
   its own page and evolution chain), Arcanas and Darkanas (game-rule
   modifiers picked at the Arcane Sanctuary/Inlaid Library — a different
   mechanic from a weapon, even though the wiki's own Category:Weapons
   used to leak a few of them in), and passive items (accessories). None
   of this is spoiler-sensitive like the character database, so nothing
   is hidden by default.
   Data: data/vampire-survivors/{weapons,arcanas,passives}.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TIER_LABEL = { base: "Base", evolution: "Evolution", union: "Union" };
const KIND_LABEL = { arcana: "Arcana", darkana: "Darkana" };

let RAW = { weapons: [], arcanas: [], passives: [] };
let category = "weapons", query = "", fDlc = "", fTier = "", sortBy = "dlc";

const els = {
  tabs: document.getElementById("vw-cat-tabs"),
  controls: document.getElementById("vw-controls"),
  list: document.getElementById("vw-list"),
  progress: document.getElementById("vw-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function itemsFor(cat) {
  if (cat === "weapons") return RAW.weapons;
  if (cat === "arcanas") return RAW.arcanas.filter((a) => a.kind === "arcana");
  if (cat === "darkanas") return RAW.arcanas.filter((a) => a.kind === "darkana");
  return RAW.passives;
}
function hrefFor(cat, slug) {
  if (cat === "weapons") return `weapon.html?slug=${encodeURIComponent(slug)}`;
  if (cat === "passives") return `passive.html?slug=${encodeURIComponent(slug)}`;
  return `arcana.html?slug=${encodeURIComponent(slug)}`;
}

function buildTabs() {
  const tabs = [
    ["weapons", `Weapons (${RAW.weapons.length})`],
    ["arcanas", `Arcanas (${RAW.arcanas.filter((a) => a.kind === "arcana").length})`],
    ["darkanas", `Darkanas (${RAW.arcanas.filter((a) => a.kind === "darkana").length})`],
    ["passives", `Passives (${RAW.passives.length})`],
  ];
  els.tabs.innerHTML = tabs.map(([id, label]) => `<button type="button" class="vs-cat-tab${id === category ? " active" : ""}" data-cat="${id}">${esc(label)}</button>`).join("");
  els.tabs.querySelectorAll(".vs-cat-tab").forEach((btn) => btn.addEventListener("click", () => {
    category = btn.dataset.cat;
    fTier = ""; query = ""; fDlc = ""; sortBy = "dlc";
    buildTabs();
    buildControls();
    render();
  }));
}

function buildControls() {
  const dlcs = [...new Set(itemsFor(category).map((i) => i.dlcName))];
  const showTierFilter = category === "weapons";
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search…" autocomplete="off" value="${esc(query)}">
    <select id="f-dlc" class="sort-select">${opt("", "All DLCs", fDlc)}${dlcs.map((d) => opt(d, d, fDlc)).join("")}</select>
    ${showTierFilter ? `<select id="f-tier" class="sort-select">${opt("", "All types", fTier)}${opt("base", "Base weapons", fTier)}${opt("evolution", "Evolutions", fTier)}${opt("union", "Unions", fTier)}</select>` : ""}
    <select id="f-sort" class="sort-select">${opt("dlc", "Sort: DLC", sortBy)}${opt("name", "Sort: Name", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-dlc").addEventListener("change", (e) => { fDlc = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
  const tierSel = document.getElementById("f-tier");
  if (tierSel) tierSel.addEventListener("change", (e) => { fTier = e.target.value; render(); });
}

function weaponCard(w) {
  return `<a class="vs-card" href="${hrefFor("weapons", w.slug)}">
    <span class="pw-card-img"><img src="${esc(w.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(w.name)}">${esc(w.name)}</span></span>
      ${w.caption ? `<span class="vs-card-weapon">${esc(w.caption)}</span>` : ""}
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(w.dlcName)}</span>
        <span class="ev-chip${w.tier === "base" ? "" : " confirmed"}">${esc(TIER_LABEL[w.tier] || w.tier)}</span>
        ${w.evolvesInto.length ? `<span class="ev-chip">→ ${esc(w.evolvesInto.length)} evolution${w.evolvesInto.length > 1 ? "s" : ""}</span>` : ""}
      </span>
    </span>
  </a>`;
}
function arcanaCard(a) {
  return `<a class="vs-card" href="${hrefFor(a.kind === "darkana" ? "darkanas" : "arcanas", a.slug)}">
    <span class="pw-card-img"><img src="${esc(a.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(a.name)}">${esc(a.name)}</span></span>
      ${a.description ? `<span class="vs-card-weapon">${esc(a.description)}</span>` : ""}
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(a.dlcName)}</span>
        ${a.affects.length ? `<span class="ev-chip">affects ${esc(a.affects.length)}</span>` : ""}
      </span>
    </span>
  </a>`;
}
function passiveCard(p) {
  return `<a class="vs-card" href="${hrefFor("passives", p.slug)}">
    <span class="pw-card-img"><img src="${esc(p.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(p.name)}">${esc(p.name)}</span></span>
      ${p.description ? `<span class="vs-card-weapon">${esc(p.description)}</span>` : ""}
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(p.dlcName)}</span>
        ${p.stat ? `<span class="ev-chip">${esc(p.stat)}</span>` : ""}
      </span>
    </span>
  </a>`;
}
function cardFor(cat, item) {
  if (cat === "weapons") return weaponCard(item);
  if (cat === "passives") return passiveCard(item);
  return arcanaCard(item);
}

function render() {
  let list = itemsFor(category).filter((i) => !fDlc || i.dlcName === fDlc);
  if (fTier && category === "weapons") list = list.filter((w) => w.tier === fTier);
  if (query) list = list.filter((i) => i.name.toLowerCase().includes(query) || (i.caption || i.description || "").toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else list = [...list].sort((a, b) => (a.dlcName === b.dlcName ? a.name.localeCompare(b.name) : (a.dlcName === "Base Game" ? -1 : b.dlcName === "Base Game" ? 1 : a.dlcName.localeCompare(b.dlcName))));

  els.progress.innerHTML = `<b>${list.length}</b> of ${itemsFor(category).length}`;

  if (sortBy === "dlc" && !query) {
    const byDlc = {};
    list.forEach((i) => (byDlc[i.dlcName] = byDlc[i.dlcName] || []).push(i));
    const dlcOrder = Object.keys(byDlc).sort((a, b) => (a === "Base Game" ? -1 : b === "Base Game" ? 1 : a.localeCompare(b)));
    els.list.innerHTML = dlcOrder.map((d) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(d)}</h3><span class="ms-sec-count">${byDlc[d].length}</span></div>
        <div class="vs-grid">${byDlc[d].map((i) => cardFor(category, i)).join("")}</div>
      </section>`).join("") || `<p class="no-results">No results.</p>`;
  } else {
    els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map((i) => cardFor(category, i)).join("")}</div>` : `<p class="no-results">No results.</p>`;
  }
}

(async function init() {
  try {
    const [weaponsData, arcanasData, passivesData] = await Promise.all([
      fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/arcanas.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/passives.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    RAW = { weapons: weaponsData.weapons, arcanas: arcanasData.arcanas, passives: passivesData.passives };
    const upd = weaponsData.updated ? new Date(weaponsData.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("vw-updated").textContent = `${RAW.weapons.length} weapons · ${RAW.arcanas.length} arcanas/darkanas · ${RAW.passives.length} passives · updated ${upd}`;
    buildTabs();
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load weapon data.</p>`;
  }
})();
