/* Ravenswatch — Hero Reference.
   Renders data/ravenswatch/data.json (scraped from the wiki by
   scripts/update-ravenswatch.js). Hero grid; click a hero for their full
   ability kit, grouped by form/spell school where the hero has them. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("rw-root");
const detail = document.getElementById("rw-detail");
let DATA = null, query = "";

const portraitHTML = (img, name, cls) =>
  `<span class="${cls}"><img src="${esc(img)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.${cls}').classList.add('no-img')"></span>`;

function abilityHTML(a) {
  return `<div class="rw-ability${a.sub ? " rw-sub" : ""}">
    <div class="rw-ab-head">
      ${a.icon ? `<img class="rw-ab-icon" src="${esc(a.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
      <div>
        <span class="rw-kind">${esc(a.kind)}</span>
        <span class="rw-ab-name">${esc(a.name)}</span>
        ${a.unlock ? `<span class="rw-unlock">${esc(a.unlock)}</span>` : ""}
      </div>
    </div>
    ${a.effects.length ? `<ul class="rw-fx">${a.effects.map((f) => `<li${f.sub ? ' class="rw-fx-sub"' : ""}>${esc(f.text)}</li>`).join("")}</ul>` : ""}
  </div>`;
}

function showHero(name) {
  const h = DATA.heroes.find((x) => x.name === name);
  if (!h) return;
  // keep the wiki's order but group anything that carries a form/school label
  const groups = [];
  for (const a of h.abilities) {
    const g = a.sub ? "" : a.group; // sub-abilities sit under their parent, not a form
    const last = groups[groups.length - 1];
    if (last && last.label === g) last.items.push(a);
    else groups.push({ label: g, items: [a] });
  }
  detail.style.display = "block";
  detail.innerHTML = `
    <div class="bd-head">
      <div class="bd-title">
        ${portraitHTML(h.art, h.name, "bd-portrait")}
        <div>
          <span class="bd-name">${esc(h.name)}</span>
          ${h.title ? `<span class="rw-epithet">${esc(h.title)}</span>` : ""}
          ${h.hp ? `<div style="margin-top:6px"><span class="ev-chip">${h.hp} max health</span><span class="ev-chip">${h.talents.length} talents</span></div>` : ""}
        </div>
      </div>
      <button class="mini-btn" id="rw-close">close ×</button>
    </div>
    ${groups.map((g) => `${g.label ? `<h3 class="rw-group">${esc(g.label)}</h3>` : ""}${g.items.map(abilityHTML).join("")}`).join("")}
    <p class="bd-credit">Kit compiled from the Ravenswatch Wiki · <a href="builds.html?hero=${encodeURIComponent(h.name)}" style="color:var(--accent)">${esc(h.name)}'s build directions</a> · <a href="talents.html" style="color:var(--accent)">all talents</a></p>`;
  detail.querySelector("#rw-close").addEventListener("click", () => { detail.style.display = "none"; });
  detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function render() {
  const q = query.toLowerCase();
  const list = DATA.heroes.filter((h) => !q || (h.name + " " + h.title).toLowerCase().includes(q));
  if (!list.length) { root.innerHTML = `<p class="no-results">No heroes match.</p>`; return; }
  root.innerHTML = list.map((h) => {
    const ult = h.abilities.filter((a) => /ULTIMATE/.test(a.kind) && !a.sub).length;
    return `<button class="char-card" data-hero="${esc(h.name)}">
      ${portraitHTML(h.art, h.name, "char-portrait")}
      <span class="char-name">${esc(h.name)}</span>
      <span class="role-chip role-Survival">${h.hp || "?"} HP</span>
      <span class="char-link">${h.abilities.length} abilities · ${ult} ultimates</span>
    </button>`;
  }).join("");
  root.querySelectorAll("[data-hero]").forEach((b) => b.addEventListener("click", () => showHero(b.dataset.hero)));
}

document.getElementById("rw-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/ravenswatch/data.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("rw-updated").textContent =
      `${DATA.heroes.length} heroes · ${DATA.heroes.reduce((n, h) => n + h.talents.length, 0)} talents · updated ${upd}`;
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the hero data yet — the updater hasn't published it.</p>`;
  }
})();
