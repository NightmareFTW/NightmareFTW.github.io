/* Vampire Survivors — single Weapon page.
   Deep-link: weapon.html?slug=whip. Shows stats plus the weapon's place in
   its evolution line: what it's made from (an evolution needs a base
   weapon + a passive item; a union needs two weapons) and what it can
   still become. Every weapon named anywhere on this page links to its own
   page in turn — a passive item isn't itself a weapon, so it's never a
   dead link, just plain text. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TIER_LABEL = { base: "Base weapon", evolution: "Evolution", union: "Union" };

const root = document.getElementById("vw-root");

function weaponLink(name, slug) {
  return slug ? `<a class="vs-xref" href="weapon.html?slug=${encodeURIComponent(slug)}">${esc(name)}</a>` : esc(name);
}

// evolvesFrom entries that share a recipeId all came from the very same
// requires1..N list on this weapon's own page — a real multi-part recipe
// (a union's two weapons, an evolution's item(s)) — so they get flattened
// into one deduplicated ingredient list rather than repeating an
// almost-identical row per parent. Entries with *different* recipeIds are
// unrelated alternative paths into this same weapon (e.g. Penshin Fatcha's
// six interchangeable starting tuna forms) and must stay separate — merging
// those would wrongly claim you need all of them at once.
function recipeGroups(w) {
  const groups = new Map();
  for (const e of w.evolvesFrom) {
    const gid = e.recipeId || `solo:${e.slug}`;
    if (!groups.has(gid)) groups.set(gid, new Map());
    const ingredients = groups.get(gid);
    if (!ingredients.has(e.name)) ingredients.set(e.name, e.slug);
    for (const x of e.extras) if (!ingredients.has(x.name)) ingredients.set(x.name, x.slug);
  }
  return [...groups.values()].map((m) => [...m.entries()].map(([name, slug]) => ({ name, slug })));
}

function statsTable(w) {
  if (!w.stats.length) return "";
  const hasMax = w.stats.some((s) => s.max);
  return `<table class="vs-stat-table">
    <thead><tr><th>Stat</th><th>Base</th>${hasMax ? "<th>At max level</th>" : ""}</tr></thead>
    <tbody>${w.stats.map((s) => `<tr><td>${esc(s.label)}</td><td>${esc(s.base)}</td>${hasMax ? `<td>${s.max ? esc(s.max) : "–"}</td>` : ""}</tr>`).join("")}</tbody>
  </table>`;
}

function effectsList(effects) {
  if (!effects) return "";
  const lines = effects.split("\n").map((l) => l.replace(/^\*\s*/, "").trim()).filter(Boolean);
  if (lines.length <= 1) return `<p class="tool-note">${esc(effects)}</p>`;
  return `<ul class="vs-sub-list" style="padding-left:16px">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
}

function evolutionSection(w) {
  const groups = recipeGroups(w);
  let fromHtml = "";
  if (groups.length === 1) {
    fromHtml = `<p class="pw-build-note"><b>${w.tier === "union" ? "Union of" : "Requires"}:</b> ${groups[0].map((i) => weaponLink(i.name, i.slug)).join(" + ")}${w.tier !== "union" ? " (at max level)" : ""}</p>`;
  } else if (groups.length > 1) {
    fromHtml = `<p class="pw-build-note"><b>Evolves from any of:</b></p>
      <ul class="vs-sub-list" style="padding-left:16px">${groups.map((g) => `<li>${g.map((i) => weaponLink(i.name, i.slug)).join(" + ")}</li>`).join("")}</ul>`;
  }
  const into = w.evolvesInto[0];
  const intoHtml = into
    ? `<p class="pw-build-note"><b>Evolves into:</b> ${weaponLink(into.name, into.slug)}${into.extras.length ? ` (also needs ${into.extras.map((x) => weaponLink(x.name, x.slug)).join(" + ")})` : ""}</p>`
    : "";
  if (!fromHtml && !intoHtml) return `<p class="tool-note">This weapon has no known evolution.</p>`;
  return `${fromHtml}${intoHtml}`;
}

function startingWeaponOf(w, characters) {
  const owners = characters.filter((c) => [c.weapon, c.hiddenWeapon].some((f) => (f || "").split(/;\s*/).map((s) => s.trim()).includes(w.name)));
  if (!owners.length) return "";
  return `<p class="pw-build-note"><b>Starting weapon of:</b> ${owners.map((c) => `<a class="vs-xref" href="character.html?slug=${encodeURIComponent(c.slug)}">${esc(c.name)}</a>`).join(", ")}</p>`;
}

// The wiki's own weapon pages list which Arcanas interact with them — the
// reverse of arcanas.json's own `affects` list, so no extra scraping is
// needed, just looking for this weapon's name in every arcana's list.
function affectingArcanas(w, arcanas) {
  const matches = arcanas.filter((a) => a.affects.includes(w.name));
  if (!matches.length) return "";
  return `<section class="panel"><h2>Arcanas</h2><p class="pw-build-note">${matches.map((a) => `<a class="vs-xref" href="arcana.html?slug=${encodeURIComponent(a.slug)}">${esc(a.name)}</a>`).join(", ")}</p></section>`;
}

function render(w, weapons, characters, arcanas, xrefIndex) {
  document.title = `${w.name} · Vampire Survivors · NightmareFTW`;
  document.getElementById("bc-weapon").textContent = w.name;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(w.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(w.name)}</h1>
        <div class="pw-detail-chips">
          <span class="ev-chip">${esc(w.dlcName)}</span>
          <span class="ev-chip${w.tier === "base" ? "" : " confirmed"}">${esc(TIER_LABEL[w.tier] || w.tier)}</span>
        </div>
      </div>
    </div>

    ${w.caption ? `<p class="pw-desc"><i>${esc(w.caption)}</i></p>` : ""}
    ${w.description ? w.description.split("\n").filter(Boolean).map((p) => `<p class="pw-desc">${VSXref.linkify(p, xrefIndex, w.name)}</p>`).join("") : ""}

    <section class="panel">
      <h2>Evolution</h2>
      ${evolutionSection(w)}
      ${startingWeaponOf(w, characters)}
    </section>

    ${w.stats.length ? `<section class="panel"><h2>Stats</h2>${statsTable(w)}</section>` : ""}
    ${w.effects ? `<section class="panel"><h2>Effects</h2>${effectsList(w.effects)}</section>` : ""}
    ${affectingArcanas(w, arcanas)}

    <p class="tool-note"><a class="mini-btn" href="weapons.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [weaponsData, charsData, enemiesData, arcanasData] = await Promise.all([
      fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/enemies.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/arcanas.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const w = weaponsData.weapons.find((x) => x.slug === slug);
    if (!w) { root.innerHTML = `<p class="tool-note">Weapon not found. <a class="mini-btn" href="weapons.html">Back to the database →</a></p>`; return; }
    const entities = [
      ...weaponsData.weapons.map((x) => ({ name: x.name, type: "weapon", href: `weapon.html?slug=${encodeURIComponent(x.slug)}` })),
      ...charsData.characters.map((x) => ({ name: x.name, type: "character", href: `character.html?slug=${encodeURIComponent(x.slug)}` })),
      ...enemiesData.enemies.map((x) => ({ name: x.name, type: "enemy", href: `enemy.html?slug=${encodeURIComponent(x.slug)}` })),
    ];
    const xrefIndex = VSXref.buildXrefIndex(entities);
    VSXref.initXrefPopup(xrefIndex);
    render(w, weaponsData.weapons, charsData.characters, arcanasData.arcanas, xrefIndex);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load weapon data.</p>`;
  }
})();
