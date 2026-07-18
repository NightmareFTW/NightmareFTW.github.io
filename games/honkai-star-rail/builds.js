/* Honkai: Star Rail — Character Builds.
   Renders data/honkai-star-rail/builds.json (scraped from each character's Game8
   guide by scripts/update-hsr-builds.js). Character grid; click a character to
   see their build (Light Cone, relics, main stats, substats). Vanilla JS. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("build-root");
const detail = document.getElementById("build-detail");
let DATA = null, query = "";

const roleClass = (r) => "role-" + (/dps|carry/i.test(r) ? "DPS" : /sustain|heal|shield|tank/i.test(r) ? "Survival" : "Buff");
const portraitHTML = (img, name, cls) =>
  `<span class="${cls}"><img src="${esc(img)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.${cls}').classList.add('no-img')"></span>`;

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

function showBuild(name) {
  const c = DATA.characters[name];
  if (!c) return;
  detail.style.display = "block";
  detail.innerHTML = `
    <div class="bd-head">
      <div class="bd-title">
        ${portraitHTML(c.img, name, "bd-portrait")}
        <div>
          <span class="bd-name">${esc(name)}</span>
          <div style="margin-top:6px">${c.builds.map((b) => b.role ? `<span class="role-chip ${roleClass(b.role)}">${esc(b.role)}</span>` : "").join(" ")}</div>
        </div>
      </div>
      <button class="mini-btn" id="bd-close">close ×</button>
    </div>
    ${c.builds.map(buildSection).join("")}
    <p class="bd-credit">Build compiled from Game8.</p>`;
  detail.querySelector("#bd-close").addEventListener("click", () => { detail.style.display = "none"; });
  detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function render() {
  const q = query.toLowerCase();
  const names = Object.keys(DATA.characters).filter((n) => !q || n.toLowerCase().includes(q)).sort();
  if (!names.length) { root.innerHTML = `<p class="no-results">No characters match.</p>`; return; }
  root.innerHTML = names.map((n) => {
    const c = DATA.characters[n];
    const role = (c.builds[0] && c.builds[0].role) || "";
    return `<button class="char-card" data-char="${esc(n)}">
      ${portraitHTML(c.img, n, "char-portrait")}
      <span class="char-name">${esc(n)}</span>
      ${role ? `<span class="role-chip ${roleClass(role)}">${esc(role)}</span>` : ""}
    </button>`;
  }).join("");
  root.querySelectorAll("[data-char]").forEach((b) => b.addEventListener("click", () => showBuild(b.dataset.char)));
}

document.getElementById("bd-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/honkai-star-rail/builds.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("bd-updated").textContent =
      `${Object.keys(DATA.characters).length} characters · v${DATA.version || "?"} builds · updated ${upd}`;
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the builds yet — the updater hasn't published them.</p>`;
  }
})();
