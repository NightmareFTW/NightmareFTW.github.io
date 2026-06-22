/* Honkai: Star Rail — Tier List.
   Renders data/honkai-star-rail/tier-list.json (auto-scraped from Game8 by
   scripts/update-hsr-tierlist.js). Portraits + names grouped by tier, with a
   live search. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("tier-root");
let DATA = null, query = "";

function render() {
  const q = query.toLowerCase();
  const rows = DATA.tiers.map((t) => {
    const chars = t.chars.filter((c) => !q || c.name.toLowerCase().includes(q));
    if (!chars.length) return "";
    const cards = chars.map((c) => `
      <div class="char-card hsr-char" title="${esc(c.name)}">
        <span class="char-portrait"><img src="${esc(c.img)}" alt="${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.char-portrait').classList.add('no-img')"></span>
        <span class="char-name">${esc(c.name)}</span>
      </div>`).join("");
    return `<div class="tier-row">
      <div class="tier-badge tier-${esc(t.tier)}">${esc(t.tier)}</div>
      <div class="tier-chars">${cards}</div>
    </div>`;
  }).join("");
  root.innerHTML = rows || `<p class="no-results">No characters match.</p>`;
}

document.getElementById("tl-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/honkai-star-rail/tier-list.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const total = DATA.tiers.reduce((n, t) => n + t.chars.length, 0);
    document.getElementById("tl-updated").textContent =
      `${total} characters · v${DATA.version || "?"} tier list · updated ${upd}`;
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the tier list yet — the updater hasn't published it.</p>`;
  }
})();
