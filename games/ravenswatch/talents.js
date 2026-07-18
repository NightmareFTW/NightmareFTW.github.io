/* Ravenswatch — Talent Database.
   Renders the talents from data/ravenswatch/data.json. Filter by hero and by
   upgrade type, or search across names and effects. Vanilla JS. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("rt-root");
const heroBar = document.getElementById("rt-heroes");
const typeBar = document.getElementById("rt-types");
let DATA = null, ALL = [], heroFilter = "all", typeFilter = "all", query = "";

// Every talent, flattened with the hero it belongs to.
const flatten = (heroes) => heroes.flatMap((h) => h.talents.map((t) => Object.assign({ hero: h.name }, t)));
const types = () => [...new Set(ALL.map((t) => t.type).filter(Boolean))].sort();

function card(t) {
  return `<div class="dr-card rw-talent">
    <div class="rw-t-head">
      ${t.icon ? `<img class="rw-t-icon" src="${esc(t.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
      <div>
        <span class="dr-name">${esc(t.name)}</span>
        <div class="rw-t-meta">
          <span class="ev-chip">${esc(t.hero)}</span>
          ${t.type ? `<span class="ev-chip">${esc(t.type)}</span>` : ""}
          ${t.unlock ? `<span class="rw-unlock">${esc(t.unlock)}</span>` : ""}
        </div>
      </div>
    </div>
    ${t.effect ? `<p class="rw-t-effect">${esc(t.effect)}</p>` : ""}
    ${t.perRarity ? `<p class="rw-t-rarity"><b>Per rarity</b> ${esc(t.perRarity)}</p>` : ""}
  </div>`;
}

function render() {
  const q = query.toLowerCase();
  const list = ALL.filter((t) =>
    (heroFilter === "all" || t.hero === heroFilter) &&
    (typeFilter === "all" || t.type === typeFilter) &&
    (!q || (t.name + " " + t.effect + " " + t.perRarity).toLowerCase().includes(q)));
  root.innerHTML = list.length
    ? `<p class="codes-updated">${list.length} talent${list.length === 1 ? "" : "s"}</p><div class="dr-grid">${list.map(card).join("")}</div>`
    : `<p class="no-results">No talents match.</p>`;
}

function chips(bar, values, current, onPick) {
  bar.innerHTML = `<button class="filter-btn${current === "all" ? " active" : ""}" data-v="all">All</button>` +
    values.map((v) => `<button class="filter-btn${current === v ? " active" : ""}" data-v="${esc(v)}">${esc(v)}</button>`).join("");
  bar.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => onPick(b.dataset.v)));
}

function renderBars() {
  chips(heroBar, DATA.heroes.map((h) => h.name), heroFilter, (v) => { heroFilter = v; renderBars(); render(); });
  chips(typeBar, types(), typeFilter, (v) => { typeFilter = v; renderBars(); render(); });
}

document.getElementById("rt-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/ravenswatch/data.json?cb=${Date.now()}`)).json();
    ALL = flatten(DATA.heroes);
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("rt-updated").textContent = `${ALL.length} talents across ${DATA.heroes.length} heroes · updated ${upd}`;
    renderBars();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the talent data yet — the updater hasn't published it.</p>`;
  }
})();
