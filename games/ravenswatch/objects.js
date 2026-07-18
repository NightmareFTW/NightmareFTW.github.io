/* Ravenswatch — Magical Objects.
   Renders the objects from data/ravenswatch/data.json, grouped by the game's
   five rarities. Filter by rarity or search names, types and effects. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("ro-root");
const rarBar = document.getElementById("ro-rarities");
let DATA = null, rarFilter = "all", query = "";

// The game's rarity ladder, in ascending order.
const RARITIES = ["Common", "Rare", "Epic", "Legendary", "Cursed"];
const rarRank = (r) => { const i = RARITIES.indexOf(r); return i < 0 ? RARITIES.length : i; };
const rarClass = (r) => "rar-" + String(r || "").toLowerCase();

function card(o) {
  return `<div class="dr-card rw-object ${rarClass(o.rarity)}">
    <div class="rw-o-head">
      ${o.icon ? `<img class="rw-o-icon" src="${esc(o.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
      <div>
        <span class="dr-name">${esc(o.name)}</span>
        <div class="rw-o-meta">
          <span class="ev-chip rw-rar">${esc(o.rarity)}</span>
          ${o.type ? `<span class="ev-chip">${esc(o.type)}</span>` : ""}
        </div>
      </div>
    </div>
    ${o.effect ? `<p class="rw-t-effect">${esc(o.effect)}</p>` : ""}
    ${o.setBonus ? `<p class="rw-t-rarity"><b>Set bonus</b> ${esc(o.setBonus)}</p>` : ""}
  </div>`;
}

function render() {
  const q = query.toLowerCase();
  const list = DATA.objects
    .filter((o) => (rarFilter === "all" || o.rarity === rarFilter) &&
      (!q || (o.name + " " + o.type + " " + o.effect + " " + o.setBonus).toLowerCase().includes(q)))
    .sort((a, b) => rarRank(a.rarity) - rarRank(b.rarity) || a.name.localeCompare(b.name));
  root.innerHTML = list.length
    ? `<p class="codes-updated">${list.length} object${list.length === 1 ? "" : "s"}</p><div class="dr-grid">${list.map(card).join("")}</div>`
    : `<p class="no-results">No objects match.</p>`;
}

function renderBar() {
  const present = RARITIES.filter((r) => DATA.objects.some((o) => o.rarity === r));
  rarBar.innerHTML = `<button class="filter-btn${rarFilter === "all" ? " active" : ""}" data-r="all">All</button>` +
    present.map((r) => `<button class="filter-btn ${rarClass(r)}${rarFilter === r ? " active" : ""}" data-r="${esc(r)}">${esc(r)}</button>`).join("");
  rarBar.querySelectorAll("[data-r]").forEach((b) =>
    b.addEventListener("click", () => { rarFilter = b.dataset.r; renderBar(); render(); }));
}

document.getElementById("ro-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/ravenswatch/data.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("ro-updated").textContent = `${DATA.objects.length} magical objects · updated ${upd}`;
    renderBar();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the object data yet — the updater hasn't published it.</p>`;
  }
})();
