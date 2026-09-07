/* Vampire Survivors — shared cross-reference linking + disambiguation.
   Several tools (characters, weapons, enemies, arcanas, passives) mention
   each other by name inside guide/description text. buildXrefIndex turns a
   flat list of {name, type, href} entities into a lookup; linkify() then
   wraps every matched name in a given block of text with a link to that
   entity's page — except when a name belongs to more than one entity (the
   wiki itself hits this: the enemy "Avatar Infernas" vs the playable
   character of the same name), in which case it becomes a small button
   that opens a popup letting the reader pick which page they meant. */
(function (global) {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const PT = () => localStorage.getItem("nftw:lang") === "pt";
  const TYPE_LABEL = {
    character: ["Character", "Personagem"],
    weapon: ["Weapon", "Arma"],
    enemy: ["Enemy", "Inimigo"],
    achievement: ["Achievement", "Conquista"],
    arcana: ["Arcana", "Arcana"],
    darkana: ["Darkana", "Darkana"],
    passive: ["Passive item", "Item passivo"],
  };
  const typeLabel = (type) => (TYPE_LABEL[type] ? TYPE_LABEL[type][PT() ? 1 : 0] : type);

  function buildXrefIndex(entities) {
    const byName = new Map();
    for (const e of entities) {
      if (!byName.has(e.name)) byName.set(e.name, []);
      byName.get(e.name).push(e);
    }
    // Longest names first, so a longer name always wins over a shorter
    // name that happens to be a substring of it at the same position.
    const names = [...byName.keys()].sort((a, b) => b.length - a.length);
    const escapedNames = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = escapedNames.length ? new RegExp(`\\b(${escapedNames.join("|")})\\b`, "g") : null;
    return { byName, re };
  }

  function linkify(text, index, excludeName) {
    if (!text) return "";
    if (!index.re) return esc(text);
    index.re.lastIndex = 0;
    let out = "", last = 0, m;
    while ((m = index.re.exec(text))) {
      const name = m[1];
      if (name === excludeName) continue;
      const matches = index.byName.get(name);
      out += esc(text.slice(last, m.index));
      out += matches.length === 1
        ? `<a class="vs-xref" href="${esc(matches[0].href)}">${esc(name)}</a>`
        : `<button type="button" class="vs-xref vs-xref-ambiguous" data-xref-name="${esc(name)}">${esc(name)}</button>`;
      last = m.index + name.length;
    }
    return out + esc(text.slice(last));
  }

  let popupIndex = null;
  function closePopup() {
    const el = document.getElementById("vs-xref-modal-backdrop");
    if (el) el.remove();
  }
  function openPopup(name) {
    closePopup();
    const matches = popupIndex && popupIndex.byName.get(name);
    if (!matches || matches.length < 2) return;
    const div = document.createElement("div");
    div.id = "vs-xref-modal-backdrop";
    div.className = "vs-xref-modal-backdrop";
    div.innerHTML = `
      <div class="vs-xref-modal" role="dialog" aria-modal="true" aria-label="${esc(name)}">
        <p class="vs-xref-modal-title">${PT() ? `"${esc(name)}" — qual delas?` : `"${esc(name)}" — which one?`}</p>
        <div class="vs-xref-modal-options">${matches.map((m) => `<a class="vs-xref-modal-opt" href="${esc(m.href)}">${esc(typeLabel(m.type))}</a>`).join("")}</div>
        <button type="button" class="mini-btn vs-xref-modal-close">${PT() ? "Cancelar" : "Cancel"}</button>
      </div>`;
    document.body.appendChild(div);
  }
  let wired = false;
  function initXrefPopup(index) {
    popupIndex = index;
    if (wired) return;
    wired = true;
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".vs-xref-ambiguous");
      if (btn) { openPopup(btn.dataset.xrefName); return; }
      if (e.target.closest(".vs-xref-modal-close") || e.target.classList.contains("vs-xref-modal-backdrop")) closePopup();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePopup(); });
  }

  global.VSXref = { buildXrefIndex, linkify, initXrefPopup };
})(window);
