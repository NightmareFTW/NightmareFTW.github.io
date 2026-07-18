/* Ravenswatch — Build Directions.
   Ravenswatch has no fixed loadouts: a build is whatever talents you pick during
   the run. scripts/update-ravenswatch.js groups each hero's 26 talents by the
   keyword they share (the game's own mechanic words, in caps in the talent
   text), which is exactly the wiki's advice for steering a run. This renders
   those themes per hero, with the talents that feed each one. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("rb-root");
const heroBar = document.getElementById("rb-heroes");
let DATA = null, hero = null;

const portrait = (img, name, cls) =>
  `<span class="${cls}"><img src="${esc(img)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.${cls}').classList.add('no-img')"></span>`;

function talentRow(t, isStarter) {
  return `<div class="rw-b-talent${isStarter ? " is-starter" : ""}">
    ${t.icon ? `<img class="rw-t-icon" src="${esc(t.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
    <div>
      <span class="rw-b-tname">${esc(t.name)}</span>
      ${isStarter ? `<span class="ev-chip rw-starter">from the start</span>` : `<span class="rw-unlock">${esc(t.unlock || t.type)}</span>`}
      ${t.effect ? `<p class="rw-t-effect">${esc(t.effect)}</p>` : ""}
    </div>
  </div>`;
}

function themeBlock(h, theme) {
  const starters = new Set(theme.starters);
  // openers first — those are the picks that actually set the run's direction
  const talents = theme.talents
    .map((n) => h.talents.find((t) => t.name === n))
    .filter(Boolean)
    .sort((a, b) => (starters.has(b.name) - starters.has(a.name)) || a.name.localeCompare(b.name));
  return `<section class="rw-theme">
    <h3 class="rw-theme-head">
      <span class="rw-keyword">${esc(theme.keyword)}</span>
      <span class="rw-theme-count">${theme.talents.length} talents${theme.starters.length ? ` · ${theme.starters.length} from the start` : ""}</span>
    </h3>
    <div class="rw-b-talents">${talents.map((t) => talentRow(t, starters.has(t.name))).join("")}</div>
  </section>`;
}

function render() {
  const h = DATA.heroes.find((x) => x.name === hero);
  if (!h) { root.innerHTML = ""; return; }
  const openers = h.talents.filter((t) => /starting/i.test(t.type));
  root.innerHTML = `
    <div class="panel">
      <div class="bd-head">
        <div class="bd-title">
          ${portrait(h.art, h.name, "bd-portrait")}
          <div>
            <span class="bd-name">${esc(h.name)}</span>
            ${h.title ? `<span class="rw-epithet">${esc(h.title)}</span>` : ""}
            <div style="margin-top:6px">
              ${h.hp ? `<span class="ev-chip">${h.hp} max health</span>` : ""}
              <span class="ev-chip">${h.talents.length} talents</span>
              <span class="ev-chip">${h.themes.length} build direction${h.themes.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
        <a class="mini-btn" href="heroes.html">see the full kit →</a>
      </div>

      ${h.themes.length
        ? h.themes.map((t) => themeBlock(h, t)).join("")
        : `<p class="tool-note">${esc(h.name)}'s talents don't converge on one keyword — their pool is generalist, so build around whichever starting talent you open with.</p>`}

      <h3 class="td-section">Openers</h3>
      <p class="td-sub">Talents available from the start</p>
      <div class="rw-b-talents">${openers.map((t) => talentRow(t, true)).join("")}</div>

      <p class="bd-credit">Derived from the Ravenswatch Wiki's talent tables.</p>
    </div>`;
}

function renderBar() {
  heroBar.innerHTML = DATA.heroes.map((h) =>
    `<button class="filter-btn${h.name === hero ? " active" : ""}" data-h="${esc(h.name)}">${esc(h.name)}</button>`).join("");
  heroBar.querySelectorAll("[data-h]").forEach((b) =>
    b.addEventListener("click", () => { hero = b.dataset.h; renderBar(); render(); }));
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/ravenswatch/data.json?cb=${Date.now()}`)).json();
    // deep-link from the Hero Reference: builds.html?hero=Beowulf
    const want = new URLSearchParams(location.search).get("hero");
    hero = (DATA.heroes.find((h) => h.name === want) || DATA.heroes[0]).name;
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const themes = DATA.heroes.reduce((n, h) => n + h.themes.length, 0);
    document.getElementById("rb-updated").textContent =
      `${DATA.heroes.length} heroes · ${themes} build directions · updated ${upd}`;
    renderBar();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the talent data yet — the updater hasn't published it.</p>`;
  }
})();
