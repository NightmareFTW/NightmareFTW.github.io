/* Epic Seven — Heroes Database.
   Every hero, filterable/sortable by grade, element and class — not
   spoiler-sensitive, so nothing is hidden by default. Cards are tinted by
   element (background gradient + a low-opacity element-symbol watermark,
   both from ELEMENT_COLOR/elementIcon) and show a 0-100 overall rating
   circle (color-ramped red->green — see ratingScore/ratingColor, a simple
   average of the PvP/PvE letter tiers since epic7db.com has no single
   numeric score of its own). A card links to hero.html for base stats,
   skills, Fribbels builds, RTA data, exclusive equipment, awakenings and
   memory imprints.
   Data: data/epic7/heroes.json (source: epic7db.com). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TIER_RANK = { SSS: 8, SS: 7, S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
// Rough 0-100 scale for each letter tier, used only to build a single
// at-a-glance overall score (epic7db.com itself has no such number —
// this just averages the PvP/PvE tiers it does give us).
const TIER_SCORE = { SSS: 100, SS: 90, S: 78, A: 64, B: 48, C: 32, D: 18, F: 5 };
const ELEMENT_COLOR = { Fire: "#f2543d", Ice: "#38b6e0", Earth: "#8bb33a", Light: "#e0c23a", Dark: "#a866e0" };
const elementIcon = (el) => `https://epic7db.com/images/elements/${encodeURIComponent(el)}.png`;

// epic7db.com uses the literal value "Unknown" when it hasn't assigned a
// tier yet — treat that the same as no tier at all.
const realTier = (t) => (t && t !== "Unknown" ? t : null);

function ratingScore(h) {
  const pvp = TIER_SCORE[realTier(h.pvpTier)];
  const pve = TIER_SCORE[realTier(h.pveTier)];
  if (pvp == null && pve == null) return null;
  if (pvp == null) return pve;
  if (pve == null) return pvp;
  return Math.round((pvp + pve) / 2);
}
// Red below 20, then a smooth red -> orange -> yellow -> green ramp up to 100.
function ratingColor(score) {
  const t = Math.max(0, Math.min(1, (score - 20) / 80));
  return `hsl(${Math.round(t * 120)}, 70%, 48%)`;
}
function ratingCircle(score) {
  if (score == null) return "";
  return `<span title="Overall rating (PvP/PvE tier average)" style="flex:0 0 auto;position:relative;z-index:1;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-family:var(--mono);font-weight:800;font-size:0.76rem;color:#0b0b0f;background:${ratingColor(score)};border:2px solid rgba(0,0,0,.28)">${score}</span>`;
}

let DATA = null, query = "", fGrade = "", fElement = "", fClass = "", sortBy = "grade";

const els = {
  controls: document.getElementById("eh-controls"),
  list: document.getElementById("eh-list"),
  progress: document.getElementById("eh-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search heroes…" autocomplete="off" value="${esc(query)}">
    <select id="f-grade" class="sort-select">${opt("", "All grades", fGrade)}${DATA.grades.map((g) => opt(g, `${g}★`, fGrade)).join("")}</select>
    <select id="f-element" class="sort-select">${opt("", "All elements", fElement)}${DATA.elements.map((e) => opt(e, e, fElement)).join("")}</select>
    <select id="f-class" class="sort-select">${opt("", "All classes", fClass)}${DATA.classes.map((c) => opt(c, c, fClass)).join("")}</select>
    <select id="f-sort" class="sort-select">${opt("grade", "Sort: Grade", sortBy)}${opt("name", "Sort: Name", sortBy)}${opt("pvp", "Sort: PvP Tier", sortBy)}${opt("pve", "Sort: PvE Tier", sortBy)}${opt("rating", "Sort: Rating", sortBy)}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-grade").addEventListener("change", (e) => { fGrade = e.target.value; render(); });
  document.getElementById("f-element").addEventListener("change", (e) => { fElement = e.target.value; render(); });
  document.getElementById("f-class").addEventListener("change", (e) => { fClass = e.target.value; render(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { sortBy = e.target.value; render(); });
}

function tierNum(h) { return TIER_RANK[realTier(h.pvpTier)] || 0; }
function tierNumPve(h) { return TIER_RANK[realTier(h.pveTier)] || 0; }

function card(h) {
  const elemColor = ELEMENT_COLOR[h.element] || null;
  const cardStyle = `position:relative;overflow:hidden;${elemColor ? `background:linear-gradient(120deg, ${elemColor}29, ${elemColor}0d 55%, transparent 78%);border-color:${elemColor}4d;` : ""}`;
  return `<a class="vs-card" href="hero.html?slug=${encodeURIComponent(h.slug)}" style="${cardStyle}">
    ${h.element ? `<img src="${elementIcon(h.element)}" alt="" aria-hidden="true" style="position:absolute;right:-8px;top:50%;transform:translateY(-50%);width:58px;height:58px;object-fit:contain;opacity:.18;z-index:0;pointer-events:none" onerror="this.remove()">` : ""}
    <span class="pw-card-img" style="position:relative;z-index:1;width:72px;height:72px;border-radius:50%;overflow:hidden;background:none;${elemColor ? `border-color:${elemColor}` : ""}"><img src="${esc(h.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.pw-card-img').classList.add('no-img')"></span>
    <span class="pw-card-body" style="position:relative;z-index:1">
      <span class="pw-card-top"><span class="pw-card-name" title="${esc(h.name)}">${esc(h.name)}</span></span>
      <span class="vs-card-weapon" ${elemColor ? `style="color:${elemColor}"` : ""}>${esc(h.class)} · ${esc(h.element)}</span>
      <span class="pw-card-chips">
        <span class="ev-chip">${esc(h.grade)}★</span>
        ${realTier(h.pvpTier) ? `<span class="ev-chip confirmed">PvP ${esc(h.pvpTier)}</span>` : ""}
        ${realTier(h.pveTier) ? `<span class="ev-chip confirmed">PvE ${esc(h.pveTier)}</span>` : ""}
      </span>
    </span>
    ${ratingCircle(ratingScore(h))}
  </a>`;
}

function render() {
  let list = DATA.heroes.filter((h) => (!fGrade || String(h.grade) === fGrade) && (!fElement || h.element === fElement) && (!fClass || h.class === fClass));
  if (query) list = list.filter((h) => h.name.toLowerCase().includes(query));

  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "pvp") list = [...list].sort((a, b) => tierNum(b) - tierNum(a));
  else if (sortBy === "pve") list = [...list].sort((a, b) => tierNumPve(b) - tierNumPve(a));
  else if (sortBy === "rating") list = [...list].sort((a, b) => (ratingScore(b) || 0) - (ratingScore(a) || 0));
  // "grade" sort order already comes pre-sorted from the data file

  els.progress.innerHTML = `<b>${list.length}</b> of ${DATA.count} heroes`;

  if (sortBy === "grade" && !query) {
    const byGrade = {};
    list.forEach((h) => (byGrade[h.grade] = byGrade[h.grade] || []).push(h));
    els.list.innerHTML = DATA.grades.filter((g) => byGrade[g] && byGrade[g].length).map((g) => `
      <section class="ms-section">
        <div class="ms-sec-head"><h3>${esc(g)}★ Heroes</h3><span class="ms-sec-count">${byGrade[g].length}</span></div>
        <div class="vs-grid">${byGrade[g].map(card).join("")}</div>
      </section>`).join("") || `<p class="no-results">No heroes match.</p>`;
  } else {
    els.list.innerHTML = list.length ? `<div class="vs-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No heroes match.</p>`;
  }
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/epic7/heroes.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("eh-updated").textContent = `${DATA.count} heroes · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load hero data.</p>`;
  }
})();
