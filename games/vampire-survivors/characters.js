/* Vampire Survivors — Characters Database.
   Every character, but hidden by default until you tell it you've found
   them — only the handful of starting characters show up right away, so
   browsing this page doesn't spoil secret characters you haven't unlocked
   yet. "Show all" overrides that for players who don't mind spoilers.
   Each revealed character expands into its unlock guide, with the wiki's
   writeup split into checkable steps — check them all and the character
   is auto-marked as unlocked.
   Data: data/vampire-survivors/characters.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY_UNLOCKED = "nftw:vs:unlocked";
const KEY_STEPS = "nftw:vs:steps";
const KEY_SHOWALL = "nftw:vs:showAll";

let DATA = null, query = "", fDlc = "", sortBy = "dlc", open = new Set();
let unlocked = new Set(JSON.parse(localStorage.getItem(KEY_UNLOCKED) || "[]"));
let stepsDone = new Set(JSON.parse(localStorage.getItem(KEY_STEPS) || "[]"));
let showAll = localStorage.getItem(KEY_SHOWALL) === "1";

const saveUnlocked = () => localStorage.setItem(KEY_UNLOCKED, JSON.stringify([...unlocked]));
const saveSteps = () => localStorage.setItem(KEY_STEPS, JSON.stringify([...stepsDone]));
const isRevealed = (c) => c.isDefault || unlocked.has(c.slug) || showAll;
const stepId = (c, i) => `${c.slug}::${i}`;

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

function stepRow(c, step, i) {
  const id = stepId(c, i);
  const done = stepsDone.has(id);
  return `<label class="ms-item ${done ? "done" : ""}" data-step="${esc(id)}">
    <input type="checkbox" class="vs-step-check" data-slug="${esc(c.slug)}" data-i="${i}" ${done ? "checked" : ""}>
    <span class="ms-item-body"><span class="ms-item-text">${esc(step)}</span></span>
  </label>`;
}

function revealedCard(c) {
  const isOpen = open.has(c.slug);
  const isUnlocked = c.isDefault || unlocked.has(c.slug);
  const haveSteps = c.steps && c.steps.length && !c.isDefault;
  const stepsHave = haveSteps ? c.steps.filter((_, i) => stepsDone.has(stepId(c, i))).length : 0;
  return `<div class="vs-card${isUnlocked ? " vs-unlocked" : ""}">
    <button class="vs-card-head" data-slug="${esc(c.slug)}" aria-expanded="${isOpen}">
      <span class="pw-card-img"><img src="${esc(c.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
      <span class="pw-card-body">
        <span class="pw-card-top"><span class="pw-card-name" title="${esc(c.name)}">${esc(c.name)}</span>${c.weapon && c.weapon !== "No" ? `<span class="pw-dex">${esc(c.weapon)}</span>` : ""}</span>
        <span class="pw-card-chips">
          <span class="ev-chip">${esc(c.dlcName)}</span>
          ${c.secret ? '<span class="ev-chip confirmed">Secret</span>' : ""}
          ${c.isDefault ? '<span class="ev-chip">Default</span>' : c.cost ? `<span class="ev-chip">${esc(c.cost)}g</span>` : ""}
          ${haveSteps ? `<span class="ev-chip">${stepsHave}/${c.steps.length} steps</span>` : ""}
        </span>
      </span>
      <span class="cb-caret">▾</span>
    </button>
    <div class="vs-card-detail" ${isOpen ? "" : "hidden"}>
      ${c.description ? `<p class="pw-desc">${esc(c.description)}</p>` : ""}
      ${c.isDefault
        ? `<p class="tool-note">Available from the very start — no unlock needed.</p>`
        : `<label class="vs-mark vs-mark-main"><input type="checkbox" class="vs-mark-check" data-slug="${esc(c.slug)}" ${isUnlocked ? "checked" : ""}> Mark as unlocked</label>
           ${c.unlockShort ? `<p class="pw-build-note"><b>How:</b> ${esc(c.unlockShort)}</p>` : ""}
           ${haveSteps ? `<div class="ms-items">${c.steps.map((s, i) => stepRow(c, s, i)).join("")}</div>` : ""}`}
    </div>
  </div>`;
}

function applyUnlockedFrom(c) {
  if (c.isDefault || !c.steps || !c.steps.length) return;
  const all = c.steps.every((_, i) => stepsDone.has(stepId(c, i)));
  if (all && !unlocked.has(c.slug)) { unlocked.add(c.slug); saveUnlocked(); }
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
  els.list.querySelectorAll(".vs-card-head").forEach((btn) => btn.addEventListener("click", () => {
    const slug = btn.dataset.slug;
    if (open.has(slug)) open.delete(slug); else open.add(slug);
    render();
  }));
  els.list.querySelectorAll(".vs-mark-check").forEach((cb) => cb.addEventListener("click", (e) => e.stopPropagation()));
  els.list.querySelectorAll(".vs-mark-check").forEach((cb) => cb.addEventListener("change", () => {
    const slug = cb.dataset.slug;
    if (cb.checked) unlocked.add(slug); else unlocked.delete(slug);
    saveUnlocked();
    render();
  }));
  els.list.querySelectorAll(".vs-step-check").forEach((cb) => cb.addEventListener("click", (e) => e.stopPropagation()));
  els.list.querySelectorAll(".vs-step-check").forEach((cb) => cb.addEventListener("change", () => {
    const id = `${cb.dataset.slug}::${cb.dataset.i}`;
    if (cb.checked) stepsDone.add(id); else stepsDone.delete(id);
    saveSteps();
    const c = DATA.characters.find((x) => x.slug === cb.dataset.slug);
    if (c) applyUnlockedFrom(c);
    render();
  }));
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
