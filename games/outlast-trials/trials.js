/* The Outlast Trials — Trials & Maps guide.
   Loads data/outlast-trials/trials.json (built by scripts/update-outlast.js):
   one card per map with its screenshot, the trial(s) it hosts, and the full
   step-by-step objective list. Live search across maps/trials/objectives. */

let DATA = null;
let query = "";
const root = document.getElementById("tr-root");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function matches(map) {
  if (!query) return true;
  const hay = (map.name + " " + map.trials.map((t) => t.name + " " + t.objectives.join(" ")).join(" ")).toLowerCase();
  return hay.includes(query);
}

function render() {
  const list = DATA.maps.filter(matches);
  root.innerHTML = list.map((m, i) => `
    <details class="trial-card" ${query ? "open" : (i === 0 ? "open" : "")}>
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
        ${m.trials.map((t) => `
          <div class="trial-block">
            <h3 class="trial-title">${esc(t.name)}</h3>
            ${t.intro ? `<p class="trial-intro">${esc(t.intro)}</p>` : ""}
            <ol class="trial-objs">${t.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ol>
          </div>`).join("")}
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
