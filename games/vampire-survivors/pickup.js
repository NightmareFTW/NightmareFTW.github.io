/* Vampire Survivors — single Pickup page.
   Deep-link: pickup.html?slug=little-clover. A pickup's writeup routinely
   names the stage it drops on, the achievement/character it unlocks, or a
   character who interacts with it specially — any of those becomes a link,
   same disambiguation popup as everywhere else (see assets/js/vs-xref.js). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const root = document.getElementById("vpk-root");

function statsTable(p) {
  const rows = [
    ["Rarity", p.rarity], ["Unlock level", p.level],
    ["Luck", p.luckAffected ? "Drop rate is affected by Luck" : "Drop rate is not affected by Luck"],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return `<table class="vs-stat-table"><tbody>${rows.map(([label, v]) => `<tr><td>${esc(label)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`;
}

function render(p, xrefIndex) {
  document.title = `${p.name} · Vampire Survivors · NightmareFTW`;
  document.getElementById("bc-pickup").textContent = p.name;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(p.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(p.name)}</h1>
        <div class="pw-detail-chips"><span class="ev-chip">${esc(p.dlcName)}</span></div>
      </div>
    </div>

    ${p.caption ? `<p class="pw-desc" style="font-style:italic">"${esc(p.caption)}"</p>` : ""}
    ${p.description ? `<p class="pw-desc">${VSXref.linkify(p.description, xrefIndex, p.name)}</p>` : ""}

    ${statsTable(p) || p.effects || p.notes ? `<section class="panel"><h2>Effects</h2>
      ${statsTable(p)}
      ${p.effects ? `<p class="tool-note" style="margin-top:10px">${VSXref.linkify(p.effects, xrefIndex, p.name)}</p>` : ""}
      ${p.notes ? `<p class="tool-note" style="margin-top:10px">${VSXref.linkify(p.notes, xrefIndex, p.name)}</p>` : ""}
    </section>` : ""}

    <p class="tool-note"><a class="mini-btn" href="pickups.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [pickupsData, charsData, weaponsData, enemiesData, stagesData] = await Promise.all([
      fetch(`../../data/vampire-survivors/pickups.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/enemies.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/stages.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const p = pickupsData.pickups.find((x) => x.slug === slug);
    if (!p) { root.innerHTML = `<p class="tool-note">Pickup not found. <a class="mini-btn" href="pickups.html">Back to the database →</a></p>`; return; }
    const entities = [
      ...pickupsData.pickups.map((x) => ({ name: x.name, type: "pickup", href: `pickup.html?slug=${encodeURIComponent(x.slug)}` })),
      ...charsData.characters.map((x) => ({ name: x.name, type: "character", href: `character.html?slug=${encodeURIComponent(x.slug)}` })),
      ...weaponsData.weapons.map((x) => ({ name: x.name, type: "weapon", href: `weapon.html?slug=${encodeURIComponent(x.slug)}` })),
      ...enemiesData.enemies.map((x) => ({ name: x.name, type: "enemy", href: `enemy.html?slug=${encodeURIComponent(x.slug)}` })),
      ...stagesData.stages.map((x) => ({ name: x.name, type: "stage", href: `stage.html?slug=${encodeURIComponent(x.slug)}` })),
    ];
    const xrefIndex = VSXref.buildXrefIndex(entities);
    VSXref.initXrefPopup(xrefIndex);
    render(p, xrefIndex);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load pickup data.</p>`;
  }
})();
