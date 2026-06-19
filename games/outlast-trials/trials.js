/* The Outlast Trials — Trials & Maps guide.
   Loads data/outlast-trials/trials.json (built by scripts/update-outlast.js):
   per map — hero shot, floor/layout maps, each trial's step-by-step objectives
   and strategy tips, plus a link to the community interactive maps. */

let DATA = null;
let query = "";
const root = document.getElementById("tr-root");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function matches(map) {
  if (!query) return true;
  const hay = (map.name + " " + map.trials.map((t) => t.name + " " + t.objectives.join(" ") + " " + (t.tips || []).join(" ")).join(" ")).toLowerCase();
  return hay.includes(query);
}

function trialBlock(t) {
  return `
    <div class="trial-block">
      <h3 class="trial-title">${esc(t.name)}</h3>
      ${t.intro ? `<p class="trial-intro">${esc(t.intro)}</p>` : ""}
      <div class="trial-cols">
        <div class="trial-col">
          <span class="trial-coltitle">Objectives</span>
          <ol class="trial-objs">${t.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ol>
        </div>
        ${(t.tips && t.tips.length) ? `<div class="trial-col">
          <span class="trial-coltitle">Tips</span>
          <ul class="trial-tips">${t.tips.map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
        </div>` : ""}
      </div>
    </div>`;
}

function render() {
  const list = DATA.maps.filter(matches);
  const general = (DATA.generalTips || []).length ? `
    <div class="general-tips">
      <span class="gt-title">💡 Survival basics (all trials)</span>
      <ul>${DATA.generalTips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    </div>` : "";

  root.innerHTML = general + list.map((m, i) => `
    <details class="trial-card" ${query || i === 0 ? "open" : ""}>
      <summary class="trial-head">
        <span class="trial-thumb">${m.img ? `<img src="${esc(m.img)}" alt="" loading="lazy" onerror="this.closest('.trial-thumb').classList.add('no-img')">` : ""}</span>
        <span class="trial-headtext">
          <span class="trial-map">${esc(m.name)}</span>
          <span class="trial-names">${m.trials.map((t) => esc(t.name)).join(" · ") || "—"}</span>
        </span>
        <span class="trial-caret">▸</span>
      </summary>
      <div class="trial-body">
        ${m.img ? `<img class="trial-hero" src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" onerror="this.remove()">` : ""}
        ${m.fex ? `<a class="btn fex-btn" href="${esc(m.fex)}" target="_blank" rel="noopener">🗺 Open the interactive maps ↗</a>` : ""}
        ${(m.layouts && m.layouts.length) ? `
          <div class="layout-block">
            <span class="trial-coltitle">Map layouts — find objectives, documents &amp; routes</span>
            <div class="layout-grid">${m.layouts.map((l) => `
              <a class="layout-item" href="${esc(l.img)}" target="_blank" rel="noopener" title="${esc(l.label)} (open full size)">
                <img src="${esc(l.img)}" alt="${esc(l.label)}" loading="lazy" onerror="this.closest('.layout-item').remove()">
                <span class="layout-label">${esc(l.label)}</span>
              </a>`).join("")}</div>
          </div>` : `<p class="layout-none">No top-down layout on the wiki yet — use the interactive maps above for objectives, documents &amp; hidden spots.</p>`}
        ${m.trials.map(trialBlock).join("")}
      </div>
    </details>`).join("") || `<p class="no-results">No maps match.</p>`;
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
