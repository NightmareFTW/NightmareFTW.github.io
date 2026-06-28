/* Far Far West — Meta Builds.
   Renders data/far-far-west/builds.json (scraped from wikily.gg by
   scripts/update-ffw-builds.js). Builds grouped by primary weapon, top-rated
   first, each with the full loadout + images. Weapon filter + search. Vanilla JS. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("fb-root");
const wBar = document.getElementById("fb-weapons");
let DATA = null, weapon = "all", query = "";

const icon = (url, name) => url
  ? `<img src="${esc(url)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.ffw-icon').classList.add('no-img');this.remove()">`
  : "";

function slot(kind, item) {
  if (!item) return "";
  return `<div class="ffw-slot">
    <span class="ffw-icon" data-init="${esc((item.label[0] || "?").toUpperCase())}">${icon(item.icon, item.label)}</span>
    <div class="ffw-slot-txt"><span class="ffw-k">${kind}</span><b>${esc(item.label)}</b></div>
  </div>`;
}

function buildCard(b) {
  const spells = b.spells.map((s) =>
    `<span class="ffw-spell"><span class="ffw-icon ffw-icon-sm" data-init="${esc((s.label[0] || "?").toUpperCase())}">${icon(s.icon, s.label)}</span>${esc(s.label)}</span>`).join("");
  const extra = [
    b.hero ? `<span class="ffw-tag">🤠 ${esc(b.hero.label)}</span>` : "",
    b.mount ? `<span class="ffw-tag">🐎 ${esc(b.mount.label)}</span>` : "",
    b.gold ? `<span class="ffw-tag ffw-gold">G ${b.gold.toLocaleString()}</span>` : "",
    b.souls ? `<span class="ffw-tag ffw-souls">S ${b.souls.toLocaleString()}</span>` : "",
    b.jokers ? `<span class="ffw-tag">${b.jokers} Jokers</span>` : "",
  ].join("");
  return `<div class="ffw-build">
    <div class="ffw-bhead">
      <div class="ffw-btitle">
        <span class="ffw-bname">${esc(b.name)}</span>
        ${b.author ? `<span class="ffw-bauthor">by ${esc(b.author)}</span>` : ""}
      </div>
      <div class="ffw-bstats">
        <span class="ffw-votes" title="net community votes">▲ ${b.score}</span>
        ${b.level ? `<span class="ffw-lv">Lv ${b.level}${b.prestige ? " ★" : ""}</span>` : ""}
      </div>
    </div>
    <div class="ffw-loadout">
      ${slot("Primary", b.weapon)}${slot("Secondary", b.secondary)}${slot("Grenade", b.grenade)}
    </div>
    ${b.spells.length ? `<div class="ffw-spells"><span class="ffw-k">Spells</span><div class="ffw-spell-row">${spells}</div></div>` : ""}
    ${extra ? `<div class="ffw-extra">${extra}</div>` : ""}
    ${b.desc ? `<p class="ffw-desc">${esc(b.desc)}</p>` : ""}
  </div>`;
}

function render() {
  const q = query.toLowerCase();
  const list = DATA.builds.filter((b) =>
    (weapon === "all" || b.weapon.label === weapon) &&
    (!q || b.name.toLowerCase().includes(q) || (b.author || "").toLowerCase().includes(q)));
  if (!list.length) { root.innerHTML = `<p class="no-results">No builds match.</p>`; return; }

  if (weapon !== "all") { root.innerHTML = `<div class="ffw-grid">${list.map(buildCard).join("")}</div>`; return; }
  // Group by weapon (already sorted top-rated within the full list).
  const groups = [];
  for (const b of list) {
    const g = groups.find((x) => x.w === b.weapon.label);
    if (g) g.items.push(b); else groups.push({ w: b.weapon.label, icon: b.weapon.icon, items: [b] });
  }
  root.innerHTML = groups.map((g) => `
    <section class="ffw-wsec">
      <h2 class="ffw-whead"><span class="ffw-icon ffw-icon-sm">${icon(g.icon, g.w)}</span>${esc(g.w)} <span class="ffw-wcount">${g.items.length}</span></h2>
      <div class="ffw-grid">${g.items.map(buildCard).join("")}</div>
    </section>`).join("");
}

function renderTabs() {
  const order = [];
  for (const b of DATA.builds) if (!order.includes(b.weapon.label)) order.push(b.weapon.label);
  wBar.innerHTML = ["all", ...order].map((w) =>
    `<button class="filter-btn${w === weapon ? " active" : ""}" data-w="${esc(w)}">${w === "all" ? "All" : esc(w)}</button>`).join("");
  wBar.querySelectorAll("[data-w]").forEach((btn) =>
    btn.addEventListener("click", () => { weapon = btn.dataset.w; renderTabs(); render(); }));
}

document.getElementById("fb-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/far-far-west/builds.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("fb-updated").textContent = `${DATA.count} top-rated builds · updated ${upd}`;
    renderTabs();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the builds yet — the updater hasn't published them.</p>`;
  }
})();
