/* Vampire Survivors — single Enemy page.
   Deep-link: enemy.html?slug=avatar-infernas-enemy. Any character, weapon
   or other enemy named in the description links to its own page — with a
   disambiguation popup when that exact name is shared by more than one of
   them (see assets/js/vs-xref.js). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const root = document.getElementById("ve-root");

function statsTable(e, xrefIndex) {
  const rows = [
    ["Health", esc(e.health)], ["Damage", esc(e.damage)], ["Move speed", esc(e.movespeed)],
    ["Stages", e.stages ? VSXref.linkify(e.stages, xrefIndex, e.name) : ""],
    ["Theme", esc(e.theme)], ["Skills", esc(e.skills)], ["Resistances", esc(e.resistances)],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return `<table class="vs-stat-table"><tbody>${rows.map(([label, v]) => `<tr><td>${esc(label)}</td><td>${v}</td></tr>`).join("")}</tbody></table>`;
}

function render(e, xrefIndex) {
  document.title = `${e.name} · Vampire Survivors · NightmareFTW`;
  document.getElementById("bc-enemy").textContent = e.name;
  const stats = statsTable(e, xrefIndex);

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(e.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(e.name)}</h1>
        <div class="pw-detail-chips"><span class="ev-chip">${esc(e.dlcName)}</span></div>
      </div>
    </div>

    ${e.description ? `<p class="pw-desc">${VSXref.linkify(e.description, xrefIndex, e.name)}</p>` : ""}

    ${stats ? `<section class="panel"><h2>Stats</h2>${stats}${e.notes ? `<p class="tool-note" style="margin-top:10px">${VSXref.linkify(e.notes, xrefIndex, e.name)}</p>` : ""}</section>` : ""}

    <p class="tool-note"><a class="mini-btn" href="enemies.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [enemiesData, charsData, weaponsData, stagesData, pickupsData] = await Promise.all([
      fetch(`../../data/vampire-survivors/enemies.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/stages.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/pickups.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const e = enemiesData.enemies.find((x) => x.slug === slug);
    if (!e) { root.innerHTML = `<p class="tool-note">Enemy not found. <a class="mini-btn" href="enemies.html">Back to the database →</a></p>`; return; }
    const entities = [
      ...enemiesData.enemies.map((x) => ({ name: x.name, type: "enemy", href: `enemy.html?slug=${encodeURIComponent(x.slug)}` })),
      ...charsData.characters.map((x) => ({ name: x.name, type: "character", href: `character.html?slug=${encodeURIComponent(x.slug)}` })),
      ...weaponsData.weapons.map((x) => ({ name: x.name, type: "weapon", href: `weapon.html?slug=${encodeURIComponent(x.slug)}` })),
      ...stagesData.stages.map((x) => ({ name: x.name, type: "stage", href: `stage.html?slug=${encodeURIComponent(x.slug)}` })),
      ...pickupsData.pickups.map((x) => ({ name: x.name, type: "pickup", href: `pickup.html?slug=${encodeURIComponent(x.slug)}` })),
    ];
    const xrefIndex = VSXref.buildXrefIndex(entities);
    VSXref.initXrefPopup(xrefIndex);
    render(e, xrefIndex);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load enemy data.</p>`;
  }
})();
