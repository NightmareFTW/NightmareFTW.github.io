/* Aniimo — Talent Build Route.
   The Pathfinder's (the player character's, not an Aniimo's) talent tree:
   28 Active/Passive talents, each unlocked by reaching a trainer title
   (Student/Wayfarer/Trailblazer) and a level within it. The recommended
   route up top is Game8's own "Best Talents and Passives" priority order
   (attributed — not a claim of our own); the full tree below is every
   talent grouped by what unlocks it. See scripts/update-aniimo.js. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let DATA = null, query = "", typeFilter = "all", titleFilter = "all";

const els = {
  route: document.getElementById("at-route"),
  controls: document.getElementById("at-controls"),
  progress: document.getElementById("at-progress"),
  tree: document.getElementById("at-tree"),
};

function unlockLabel(t) {
  const levelName = DATA.levelNames[String(t.level)] || `Level ${t.level}`;
  return `${t.title} · ${levelName}`;
}

// ---- recommended route -------------------------------------------------
function routeItem(t) {
  return `<div class="at-route-item">
    <span class="at-route-rank">${t.recommended.rank}</span>
    ${t.icon ? `<img class="at-route-icon" src="${esc(t.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : ""}
    <div>
      <span class="at-route-name">${esc(t.name)}</span><span class="at-route-unlock">${esc(unlockLabel(t))}</span>
      <p class="at-route-reason">${esc(t.recommended.reason)}</p>
    </div>
  </div>`;
}

function renderRoute() {
  const active = DATA.talents.filter((t) => t.recommended && t.recommended.group === "Active").sort((a, b) => a.recommended.rank - b.recommended.rank);
  const passive = DATA.talents.filter((t) => t.recommended && t.recommended.group === "Passive").sort((a, b) => a.recommended.rank - b.recommended.rank);
  if (!active.length && !passive.length) {
    els.route.innerHTML = `<p class="tool-note">No recommended order published yet.</p>`;
    return;
  }
  els.route.innerHTML = `<div class="at-route-cols">
    ${active.length ? `<div class="at-route-group"><h3>Active Skills</h3>${active.map(routeItem).join("")}</div>` : ""}
    ${passive.length ? `<div class="at-route-group"><h3>Passive Skills</h3>${passive.map(routeItem).join("")}</div>` : ""}
  </div>`;
}

// ---- full tree -----------------------------------------------------------
function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="at-search" class="search-input" placeholder="Search talents…" autocomplete="off" value="${esc(query)}">
    <select id="at-type" class="sort-select">
      <option value="all">All types</option>
      <option value="Active"${typeFilter === "Active" ? " selected" : ""}>Active</option>
      <option value="Passive"${typeFilter === "Passive" ? " selected" : ""}>Passive</option>
    </select>
    <select id="at-title" class="sort-select">
      <option value="all">All titles</option>
      ${DATA.titles.map((t) => `<option value="${esc(t)}"${titleFilter === t ? " selected" : ""}>${esc(t)}</option>`).join("")}
    </select>`;
  document.getElementById("at-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderTree(); });
  document.getElementById("at-type").addEventListener("change", (e) => { typeFilter = e.target.value; renderTree(); });
  document.getElementById("at-title").addEventListener("change", (e) => { titleFilter = e.target.value; renderTree(); });
}

function talentRow(t) {
  return `<div class="dr-card rw-talent">
    <div class="rw-t-head">
      ${t.icon ? `<img class="rw-t-icon" src="${esc(t.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
      <div>
        <span class="dr-name">${esc(t.name)}</span>
        <div class="rw-t-meta">
          <span class="ev-chip">${esc(t.type)}</span>
          ${t.cd ? `<span class="ev-chip">CD ${esc(t.cd)}</span>` : ""}
          ${t.recommended ? `<span class="ev-chip at-recommended-badge">Recommended #${t.recommended.rank}</span>` : ""}
        </div>
      </div>
    </div>
    ${t.desc ? `<p class="rw-t-effect">${esc(t.desc)}</p>` : ""}
  </div>`;
}

function renderTree() {
  const q = query;
  const list = DATA.talents.filter((t) =>
    (typeFilter === "all" || t.type === typeFilter) &&
    (titleFilter === "all" || t.title === titleFilter) &&
    (!q || (t.name + " " + t.desc).toLowerCase().includes(q)));

  els.progress.textContent = `${list.length} of ${DATA.talents.length} talents`;
  if (!list.length) { els.tree.innerHTML = `<p class="no-results">No talents match.</p>`; return; }

  els.tree.innerHTML = DATA.titles.filter((title) => list.some((t) => t.title === title)).map((title) => {
    const levels = [...new Set(list.filter((t) => t.title === title).map((t) => t.level))].sort((a, b) => a - b);
    return `<section class="at-tier">
      <h3 class="at-tier-head">${esc(title)}</h3>
      ${levels.map((lvl) => `
        <p class="at-level-head">${esc(DATA.levelNames[String(lvl)] || `Level ${lvl}`)}</p>
        <div class="dr-grid">${list.filter((t) => t.title === title && t.level === lvl).map(talentRow).join("")}</div>
      `).join("")}
    </section>`;
  }).join("");
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/aniimo/talents.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("at-updated").textContent = `${DATA.count} talents · updated ${upd}`;
    renderRoute();
    buildControls();
    renderTree();
  } catch (e) {
    els.route.innerHTML = `<p class="tool-note">Couldn't load Aniimo talent data.</p>`;
    els.tree.innerHTML = "";
  }
})();
