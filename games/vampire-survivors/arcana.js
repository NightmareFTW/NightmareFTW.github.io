/* Vampire Survivors — single Arcana/Darkana page.
   Deep-link: arcana.html?slug=game-killer-0. An Arcana is a game-rule
   modifier picked at the Arcane Sanctuary (a Darkana, at the Inlaid
   Library) — a different mechanic from a weapon, even though a few used
   to leak into the weapons list (see weapons.json's own notes on why).
   The weapons/passive items an Arcana "affects" link to their own page;
   its unlock condition usually names a character, linked the same way as
   everywhere else on the site (with a disambiguation popup if that name
   is shared with an enemy). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KIND_LABEL = { arcana: "Arcana", darkana: "Darkana" };

const root = document.getElementById("va-root");

function affectsHtml(names, nameToHref) {
  if (!names.length) return "";
  return `<p class="pw-build-note"><b>Affects:</b> ${names.map((n) => nameToHref.has(n) ? `<a class="vs-xref" href="${nameToHref.get(n)}">${esc(n)}</a>` : esc(n)).join(", ")}</p>`;
}

function render(a, nameToHref, xrefIndex) {
  document.title = `${a.name} · Vampire Survivors · NightmareFTW`;
  document.getElementById("bc-arcana").textContent = a.name;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(a.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(a.name)}</h1>
        <div class="pw-detail-chips">
          <span class="ev-chip">${esc(a.dlcName)}</span>
          <span class="ev-chip confirmed">${esc(KIND_LABEL[a.kind] || a.kind)}</span>
        </div>
      </div>
    </div>

    ${a.description ? `<p class="pw-desc">${VSXref.linkify(a.description, xrefIndex)}</p>` : ""}

    <section class="panel">
      <h2>Details</h2>
      ${a.unlock ? `<p class="pw-build-note"><b>Unlock:</b> ${VSXref.linkify(a.unlock, xrefIndex)}</p>` : ""}
      ${affectsHtml(a.affects, nameToHref)}
      ${a.notes ? `<p class="tool-note">${VSXref.linkify(a.notes, xrefIndex)}</p>` : ""}
    </section>

    <p class="tool-note"><a class="mini-btn" href="weapons.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [arcanasData, weaponsData, passivesData, charsData, enemiesData] = await Promise.all([
      fetch(`../../data/vampire-survivors/arcanas.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/passives.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/enemies.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const a = arcanasData.arcanas.find((x) => x.slug === slug);
    if (!a) { root.innerHTML = `<p class="tool-note">Not found. <a class="mini-btn" href="weapons.html">Back to the database →</a></p>`; return; }
    const nameToHref = new Map([
      ...weaponsData.weapons.map((w) => [w.name, `weapon.html?slug=${encodeURIComponent(w.slug)}`]),
      ...passivesData.passives.map((p) => [p.name, `passive.html?slug=${encodeURIComponent(p.slug)}`]),
    ]);
    const entities = [
      ...charsData.characters.map((x) => ({ name: x.name, type: "character", href: `character.html?slug=${encodeURIComponent(x.slug)}` })),
      ...enemiesData.enemies.map((x) => ({ name: x.name, type: "enemy", href: `enemy.html?slug=${encodeURIComponent(x.slug)}` })),
      ...weaponsData.weapons.map((x) => ({ name: x.name, type: "weapon", href: `weapon.html?slug=${encodeURIComponent(x.slug)}` })),
    ];
    const xrefIndex = VSXref.buildXrefIndex(entities);
    VSXref.initXrefPopup(xrefIndex);
    render(a, nameToHref, xrefIndex);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load arcana data.</p>`;
  }
})();
