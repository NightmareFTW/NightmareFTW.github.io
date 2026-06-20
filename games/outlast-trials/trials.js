/* The Outlast Trials — Trials & Maps guide.
   Loads data/outlast-trials/trials.json (built by scripts/update-outlast.js):
   per map — hero shot, floor/layout maps, and ALL of the map's missions with a
   selector to switch between them (goal, step objectives, tips, matched layout).
   The community interactive maps open in a full-screen modal on our site. */

let DATA = null;
let query = "";
const root = document.getElementById("tr-root");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function matches(map) {
  if (!query) return true;
  const hay = (map.name + " " + map.trials.map((t) => t.name + " " + t.goal + " " + t.objectives.join(" ") + " " + (t.tips || []).join(" ")).join(" ")).toLowerCase();
  return hay.includes(query);
}

// One mission's panel (goal, objectives, tips, its matched layout).
function missionPanel(map, t) {
  const layout = (map.layouts || []).find((l) => l.trial === t.name);
  return `
    <div class="mission-panel">
      ${t.goal ? `<p class="mission-goal">“${esc(t.goal)}”</p>` : ""}
      ${t.prime ? `<p class="mission-prime"><b>Prime Asset:</b> ${esc(t.prime)}</p>` : ""}
      <div class="trial-cols">
        <div class="trial-col">
          <span class="trial-coltitle">Objectives</span>
          ${t.objectives.length ? `<ol class="trial-objs">${t.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ol>`
            : `<p class="layout-none">Objective list not on the wiki yet — open the interactive map for the route.</p>`}
        </div>
        ${(t.tips && t.tips.length) ? `<div class="trial-col">
          <span class="trial-coltitle">Tips</span>
          <ul class="trial-tips">${t.tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
        </div>` : ""}
      </div>
      ${layout ? `<div class="layout-block"><span class="trial-coltitle">This mission's layout</span>
        <div class="layout-grid"><a class="layout-item" href="${esc(layout.img)}" target="_blank" rel="noopener">
          <img src="${esc(layout.img)}" alt="${esc(layout.label)}" loading="lazy" onerror="this.closest('.layout-item').remove()"><span class="layout-label">${esc(layout.label)}</span></a></div></div>` : ""}
    </div>`;
}

function mapCard(m, i) {
  return `
    <details class="trial-card" data-map="${esc(m.name)}" ${query || i === 0 ? "open" : ""}>
      <summary class="trial-head">
        <span class="trial-thumb">${m.img ? `<img src="${esc(m.img)}" alt="" loading="lazy" onerror="this.closest('.trial-thumb').classList.add('no-img')">` : ""}</span>
        <span class="trial-headtext">
          <span class="trial-map">${esc(m.name)}</span>
          <span class="trial-names">${m.trials.length} mission${m.trials.length === 1 ? "" : "s"}</span>
        </span>
        <span class="trial-caret">▸</span>
      </summary>
      <div class="trial-body">
        ${m.img ? `<img class="trial-hero" src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" onerror="this.remove()">` : ""}
        <button class="btn fex-btn" data-map-open="${esc(m.name)}" data-floor="0">🗺 Open the interactive map${m.layouts.length ? "" : " (Fex)"}</button>
        ${m.layouts.length ? `<div class="layout-block"><span class="trial-coltitle">Floor maps — click to open the zoomable viewer</span>
          <div class="layout-grid">${m.layouts.map((l, k) => `<button class="layout-item" data-map-open="${esc(m.name)}" data-floor="${k}" title="${esc(l.label)} — zoom">
            <img src="${esc(l.img)}" alt="${esc(l.label)}" loading="lazy" onerror="this.closest('.layout-item').remove()"><span class="layout-label">${esc(l.label)}</span></button>`).join("")}</div></div>` : ""}
        <div class="mission-tabs">${m.trials.map((t, j) => `<button class="mission-tab ${j === 0 ? "on" : ""}" data-mission="${j}">${esc(t.name)}</button>`).join("")}</div>
        <div class="mission-host">${m.trials.length ? missionPanel(m, m.trials[0]) : ""}</div>
      </div>
    </details>`;
}

function render() {
  const list = DATA.maps.filter(matches);
  const general = (DATA.generalTips || []).length ? `
    <div class="general-tips">
      <span class="gt-title">💡 Survival basics (all missions)</span>
      <ul>${DATA.generalTips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    </div>` : "";
  root.innerHTML = general + (list.map(mapCard).join("") || `<p class="no-results">No maps match.</p>`);

  // Mission selector: swap the host panel when a tab is clicked.
  root.querySelectorAll(".trial-card").forEach((card) => {
    const map = DATA.maps.find((m) => m.name === card.dataset.map);
    const host = card.querySelector(".mission-host");
    card.querySelectorAll(".mission-tab").forEach((btn) => btn.addEventListener("click", () => {
      card.querySelectorAll(".mission-tab").forEach((b) => b.classList.toggle("on", b === btn));
      host.innerHTML = missionPanel(map, map.trials[+btn.dataset.mission]);
    }));
  });
  root.querySelectorAll("[data-map-open]").forEach((b) => b.addEventListener("click", () => openMap(b.dataset.mapOpen, +b.dataset.floor || 0)));
}

// ---- Interactive map viewer (our own pan/zoom of the wiki floor plans, with a
//      floor selector). Falls back to the Fex maps for maps with no floor plan. ----
let VIEW = null; // { scale, tx, ty }
function closeModal() { const m = document.getElementById("map-modal"); if (m) m.classList.remove("on"); document.body.style.overflow = ""; }

function openMap(mapName, floor = 0) {
  const map = DATA.maps.find((m) => m.name === mapName);
  const layouts = (map && map.layouts) || [];
  let m = document.getElementById("map-modal");
  if (!m) { m = document.createElement("div"); m.id = "map-modal"; m.className = "map-modal"; document.body.appendChild(m); }

  if (!layouts.length) {
    // No floor plan on the wiki — fall back to the community interactive maps.
    m.innerHTML = `
      <div class="map-modal-bar"><span>🗺 ${esc(mapName)} — interactive maps by <a href="https://outlast.fex.dev/maps" target="_blank" rel="noopener">Fex</a> (no floor plan on the wiki for this map yet)</span>
        <button class="mini-btn" id="map-modal-close">close ✕</button></div>
      <iframe class="map-modal-frame" src="https://outlast.fex.dev/maps" title="Fex interactive maps" referrerpolicy="no-referrer"></iframe>`;
    m.querySelector("#map-modal-close").addEventListener("click", closeModal);
  } else {
    m.innerHTML = `
      <div class="map-modal-bar">
        <span>🗺 ${esc(mapName)}</span>
        <div class="floor-tabs">${layouts.map((l, k) => `<button class="floor-tab ${k === floor ? "on" : ""}" data-floor="${k}">${esc(l.label.replace(/ map$/i, ""))}</button>`).join("")}</div>
        <button class="mini-btn" id="map-modal-close">close ✕</button>
      </div>
      <div class="map-view" id="map-view"><img class="map-view-img" id="map-view-img" src="${esc(layouts[floor].img)}" alt="${esc(layouts[floor].label)}" draggable="false"></div>
      <p class="map-view-hint">Scroll to zoom · drag to pan · double-click to reset${layouts.length > 1 ? " · pick a floor above" : ""}</p>`;
    const view = m.querySelector("#map-view"), img = m.querySelector("#map-view-img");
    const apply = () => { img.style.transform = `translate(${VIEW.tx}px, ${VIEW.ty}px) scale(${VIEW.scale})`; };
    const reset = () => { VIEW = { scale: 1, tx: 0, ty: 0 }; apply(); };
    reset();
    view.addEventListener("wheel", (e) => { e.preventDefault(); const d = e.deltaY < 0 ? 1.15 : 1 / 1.15; VIEW.scale = Math.min(8, Math.max(0.5, VIEW.scale * d)); apply(); }, { passive: false });
    let drag = null;
    view.addEventListener("pointerdown", (e) => { drag = { x: e.clientX - VIEW.tx, y: e.clientY - VIEW.ty }; view.setPointerCapture(e.pointerId); view.classList.add("grabbing"); });
    view.addEventListener("pointermove", (e) => { if (!drag) return; VIEW.tx = e.clientX - drag.x; VIEW.ty = e.clientY - drag.y; apply(); });
    view.addEventListener("pointerup", () => { drag = null; view.classList.remove("grabbing"); });
    view.addEventListener("dblclick", reset);
    m.querySelector("#map-modal-close").addEventListener("click", closeModal);
    m.querySelectorAll(".floor-tab").forEach((b) => b.addEventListener("click", () => {
      m.querySelectorAll(".floor-tab").forEach((x) => x.classList.toggle("on", x === b));
      img.src = layouts[+b.dataset.floor].img; reset();
    }));
  }
  m.addEventListener("click", (e) => { if (e.target === m) closeModal(); });
  m.classList.add("on");
  document.body.style.overflow = "hidden"; // page can't scroll behind — only the map moves
}

document.getElementById("tr-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/outlast-trials/trials.json?cb=${Date.now()}`)).json();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load trial data.</p>`;
  }
})();
