/* Marvel Snap — Deck Importer.
   Paste a standard Marvel Snap deck code (base64 of {"Cards":[{"CardDefId":…}]});
   it decodes, matches each card against the daily card database and compiles the
   full deck on-site — art, energy curve, archetype and a copy/edit handoff to the
   Deck Builder. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const out = document.getElementById("di-result");
const msg = document.getElementById("di-msg");
let BY = {}, CARDS = [];

function parseCode(code) {
  code = (code || "").trim().replace(/\s+/g, "");
  if (!code) return null;
  let json;
  try { json = JSON.parse(decodeURIComponent(escape(atob(code)))); }
  catch (e) { try { json = JSON.parse(code); } catch (e2) { return null; } }
  const arr = (json && (json.Cards || json.cards)) || [];
  const ids = arr.map((c) => c.CardDefId || c.cardDefId || c.defId).filter(Boolean);
  return ids.length ? ids : null;
}

function archetype(cards) {
  const ARCH = ["Destroy", "Discard", "Move", "On Reveal", "Ongoing"];
  const count = {};
  for (const c of cards) for (const t of c.tags || []) if (ARCH.includes(t)) count[t] = (count[t] || 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3).filter(([, n]) => n >= 2).map(([t]) => t);
}

function compile(code) {
  const ids = parseCode(code);
  if (!ids) { msg.textContent = "Couldn't read that — paste a valid Marvel Snap deck code."; msg.className = "di-msg err"; out.innerHTML = ""; return; }
  const cards = ids.map((id) => BY[id]).filter(Boolean);
  const unknown = ids.length - cards.length;
  cards.sort((a, b) => (a.cost - b.cost) || a.name.localeCompare(b.name));
  msg.textContent = `Compiled ${cards.length}-card deck${unknown ? ` (${unknown} card${unknown > 1 ? "s" : ""} not in the database yet)` : ""}.`;
  msg.className = "di-msg ok";

  const curve = Array.from({ length: 7 }, (_, i) => cards.filter((c) => (i === 6 ? c.cost >= 6 : c.cost === i)).length);
  const maxC = Math.max(1, ...curve);
  const arch = archetype(cards);
  const grid = cards.map((c) => `<div class="ms-card" title="${esc(c.name)} — ${c.cost}/${c.power}"><img src="${esc(c.art)}" alt="${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer"></div>`).join("");

  out.innerHTML = `<section class="panel di-deck">
    <div class="db-head">
      <h2>Deck <span class="db-count ${cards.length === 12 ? "full" : ""}">${cards.length}/12</span>
        ${arch.length ? `<span class="di-arch">${arch.map((a) => esc(a)).join(" · ")}</span>` : ""}</h2>
      <div class="db-actions">
        <button class="mini-btn" id="di-copy">⧉ Copy code</button>
        <button class="mini-btn" id="di-edit">✎ Edit in Deck Builder</button>
      </div>
    </div>
    <div class="ms-grid di-grid">${grid}</div>
    <div class="db-curve">${curve.map((n, i) => `<div class="db-bar"><span class="db-barfill" style="height:${(n / maxC) * 100}%"></span><b>${i === 6 ? "6+" : i}</b><em>${n || ""}</em></div>`).join("")}</div>
  </section>`;

  out.querySelector("#di-copy").addEventListener("click", (e) => {
    const c = btoa(JSON.stringify({ Cards: cards.map((x) => ({ CardDefId: x.defid })) }));
    navigator.clipboard.writeText(c).then(() => { e.target.textContent = "✓ Copied!"; setTimeout(() => (e.target.textContent = "⧉ Copy code"), 1500); });
  });
  out.querySelector("#di-edit").addEventListener("click", () => {
    try { localStorage.setItem("nftw:ms:deck", JSON.stringify(cards.map((c) => c.defid))); } catch (e) {}
    location.href = "deck-builder.html";
  });
}

document.getElementById("di-go").addEventListener("click", () => compile(document.getElementById("di-code").value));
document.getElementById("di-code").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) compile(e.target.value); });
document.getElementById("di-sample").addEventListener("click", () => {
  const sample = CARDS.slice(0, 12).map((c) => c.defid);
  const code = btoa(JSON.stringify({ Cards: sample.map((d) => ({ CardDefId: d })) }));
  document.getElementById("di-code").value = code; compile(code);
});

(async function init() {
  try {
    CARDS = (await (await fetch(`../../data/marvel-snap/cards.json?cb=${Date.now()}`)).json()).cards;
    CARDS.forEach((c) => (BY[c.defid] = c));
  } catch (e) { msg.textContent = "Couldn't load the card database yet."; msg.className = "di-msg err"; }
})();
