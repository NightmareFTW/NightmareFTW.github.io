/* Far Far West — Meta Builds.
   Renders data/far-far-west/builds.json (scraped from wikily.gg by
   scripts/update-ffw-builds.js). Builds grouped by primary weapon, top-rated
   first. Card = preview; click opens the full build (loadout, joker rarities,
   weapon stats, spells, hero, mount) imported from the site. Vanilla JS. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("fb-root");
const wBar = document.getElementById("fb-weapons");
let DATA = null, weapon = "all", query = "", BY_ID = {};

const RARITY = { Normal: "#9aa0a6", Common: "#9aa0a6", Prime: "#5bd6a0", Rare: "#5bc8e8", Unique: "#5bc8e8", Epic: "#b482ff", Legendary: "#e8c84a", Mythic: "#ff5a5a" };
const icon = (url, name, cls) => url
  ? `<img src="${esc(url)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.${cls}').classList.add('no-img');this.remove()">`
  : "";

/* ---------- card (preview) ---------- */
function slot(kind, item) {
  if (!item) return "";
  return `<div class="ffw-slot">
    <span class="ffw-icon" data-init="${esc((item.label[0] || "?").toUpperCase())}">${icon(item.icon, item.label, "ffw-icon")}</span>
    <div class="ffw-slot-txt"><span class="ffw-k">${kind}</span><b>${esc(item.label)}</b></div>
  </div>`;
}
function buildCard(b) {
  const spells = b.spells.map((s) =>
    `<span class="ffw-spell"><span class="ffw-icon ffw-icon-sm" data-init="${esc((s.label[0] || "?").toUpperCase())}">${icon(s.icon, s.label, "ffw-icon")}</span>${esc(s.label)}</span>`).join("");
  return `<button class="ffw-build ffw-build-btn" data-id="${esc(b.id)}">
    <div class="ffw-bhead">
      <div class="ffw-btitle"><span class="ffw-bname">${esc(b.name)}</span>${b.author ? `<span class="ffw-bauthor">by ${esc(b.author)}</span>` : ""}</div>
      <div class="ffw-bstats"><span class="ffw-votes" title="net community votes">▲ ${b.score}</span>${b.level ? `<span class="ffw-lv">Lv ${b.level}${b.prestige ? " ★" : ""}</span>` : ""}</div>
    </div>
    <div class="ffw-loadout">${slot("Primary", b.weapon)}${slot("Secondary", b.secondary)}${slot("Grenade", b.grenade)}</div>
    ${b.spells.length ? `<div class="ffw-spells"><span class="ffw-k">Spells</span><div class="ffw-spell-row">${spells}</div></div>` : ""}
    <span class="ffw-open">View full build →</span>
  </button>`;
}

/* ---------- detail modal ---------- */
const jokerRow = (arr) => !arr || !arr.length ? "" :
  `<div class="ffw-jokers">${arr.map((j) => {
    const name = typeof j === "string" ? j : j.name, rarity = typeof j === "string" ? j : j.rarity;
    return `<span class="ffw-jk" style="--c:${RARITY[rarity] || "#9aa0a6"}" title="${esc(rarity)} joker">${esc(name)}</span>`;
  }).join("")}</div>`;

function weaponBlock(label, w, stats, jokers) {
  if (!w) return "";
  const st = stats ? [["DPS", stats.dps], ["DMG", stats.dmg], ["Mag", stats.mag], ["Reload", stats.reload != null ? stats.reload + "s" : null]]
    .filter(([, v]) => v != null && v !== 0).map(([k, v]) => `<span class="ffw-statchip"><em>${k}</em>${v}</span>`).join("") : "";
  return `<div class="ffw-wblock">
    <span class="ffw-wrender" data-init="${esc((w.label[0] || "?").toUpperCase())}">${icon(w.render || w.icon, w.label, "ffw-wrender")}</span>
    <div class="ffw-wmeta">
      <span class="ffw-k">${label}${w.element ? ` · ${esc(w.element)}` : ""}</span>
      <b>${esc(w.label)}</b>
      ${jokerRow(jokers)}
      ${st ? `<div class="ffw-stats">${st}</div>` : ""}
    </div>
  </div>`;
}

function openDetail(id) {
  const b = BY_ID[id]; if (!b) return;
  const s = b.stats || {}, jl = b.jokerLayout || {};
  const spells = b.spells.map((sp) =>
    `<div class="ffw-dspell"><span class="ffw-icon ffw-icon-sm" data-init="${esc((sp.label[0] || "?").toUpperCase())}">${icon(sp.icon, sp.label, "ffw-icon")}</span><div><b>${esc(sp.label)}</b>${sp.school ? `<span class="ffw-k">${esc(sp.school)}</span>` : ""}</div></div>`).join("");
  const tags = (b.tags || []).map((t) => `<span class="ffw-tag">#${esc(t)}</span>`).join("");
  const meta = [
    b.gold ? `<span class="ffw-tag ffw-gold">G ${b.gold.toLocaleString()}</span>` : "",
    b.souls ? `<span class="ffw-tag ffw-souls">S ${b.souls.toLocaleString()}</span>` : "",
    b.jokers ? `<span class="ffw-tag">${b.jokers} Jokers</span>` : "",
    b.level ? `<span class="ffw-tag">Lv ${b.level}${b.prestige ? " ★ Prestige" : ""}</span>` : "",
  ].join("");

  const wrap = document.createElement("div");
  wrap.className = "ffw-overlay";
  wrap.innerHTML = `<div class="ffw-modal" role="dialog" aria-modal="true">
    <button class="mini-btn ffw-close" aria-label="Close">close ×</button>
    <div class="ffw-mhead">
      <div><h2 class="ffw-mname">${esc(b.name)}</h2>${b.author ? `<span class="ffw-bauthor">by ${esc(b.author)}</span>` : ""}</div>
      <span class="ffw-votes ffw-mvotes" title="net community votes">▲ ${b.score}</span>
    </div>
    ${meta ? `<div class="ffw-extra">${meta}</div>` : ""}
    ${b.desc ? `<p class="ffw-desc">${esc(b.desc)}</p>` : ""}
    <div class="ffw-section"><span class="ffw-k">Weapons</span>
      ${weaponBlock("Primary", b.weapon, s.primary, jl.primary)}
      ${weaponBlock("Secondary", b.secondary, s.secondary, jl.secondary)}
      ${b.grenade ? `<div class="ffw-wblock"><span class="ffw-wrender ffw-icon" data-init="${esc((b.grenade.label[0] || "?"))}">${icon(b.grenade.icon, b.grenade.label, "ffw-wrender")}</span><div class="ffw-wmeta"><span class="ffw-k">Grenade</span><b>${esc(b.grenade.label)}</b></div></div>` : ""}
    </div>
    ${b.spells.length ? `<div class="ffw-section"><span class="ffw-k">Spells</span><div class="ffw-dspells">${spells}</div></div>` : ""}
    ${(b.hero || b.mount) ? `<div class="ffw-section"><span class="ffw-k">Hero & Mount</span><div class="ffw-hm">
      ${b.hero ? `<div class="ffw-wblock"><span class="ffw-wrender" data-init="${esc((b.hero.label[0] || "?"))}">${icon(b.hero.render || b.hero.icon, b.hero.label, "ffw-wrender")}</span><div class="ffw-wmeta"><span class="ffw-k">Hero</span><b>${esc(b.hero.label)}</b>${jokerRow(jl.hero)}${s.hero ? `<div class="ffw-stats"><span class="ffw-statchip"><em>HP</em>${s.hero.hp}</span><span class="ffw-statchip"><em>SPD</em>${s.hero.speed}</span>${s.hero.spellCooldownReduction ? `<span class="ffw-statchip"><em>CDR</em>${s.hero.spellCooldownReduction}</span>` : ""}</div>` : ""}</div></div>` : ""}
      ${b.mount ? `<div class="ffw-wblock"><span class="ffw-wrender" data-init="${esc((b.mount.label[0] || "?"))}">${icon(b.mount.render, b.mount.label, "ffw-wrender")}</span><div class="ffw-wmeta"><span class="ffw-k">Mount</span><b>${esc(b.mount.label)}</b></div></div>` : ""}
    </div></div>` : ""}
    ${tags ? `<div class="ffw-extra">${tags}</div>` : ""}
    ${b.video ? `<a class="team-source-link" href="${esc(b.video)}" target="_blank" rel="noopener">▶ Watch the author's video</a>` : ""}
    <p class="bd-credit">Build by ${esc(b.author || "the community")} · imported from wikily.gg.</p>
  </div>`;
  document.body.appendChild(wrap);
  document.body.style.overflow = "hidden";
  const close = () => { wrap.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  wrap.querySelector(".ffw-close").addEventListener("click", close);
  document.addEventListener("keydown", onKey);
}

/* ---------- list + tabs ---------- */
function render() {
  const q = query.toLowerCase();
  const list = DATA.builds.filter((b) =>
    (weapon === "all" || b.weapon.label === weapon) &&
    (!q || b.name.toLowerCase().includes(q) || (b.author || "").toLowerCase().includes(q)));
  if (!list.length) { root.innerHTML = `<p class="no-results">No builds match.</p>`; return; }

  if (weapon !== "all") { root.innerHTML = `<div class="ffw-grid">${list.map(buildCard).join("")}</div>`; }
  else {
    const groups = [];
    for (const b of list) { const g = groups.find((x) => x.w === b.weapon.label); if (g) g.items.push(b); else groups.push({ w: b.weapon.label, icon: b.weapon.icon, items: [b] }); }
    root.innerHTML = groups.map((g) => `<section class="ffw-wsec">
      <h2 class="ffw-whead"><span class="ffw-icon ffw-icon-sm">${icon(g.icon, g.w, "ffw-icon")}</span>${esc(g.w)} <span class="ffw-wcount">${g.items.length}</span></h2>
      <div class="ffw-grid">${g.items.map(buildCard).join("")}</div></section>`).join("");
  }
  root.querySelectorAll("[data-id]").forEach((c) => c.addEventListener("click", () => openDetail(c.dataset.id)));
}

function renderTabs() {
  const order = [];
  for (const b of DATA.builds) if (!order.includes(b.weapon.label)) order.push(b.weapon.label);
  wBar.innerHTML = ["all", ...order].map((w) =>
    `<button class="filter-btn${w === weapon ? " active" : ""}" data-w="${esc(w)}">${w === "all" ? "All" : esc(w)}</button>`).join("");
  wBar.querySelectorAll("[data-w]").forEach((btn) => btn.addEventListener("click", () => { weapon = btn.dataset.w; renderTabs(); render(); }));
}

document.getElementById("fb-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/far-far-west/builds.json?cb=${Date.now()}`)).json();
    for (const b of DATA.builds) BY_ID[b.id] = b;
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("fb-updated").textContent = `${DATA.count} top-rated builds · click any for the full loadout · updated ${upd}`;
    renderTabs();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the builds yet — the updater hasn't published them.</p>`;
  }
})();
