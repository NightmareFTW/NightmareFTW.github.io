/* Honkai: Star Rail — Warp Calendar.
   Renders data/honkai-star-rail/banners.json (scraped from Game8 by
   scripts/update-hsr-banners.js). Character banners grouped by version, newest
   first, with live / upcoming / past status from today's date. Vanilla JS. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.getElementById("wc-root");
const today = new Date().toISOString().slice(0, 10);
let DATA = null, query = "";

const statusOf = (b) => b.startISO > today ? "upcoming" : (b.endISO && b.endISO >= today ? "live" : "past");
const STATUS_LABEL = { live: "Live now", upcoming: "Upcoming", past: "Ended" };

function bannerCard(b) {
  const st = statusOf(b);
  const init = (b.char[0] || "?").toUpperCase();
  const pic = b.img
    ? `<img src="${esc(b.img)}" alt="${esc(b.char)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.wc-pic').classList.add('no-img');this.remove()">`
    : "";
  return `<div class="wc-banner wc-${st}">
    <span class="wc-pic${b.img ? "" : " no-img"}" data-init="${esc(init)}">${pic}</span>
    <div class="wc-info">
      <span class="wc-char">${esc(b.char)}</span>
      <span class="wc-dates">${esc(b.start)} – ${esc(b.end)}</span>
    </div>
    <span class="wc-badge wc-b-${st}">${STATUS_LABEL[st]}${b.phase ? ` · P${esc(b.phase)}` : ""}</span>
  </div>`;
}

function render() {
  const q = query.toLowerCase();
  const list = DATA.banners.filter((b) => !q || b.char.toLowerCase().includes(q));
  if (!list.length) { root.innerHTML = `<p class="no-results">No banners match.</p>`; return; }
  // Group by version, preserving the newest-first order.
  const groups = [];
  for (const b of list) {
    const last = groups[groups.length - 1];
    if (last && last.version === b.version) last.items.push(b);
    else groups.push({ version: b.version, items: [b] });
  }
  root.innerHTML = groups.map((g) => `
    <section class="wc-version">
      <h2 class="wc-vhead">Version ${esc(g.version)}</h2>
      <div class="wc-banners">${g.items.map(bannerCard).join("")}</div>
    </section>`).join("");
}

document.getElementById("wc-search").addEventListener("input", (e) => { query = e.target.value.trim(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/honkai-star-rail/banners.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const live = DATA.banners.filter((b) => statusOf(b) === "live").length;
    document.getElementById("wc-updated").textContent =
      `${DATA.banners.length} banners · ${live} live now · updated ${upd}`;
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the banner calendar yet — the updater hasn't published it.</p>`;
  }
})();
