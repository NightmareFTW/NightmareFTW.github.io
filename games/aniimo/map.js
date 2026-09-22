/* Aniimo — Map.
   A real interactive map: actual pixel positions for chests, resources,
   eggs, Pathfinder Challenges, quest waypoints, landmarks and named Alpha
   and Omega Aniimo encounters, pinned on the game's own world map image.
   Sourced from gmtreks.com (GameTrek) — see scripts/update-aniimo.js for
   how and why. Regular (non-Alpha/Omega) Aniimo aren't pinned anywhere
   in-game, so the region browser below the map (built from the official
   site's own region art plus
   the Aniimo database's habitats) still covers "where does X live". Region
   description/mechanics text is run through the shared cross-reference
   linker (assets/js/vs-xref.js), and this page accepts ?slug=<creature> or
   ?region=<name> deep-links from other Aniimo tools.
   Data: data/aniimo/map.json + data/aniimo/regions.json +
   data/aniimo/creatures.json + data/aniimo/talents.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ELEMENT_COLOR = {
  Fire: "#f2543d", Water: "#3d9bf2", Grass: "#6bbf3f", Electric: "#e0c23a", Ice: "#38b6e0",
  Wind: "#7fd9c4", Dark: "#a866e0", Holy: "#f2e6a3", Rock: "#a9835a",
};
const MIN_ZOOM_STEP = 0.15, WHEEL_ZOOM_STEP = 0.08, MAX_SCALE = 2.5;
const isDesktopPointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function buildXrefEntities(creatures, regions, talents) {
  const entities = [];
  for (const c of creatures) entities.push({ name: c.name, type: "creature", href: `aniimo.html?slug=${c.slug}` });
  for (const r of regions) entities.push({ name: r.name, type: "region", href: `map.html?region=${encodeURIComponent(r.name)}` });
  for (const t of talents) entities.push({ name: t.name, type: "talent", href: `talents.html?highlight=${encodeURIComponent(t.name)}` });
  return entities;
}

let MAP = null, REGIONS = null, CREATURES = null, TALENTS = null, XREF = null;
let activeAniimoSlug = "", query = "", regionQuery = "";
let scale = 0.2, fitScale = 0.2;
let hiddenCategories = new Set();
let openPopupMarkerId = null;
// Click-drag panning on desktop (wheel is reserved for zoom there — see
// bindMapInteractions()); a single set of window-level listeners tracks it
// so buildMapStage() can freely recreate the wrap element on resize without
// piling up duplicate listeners.
const drag = { active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0, wrap: null };
document.addEventListener("mousemove", (e) => {
  if (!drag.active) return;
  drag.wrap.scrollLeft = drag.startLeft - (e.clientX - drag.startX);
  drag.wrap.scrollTop = drag.startTop - (e.clientY - drag.startY);
});
document.addEventListener("mouseup", () => {
  if (!drag.active) return;
  drag.active = false;
  drag.wrap.classList.remove("am-dragging");
});

const els = {
  toolbar: document.getElementById("am-toolbar"),
  legend: document.getElementById("am-legend"),
  mapContainer: document.getElementById("am-map-container"),
  attribution: document.getElementById("am-attribution"),
  controls: document.getElementById("am-controls"),
  grid: document.getElementById("am-grid"),
  detail: document.getElementById("am-detail"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

// ---- toolbar + legend -------------------------------------------------------
function buildToolbar() {
  const aniimoOpts = [...CREATURES].sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => opt(c.slug, c.name, activeAniimoSlug)).join("");
  els.toolbar.innerHTML = `
    <input type="search" id="am-search" class="search-input" placeholder="Search the map…" autocomplete="off" value="${esc(query)}">
    <select id="am-jump" class="sort-select"><option value="">Jump to an Aniimo…</option>${aniimoOpts}</select>
    <button type="button" class="am-zoom-btn" id="am-zoom-out" title="Zoom out" aria-label="Zoom out">−</button>
    <button type="button" class="am-zoom-btn" id="am-zoom-reset" title="Reset zoom" aria-label="Reset zoom">⤢</button>
    <button type="button" class="am-zoom-btn" id="am-zoom-in" title="Zoom in" aria-label="Zoom in">+</button>`;
  document.getElementById("am-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderPins(); });
  document.getElementById("am-jump").addEventListener("change", (e) => jumpToAniimo(e.target.value));
  document.getElementById("am-zoom-out").addEventListener("click", () => setScale(scale - MIN_ZOOM_STEP));
  document.getElementById("am-zoom-in").addEventListener("click", () => setScale(scale + MIN_ZOOM_STEP));
  document.getElementById("am-zoom-reset").addEventListener("click", () => setScale(fitScale));
}

function buildLegend() {
  els.legend.innerHTML = MAP.categories.map((c) => {
    const count = MAP.markers.filter((m) => m.categoryId === c.id).length;
    const off = hiddenCategories.has(c.id);
    return `<span class="am-legend-item${off ? " am-off" : ""}" data-cat="${esc(c.id)}" role="button" tabindex="0">
      <img src="${esc(c.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer">${esc(c.name)} (${count})</span>`;
  }).join("");
  els.legend.querySelectorAll("[data-cat]").forEach((el) => {
    const toggle = () => {
      const id = el.dataset.cat;
      if (hiddenCategories.has(id)) hiddenCategories.delete(id); else hiddenCategories.add(id);
      el.classList.toggle("am-off");
      renderPins();
    };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });
}

// ---- the map itself ---------------------------------------------------------
function buildMapStage() {
  els.mapContainer.innerHTML = `
    <div class="am-map-wrap" id="am-map-wrap">
      <div class="am-map-stage" id="am-map-stage">
        <img src="${esc(MAP.mapImage)}" alt="Aniimo world map" referrerpolicy="no-referrer">
      </div>
    </div>`;
  const wrap = document.getElementById("am-map-wrap");
  const wrapWidth = wrap.clientWidth || 900;
  // Desktop gets a fixed-height viewport (see the CSS) with no scrollbar —
  // panning is by click-drag and zooming by wheel — so it can fit the whole
  // map on both axes with nothing cut off. Touch devices keep the plain
  // scrollable box, fit to width only, since they still pan by finger-swipe.
  fitScale = isDesktopPointer()
    ? Math.min(wrapWidth / MAP.mapWidth, (wrap.clientHeight || 600) / MAP.mapHeight)
    : Math.min(1, wrapWidth / MAP.mapWidth);
  scale = fitScale;
  applyScale();
  renderPins();
  bindMapInteractions(wrap);
}

function applyScale() {
  const stage = document.getElementById("am-map-stage");
  if (!stage) return;
  stage.style.width = `${MAP.mapWidth * scale}px`;
  stage.style.height = `${MAP.mapHeight * scale}px`;
}

// Zoom while keeping the map point under (px, py) — viewport-relative
// coordinates within `wrap` — fixed on screen, so zooming toward the cursor
// (wheel) or the viewport center (the +/- buttons) both feel anchored.
function zoomAtPoint(next, px, py) {
  const wrap = document.getElementById("am-map-wrap");
  if (!wrap) return;
  const worldX = (wrap.scrollLeft + px) / scale;
  const worldY = (wrap.scrollTop + py) / scale;
  scale = Math.max(fitScale, Math.min(MAX_SCALE, next));
  applyScale();
  wrap.scrollLeft = worldX * scale - px;
  wrap.scrollTop = worldY * scale - py;
}

function setScale(next) {
  const wrap = document.getElementById("am-map-wrap");
  if (!wrap) return;
  zoomAtPoint(next, wrap.clientWidth / 2, wrap.clientHeight / 2);
}

// Desktop-only: mouse wheel zooms (toward the cursor) instead of scrolling,
// and dragging the map (anywhere but a pin) pans it — see the shared `drag`
// state above, which persists across buildMapStage() rebuilding this wrap.
function bindMapInteractions(wrap) {
  wrap.addEventListener("wheel", (e) => {
    if (!isDesktopPointer()) return;
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    zoomAtPoint(scale + (e.deltaY < 0 ? 1 : -1) * WHEEL_ZOOM_STEP, e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });
  wrap.addEventListener("mousedown", (e) => {
    if (!isDesktopPointer() || e.target.closest(".am-pin")) return;
    drag.active = true;
    drag.wrap = wrap;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.startLeft = wrap.scrollLeft;
    drag.startTop = wrap.scrollTop;
    wrap.classList.add("am-dragging");
  });
}

function pinMatchesQuery(m) {
  return !query || m.name.toLowerCase().includes(query);
}

function renderPins() {
  const stage = document.getElementById("am-map-stage");
  if (!stage) return;
  stage.querySelectorAll(".am-pin").forEach((p) => p.remove());
  const frag = document.createDocumentFragment();
  for (const m of MAP.markers) {
    const cat = MAP.categories.find((c) => c.id === m.categoryId);
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "am-pin" + (m.creatureSlug ? " am-pin-creature" : "");
    if (hiddenCategories.has(m.categoryId) || !pinMatchesQuery(m)) pin.classList.add("am-hidden");
    pin.style.left = `${m.x * 100}%`;
    pin.style.top = `${m.y * 100}%`;
    pin.title = m.name;
    pin.dataset.markerId = m.id;
    pin.innerHTML = cat && cat.icon ? `<img src="${esc(cat.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : "";
    pin.addEventListener("click", (e) => { e.stopPropagation(); openPopup(m, pin); });
    frag.appendChild(pin);
  }
  stage.appendChild(frag);
}

function openPopup(marker, pinEl) {
  closePopup();
  openPopupMarkerId = marker.id;
  const cat = MAP.categories.find((c) => c.id === marker.categoryId);
  const rect = pinEl.getBoundingClientRect();
  const popup = document.createElement("div");
  popup.className = "am-popup";
  popup.id = "am-popup";
  popup.innerHTML = `
    <button type="button" class="am-popup-close" aria-label="Close">✕</button>
    <div class="am-popup-title">${cat && cat.icon ? `<img src="${esc(cat.icon)}" alt="" referrerpolicy="no-referrer">` : ""}${esc(marker.name)}</div>
    <div class="am-popup-group">${esc(marker.group || "")}</div>
    ${marker.creatureSlug ? `<a class="am-popup-link" href="aniimo.html?slug=${encodeURIComponent(marker.creatureSlug)}">View in database →</a>` : ""}`;
  document.body.appendChild(popup);
  const pw = popup.offsetWidth, ph = popup.offsetHeight;
  let top = rect.top - ph - 10;
  if (top < 8) top = rect.bottom + 10;
  let left = Math.min(Math.max(8, rect.left - pw / 2), window.innerWidth - pw - 8);
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  popup.querySelector(".am-popup-close").addEventListener("click", closePopup);
}
function closePopup() {
  const p = document.getElementById("am-popup");
  if (p) p.remove();
  openPopupMarkerId = null;
}
document.addEventListener("click", (e) => { if (openPopupMarkerId && !e.target.closest("#am-popup")) closePopup(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePopup(); });
window.addEventListener("resize", () => { if (document.getElementById("am-map-stage")) buildMapStage(); });

function jumpToAniimo(slug) {
  activeAniimoSlug = slug;
  if (!slug) { renderGrid(); return; }
  const marker = MAP.markers.find((m) => m.creatureSlug === slug);
  if (marker) {
    els.mapContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    hiddenCategories.forEach((id) => hiddenCategories.delete(id));
    buildLegend();
    query = "";
    document.getElementById("am-search").value = "";
    renderPins();
    requestAnimationFrame(() => {
      const wrap = document.getElementById("am-map-wrap");
      const stage = document.getElementById("am-map-stage");
      if (!wrap || !stage) return;
      wrap.scrollLeft = marker.x * stage.clientWidth - wrap.clientWidth / 2;
      wrap.scrollTop = marker.y * stage.clientHeight - wrap.clientHeight / 2;
      const pin = stage.querySelector(`[data-marker-id="${CSS.escape(marker.id)}"]`);
      if (pin) { pin.classList.add("am-target"); openPopup(marker, pin); setTimeout(() => pin.classList.remove("am-target"), 4200); }
    });
  } else {
    closePopup();
    const first = REGIONS.regions.find((r) => r.creatures.some((c) => c.slug === slug));
    if (first) openRegion(first.name); else els.grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  renderGrid();
}

// ---- regions section (habitats, not pinned individually in-game) -----------
function buildControls() {
  els.controls.innerHTML = `<input type="search" id="f-search" class="search-input" placeholder="Search regions…" autocomplete="off" value="${esc(regionQuery)}">`;
  document.getElementById("f-search").addEventListener("input", (e) => { regionQuery = e.target.value.trim().toLowerCase(); renderGrid(); });
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
  if (regionQuery) list = list.filter((r) => r.name.toLowerCase().includes(regionQuery));
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
      ${region.description ? `<p class="tool-note">${VSXref.linkify(region.description, XREF, region.name)}</p>` : `<p class="tool-note">No official description published yet for this region.</p>`}
      ${region.mechanics.length ? `<p class="pw-build-note"><b>Known mechanics</b>:</p><ul class="vs-sub-list">${region.mechanics.map((m) => `<li><b>${esc(m.name)}:</b> ${VSXref.linkify(m.description, XREF, region.name)}</li>`).join("")}</ul>` : ""}
      <p class="pw-build-note" style="margin-top:10px"><b>Aniimo found here</b> (${region.creatures.length}):</p>
      <p>${region.creatures.length ? region.creatures.map(creatureChip).join("") : `<span class="tool-note">None listed yet.</span>`}</p>
    </section>`;
  els.detail.scrollIntoView({ behavior: "smooth", block: "start" });
}

(async function init() {
  try {
    let talents;
    [MAP, REGIONS, CREATURES, talents] = await Promise.all([
      fetch(`../../data/aniimo/map.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/aniimo/regions.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/aniimo/creatures.json?cb=${Date.now()}`).then((r) => r.json()).then((d) => d.creatures),
      fetch(`../../data/aniimo/talents.json?cb=${Date.now()}`).then((r) => r.json()).then((d) => d.talents),
    ]);
    TALENTS = talents;
    XREF = VSXref.buildXrefIndex(buildXrefEntities(CREATURES, REGIONS.regions, TALENTS));
    VSXref.initXrefPopup(XREF);
    const upd = MAP.updated ? new Date(MAP.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("am-updated").textContent = `${MAP.count} map markers · updated ${upd}`;
    els.attribution.innerHTML = `Map imagery and marker data courtesy of <a href="${esc(MAP.source)}" target="_blank" rel="noopener">GameTrek</a>.`;

    buildToolbar();
    buildLegend();
    buildMapStage();

    buildControls();
    renderGrid();

    // Deep-link from another tool: ?slug=<creature> jumps to its map pin
    // (or region, if it isn't pinned individually), ?region=<name> opens
    // that region's detail panel directly.
    const params = new URLSearchParams(location.search);
    const wantSlug = params.get("slug");
    const wantRegion = params.get("region");
    if (wantSlug) jumpToAniimo(wantSlug);
    else if (wantRegion) openRegion(wantRegion);
  } catch (e) {
    els.mapContainer.innerHTML = `<p class="tool-note">Couldn't load Aniimo map data.</p>`;
    els.grid.innerHTML = `<p class="tool-note">Couldn't load Aniimo region data.</p>`;
  }
})();
