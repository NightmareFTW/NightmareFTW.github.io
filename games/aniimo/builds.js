/* Aniimo — Teams & Builds.
   Real recommended team compositions (compiled from games.gg's best-teams
   guide — data/aniimo/teams.json) on top, each member enriched with its own
   Held Item, personality and stat priority from our per-Aniimo build data
   (Game8 — data/aniimo/builds.json) and linked to its full Aniimo page.
   Below that, the full searchable list of individual per-Aniimo builds.
   Data: data/aniimo/teams.json, builds.json, creatures.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ELEMENT_COLOR = {
  Fire: "#f2543d", Water: "#3d9bf2", Grass: "#6bbf3f", Electric: "#e0c23a", Ice: "#38b6e0",
  Wind: "#7fd9c4", Dark: "#a866e0", Holy: "#f2e6a3", Rock: "#a9835a", Mixed: "#9aa0ad",
};
const ROLE_COLOR = { DPS: "#ff6470", BREAK: "#e0a23a", HEAL: "#34d399", REGEN: "#3d9bf2", SUPPORT: "#a866e0" };

let BUILDS = null, TEAMS = null, CREATURES = null, byCreature = null, byBuild = null, query = "";

const els = {
  controls: document.getElementById("ab-controls"),
  list: document.getElementById("ab-list"),
  progress: document.getElementById("ab-progress"),
  teams: document.getElementById("ab-teams"),
};

/* ---- Teams ---- */
function resolveMember(m) {
  const nameKey = m.name.toLowerCase();
  const baseKey = (m.base || m.name).toLowerCase();
  return {
    creature: byCreature.get(baseKey) || null,
    build: byBuild.get(nameKey) || byBuild.get(baseKey) || null,
  };
}

function memberCard(m) {
  const { creature, build } = resolveMember(m);
  const slug = creature && creature.slug;
  const icon = creature ? creature.icon : (build ? build.icon : "");
  const element = creature && creature.elements && creature.elements[0];
  const elColor = ELEMENT_COLOR[element] || null;
  const roleColor = ROLE_COLOR[m.role] || "#9aa0ad";
  const name = slug
    ? `<a class="vs-xref" href="aniimo.html?slug=${encodeURIComponent(slug)}">${esc(m.name)}</a>`
    : `<span>${esc(m.name)}</span>`;
  const alt = m.alt ? ` <span class="tm-alt">or ${esc(m.alt)}</span>` : "";
  const bits = build
    ? `${build.heldItem ? `<span class="ev-chip" title="Held Item">${esc(build.heldItem.name)}</span>` : ""}
       ${build.personality ? `<span class="ev-chip" title="Personality">${esc(build.personality)}</span>` : ""}
       ${build.statPriority ? `<span class="ev-chip" title="Stat priority">${esc(build.statPriority)}</span>` : ""}`
    : (creature ? "" : `<span class="ev-chip" style="opacity:.55">not in database yet</span>`);
  return `<div class="tm-member">
    <span class="tm-ic" ${elColor ? `style="border-color:${elColor}80"` : ""}>${icon ? `<img src="${esc(icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : ""}</span>
    <div class="tm-info">
      <div class="tm-name">${name}${alt}
        ${element ? `<span class="ev-chip" style="background:${elColor}22;color:${elColor}">${esc(element)}</span>` : ""}
        <span class="ev-chip" style="background:${roleColor}22;color:${roleColor}">${esc(m.role || "")}</span>
      </div>
      <div class="tm-bits">${bits}</div>
    </div>
  </div>`;
}

function teamCard(t) {
  const elColor = ELEMENT_COLOR[t.element] || "#9aa0ad";
  return `<div class="tm-card" style="border-color:${elColor}3d">
    <div class="tm-head">
      <h3>${esc(t.name)}</h3>
      <span class="tm-tags">
        <span class="ev-chip">${esc(t.tag)}</span>
        <span class="ev-chip" style="background:${elColor}22;color:${elColor}">${esc(t.element)}</span>
        ${t.flex ? `<span class="ev-chip" style="opacity:.7">+ flex slot</span>` : ""}
      </span>
    </div>
    <div class="tm-members">${t.members.map(memberCard).join("")}</div>
    <p class="tm-why">${esc(t.why)}</p>
  </div>`;
}

function renderTeams() {
  if (!els.teams) return;
  if (!TEAMS || !TEAMS.teams || !TEAMS.teams.length) { els.teams.innerHTML = ""; return; }
  const tUpd = TEAMS.updated ? new Date(TEAMS.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
  els.teams.innerHTML = `<p class="tool-note" style="margin:0 0 14px">The current best endgame / meta teams${tUpd ? `, as of ${tUpd}` : ""} — compiled from and corroborated across up-to-date guides (${esc(TEAMS.sourceName || "the source guides")}). Each member's Held Item, personality and stat priority is from our Game8 build data. Metas shift with every patch.</p>
    <div class="tm-grid">${TEAMS.teams.map(teamCard).join("")}</div>
    <p class="tool-note"><a href="${esc(TEAMS.source)}" target="_blank" rel="noopener">Primary source ↗</a></p>`;
}

/* ---- Individual builds ---- */
function buildControls() {
  els.controls.innerHTML = `<input type="search" id="f-search" class="search-input" placeholder="Search builds…" autocomplete="off" value="${esc(query)}">`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderBuilds(); });
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

function renderBuilds() {
  const q = query;
  const list = BUILDS.builds.filter((b) => !q || b.name.toLowerCase().includes(q) || b.statPriority.toLowerCase().includes(q));
  els.progress.textContent = `${list.length} of ${BUILDS.count} builds`;
  els.list.innerHTML = list.length ? `<div class="dr-grid">${list.map(card).join("")}</div>` : `<p class="no-results">No builds match.</p>`;
}

(async function init() {
  try {
    const [builds, teams, creatures] = await Promise.all([
      fetch(`../../data/aniimo/builds.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/aniimo/teams.json?cb=${Date.now()}`).then((r) => r.json()).catch(() => null),
      fetch(`../../data/aniimo/creatures.json?cb=${Date.now()}`).then((r) => r.json()).catch(() => null),
    ]);
    BUILDS = builds; TEAMS = teams;
    CREATURES = creatures ? creatures.creatures : [];
    byCreature = new Map(CREATURES.map((c) => [c.name.toLowerCase(), c]));
    byBuild = new Map(BUILDS.builds.map((b) => [b.name.toLowerCase(), b]));
    const upd = BUILDS.updated ? new Date(BUILDS.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("ab-updated").textContent = `${(TEAMS && TEAMS.teams ? TEAMS.teams.length : 0)} team comps · ${BUILDS.count} individual builds · updated ${upd}`;
    renderTeams();
    buildControls();
    renderBuilds();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load Aniimo build data.</p>`;
  }
})();
