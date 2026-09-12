/* Epic Seven — single Artifact page.
   Deep-link: artifact.html?slug=barthez-s-orbuculum. Recommended heroes
   link to their own page in turn (hero.html), when Game8 lists one this
   scraper also found on the hero list pages. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const root = document.getElementById("ea-root");

function statsTable(stats) {
  const entries = Object.entries(stats || {});
  if (!entries.length) return "";
  return `<table class="vs-stat-table"><tbody>${entries.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`;
}

function heroesHtml(recs) {
  if (!recs.length) return `<p class="tool-note">No recommended heroes listed.</p>`;
  return `<p class="pw-build-note">${recs.map((h) => h.slug ? `<a class="vs-xref" href="hero.html?slug=${encodeURIComponent(h.slug)}">${esc(h.name)}</a>` : esc(h.name)).join(", ")}</p>`;
}

function render(a) {
  document.title = `${a.name} · Epic Seven · NightmareFTW`;
  document.getElementById("bc-artifact").textContent = a.name;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(a.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(a.name)}</h1>
        <div class="pw-detail-chips">
          <span class="ev-chip">${esc(a.category)}</span>
          ${a.rating ? `<span class="ev-chip confirmed">${esc(a.rating)}</span>` : ""}
        </div>
      </div>
    </div>

    ${a.skillEffectBase || a.skillEffectMax ? `<section class="panel">
      <h2>Skill Effect</h2>
      ${a.skillEffectBase ? `<p class="pw-build-note"><b>Base:</b> ${esc(a.skillEffectBase)}</p>` : ""}
      ${a.skillEffectMax ? `<p class="pw-build-note"><b>Max:</b> ${esc(a.skillEffectMax)}</p>` : ""}
    </section>` : ""}

    ${Object.keys(a.stats || {}).length ? `<section class="panel"><h2>Stats</h2>${statsTable(a.stats)}</section>` : ""}

    <section class="panel">
      <h2>Recommended Heroes</h2>
      ${heroesHtml(a.recommendedHeroes)}
    </section>

    <p class="tool-note"><a class="mini-btn" href="artifacts.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const artifactsData = await (await fetch(`../../data/epic7/artifacts.json?cb=${Date.now()}`)).json();
    const a = artifactsData.artifacts.find((x) => x.slug === slug);
    if (!a) { root.innerHTML = `<p class="tool-note">Artifact not found. <a class="mini-btn" href="artifacts.html">Back to the database →</a></p>`; return; }
    render(a);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load artifact data.</p>`;
  }
})();
