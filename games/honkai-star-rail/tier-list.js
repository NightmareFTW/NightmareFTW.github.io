/* Honkai: Star Rail — Tier List.
   Renders data/honkai-star-rail/tier-list.json (auto-scraped from Game8 by
   scripts/update-hsr-tierlist.js). Portraits + names grouped by tier, with a
   live search.

   Clicking a character opens everything we know about them in one place: their
   builds (builds.json) and every meta team comp they appear in (teams.json),
   so the tier list doubles as the character reference. The dedicated Meta
   Builds tool still exists for browsing comps by element. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("tier-root");
const detail = document.getElementById("tier-detail");
let DATA = null, BUILDS = null, TEAMS = null, query = "";

const roleClass = (r) => "role-" + (/dps|carry/i.test(r) ? "DPS" : /sustain|heal|shield|tank/i.test(r) ? "Survival" : "Buff");
const portrait = (img, name, cls) =>
  `<span class="${cls}"><img src="${esc(img)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.${cls}').classList.add('no-img')"></span>`;

// ---- builds (same layout as the Character Builds tool) ----------------------
function buildSection(b) {
  const ms = b.mainStats;
  const slot = (k, v) => v ? `<div class="hb-slot"><b>${k}</b><span>${esc(v)}</span></div>` : "";
  return `<div class="hb-build">
    ${b.role ? `<span class="role-chip ${roleClass(b.role)} hb-role">${esc(b.role)}</span>` : ""}
    <div class="hb-gear">
      ${b.lightCone ? `<div class="hb-item"><span class="hb-k">Light Cone</span><span class="hb-v">${esc(b.lightCone)}</span></div>` : ""}
      ${b.relicSet ? `<div class="hb-item"><span class="hb-k">Relic Set · 4pc</span><span class="hb-v">${esc(b.relicSet)}</span></div>` : ""}
      ${b.ornament ? `<div class="hb-item"><span class="hb-k">Planar Ornament · 2pc</span><span class="hb-v">${esc(b.ornament)}</span></div>` : ""}
    </div>
    ${ms ? `<div class="hb-stats"><span class="hb-k">Main Stats</span><div class="hb-slots">
      ${slot("Body", ms.body)}${slot("Feet", ms.feet)}${slot("Sphere", ms.sphere)}${slot("Rope", ms.rope)}
    </div></div>` : ""}
    ${b.subStats ? `<div class="hb-stats"><span class="hb-k">Substat Priority</span><span class="hb-subs">${esc(b.subStats)}</span></div>` : ""}
    ${b.note ? `<p class="hb-note">${esc(b.note)}</p>` : ""}
  </div>`;
}

// ---- team comps (same layout as the Meta Builds tool) ----------------------
function member(m, isCarry, highlight) {
  return `<div class="comp-member${isCarry ? " is-carry" : ""}${m.name === highlight ? " is-focus" : ""}" title="${esc(m.name)}${m.role ? " · " + esc(m.role) : ""}">
    ${portrait(m.img, m.name, "comp-portrait")}
    <span class="comp-mname">${esc(m.name)}</span>
    ${m.role ? `<span class="comp-role ${roleClass(m.role)}">${esc(m.role)}</span>` : ""}
  </div>`;
}
function teamCard(t, highlight) {
  return `<div class="team-comp">
    <span class="comp-label">${esc(t.label)}${t.element ? ` · ${esc(t.element)}` : ""}</span>
    <div class="comp-members">${t.members.map((m, i) => member(m, i === 0, highlight)).join("")}</div>
  </div>`;
}

// Every comp the character appears in, carries first so their own teams lead.
function compsFor(name) {
  const out = [];
  for (const el of (TEAMS && TEAMS.elements) || []) {
    for (const t of el.teams) {
      const i = t.members.findIndex((m) => m.name === name);
      if (i >= 0) out.push(Object.assign({}, t, { element: el.element, _carry: i === 0 }));
    }
  }
  return out.sort((a, b) => (b._carry === true) - (a._carry === true));
}

function showChar(name, tier) {
  const c = (BUILDS && BUILDS.characters && BUILDS.characters[name]) || null;
  const comps = compsFor(name);
  const carries = comps.filter((t) => t._carry), supports = comps.filter((t) => !t._carry);
  const img = c ? c.img : (DATA.tiers.flatMap((t) => t.chars).find((x) => x.name === name) || {}).img;

  detail.style.display = "block";
  detail.innerHTML = `
    <div class="bd-head">
      <div class="bd-title">
        ${portrait(img, name, "bd-portrait")}
        <div>
          <span class="bd-name">${esc(name)}</span>
          <div style="margin-top:6px">
            <span class="tier-badge tier-${esc(tier)} tier-inline">${esc(tier)}</span>
            ${c ? c.builds.map((b) => b.role ? `<span class="role-chip ${roleClass(b.role)}">${esc(b.role)}</span>` : "").join(" ") : ""}
          </div>
        </div>
      </div>
      <button class="mini-btn" id="td-close">close ×</button>
    </div>

    <h3 class="td-section">Builds</h3>
    ${c ? c.builds.map(buildSection).join("")
      : `<p class="tool-note">No build published for ${esc(name)} yet.</p>`}

    <h3 class="td-section">Team comps${comps.length ? ` <span class="td-count">${comps.length}</span>` : ""}</h3>
    ${carries.length ? `<p class="td-sub">As the carry</p><div class="td-comps">${carries.map((t) => teamCard(t, name)).join("")}</div>` : ""}
    ${supports.length ? `<p class="td-sub">Playing support</p><div class="td-comps">${supports.map((t) => teamCard(t, name)).join("")}</div>` : ""}
    ${comps.length ? "" : `<p class="tool-note">${esc(name)} isn't in a featured meta team right now.</p>`}

    <p class="bd-credit">Compiled from Game8 · <a href="meta-builds.html" style="color:var(--accent)">browse all team comps</a></p>`;
  detail.querySelector("#td-close").addEventListener("click", () => { detail.style.display = "none"; });
  detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function render() {
  const q = query.toLowerCase();
  const rows = DATA.tiers.map((t) => {
    const chars = t.chars.filter((c) => !q || c.name.toLowerCase().includes(q));
    if (!chars.length) return "";
    const cards = chars.map((c) => `
      <button class="char-card hsr-char" title="${esc(c.name)}" data-char="${esc(c.name)}" data-tier="${esc(t.tier)}">
        ${portrait(c.img, c.name, "char-portrait")}
        <span class="char-name">${esc(c.name)}</span>
      </button>`).join("");
    return `<div class="tier-row">
      <div class="tier-badge tier-${esc(t.tier)}">${esc(t.tier)}</div>
      <div class="tier-chars">${cards}</div>
    </div>`;
  }).join("");
  root.innerHTML = rows || `<p class="no-results">No characters match.</p>`;
  root.querySelectorAll("[data-char]").forEach((b) =>
    b.addEventListener("click", () => showChar(b.dataset.char, b.dataset.tier)));
}

document.getElementById("tl-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  const grab = async (f) => {
    try { return await (await fetch(`../../data/honkai-star-rail/${f}?cb=${Date.now()}`)).json(); }
    catch (e) { return null; } // builds/teams are optional extras on this page
  };
  try {
    [DATA, BUILDS, TEAMS] = await Promise.all([grab("tier-list.json"), grab("builds.json"), grab("teams.json")]);
    if (!DATA) throw new Error("no tier list");
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const total = DATA.tiers.reduce((n, t) => n + t.chars.length, 0);
    document.getElementById("tl-updated").textContent =
      `${total} characters · v${DATA.version || "?"} tier list · updated ${upd}`;
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the tier list yet — the updater hasn't published it.</p>`;
  }
})();
