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
  const generalLayouts = (m.layouts || []).filter((l) => !l.trial);
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
        <button class="btn fex-btn" data-map-open="${esc(m.name)}">🗺 Open the interactive map</button>
        ${generalLayouts.length ? `<div class="layout-block"><span class="trial-coltitle">Map layouts — objectives, documents &amp; routes</span>
          <div class="layout-grid">${generalLayouts.map((l) => `<a class="layout-item" href="${esc(l.img)}" target="_blank" rel="noopener" title="${esc(l.label)}">
            <img src="${esc(l.img)}" alt="${esc(l.label)}" loading="lazy" onerror="this.closest('.layout-item').remove()"><span class="layout-label">${esc(l.label)}</span></a>`).join("")}</div></div>` : ""}
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
  root.querySelectorAll("[data-map-open]").forEach((b) => b.addEventListener("click", () => openMap()));
}

// ---- Full-screen interactive-map modal (loads Fex on our own page) ----
function openMap() {
  let m = document.getElementById("map-modal");
  if (!m) {
    m = document.createElement("div");
    m.id = "map-modal";
    m.className = "map-modal";
    m.innerHTML = `
      <div class="map-modal-bar">
        <span>🗺 Interactive maps — by <a href="https://outlast.fex.dev/maps" target="_blank" rel="noopener">Fex</a></span>
        <button class="mini-btn" id="map-modal-close">close ✕</button>
      </div>
      <iframe class="map-modal-frame" src="https://outlast.fex.dev/maps" title="The Outlast Trials interactive maps" referrerpolicy="no-referrer"></iframe>`;
    document.body.appendChild(m);
    m.querySelector("#map-modal-close").addEventListener("click", () => { m.classList.remove("on"); document.body.style.overflow = ""; });
    m.addEventListener("click", (e) => { if (e.target === m) { m.classList.remove("on"); document.body.style.overflow = ""; } });
  }
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
