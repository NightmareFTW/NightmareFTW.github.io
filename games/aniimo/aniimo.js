/* Aniimo — single Aniimo page.
   Deep-link: aniimo.html?slug=emberpup. Data comes from wiki.aniimo.com
   (the official game wiki) via scripts/update-aniimo.js: base stats,
   mobility, traits, skills (grouped by tab: Combat/Innate/...), the
   evolution line, habitats (region names — no map coordinates; see
   games/aniimo/map.js for why) and Resonance Training. */

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

function mobilityHtml(m) {
  if (!m) return `<p class="tool-note">No Mobility ability listed yet.</p>`;
  return `<div class="ms-items"><div class="ms-item" style="cursor:default">
    ${itemIcon(m.icon, m.name)}
    <span class="ms-item-body"><span class="ms-item-text"><b>${esc(m.name)}</b></span><span class="ms-item-meta">${esc(m.description)}</span></span>
  </div></div>`;
}

function traitsHtml(list) {
  if (!list.length) return `<p class="tool-note">No traits listed yet.</p>`;
  return `<div class="ms-items">${list.map((t) => `
    <div class="ms-item" style="cursor:default">
      ${itemIcon(t.icon, t.name)}
      <span class="ms-item-body"><span class="ms-item-text"><b>${esc(t.name)}</b></span><span class="ms-item-meta">${esc(t.description)}</span></span>
    </div>`).join("")}</div>`;
}

function skillsHtml(skills) {
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
          <span class="ms-item-meta">${esc(s.description)}</span>
        </span>
      </div>`).join("")}</div>`).join("");
}

function evolutionHtml(node, depth) {
  if (!node) return "";
  const row = `<div class="ms-item" style="cursor:default;margin-left:${depth * 24}px">
    ${itemIcon(node.icon, node.name)}
    <span class="ms-item-body"><span class="ms-item-text"><b>${esc(node.name)}</b></span>${node.condition.length ? `<span class="ms-item-meta">${esc(node.condition.join(", "))}</span>` : ""}</span>
  </div>`;
  return row + (node.children || []).map((c) => evolutionHtml(c, depth + 1)).join("");
}

function habitatsHtml(list) {
  if (!list.length) return `<p class="tool-note">No known habitats listed yet: check back once the wiki fills this in.</p>`;
  return `<p class="pw-card-chips">${list.map((h) => `<span class="ev-chip">${esc(h)}</span>`).join("")}</p>
    <p class="tool-note">See these regions on the <a class="vs-xref" href="map.html">Aniimo Map</a>.</p>`;
}

function resonanceHtml(list) {
  if (!list.length) return `<p class="tool-note">No Resonance Training data listed yet.</p>`;
  return `<table class="vs-stat-table">
    <thead><tr><th>Level</th><th>Condition</th><th>Cost</th></tr></thead>
    <tbody>${list.map((r) => `<tr><td>${esc(r.level)}</td><td>${esc(r.condition)}</td><td>${esc(r.cost)}</td></tr>`).join("")}</tbody>
  </table>`;
}

function render(c) {
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
        <p class="tool-note">${esc(c.description)}</p>
      </div>
    </div>

    <section class="panel"><h2>Base Stats</h2>${statsTable(c.baseStats)}</section>

    <section class="panel"><h2>Mobility</h2>${mobilityHtml(c.mobility)}</section>

    <section class="panel"><h2>Traits</h2>${traitsHtml(c.traits)}</section>

    <section class="panel"><h2>Skills</h2>${skillsHtml(c.skills)}</section>

    <section class="panel"><h2>Evolution Line</h2>${c.evolution ? evolutionHtml(c.evolution, 0) : `<p class="tool-note">No evolution data listed yet.</p>`}</section>

    <section class="panel"><h2>Habitats</h2>${habitatsHtml(c.habitats)}</section>

    <section class="panel"><h2>Resonance Training</h2>${resonanceHtml(c.resonanceTraining)}</section>

    <p class="tool-note"><a class="mini-btn" href="aniimos.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const data = await (await fetch(`../../data/aniimo/creatures.json?cb=${Date.now()}`)).json();
    const c = data.creatures.find((x) => x.slug === slug);
    if (!c) { root.innerHTML = `<p class="tool-note">Aniimo not found. <a class="mini-btn" href="aniimos.html">Back to the database →</a></p>`; return; }
    render(c);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load Aniimo data.</p>`;
  }
})();
