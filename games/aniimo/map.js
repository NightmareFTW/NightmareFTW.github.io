/* Aniimo — Map.
   Not a pixel-accurate world map: the only sources that publish real spawn
   coordinates for Aniimo gate that dataset behind their own private map
   tools and/or explicitly disallow bulk reproduction of it, so this is a
   region browser instead — genuinely interactive (pick an Aniimo to see
   its regions light up, or open a region to see who lives there), built
   from data we can actually use: the official site's own region art/lore
   (for the regions it currently showcases) plus every region name in the
   Aniimo database's own habitats, cross-referenced against it.
   Data: data/aniimo/regions.json + data/aniimo/creatures.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ELEMENT_COLOR = {
  Fire: "#f2543d", Water: "#3d9bf2", Grass: "#6bbf3f", Electric: "#e0c23a", Ice: "#38b6e0",
  Wind: "#7fd9c4", Dark: "#a866e0", Holy: "#f2e6a3", Rock: "#a9835a",
};

let REGIONS = null, CREATURES = null, activeAniimoSlug = "", query = "";

const els = {
  controls: document.getElementById("am-controls"),
  grid: document.getElementById("am-grid"),
  detail: document.getElementById("am-detail"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  const aniimoOpts = [...CREATURES].sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => opt(c.slug, c.name, activeAniimoSlug)).join("");
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search regions…" autocomplete="off" value="${esc(query)}">
    <select id="f-aniimo" class="sort-select"><option value="">Jump to an Aniimo…</option>${aniimoOpts}</select>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderGrid(); });
  document.getElementById("f-aniimo").addEventListener("change", (e) => {
    activeAniimoSlug = e.target.value;
    renderGrid();
    if (activeAniimoSlug) {
      const first = REGIONS.regions.find((r) => r.creatures.some((c) => c.slug === activeAniimoSlug));
      if (first) openRegion(first.name);
    } else {
      els.detail.innerHTML = "";
    }
  });
}

function regionHasAniimo(region) {
  return activeAniimoSlug && region.creatures.some((c) => c.slug === activeAniimoSlug);
}

function tile(region) {
  const highlight = regionHasAniimo(region);
  const style = highlight ? "outline:2px solid var(--accent);outline-offset:-1px" : "";
  return `<a class="game-card${highlight ? " am-highlight" : ""}" href="#" data-region="${esc(region.name)}" style="${style}">
    <span class="game-banner">${region.image
      ? `<img src="${esc(region.image)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-img')">`
      : `<span style="display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg, var(--accent2, #4fbf8f)33, transparent);font-family:var(--mono);color:var(--muted)">no art yet</span>`}</span>
    <span class="game-card-body">
      <h3>${esc(region.name)}</h3>
      <p>${region.creatures.length} Aniimo${region.mechanics.length ? ` · ${region.mechanics.length} known mechanic${region.mechanics.length === 1 ? "" : "s"}` : ""}</p>
    </span>
  </a>`;
}

function renderGrid() {
  let list = REGIONS.regions;
  if (query) list = list.filter((r) => r.name.toLowerCase().includes(query));
  els.grid.innerHTML = list.length ? `<div class="tool-grid">${list.map(tile).join("")}</div>` : `<p class="no-results">No regions match.</p>`;
  els.grid.querySelectorAll("[data-region]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openRegion(a.dataset.region); }));
}

function creatureChip(c) {
  const color = ELEMENT_COLOR[c.elements[0]] || null;
  return `<a class="vs-xref" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;margin:0 10px 8px 0" href="aniimo.html?slug=${encodeURIComponent(c.slug)}">
    <span class="ms-item-img" style="width:28px;height:28px;${color ? `border-color:${color}` : ""}"><img src="${esc(c.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>
    ${esc(c.name)}
  </a>`;
}

function openRegion(name) {
  const region = REGIONS.regions.find((r) => r.name === name);
  if (!region) return;
  els.detail.innerHTML = `
    <section class="panel">
      ${region.image ? `<img src="${esc(region.image)}" alt="" style="width:100%;max-height:280px;object-fit:cover;border-radius:var(--radius);border:1px solid var(--border);margin-bottom:12px">` : ""}
      <h1 style="margin:0 0 6px">${esc(region.name)}</h1>
      ${region.description ? `<p class="tool-note">${esc(region.description)}</p>` : `<p class="tool-note">No official description published yet for this region.</p>`}
      ${region.mechanics.length ? `<p class="pw-build-note"><b>Known mechanics</b>:</p><ul class="vs-sub-list">${region.mechanics.map((m) => `<li><b>${esc(m.name)}:</b> ${esc(m.description)}</li>`).join("")}</ul>` : ""}
      <p class="pw-build-note" style="margin-top:10px"><b>Aniimo found here</b> (${region.creatures.length}):</p>
      <p>${region.creatures.length ? region.creatures.map(creatureChip).join("") : `<span class="tool-note">None listed yet.</span>`}</p>
    </section>`;
  els.detail.scrollIntoView({ behavior: "smooth", block: "start" });
}

(async function init() {
  try {
    [REGIONS, CREATURES] = await Promise.all([
      fetch(`../../data/aniimo/regions.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/aniimo/creatures.json?cb=${Date.now()}`).then((r) => r.json()).then((d) => d.creatures),
    ]);
    const upd = REGIONS.updated ? new Date(REGIONS.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("am-updated").textContent = `${REGIONS.count} regions · updated ${upd}`;
    buildControls();
    renderGrid();
    if (REGIONS.poiTypes && REGIONS.poiTypes.length) {
      document.getElementById("am-legend-list").innerHTML = REGIONS.poiTypes.map((t) => `<span class="ev-chip">${esc(t)}</span>`).join("");
      document.getElementById("am-legend").hidden = false;
    }
  } catch (e) {
    els.grid.innerHTML = `<p class="tool-note">Couldn't load Aniimo map data.</p>`;
  }
})();
