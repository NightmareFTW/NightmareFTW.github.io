/* Epic Seven — single Hero page.
   Deep-link: hero.html?slug=alencia. Recommended artifacts link to their
   own page in turn (artifact.html), when Game8 lists one this scraper
   also found on the artifacts hub page. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const root = document.getElementById("eh-root");

function statsTable(stats) {
  const entries = Object.entries(stats || {});
  if (!entries.length) return "";
  return `<table class="vs-stat-table"><tbody>${entries.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`;
}

function strengthsWeaknesses(h) {
  if (!h.strengths.length && !h.weaknesses.length) return "";
  return `
    ${h.strengths.length ? `<p class="pw-build-note"><b>Strengths:</b></p><ul class="vs-sub-list" style="padding-left:16px">${h.strengths.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
    ${h.weaknesses.length ? `<p class="pw-build-note" style="margin-top:8px"><b>Weaknesses:</b></p><ul class="vs-sub-list" style="padding-left:16px">${h.weaknesses.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}`;
}

function skillsHtml(skills) {
  if (!skills.length) return "";
  return `<div class="ms-items">${skills.map((s) => `
    <div class="ms-item" style="cursor:default">
      <span class="ms-item-body"><span class="ms-item-text"><b>${esc(s.name)}</b></span><span class="ms-item-meta">${esc(s.effect)}</span></span>
    </div>`).join("")}</div>`;
}

function awakeningTable(awakening) {
  if (!awakening.length) return "";
  return `<table class="vs-stat-table">
    <thead><tr><th>Awaken</th><th>Main</th><th>Additional</th></tr></thead>
    <tbody>${awakening.map((a) => `<tr><td>${esc(a.level)}</td><td>${esc(a.main)}</td><td>${esc(a.additional)}</td></tr>`).join("")}</tbody>
  </table>`;
}

function artifactsHtml(recs) {
  if (!recs.length) return `<p class="tool-note">No recommended artifacts listed.</p>`;
  return recs.map((a) => `<p class="pw-build-note">${a.slug ? `<a class="vs-xref" href="artifact.html?slug=${encodeURIComponent(a.slug)}">${esc(a.name)}</a>` : `<b>${esc(a.name)}</b>`} — ${esc(a.reason)}</p>`).join("");
}

function render(h) {
  document.title = `${h.name} · Epic Seven · NightmareFTW`;
  document.getElementById("bc-hero").textContent = h.name;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(h.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(h.name)}</h1>
        <div class="pw-detail-chips">
          <span class="ev-chip">${esc(h.grade)}★</span>
          ${h.element ? `<span class="ev-chip">${esc(h.element)}</span>` : ""}
          ${h.class ? `<span class="ev-chip">${esc(h.class)}</span>` : ""}
          ${h.zodiac ? `<span class="ev-chip">${esc(h.zodiac)}</span>` : ""}
          ${h.rating ? `<span class="ev-chip confirmed">${esc(h.rating)}</span>` : ""}
        </div>
      </div>
    </div>

    <section class="panel">
      <h2>Rating</h2>
      ${strengthsWeaknesses(h) || `<p class="tool-note">No rating breakdown listed.</p>`}
    </section>

    ${Object.keys(h.stats || {}).length ? `<section class="panel"><h2>Stats</h2>${statsTable(h.stats)}</section>` : ""}

    ${h.skills.length ? `<section class="panel"><h2>Skills</h2>${skillsHtml(h.skills)}</section>` : ""}

    ${h.awakening.length ? `<section class="panel"><h2>Awakening</h2>${awakeningTable(h.awakening)}</section>` : ""}

    <section class="panel">
      <h2>Recommended Artifacts</h2>
      ${artifactsHtml(h.recommendedArtifacts)}
    </section>

    <p class="tool-note"><a class="mini-btn" href="heroes.html">← Back to the database</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const heroesData = await (await fetch(`../../data/epic7/heroes.json?cb=${Date.now()}`)).json();
    const h = heroesData.heroes.find((x) => x.slug === slug);
    if (!h) { root.innerHTML = `<p class="tool-note">Hero not found. <a class="mini-btn" href="heroes.html">Back to the database →</a></p>`; return; }
    render(h);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load hero data.</p>`;
  }
})();
