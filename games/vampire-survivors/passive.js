/* Vampire Survivors — single Passive item page.
   Deep-link: passive.html?slug=hollow-heart. Passives don't evolve on
   their own the way weapons do (they combine WITH a weapon to make it
   evolve) — this page is a lighter stats-and-description card than a
   weapon's, plus the reverse of an Arcana's own "affects" list: which
   Arcanas call this item out by name. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const root = document.getElementById("vp-root");

function statsTable(p) {
  const rows = [
    ["Stat", p.stat], ["Rarity", p.rarity], ["Max level", p.maxLevel],
    ["Per level", p.perLevel], ["Stacking", p.stacking], ["Max effect", p.maxEffect],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return `<table class="vs-stat-table"><tbody>${rows.map(([label, v]) => `<tr><td>${esc(label)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`;
}

function usedByArcanas(p, arcanas) {
  const matches = arcanas.filter((a) => a.affects.includes(p.name));
  if (!matches.length) return "";
  return `<section class="panel"><h2>Arcanas</h2><p class="pw-build-note">${matches.map((a) => `<a class="vs-xref" href="arcana.html?slug=${encodeURIComponent(a.slug)}">${esc(a.name)}</a>`).join(", ")}</p></section>`;
}

function render(p, arcanas, xrefIndex) {
  document.title = `${p.name} · Vampire Survivors · NightmareFTW`;
  document.getElementById("bc-passive").textContent = p.name;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(p.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(p.name)}</h1>
        <div class="pw-detail-chips"><span class="ev-chip">${esc(p.dlcName)}</span></div>
      </div>
    </div>

    ${p.description ? `<p class="pw-desc">${VSXref.linkify(p.description, xrefIndex)}</p>` : ""}

    ${statsTable(p) ? `<section class="panel"><h2>Stats</h2>${statsTable(p)}</section>` : ""}
    ${usedByArcanas(p, arcanas)}

    <p class="tool-note"><a class="mini-btn" href="weapons.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [passivesData, arcanasData, weaponsData, charsData, enemiesData] = await Promise.all([
      fetch(`../../data/vampire-survivors/passives.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/arcanas.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/enemies.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const p = passivesData.passives.find((x) => x.slug === slug);
    if (!p) { root.innerHTML = `<p class="tool-note">Not found. <a class="mini-btn" href="weapons.html">Back to the database →</a></p>`; return; }
    const entities = [
      ...charsData.characters.map((x) => ({ name: x.name, type: "character", href: `character.html?slug=${encodeURIComponent(x.slug)}` })),
      ...enemiesData.enemies.map((x) => ({ name: x.name, type: "enemy", href: `enemy.html?slug=${encodeURIComponent(x.slug)}` })),
      ...weaponsData.weapons.map((x) => ({ name: x.name, type: "weapon", href: `weapon.html?slug=${encodeURIComponent(x.slug)}` })),
    ];
    const xrefIndex = VSXref.buildXrefIndex(entities);
    VSXref.initXrefPopup(xrefIndex);
    render(p, arcanasData.arcanas, xrefIndex);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load passive item data.</p>`;
  }
})();
