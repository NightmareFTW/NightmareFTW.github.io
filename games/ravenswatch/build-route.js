/* Ravenswatch — Build Route Planner.
   Turns a hero's build-direction data (see builds.js/scripts/update-ravenswatch.js
   for how "themes" are derived from shared keywords) into an actionable draft
   priority list: talents active from the start need no picks; talents drafted
   mid-run are ordered by their account-Rank unlock requirement, since a talent
   your account hasn't unlocked yet can't be offered at all — lower Rank means
   more players (and earlier runs) can actually draw it; a Final-tier talent,
   if the theme reaches one, is the run's finisher.
   Draft offers are random (a choice among a few of your unlocked talents), so
   this is a priority list to take from when offered, not a guaranteed order —
   said plainly in the page's own note. Vanilla JS. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("rr-root");
const heroBar = document.getElementById("rr-heroes");
const themeBar = document.getElementById("rr-themes");
let DATA = null, hero = null, themeIndex = 0;

const portrait = (img, name, cls) =>
  `<span class="${cls}"><img src="${esc(img)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.${cls}').classList.add('no-img')"></span>`;

// "Unlocked by default" -> 0, "Unlocked at Rank 7" -> 7, "ULTIMATE 1/2" (tied
// to unlocking that ultimate, not a Rank) sort after all Rank-gated ones.
function unlockRank(u) {
  const m = /Rank\s+(\d+)/i.exec(u || "");
  if (m) return Number(m[1]);
  if (/default/i.test(u || "")) return 0;
  if (/ULTIMATE/i.test(u || "")) return 90;
  return 99;
}

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

function step(n, title, note, talents, isStarter) {
  return `<section class="rr-step">
    <h3 class="rr-step-head"><span class="rr-step-num">${n}</span>${esc(title)}</h3>
    <p class="rr-step-note">${note}</p>
    <div class="rw-b-talents">${talents.map((t) => talentRow(t, isStarter)).join("")}</div>
  </section>`;
}

function renderRoute(h, theme) {
  const byName = (n) => h.talents.find((t) => t.name === n);
  const talents = theme.talents.map(byName).filter(Boolean);
  const starting = talents.filter((t) => /starting/i.test(t.type));
  const standard = talents.filter((t) => /standard/i.test(t.type)).sort((a, b) => unlockRank(a.unlock) - unlockRank(b.unlock) || a.name.localeCompare(b.name));
  const final = talents.filter((t) => /final/i.test(t.type));

  const steps = [];
  if (starting.length) {
    steps.push(["Already active", "Auto-equipped from the start, no draft needed — this is what makes the theme worth opening into.", starting, true]);
  }
  if (standard.length) {
    steps.push(["Priority picks", "Take whichever of these you're offered, roughly top to bottom — talents earlier here need a lower account Rank, so they can show up for more runs.", standard, false]);
  }
  if (final.length) {
    steps.push(["Finisher", "This theme reaches one of the hero's Final-tier talents — grab it at the run's last pick if it's on offer.", final, false]);
  }
  const parts = steps.map(([title, note, list, isStarter], i) => step(i + 1, title, note, list, isStarter));
  if (!final.length) {
    parts.push(`<p class="tool-note">This theme doesn't reach a Final-tier talent — finish the run with whichever Final talent you're offered.</p>`);
  }

  const backup = h.themes.find((t) => t !== theme);
  return `
    <section class="rr-summary">
      <span class="rw-keyword">${esc(theme.keyword)}</span>
      <span class="rw-theme-count">${talents.length} of ${h.talents.length} talents${theme.starters.length ? ` · ${theme.starters.length} from the start` : ""}</span>
    </section>
    ${parts.join("")}
    ${backup ? `<p class="rr-backup">Not seeing these? ${esc(h.name)}'s next-strongest direction is <button type="button" class="rr-backup-btn" data-theme="${esc(backup.keyword)}">${esc(backup.keyword)}</button>.</p>` : ""}`;
}

function render() {
  const h = DATA.heroes.find((x) => x.name === hero);
  if (!h) { root.innerHTML = ""; return; }
  if (!h.themes.length) {
    root.innerHTML = `<p class="tool-note">${esc(h.name)}'s talents don't converge on one keyword — their pool is generalist, so there's no single route to plan around. Pick whatever synergizes with your first few picks instead.</p>`;
    return;
  }
  const theme = h.themes[Math.min(themeIndex, h.themes.length - 1)];
  root.innerHTML = `
    <div class="panel">
      <div class="bd-head">
        <div class="bd-title">
          ${portrait(h.art, h.name, "bd-portrait")}
          <div>
            <span class="bd-name">${esc(h.name)}</span>
            ${h.title ? `<span class="rw-epithet">${esc(h.title)}</span>` : ""}
          </div>
        </div>
        <a class="mini-btn" href="builds.html?hero=${encodeURIComponent(h.name)}">see all build directions →</a>
      </div>
      ${renderRoute(h, theme)}
    </div>`;
  root.querySelectorAll("[data-theme]").forEach((b) => b.addEventListener("click", () => {
    themeIndex = h.themes.findIndex((t) => t.keyword === b.dataset.theme);
    renderThemeBar();
    render();
  }));
}

function renderThemeBar() {
  const h = DATA.heroes.find((x) => x.name === hero);
  if (!h || !h.themes.length) { themeBar.innerHTML = ""; return; }
  themeBar.innerHTML = h.themes.map((t, i) =>
    `<button class="filter-btn${i === themeIndex ? " active" : ""}" data-i="${i}">${esc(t.keyword)}</button>`).join("");
  themeBar.querySelectorAll("[data-i]").forEach((b) =>
    b.addEventListener("click", () => { themeIndex = Number(b.dataset.i); renderThemeBar(); render(); }));
}

function renderHeroBar() {
  heroBar.innerHTML = DATA.heroes.map((h) =>
    `<button class="filter-btn${h.name === hero ? " active" : ""}" data-h="${esc(h.name)}">${esc(h.name)}</button>`).join("");
  heroBar.querySelectorAll("[data-h]").forEach((b) =>
    b.addEventListener("click", () => { hero = b.dataset.h; themeIndex = 0; renderHeroBar(); renderThemeBar(); render(); }));
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/ravenswatch/data.json?cb=${Date.now()}`)).json();
    const want = new URLSearchParams(location.search).get("hero");
    hero = (DATA.heroes.find((h) => h.name === want) || DATA.heroes[0]).name;
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("rr-updated").textContent = `${DATA.heroes.length} heroes · updated ${upd}`;
    renderHeroBar();
    renderThemeBar();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the talent data yet — the updater hasn't published it.</p>`;
  }
})();
