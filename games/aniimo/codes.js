/* Aniimo — Community Codes.
   Player-submitted import codes for Character appearance (Face Codes),
   Photo Studio setups and Base layouts — NOT redeemable gift codes (those
   live in this game's Codes tab on the hub, data/codes/aniimo.json). This
   is genuinely user-generated forum content scraped from Game8's public
   Face Codes Sharing Board, so treat it as best-effort: codes are
   anonymous (no submitter name beyond a link back to the original
   comment) and may stop working after a patch with no way for us to
   verify that. Photo Studio and Base don't have an equivalent sharing
   board yet (the game is only days old), so those tabs show a "coming
   soon" note instead of a list. See scripts/update-aniimo.js
   (buildCommunityCodes) for the scrape + filtering logic.
   Data: data/aniimo/community-codes.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TAB_ORDER = ["character", "photoStudio", "base"];

let DATA = null, activeTab = "character";

const els = {
  tabs: document.getElementById("ac-cat-tabs"),
  list: document.getElementById("ac-list"),
};

function buildTabs() {
  els.tabs.innerHTML = TAB_ORDER.map((id) => {
    const tab = DATA.tabs[id];
    return `<button type="button" class="vs-cat-tab${id === activeTab ? " active" : ""}" data-tab="${id}">${esc(tab.label)} (${tab.entries.length})</button>`;
  }).join("");
  els.tabs.querySelectorAll(".vs-cat-tab").forEach((btn) => btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    buildTabs();
    render();
  }));
}

function codeCard(entry) {
  return `<div class="cc-card">
    <div class="cc-shot${entry.image ? "" : " noimg"}">${entry.image ? `<img src="${esc(entry.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="const s=this.closest('.cc-shot');s.classList.add('noimg');s.textContent='no preview'">` : "no preview"}</div>
    <div class="cc-body">
      <div class="cc-code-row">
        <code class="cc-code" title="${esc(entry.code)}">${esc(entry.code)}</code>
        <button type="button" class="cc-copy" data-code="${esc(entry.code)}">Copy</button>
      </div>
      <div class="cc-meta">${entry.postedAgo ? `Posted ${esc(entry.postedAgo)} ago` : ""}${entry.sourceUrl ? ` · <a href="${esc(entry.sourceUrl)}" target="_blank" rel="noopener">source ↗</a>` : ""}</div>
    </div>
  </div>`;
}

function render() {
  const tab = DATA.tabs[activeTab];
  if (!tab.entries.length) {
    els.list.innerHTML = `<div class="cc-empty">${esc(tab.note || "No codes shared yet.")}</div>`;
    return;
  }
  els.list.innerHTML = `
    ${tab.source ? `<p class="codes-note">Scraped from <a href="${esc(tab.source)}" target="_blank" rel="noopener">Game8's Face Codes Sharing Board</a>. Anonymous, user-submitted — we can't verify a code still works.</p>` : ""}
    <div class="cc-grid">${tab.entries.map(codeCard).join("")}</div>`;

  els.list.querySelectorAll(".cc-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigator.clipboard?.writeText(btn.dataset.code);
      btn.textContent = "Copied ✓";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
  });
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/aniimo/community-codes.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const total = TAB_ORDER.reduce((n, id) => n + DATA.tabs[id].entries.length, 0);
    document.getElementById("ac-updated").textContent = `${total} community codes · updated ${upd}`;
    buildTabs();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load community codes.</p>`;
  }
})();
