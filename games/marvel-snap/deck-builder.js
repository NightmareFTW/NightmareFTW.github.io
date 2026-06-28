/* Marvel Snap — Deck Builder.
   Pick up to 12 unique cards (tap or drag onto the deck) from the live pool
   (data/marvel-snap/cards.json). Shows the energy curve, exports the in-game
   deck code, and lets you save named decks. The working deck ("nftw:ms:deck")
   and saved decks ("nftw:ms:savedDecks") persist and sync when signed in. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const poolEl = document.getElementById("db-pool");
const deckEl = document.getElementById("db-deck");
const savedEl = document.getElementById("db-saved");
const KEY = "nftw:ms:deck", SAVED = "nftw:ms:savedDecks";
let CARDS = [], BY = {}, deck = [], query = "", cost = "all", tag = "all";
const TAGS = ["On Reveal", "Ongoing", "Destroy", "Discard", "Move", "No Ability", "Activate", "Merc"];

const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const save = () => lsSet(KEY, deck);
const artCard = (c, cls, sub) => `<button class="ms-card ${cls}" data-defid="${esc(c.defid)}" draggable="true" title="${esc(c.name)}">
  <img src="${esc(c.art)}" alt="${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer">${sub || ""}</button>`;
const addCard = (id) => { if (!deck.includes(id) && deck.length < 12) { deck.push(id); save(); renderDeck(); renderPool(); } };

function renderDeck() {
  const cards = deck.map((d) => BY[d]).filter(Boolean);
  const code = cards.length ? btoa(JSON.stringify({ Cards: cards.map((c) => ({ CardDefId: c.defid })) })) : "";
  const curve = Array.from({ length: 7 }, (_, i) => cards.filter((c) => (i === 6 ? c.cost >= 6 : c.cost === i)).length);
  const maxC = Math.max(1, ...curve);
  const slots = Array.from({ length: 12 }, (_, i) => cards[i] ? artCard(cards[i], "db-slot", "") : `<div class="ms-card db-slot db-empty"></div>`).join("");
  deckEl.innerHTML = `
    <div class="db-head">
      <h2>Your Deck <span class="db-count ${cards.length === 12 ? "full" : ""}">${cards.length}/12</span></h2>
      <div class="db-actions">
        <button class="mini-btn" id="db-copy" ${cards.length ? "" : "disabled"}>⧉ Copy deck code</button>
        <button class="mini-btn del" id="db-clear" ${cards.length ? "" : "disabled"}>Clear</button>
      </div>
    </div>
    <div class="db-slots">${slots}</div>
    <div class="db-curve">${curve.map((n, i) => `<div class="db-bar"><span class="db-barfill" style="height:${(n / maxC) * 100}%"></span><b>${i === 6 ? "6+" : i}</b><em>${n || ""}</em></div>`).join("")}</div>`;

  deckEl.querySelectorAll(".db-slot[data-defid]").forEach((b) => b.addEventListener("click", () => { deck = deck.filter((d) => d !== b.dataset.defid); save(); renderDeck(); renderPool(); }));
  const copy = deckEl.querySelector("#db-copy");
  if (copy) copy.addEventListener("click", () => navigator.clipboard.writeText(code).then(() => { copy.textContent = "✓ Copied!"; setTimeout(() => (copy.textContent = "⧉ Copy deck code"), 1500); }));
  const clr = deckEl.querySelector("#db-clear");
  if (clr) clr.addEventListener("click", () => { if (confirm("Clear the whole deck?")) { deck = []; save(); renderDeck(); renderPool(); } });
}

function renderSaved() {
  const list = lsGet(SAVED, []);
  savedEl.innerHTML = !list.length ? "" : `<span class="db-saved-h">Saved decks</span><div class="db-saved-list">` +
    list.map((d, i) => `<div class="db-saved-item"><button class="db-saved-load" data-i="${i}">${esc(d.name)} <span>${d.cards.length}/12</span></button><button class="mini-btn del db-saved-del" data-i="${i}" title="Delete">×</button></div>`).join("") + `</div>`;
  savedEl.querySelectorAll(".db-saved-load").forEach((b) => b.addEventListener("click", () => {
    const d = lsGet(SAVED, [])[+b.dataset.i]; if (!d) return;
    deck = d.cards.filter((x) => BY[x]).slice(0, 12); save(); document.getElementById("db-name").value = d.name; renderDeck(); renderPool();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  savedEl.querySelectorAll(".db-saved-del").forEach((b) => b.addEventListener("click", () => {
    const list2 = lsGet(SAVED, []); list2.splice(+b.dataset.i, 1); lsSet(SAVED, list2); renderSaved();
  }));
}

function renderPool() {
  const q = query.toLowerCase();
  const list = CARDS.filter((c) =>
    (cost === "all" || (cost === "6" ? c.cost >= 6 : c.cost === +cost)) &&
    (tag === "all" || (c.tags || []).includes(tag)) &&
    (!q || c.name.toLowerCase().includes(q)));
  poolEl.innerHTML = list.length
    ? list.map((c) => artCard(c, deck.includes(c.defid) ? "in-deck" : "", deck.includes(c.defid) ? '<span class="db-check">✓</span>' : "")).join("")
    : `<p class="no-results">No cards match.</p>`;
  poolEl.querySelectorAll("[data-defid]").forEach((b) => {
    b.addEventListener("click", () => { const id = b.dataset.defid; if (deck.includes(id)) { deck = deck.filter((d) => d !== id); save(); renderDeck(); renderPool(); } else addCard(id); });
    b.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", b.dataset.defid));
  });
}

function chips() {
  document.getElementById("db-cost").innerHTML = ["all", "0", "1", "2", "3", "4", "5", "6"].map((c) => `<button class="filter-btn${c === cost ? " active" : ""}" data-cost="${c}">${c === "all" ? "All" : c === "6" ? "6+" : c}</button>`).join("");
  document.getElementById("db-tags").innerHTML = ["all", ...TAGS].map((t) => `<button class="filter-btn${t === tag ? " active" : ""}" data-tag="${esc(t)}">${t === "all" ? "All types" : esc(t)}</button>`).join("");
  document.querySelectorAll("[data-cost]").forEach((b) => b.addEventListener("click", () => { cost = b.dataset.cost; chips(); renderPool(); }));
  document.querySelectorAll("[data-tag]").forEach((b) => b.addEventListener("click", () => { tag = b.dataset.tag; chips(); renderPool(); }));
}

// Drag cards onto the deck area to add them.
deckEl.addEventListener("dragover", (e) => { e.preventDefault(); deckEl.classList.add("db-dragover"); });
deckEl.addEventListener("dragleave", () => deckEl.classList.remove("db-dragover"));
deckEl.addEventListener("drop", (e) => { e.preventDefault(); deckEl.classList.remove("db-dragover"); const id = e.dataTransfer.getData("text/plain"); if (BY[id]) addCard(id); });

document.getElementById("db-search").addEventListener("input", (e) => { query = e.target.value.trim(); renderPool(); });
document.getElementById("db-save").addEventListener("click", () => {
  if (!deck.length) return;
  let name = (document.getElementById("db-name").value || "").trim() || prompt("Name this deck:", "My deck") || "";
  name = name.trim(); if (!name) return;
  const list = lsGet(SAVED, []);
  const existing = list.findIndex((d) => d.name.toLowerCase() === name.toLowerCase());
  const entry = { name, cards: [...deck], ts: Date.now() };
  if (existing >= 0) list[existing] = entry; else list.unshift(entry);
  lsSet(SAVED, list); renderSaved();
  const btn = document.getElementById("db-save"); btn.textContent = "✓ Saved!"; setTimeout(() => (btn.textContent = "💾 Save deck"), 1500);
});

(async function init() {
  try {
    CARDS = (await (await fetch(`../../data/marvel-snap/cards.json?cb=${Date.now()}`)).json()).cards;
    CARDS.forEach((c) => (BY[c.defid] = c));
    deck = lsGet(KEY, []).filter((d) => BY[d]).slice(0, 12);
    chips(); renderDeck(); renderPool(); renderSaved();
  } catch (e) {
    poolEl.innerHTML = `<p class="tool-note">Couldn't load the cards yet — the updater hasn't published them.</p>`;
  }
})();
