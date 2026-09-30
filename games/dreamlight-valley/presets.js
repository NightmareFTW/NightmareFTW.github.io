/* Disney Dreamlight Valley — Community Presets.
   Decoration Preset codes (Furniture > Presets > Add New Import Preset),
   hand-picked from Dreamers Portal (starlightdreamers.com/presetcodes), a
   fan-run board for sharing these. Not auto-scraped like this repo's other
   codes: Dreamers Portal's API is Cloudflare-gated against plain HTTP
   clients (curl/fetch get its SPA shell back, not JSON — a real browser
   session is required), and every other scraper in this repo is
   zero-dependency curl, so this data is a manually refreshed snapshot
   instead. Only presets whose code is visibly baked into the player's own
   screenshot are included — that image IS the verification, since the
   board's API data isn't independently checkable by us. Data:
   data/dreamlight-valley/presets.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let DATA = null;

const els = {
  updated: document.getElementById("dp-updated"),
  list: document.getElementById("dp-list"),
};

function daysUntil(iso) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function card(p) {
  const days = daysUntil(p.expiresAt);
  const expired = days < 0;
  const expiryLabel = expired ? "Expired" : `Expires in ${days} day${days === 1 ? "" : "s"}`;
  const expiryDate = new Date(p.expiresAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const tags = [p.type, ...p.categories, ...p.dlcs.map((d) => `${d} required`)];
  return `<div class="dp-card${expired ? " is-expired" : ""}">
    <div class="dp-card-img-wrap">
      <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer">
    </div>
    <div class="dp-card-body">
      <h3 class="dp-card-name">${esc(p.name)}</h3>
      ${p.description ? `<p class="dp-card-desc">${esc(p.description)}</p>` : ""}
      <p class="dp-card-meta">by ${esc(p.creator)}${tags.map((t) => ` · <span class="dp-card-tag">${esc(t)}</span>`).join("")}</p>
      <div class="dp-card-code-row code-row${expired ? " is-expired" : ""}" data-code="${esc(p.code)}">
        <div class="code-main">
          <code class="code-text">${esc(p.code)}</code>
          <span class="code-reward">${esc(expiryLabel)} (${esc(expiryDate)})</span>
        </div>
        <button type="button" class="btn code-copy">Copy</button>
      </div>
    </div>
  </div>`;
}

function render() {
  els.list.innerHTML = `<div class="dp-grid">${DATA.presets.map(card).join("")}</div>`;
  els.list.querySelectorAll(".code-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.closest(".dp-card-code-row").dataset.code;
      navigator.clipboard?.writeText(code);
      btn.textContent = "Copied ✓";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
  });
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/dreamlight-valley/presets.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    els.updated.textContent = `${DATA.count} presets · updated ${upd}`;
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load community presets.</p>`;
  }
})();
