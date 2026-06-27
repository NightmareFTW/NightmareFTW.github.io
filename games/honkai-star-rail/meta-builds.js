/* Honkai: Star Rail — Meta Builds (team comps).
   Renders data/honkai-star-rail/teams.json (scraped from Game8 by
   scripts/update-hsr-teams.js). Teams grouped by element then by DPS, with a
   live search and element filter. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("mb-root");
const elBar = document.getElementById("mb-elements");
let DATA = null, element = "all", query = "";

const roleClass = (r) => "role-" + (/dps/i.test(r) ? "DPS" : /sustain|heal|shield/i.test(r) ? "Survival" : "Buff");

function member(m, isCarry) {
  return `<div class="comp-member${isCarry ? " is-carry" : ""}" title="${esc(m.name)}${m.role ? " · " + esc(m.role) : ""}">
    <span class="comp-portrait"><img src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.comp-portrait').classList.add('no-img')"></span>
    <span class="comp-mname">${esc(m.name)}</span>
    ${m.role ? `<span class="comp-role ${roleClass(m.role)}">${esc(m.role)}</span>` : ""}
  </div>`;
}

function teamCard(t) {
  return `<div class="team-comp">
    <span class="comp-label">${esc(t.label)}</span>
    <div class="comp-members">${t.members.map((m, i) => member(m, i === 0)).join("")}</div>
  </div>`;
}

function dpsBlock(name, img, teams) {
  return `<div class="dps-block">
    <div class="dps-head">
      <span class="comp-portrait"><img src="${esc(img)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.comp-portrait').classList.add('no-img')"></span>
      <span class="dps-name">${esc(name)}</span>
      <span class="dps-count">${teams.length} team${teams.length > 1 ? "s" : ""}</span>
    </div>
    ${teams.map(teamCard).join("")}
  </div>`;
}

function render() {
  const q = query.toLowerCase();
  const blocks = DATA.elements
    .filter((e) => element === "all" || e.element === element)
    .map((e) => {
      const teams = e.teams.filter((t) => !q || t.members.some((m) => m.name.toLowerCase().includes(q)));
      if (!teams.length) return "";
      // Group consecutive teams by their carry (members[0]).
      const groups = [];
      for (const t of teams) {
        const dps = t.members[0];
        const last = groups[groups.length - 1];
        if (last && last.name === dps.name) last.teams.push(t);
        else groups.push({ name: dps.name, img: dps.img, teams: [t] });
      }
      return `<section class="mb-element">
        <h2 class="mb-el-head el-${esc(e.element)}"><span class="el-dot"></span>${esc(e.element)}</h2>
        <div class="dps-grid">${groups.map((g) => dpsBlock(g.name, g.img, g.teams)).join("")}</div>
      </section>`;
    }).join("");
  root.innerHTML = blocks || `<p class="no-results">No teams match.</p>`;
}

function renderTabs() {
  const els = ["all", ...DATA.elements.map((e) => e.element)];
  elBar.innerHTML = els.map((e) =>
    `<button class="filter-btn${e === element ? " active" : ""}" data-el="${esc(e)}">${e === "all" ? "All" : esc(e)}</button>`).join("");
  elBar.querySelectorAll("[data-el]").forEach((b) =>
    b.addEventListener("click", () => { element = b.dataset.el; renderTabs(); render(); }));
}

document.getElementById("mb-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/honkai-star-rail/teams.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const total = DATA.elements.reduce((n, e) => n + e.teams.length, 0);
    document.getElementById("mb-updated").textContent =
      `${total} team comps · v${DATA.version || "?"} meta · updated ${upd}`;
    renderTabs();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the team comps yet — the updater hasn't published them.</p>`;
  }
})();
