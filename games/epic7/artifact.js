/* Epic Seven — single Artifact page.
   Deep-link: artifact.html?slug=alencinoxs-wrath. Data comes from
   epic7db.com via scripts/update-epic7.js. Recommended heroes link to
   their own page in turn (hero.html), where each hero's own
   "Recommended Artifacts" section also shows real usage % for this item
   (aggregated from the Fribbels gear optimizer). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const root = document.getElementById("ea-root");

function levelBlock(label, level) {
  if (!level || (!level.effect && level.attack == null && level.health == null)) return "";
  const stats = [];
  if (level.attack != null) stats.push(`Attack ${level.attack}`);
  if (level.health != null) stats.push(`Health ${level.health}`);
  return `<p class="pw-build-note"><b>${esc(label)}:</b> ${esc(level.effect)}${stats.length ? ` <span class="pw-card-chips">${stats.map((s) => `<span class="ev-chip">${esc(s)}</span>`).join("")}</span>` : ""}</p>`;
}

function heroesHtml(recs) {
  if (!recs.length) return `<p class="tool-note">No recommended heroes listed.</p>`;
  return `<ul class="vs-sub-list">${recs.map((h) => `<li>${h.slug ? `<a class="vs-xref" href="hero.html?slug=${encodeURIComponent(h.slug)}">${esc(h.name)}</a>` : `<b>${esc(h.name)}</b>`}${h.element || h.class ? ` (${esc([h.element, h.class].filter(Boolean).join(" "))})` : ""}</li>`).join("")}</ul>`;
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
          ${a.grade ? `<span class="ev-chip">${esc(a.grade)}★</span>` : ""}
        </div>
        ${a.description ? `<p class="tool-note">${esc(a.description)}</p>` : ""}
      </div>
    </div>

    <section class="panel">
      <h2>Skill Effect</h2>
      ${levelBlock("Base", a.base) || `<p class="tool-note">No base-level effect listed.</p>`}
      ${levelBlock("Max", a.max)}
    </section>

    ${a.howToAcquire ? `<section class="panel"><h2>How to Acquire</h2><p class="pw-build-note">${esc(a.howToAcquire)}</p></section>` : ""}

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
