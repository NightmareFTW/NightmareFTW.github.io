/* Vampire Survivors — Characters Database.
   Every character, but hidden by default until you tell it you've found
   them — only the handful of starting characters show up right away, so
   browsing this page doesn't spoil secret characters you haven't unlocked
   yet. "Show all" overrides that for players who don't mind spoilers.
   A revealed character links to its own page (character.html) for the
   full unlock guide; a locked one is just a "???" tile you can tick off
   directly if you already have it.
   Data: data/vampire-survivors/characters.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY_UNLOCKED = "nftw:vs:unlocked";
const KEY_SHOWALL = "nftw:vs:showAll";

let DATA = null, query = "", fDlc = "", sortBy = "dlc";
let unlocked = new Set(JSON.parse(localStorage.getItem(KEY_UNLOCKED) || "[]"));
let showAll = localStorage.getItem(KEY_SHOWALL) === "1";

const saveUnlocked = () => localStorage.setItem(KEY_UNLOCKED, JSON.stringify([...unlocked]));
const isRevealed = (c) => c.isDefault || unlocked.has(c.slug) || showAll;

const els = {
  controls: document.getElementById("vc-controls"),
  list: document.getElementById("vc-list"),
  progress: document.getElementById("vc-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search characters…" autocomplete="off" value="${esc(query)}">
    <select id="f-dlc" class="sort-select">${opt("", "All DLCs", fDlc)}${DATA.dlcs.map((d) => opt(d, d, fDlc)).join("")}</select>
    <select id="f-sort" class="sort-select">${opt("dlc", "Sort: DLC", sortBy)}${opt("name", "Sort: Name", sortBy)}${opt("cost", "Sort: Cost", sortBy)}</select>
    <label class="pw-boss-toggle"><input type="checkbox" id="f-showall" ${showAll ? "checked" : ""}> Show all (spoilers)</label>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-dlc").addEventListener("change", (e) => { fDlc = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
  document.getElementById("f-showall").addEventListener("change", (e) => { showAll = e.target.checked; localStorage.setItem(KEY_SHOWALL, showAll ? "1" : "0"); render(); });
}

function lockedCard(c) {
  return `<div class="vs-card vs-locked">
    <span class="pw-card-img"><span class="pw-lock-q">?</span></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name">???</span></span>
      <span class="pw-card-chips"><span class="ev-chip">${esc(c.dlcName)}</span>${c.cost ? `<span class="ev-chip">${esc(c.cost)}g</span>` : ""}</span>
      <label class="vs-mark"><input type="checkbox" class="vs-mark-check" data-slug="${esc(c.slug)}"> I already have this one</label>
    </span>
  </div>`;
}

// A curated phased guide (see scripts/data/vs-curated-guides.js) replaces
// the mechanical `steps` list for a handful of characters (e.g. Chaos) whose
// real unlock condition is far longer — count its leaf items instead of
// falling back to the much smaller `steps.length`. Guides carry an {en, pt}
// pair with identical item counts on each side (see that file's notes), so
// either one gives the same number — no need to pick a language here.
function guideStepCount(guide) {
  let n = 0;
  for (const p of (guide.en || guide).phases) {
    const groups = p.groups || [{ items: p.items || [] }];
    for (const g of groups) n += (g.items || []).length;
  }
  return n;
}

function revealedCard(c) {
  const isUnlocked = c.isDefault || unlocked.has(c.slug);
  const haveSteps = c.steps && c.steps.length && !c.isDefault;
  const stepsChip = c.guide ? `${guideStepCount(c.guide)}-step guide` : haveSteps ? `${c.steps.length} steps` : null;
  return `<a class="vs-card${isUnlocked ? " vs-unlocked" : ""}" href="character.html?slug=${encodeURIComponent(c.slug)}">
    <span class="pw-card-img"><img src="${esc(c.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(c.name)}">${esc(c.name)}</span>${c.weapon && c.weapon !== "No" ? `<span class="pw-dex">${esc(c.weapon)}</span>` : ""}</span>
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(c.dlcName)}</span>
        ${c.secret ? '<span class="ev-chip confirmed">Secret</span>' : ""}
        ${c.isDefault ? '<span class="ev-chip">Default</span>' : c.cost ? `<span class="ev-chip">${esc(c.cost)}g</span>` : ""}
        ${isUnlocked ? '<span class="ev-chip confirmed">Unlocked</span>' : stepsChip ? `<span class="ev-chip">${esc(stepsChip)}</span>` : ""}
      </span>
    </span>
  </a>`;
}

function render() {
  let list = DATA.characters.filter((c) => !fDlc || c.dlcName === fDlc);
  if (query) list = list.filter((c) => isRevealed(c) && c.name.toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "cost") list = [...list].sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  // "dlc" sort order already comes pre-sorted from the data file

  const haveCount = DATA.characters.filter((c) => c.isDefault || unlocked.has(c.slug)).length;
  els.progress.innerHTML = `<b>${haveCount}/${DATA.count}</b> revealed${showAll ? " · showing all (spoilers on)" : ""}`;

  if (sortBy === "dlc" && !query) {
    const byDlc = {};
    list.forEach((c) => (byDlc[c.dlcName] = byDlc[c.dlcName] || []).push(c));
    els.list.innerHTML = DATA.dlcs.filter((d) => byDlc[d] && byDlc[d].length).map((d) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(d)}</h3><span class="ms-sec-count">${byDlc[d].filter((c) => c.isDefault || unlocked.has(c.slug)).length}/${byDlc[d].length}</span></div>
        <div class="vs-grid">${byDlc[d].map((c) => isRevealed(c) ? revealedCard(c) : lockedCard(c)).join("")}</div>
      </section>`).join("") || `<p class="no-results">No characters match.</p>`;
  } else {
    els.list.innerHTML = `<div class="vs-grid">${list.map((c) => isRevealed(c) ? revealedCard(c) : lockedCard(c)).join("")}</div>` || `<p class="no-results">No characters match.</p>`;
  }
  wire();
}

function wire() {
  els.list.querySelectorAll(".vs-mark-check").forEach((cb) => {
    cb.addEventListener("click", (e) => e.stopPropagation());
    cb.addEventListener("change", () => {
      const slug = cb.dataset.slug;
      if (cb.checked) unlocked.add(slug); else unlocked.delete(slug);
      saveUnlocked();
      render();
    });
  });
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("vc-updated").textContent = `${DATA.count} characters · ${DATA.dlcs.length} DLCs · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load character data.</p>`;
  }
})();
