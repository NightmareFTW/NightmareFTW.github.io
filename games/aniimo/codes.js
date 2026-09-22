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

function codeRow(entry) {
  return `<div class="code-row ac-code-row" data-code="${esc(entry.code)}">
    ${entry.image ? `<span class="ac-code-thumb"><img src="${esc(entry.image)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>` : ""}
    <div class="code-main">
      <code class="code-text">${esc(entry.code)}</code>
      <span class="code-reward">${entry.postedAgo ? `Posted ${esc(entry.postedAgo)} ago` : ""}${entry.sourceUrl ? ` · <a href="${esc(entry.sourceUrl)}" target="_blank" rel="noopener">source ↗</a>` : ""}</span>
    </div>
    <button type="button" class="btn code-copy">Copy</button>
  </div>`;
}

function render() {
  const tab = DATA.tabs[activeTab];
  if (!tab.entries.length) {
    els.list.innerHTML = `<p class="tool-note">${esc(tab.note || "No codes shared yet.")}</p>`;
    return;
  }
  els.list.innerHTML = `
    ${tab.source ? `<p class="codes-note">Scraped from <a href="${esc(tab.source)}" target="_blank" rel="noopener">Game8's Face Codes Sharing Board</a>. Anonymous, user-submitted — we can't verify a code still works.</p>` : ""}
    <div class="codes-list">${tab.entries.map(codeRow).join("")}</div>`;

  els.list.querySelectorAll(".code-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.closest(".code-row").dataset.code;
      navigator.clipboard?.writeText(code);
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
