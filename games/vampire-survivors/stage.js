/* Vampire Survivors — single Stage page.
   Deep-link: stage.html?slug=westwoods. A stage's own writeup routinely
   names the character it unlocks, the pickup found on it, or the Adventure
   stage before/after it — any of those becomes a link, same disambiguation
   popup as everywhere else (see assets/js/vs-xref.js). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const root = document.getElementById("vst-root");

function metaTable(s) {
  if (!s.meta.length) return "";
  return `<table class="vs-stat-table"><tbody>${s.meta.map((m) => `<tr><td>${esc(m.label)}</td><td>${esc(m.value)}</td></tr>`).join("")}</tbody></table>`;
}

function render(s, xrefIndex) {
  document.title = `${s.name} · Vampire Survivors · NightmareFTW`;
  document.getElementById("bc-stage").textContent = s.name;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(s.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(s.name)}</h1>
        <div class="pw-detail-chips">
          <span class="ev-chip">${esc(s.dlcName)}</span>
          ${s.type ? `<span class="ev-chip">${esc(s.type)}</span>` : ""}
          ${s.isAdventure ? `<span class="ev-chip">Adventure</span>` : ""}
        </div>
      </div>
    </div>

    ${s.caption ? `<p class="pw-desc" style="font-style:italic">"${VSXref.linkify(s.caption, xrefIndex, s.name)}"</p>` : ""}
    ${s.description ? `<p class="pw-desc">${VSXref.linkify(s.description, xrefIndex, s.name)}</p>` : ""}

    ${metaTable(s) ? `<section class="panel"><h2>Stage Rules</h2>${metaTable(s)}</section>` : ""}

    <p class="tool-note"><a class="mini-btn" href="stages.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [stagesData, charsData, weaponsData, enemiesData, pickupsData] = await Promise.all([
      fetch(`../../data/vampire-survivors/stages.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/enemies.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/pickups.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const s = stagesData.stages.find((x) => x.slug === slug);
    if (!s) { root.innerHTML = `<p class="tool-note">Stage not found. <a class="mini-btn" href="stages.html">Back to the database →</a></p>`; return; }
    const entities = [
      ...stagesData.stages.map((x) => ({ name: x.name, type: "stage", href: `stage.html?slug=${encodeURIComponent(x.slug)}` })),
      ...charsData.characters.map((x) => ({ name: x.name, type: "character", href: `character.html?slug=${encodeURIComponent(x.slug)}` })),
      ...weaponsData.weapons.map((x) => ({ name: x.name, type: "weapon", href: `weapon.html?slug=${encodeURIComponent(x.slug)}` })),
      ...enemiesData.enemies.map((x) => ({ name: x.name, type: "enemy", href: `enemy.html?slug=${encodeURIComponent(x.slug)}` })),
      ...pickupsData.pickups.map((x) => ({ name: x.name, type: "pickup", href: `pickup.html?slug=${encodeURIComponent(x.slug)}` })),
    ];
    const xrefIndex = VSXref.buildXrefIndex(entities);
    VSXref.initXrefPopup(xrefIndex);
    render(s, xrefIndex);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load stage data.</p>`;
  }
})();
