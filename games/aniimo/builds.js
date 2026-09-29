/* Aniimo — Builds.
   A real per-Aniimo build: which two Skills to equip, the best Held Item,
   stat priority and a recommended personality — sourced from Game8's own
   "List of All Builds" page (the site's established primary source for
   this kind of attributed guide, same as the Pathfinder's talent route).
   Covers 46 of the 86 tracked Aniimo; a few rows are for a "Prismana"
   (top-tier awakened) form of a base creature rather than a separate
   roster entry, and a handful name an Aniimo not yet documented on
   wiki.aniimo.com (creatures.json) — those render as plain text instead
   of a dead link. See scripts/update-aniimo.js (buildAniimoBuilds).
   Data: data/aniimo/builds.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let DATA = null, query = "";

const els = {
  controls: document.getElementById("ab-controls"),
  list: document.getElementById("ab-list"),
  progress: document.getElementById("ab-progress"),
};

function buildControls() {
  els.controls.innerHTML = `<input type="search" id="f-search" class="search-input" placeholder="Search builds…" autocomplete="off" value="${esc(query)}">`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
}

function skillChip(s) {
  return `<span class="ms-item" style="cursor:default;display:inline-flex;padding:4px 8px 4px 4px;gap:6px">
    ${s.icon ? `<img src="${esc(s.icon)}" alt="" width="20" height="20" style="border-radius:5px;flex-shrink:0" referrerpolicy="no-referrer">` : ""}
    <span class="ms-item-text">${esc(s.name)}</span>
  </span>`;
}

function card(b) {
  const nameLine = `${esc(b.name)}${b.formTag ? ` <span class="ev-chip">${esc(b.formTag)}</span>` : ""}`;
  const title = b.slug
    ? `<a class="dr-name vs-xref" href="aniimo.html?slug=${encodeURIComponent(b.slug)}">${nameLine}</a>`
    : `<span class="dr-name">${nameLine}</span>`;
  return `<div class="dr-card rw-talent">
    <div class="rw-t-head">
      ${b.icon ? `<img class="rw-t-icon" src="${esc(b.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
      <div>
        ${title}
        <div class="rw-t-meta"><span class="ev-chip at-recommended-badge">${esc(b.personality)}</span></div>
      </div>
    </div>
    <p class="rw-t-effect" style="margin-bottom:6px"><b>Equipped Skills</b>:</p>
    <p style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px">${b.skills.map(skillChip).join("")}</p>
    ${b.heldItem ? `<p class="rw-t-effect" style="margin-bottom:6px"><b>Held Item</b>:</p><p style="margin:0 0 8px">${skillChip(b.heldItem)}</p>` : ""}
    <p class="rw-t-effect" style="margin-top:8px"><b>Stat Priority</b>: ${esc(b.statPriority)}</p>
  </div>`;
}

function render() {
  const q = query;
  const list = DATA.builds.filter((b) => !q || b.name.toLowerCase().includes(q) || b.statPriority.toLowerCase().includes(q));
  els.progress.textContent = `${list.length} of ${DATA.count} builds`;
  els.list.innerHTML = list.length ? `<div class="dr-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No builds match.</p>`;
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/aniimo/builds.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("ab-updated").textContent = `${DATA.count} builds · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load Aniimo build data.</p>`;
  }
})();
