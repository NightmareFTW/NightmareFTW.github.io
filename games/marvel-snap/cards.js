/* Marvel Snap — Card Database.
   Renders data/marvel-snap/cards.json (scraped from Marvel Snap Zone). Grid of
   card art, filter by cost / archetype, search by name, click for full details.
   Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("cd-root");
const detail = document.getElementById("ms-detail");
let CARDS = [], query = "", cost = "all", tag = "all";

const TAGS = ["On Reveal", "Ongoing", "Destroy", "Discard", "Move", "No Ability", "Activate", "Merc"];

function cardArt(c) {
  return `<button class="ms-card" data-name="${esc(c.name)}" title="${esc(c.name)}">
    <img src="${esc(c.art)}" alt="${esc(c.name)} — ${c.cost}/${c.power}" loading="lazy" referrerpolicy="no-referrer">
  </button>`;
}

function openCard(name) {
  const c = CARDS.find((x) => x.name === name); if (!c) return;
  const tags = (c.tags || []).map((t) => `<span class="ev-chip">${esc(t)}</span>`).join("");
  const wrap = document.createElement("div");
  wrap.className = "ffw-overlay ms-overlay";
  wrap.innerHTML = `<div class="ffw-modal ms-modal" role="dialog" aria-modal="true">
    <button class="mini-btn ffw-close" aria-label="Close">close ×</button>
    <div class="ms-detail-grid">
      <img class="ms-detail-art" src="${esc(c.art)}" alt="${esc(c.name)}" referrerpolicy="no-referrer">
      <div>
        <h2 class="ffw-mname">${esc(c.name)}</h2>
        <div class="ms-stats"><span class="ms-stat ms-cost">${c.cost} Cost</span><span class="ms-stat ms-power">${c.power} Power</span></div>
        ${c.ability ? `<p class="ms-ability">${esc(c.ability)}</p>` : `<p class="ms-ability ms-noability">No ability.</p>`}
        ${tags ? `<div class="bd-team" style="margin:10px 0">${tags}</div>` : ""}
        <p class="ms-meta">${esc(c.pool || "—")}${c.type && c.type !== "Character" ? " · " + esc(c.type) : ""}</p>
        ${c.url ? `<a class="team-source-link" href="${esc(c.url)}" target="_blank" rel="noopener">View on Marvel Snap Zone ↗</a>` : ""}
      </div>
    </div>
  </div>`;
  document.body.appendChild(wrap); document.body.style.overflow = "hidden";
  const close = () => { wrap.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  wrap.querySelector(".ffw-close").addEventListener("click", close);
  document.addEventListener("keydown", onKey);
}

function render() {
  const q = query.toLowerCase();
  const list = CARDS.filter((c) =>
    (cost === "all" || (cost === "6" ? c.cost >= 6 : c.cost === +cost)) &&
    (tag === "all" || (c.tags || []).includes(tag)) &&
    (!q || c.name.toLowerCase().includes(q) || (c.ability || "").toLowerCase().includes(q)));
  root.innerHTML = list.length ? list.map(cardArt).join("") : `<p class="no-results">No cards match.</p>`;
  root.querySelectorAll("[data-name]").forEach((b) => b.addEventListener("click", () => openCard(b.dataset.name)));
  document.getElementById("cd-updated").textContent = `${list.length} of ${CARDS.length} cards`;
}

function chips() {
  document.getElementById("cd-cost").innerHTML = ["all", "0", "1", "2", "3", "4", "5", "6"]
    .map((c) => `<button class="filter-btn${c === cost ? " active" : ""}" data-cost="${c}">${c === "all" ? "All" : c === "6" ? "6+" : c}</button>`).join("");
  document.getElementById("cd-tags").innerHTML = ["all", ...TAGS]
    .map((t) => `<button class="filter-btn${t === tag ? " active" : ""}" data-tag="${esc(t)}">${t === "all" ? "All types" : esc(t)}</button>`).join("");
  document.querySelectorAll("[data-cost]").forEach((b) => b.addEventListener("click", () => { cost = b.dataset.cost; chips(); render(); }));
  document.querySelectorAll("[data-tag]").forEach((b) => b.addEventListener("click", () => { tag = b.dataset.tag; chips(); render(); }));
}

document.getElementById("cd-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    CARDS = (await (await fetch(`../../data/marvel-snap/cards.json?cb=${Date.now()}`)).json()).cards;
    chips();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the cards yet — the updater hasn't published them.</p>`;
  }
})();
