/* Aniimo — single Aniimo page.
   Deep-link: aniimo.html?slug=emberpup. Data comes from wiki.aniimo.com
   (the official game wiki) via scripts/update-aniimo.js: base stats,
   mobility, traits, skills (grouped by tab: Combat/Innate/...), the
   evolution line, habitats (region names — no map coordinates; see
   games/aniimo/map.js for why) and Resonance Training.
   Free-text fields (description, mobility/trait/skill text) are run through
   the shared cross-reference linker (assets/js/vs-xref.js) so mentions of
   other Aniimo, regions or Pathfinder talents link straight to that page. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ELEMENT_COLOR = {
  Fire: "#f2543d", Water: "#3d9bf2", Grass: "#6bbf3f", Electric: "#e0c23a", Ice: "#38b6e0",
  Wind: "#7fd9c4", Dark: "#a866e0", Holy: "#f2e6a3", Rock: "#a9835a",
};

const root = document.getElementById("an-root");

function itemIcon(src, initial) {
  if (!src) return `<span class="ms-item-img no-img" data-init="${esc((initial || "?")[0])}"></span>`;
  return `<span class="ms-item-img"><img src="${esc(src)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.parentElement.classList.add('no-img')"></span>`;
}

function buildXrefEntities(creatures, regions, talents) {
  const entities = [];
  for (const c of creatures) entities.push({ name: c.name, type: "creature", href: `aniimo.html?slug=${c.slug}` });
  for (const r of regions) entities.push({ name: r.name, type: "region", href: `map.html?region=${encodeURIComponent(r.name)}` });
  for (const t of talents) entities.push({ name: t.name, type: "talent", href: `talents.html?highlight=${encodeURIComponent(t.name)}` });
  return entities;
}

function kvTable(pairs) {
  if (!pairs.length) return "";
  return `<table class="vs-stat-table"><tbody>${pairs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`;
}

function statsTable(s) {
  return kvTable([
    ["HP", s.hp], ["Physical Attack", s.physicalAttack], ["Magic Attack", s.magicAttack],
    ["Physical Defense", s.physicalDefense], ["Magic Defense", s.magicDefense], ["Haste", s.haste],
    ["Total", s.total],
  ].filter(([, v]) => v != null));
}

function mobilityHtml(m, xrefIndex, excludeName) {
  if (!m) return `<p class="tool-note">No Mobility ability listed yet.</p>`;
  return `<div class="ms-items"><div class="ms-item" style="cursor:default">
    ${itemIcon(m.icon, m.name)}
    <span class="ms-item-body"><span class="ms-item-text"><b>${esc(m.name)}</b></span><span class="ms-item-meta">${VSXref.linkify(m.description, xrefIndex, excludeName)}</span></span>
  </div></div>`;
}

function traitsHtml(list, xrefIndex, excludeName) {
  if (!list.length) return `<p class="tool-note">No traits listed yet.</p>`;
  return `<div class="ms-items">${list.map((t) => `
    <div class="ms-item" style="cursor:default">
      ${itemIcon(t.icon, t.name)}
      <span class="ms-item-body"><span class="ms-item-text"><b>${esc(t.name)}</b></span><span class="ms-item-meta">${VSXref.linkify(t.description, xrefIndex, excludeName)}</span></span>
    </div>`).join("")}</div>`;
}

function skillsHtml(skills, xrefIndex, excludeName) {
  const tabs = Object.keys(skills || {});
  if (!tabs.length) return `<p class="tool-note">No skills listed yet.</p>`;
  return tabs.map((tab) => `
    <p class="pw-build-note" style="margin-top:8px"><b>${esc(tab)}</b>:</p>
    <div class="ms-items">${skills[tab].map((s) => `
      <div class="ms-item" style="cursor:default;align-items:flex-start">
        ${itemIcon(s.icon, s.name)}
        <span class="ms-item-body" style="gap:4px">
          <span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="ms-item-text"><b>${esc(s.name)}</b></span>
            <span class="pw-card-chips">
              ${s.type ? `<span class="ev-chip">${esc(s.type)}</span>` : ""}
              ${s.power ? `<span class="ev-chip">Might ${esc(s.power)}</span>` : ""}
              ${s.cost ? `<span class="ev-chip">EP ${esc(s.cost)}</span>` : ""}
            </span>
          </span>
          <span class="ms-item-meta">${VSXref.linkify(s.description, xrefIndex, excludeName)}</span>
        </span>
      </div>`).join("")}</div>`).join("");
}

function evolutionHtml(node, depth, xrefIndex, excludeName) {
  if (!node) return "";
  const row = `<div class="ms-item" style="cursor:default;margin-left:${depth * 24}px">
    ${itemIcon(node.icon, node.name)}
    <span class="ms-item-body"><span class="ms-item-text"><b>${esc(node.name)}</b></span>${node.condition.length ? `<span class="ms-item-meta">${VSXref.linkify(node.condition.join(", "), xrefIndex, excludeName)}</span>` : ""}</span>
  </div>`;
  return row + (node.children || []).map((c) => evolutionHtml(c, depth + 1, xrefIndex, excludeName)).join("");
}

function habitatsHtml(list) {
  if (!list.length) return `<p class="tool-note">No known habitats listed yet: check back once the wiki fills this in.</p>`;
  return `<p class="pw-card-chips">${list.map((h) => `<a class="ev-chip vs-xref" href="map.html?region=${encodeURIComponent(h)}">${esc(h)}</a>`).join("")}</p>
    <p class="tool-note">See these on the <a class="vs-xref" href="map.html">Aniimo Map</a>.</p>`;
}

function resonanceHtml(list, xrefIndex, excludeName) {
  if (!list.length) return `<p class="tool-note">No Resonance Training data listed yet.</p>`;
  return `<table class="vs-stat-table">
    <thead><tr><th>Level</th><th>Condition</th><th>Cost</th></tr></thead>
    <tbody>${list.map((r) => `<tr><td>${esc(r.level)}</td><td>${VSXref.linkify(r.condition, xrefIndex, excludeName)}</td><td>${esc(r.cost)}</td></tr>`).join("")}</tbody>
  </table>`;
}

function render(c, xrefIndex) {
  document.title = `${c.name} · Aniimo · NightmareFTW`;
  document.getElementById("bc-aniimo").textContent = c.name;
  const elemColor = ELEMENT_COLOR[c.elements[0]] || null;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img" ${elemColor ? `style="border-color:${elemColor}"` : ""}><img src="${esc(c.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(c.name)}</h1>
        <div class="pw-detail-chips">
          <span class="ev-chip">No.${esc(c.number)}</span>
          ${c.elements.map((e) => `<span class="ev-chip" style="background:${(ELEMENT_COLOR[e] || "#888")}26;color:${ELEMENT_COLOR[e] || "#ccc"}">${esc(e)}</span>`).join("")}
          <span class="ev-chip">${esc(c.role)}</span>
          <span class="ev-chip">${esc(c.stage)}</span>
          ${c.gender.length ? `<span class="ev-chip">${esc(c.gender.join(" / "))}</span>` : ""}
        </div>
        <p class="tool-note">${VSXref.linkify(c.description, xrefIndex, c.name)}</p>
      </div>
    </div>

    <section class="panel"><h2>Base Stats</h2>${statsTable(c.baseStats)}</section>

    <section class="panel"><h2>Mobility</h2>${mobilityHtml(c.mobility, xrefIndex, c.name)}</section>

    <section class="panel"><h2>Traits</h2>${traitsHtml(c.traits, xrefIndex, c.name)}</section>

    <section class="panel"><h2>Skills</h2>${skillsHtml(c.skills, xrefIndex, c.name)}</section>

    <section class="panel"><h2>Evolution Line</h2>${c.evolution ? evolutionHtml(c.evolution, 0, xrefIndex, c.name) : `<p class="tool-note">No evolution data listed yet.</p>`}</section>

    <section class="panel"><h2>Habitats</h2>${habitatsHtml(c.habitats)}</section>

    <section class="panel"><h2>Resonance Training</h2>${resonanceHtml(c.resonanceTraining, xrefIndex, c.name)}</section>

    <p class="tool-note"><a class="mini-btn" href="aniimos.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [creaturesData, regionsData, talentsData] = await Promise.all([
      fetch(`../../data/aniimo/creatures.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/aniimo/regions.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/aniimo/talents.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const c = creaturesData.creatures.find((x) => x.slug === slug);
    if (!c) { root.innerHTML = `<p class="tool-note">Aniimo not found. <a class="mini-btn" href="aniimos.html">Back to the database →</a></p>`; return; }
    const xrefIndex = VSXref.buildXrefIndex(buildXrefEntities(creaturesData.creatures, regionsData.regions, talentsData.talents));
    VSXref.initXrefPopup(xrefIndex);
    render(c, xrefIndex);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load Aniimo data.</p>`;
  }
})();
