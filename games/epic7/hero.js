/* Epic Seven — single Hero page.
   Deep-link: hero.html?slug=alencia. Data comes from epic7db.com via
   scripts/update-epic7.js: base info, skills (with icons), Fribbels
   aggregate builds (real gear-optimizer usage %), recommended artifacts
   (with icons + real usage %), suggested teams (built server-side from
   this hero's own RTA synergy data — epic7db.com has no dedicated team
   list, so this groups the most frequent synergy picks into team-sized
   sets rather than presenting a curated list), RTA data per rank (win
   rate/stat priority/synergies/counters), exclusive equipment (with
   icon) and awakenings/memory imprints. Recommended artifacts/synergy
   heroes link to their own page in turn, when this scraper resolved a
   slug for them. The element chip and portrait border are tinted per
   the hero's element (ELEMENT_COLOR) to help tell heroes apart at a
   glance. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TIER_RANK = { SSS: 8, SS: 7, S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
const ELEMENT_COLOR = { Fire: "#f2543d", Ice: "#38b6e0", Earth: "#8bb33a", Light: "#e0c23a", Dark: "#a866e0" };

const root = document.getElementById("eh-root");

function itemIcon(src, initial) {
  if (!src) return `<span class="ms-item-img no-img" data-init="${esc((initial || "?")[0])}"></span>`;
  return `<span class="ms-item-img"><img src="${esc(src)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.parentElement.classList.add('no-img')"></span>`;
}

function kvTable(pairs) {
  if (!pairs.length) return "";
  return `<table class="vs-stat-table"><tbody>${pairs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`;
}
function statsTable(stats) { return kvTable(Object.entries(stats || {})); }

function tierChips(h) {
  const chips = [];
  if (h.pvpTier) chips.push(`<span class="ev-chip confirmed">PvP ${esc(h.pvpTier)}</span>`);
  if (h.pveTier) chips.push(`<span class="ev-chip confirmed">PvE ${esc(h.pveTier)}</span>`);
  return chips.join("");
}
function gwMetaNote(gwMeta) {
  if (!gwMeta || !gwMeta.length) return "";
  return `<p class="tool-note">${gwMeta.map((m) => `Currently meta for <b>${esc(m)}</b> in Guild Wars.`).join(" ")}</p>`;
}

function skillsHtml(skills) {
  if (!skills.length) return `<p class="tool-note">No skills listed.</p>`;
  return `<div class="ms-items">${skills.map((s) => `
    <div class="ms-item" style="cursor:default;align-items:flex-start">
      ${itemIcon(s.icon, s.name)}
      <span class="ms-item-body" style="gap:4px">
        <span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="ms-item-text"><b>${esc(s.name)}</b></span>
          <span class="pw-card-chips">
            ${s.cooldown ? `<span class="ev-chip">${esc(s.cooldown)}</span>` : ""}
            ${s.soulGain ? `<span class="ev-chip">${esc(s.soulGain)}</span>` : ""}
          </span>
        </span>
        <span class="ms-item-meta">${esc(s.effect)}</span>
        ${s.soulburn ? `<span class="ms-item-meta"><b>Soulburn:</b> ${esc(s.soulburn)}</span>` : ""}
        ${s.statusEffects.length ? `<span class="pw-card-chips">${s.statusEffects.map((e) => `<span class="ev-chip">${esc(e)}</span>`).join("")}</span>` : ""}
      </span>
    </div>`).join("")}</div>`;
}

function gearSetLine(g, rateLabel) {
  return `<li>${esc(g.sets.join(" + "))} — <b>${g.rate}%</b> ${rateLabel}</li>`;
}

function fribbelsHtml(f) {
  const hasAvg = Object.keys(f.averageStats || {}).length;
  const hasSets = (f.gearSets || []).length;
  const hasBuilds = (f.topBuilds || []).length;
  if (!hasAvg && !hasSets && !hasBuilds) return `<p class="tool-note">No Fribbels build data listed.</p>`;
  return `
    ${hasAvg ? `<p class="pw-build-note"><b>Average Stats</b> (Fribbels gear optimizer users):</p>${statsTable(f.averageStats)}` : ""}
    ${hasSets ? `<p class="pw-build-note" style="margin-top:8px"><b>Gear Sets Used</b>:</p><ul class="vs-sub-list">${f.gearSets.map((g) => gearSetLine(g, "Use Rate")).join("")}</ul>` : ""}
    ${hasBuilds ? `<p class="pw-build-note" style="margin-top:8px"><b>Top Builds</b>:</p><div class="ms-items">${f.topBuilds.map((b) => `
      <div class="ms-item" style="cursor:default">
        <span class="ms-item-body">
          <span class="ms-item-text">${esc(Object.entries(b.stats).map(([k, v]) => `${k} ${v}`).join(" · "))}</span>
          <span class="ms-item-meta">${esc(b.gearSets.join(" + "))}${b.artifact ? ` · ${b.artifact.slug ? `<a class="vs-xref" href="artifact.html?slug=${encodeURIComponent(b.artifact.slug)}">${esc(b.artifact.name)}</a>` : esc(b.artifact.name)}` : ""}</span>
        </span>
      </div>`).join("")}</div>` : ""}`;
}

function recommendedArtifactsHtml(recs) {
  if (!recs.length) return `<p class="tool-note">No recommended artifacts listed.</p>`;
  return `<div class="ms-items">${recs.map((a) => `
    <div class="ms-item" style="cursor:default">
      ${itemIcon(a.icon, a.name)}
      <span class="ms-item-body">
        <span class="ms-item-text">${a.slug ? `<a class="vs-xref" href="artifact.html?slug=${encodeURIComponent(a.slug)}">${esc(a.name)}</a>` : `<b>${esc(a.name)}</b>`}</span>
        ${a.usageRate != null ? `<span class="ms-item-meta"><b>${a.usageRate}%</b> of players</span>` : ""}
      </span>
    </div>`).join("")}</div>`;
}

function heroChipList(list) {
  return list.map((h) => h.slug ? `<a class="ev-chip" style="text-decoration:none" href="hero.html?slug=${encodeURIComponent(h.slug)}">${esc(h.name)}</a>` : `<span class="ev-chip">${esc(h.name)}</span>`).join(" ");
}

function suggestedTeamsHtml(hero, teams) {
  if (!teams || !teams.length) return `<p class="tool-note">Not enough RTA synergy data to suggest teams for this hero.</p>`;
  return `<p class="tool-note">Built from this hero's own RTA synergy data — the teammates most often shown as top win-rate picks alongside them, across ranks (not an official curated list).</p>
    <div class="ms-items">${teams.map((t, i) => `
    <div class="ms-item" style="cursor:default">
      <span class="ms-item-body" style="flex-direction:row;align-items:center;flex-wrap:wrap;gap:10px">
        <span class="ev-chip">Team ${i + 1}</span>
        <span style="display:flex;align-items:center;gap:6px">${itemIcon(hero.icon, hero.name)}<b>${esc(hero.name)}</b></span>
        ${t.teammates.map((m) => `<span style="display:flex;align-items:center;gap:6px">+ ${itemIcon(m.icon, m.name)}${m.slug ? `<a class="vs-xref" href="hero.html?slug=${encodeURIComponent(m.slug)}">${esc(m.name)}</a>` : esc(m.name)}</span>`).join("")}
      </span>
    </div>`).join("")}</div>`;
}

function rtaHtml(rta) {
  if (!rta.length) return `<p class="tool-note">No RTA data listed.</p>`;
  const opts = rta.map((r, i) => `<option value="${i}">${esc(r.rank[0].toUpperCase() + r.rank.slice(1))} (${r.winRate}% WR)</option>`).join("");
  const panels = rta.map((r, i) => `
    <div class="rta-rank-panel" data-idx="${i}" ${i === 0 ? "" : "hidden"}>
      ${r.lowSample ? `<p class="tool-note">⚠ Low pick rate at this rank — data may be inaccurate.</p>` : ""}
      ${Object.keys(r.statPriority).length ? `<p class="pw-build-note"><b>Stat Priority</b>:</p>${statsTable(r.statPriority)}` : ""}
      ${r.gearSets.length ? `<p class="pw-build-note" style="margin-top:8px"><b>Gear Sets</b>:</p><ul class="vs-sub-list">${r.gearSets.map((g) => gearSetLine(g, "Win Rate")).join("")}</ul>` : ""}
      ${r.synergies.length ? `<p class="pw-build-note" style="margin-top:8px"><b>Synergies</b>:</p><p class="pw-card-chips">${heroChipList(r.synergies)}</p>` : ""}
      ${r.counters.length ? `<p class="pw-build-note" style="margin-top:8px"><b>Counters</b>:</p><p class="pw-card-chips">${heroChipList(r.counters)}</p>` : ""}
    </div>`).join("");
  return `<div class="pw-controls" style="margin-bottom:12px"><select id="rta-rank-select" class="sort-select">${opts}</select></div>${panels}`;
}

function exclusiveEquipmentHtml(list) {
  if (!list.length) return `<p class="tool-note">No exclusive equipment listed.</p>`;
  return list.map((eq) => `
    <div class="ms-item" style="cursor:default">
      ${itemIcon(eq.icon, eq.name)}
      <span class="ms-item-body">
        <span class="ms-item-text"><b>${esc(eq.name)}</b></span>
        <span class="ms-item-meta">${esc(eq.stat)} (${esc(eq.minRoll || "?")} – ${esc(eq.maxRoll || "?")})</span>
      </span>
    </div>
    <ul class="vs-sub-list">${eq.skillImprovements.map((s) => `<li>${s.recommended ? "<b>★ Recommended</b> — " : ""}<b>${esc(s.skill)}:</b> ${esc(s.effect)}</li>`).join("")}</ul>`).join("");
}

function awakeningTable(awakenings) {
  if (!awakenings.length) return `<p class="tool-note">No awakening data listed.</p>`;
  return `<table class="vs-stat-table">
    <thead><tr><th>Level</th><th>Stats</th><th>Cost</th></tr></thead>
    <tbody>${awakenings.map((a) => `<tr><td>${esc(a.level)}</td><td>${esc(a.stats.map((s) => `${s.label} ${s.value}`).join(", "))}</td><td>${esc(a.cost.join(", "))}</td></tr>`).join("")}</tbody>
  </table>`;
}

function memoryImprintsHtml(list) {
  if (!list.length) return `<p class="tool-note">No memory imprint data listed.</p>`;
  return list.map((m) => `
    <p class="pw-build-note"><b>${esc(m.type)}</b>:</p>
    <ul class="vs-sub-list">${m.tiers.map((t) => `<li>${esc(t.grade)} — ${esc(t.value)}</li>`).join("")}</ul>`).join("");
}

function render(h) {
  document.title = `${h.name} · Epic Seven · NightmareFTW`;
  document.getElementById("bc-hero").textContent = h.name;
  const elemColor = ELEMENT_COLOR[h.element] || null;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img" ${elemColor ? `style="border-color:${elemColor}"` : ""}><img src="${esc(h.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(h.name)}</h1>
        <div class="pw-detail-chips">
          <span class="ev-chip">${esc(h.grade)}★</span>
          ${h.element ? `<span class="ev-chip" style="background:${elemColor}26;color:${elemColor}">${esc(h.element)}</span>` : ""}
          ${h.class ? `<span class="ev-chip">${esc(h.class)}</span>` : ""}
          ${h.zodiac ? `<span class="ev-chip">${esc(h.zodiac)}</span>` : ""}
          ${tierChips(h)}
        </div>
        ${gwMetaNote(h.gwMeta)}
      </div>
    </div>

    ${Object.keys(h.baseStats || {}).length ? `<section class="panel"><h2>Base Stats</h2>${statsTable(h.baseStats)}</section>` : ""}

    <section class="panel"><h2>Skills</h2>${skillsHtml(h.skills)}</section>

    <section class="panel"><h2>Builds (Fribbels)</h2>${fribbelsHtml(h.fribbels)}</section>

    <section class="panel"><h2>Recommended Artifacts</h2>${recommendedArtifactsHtml(h.recommendedArtifacts)}</section>

    <section class="panel"><h2>Suggested Teams</h2>${suggestedTeamsHtml(h, h.suggestedTeams)}</section>

    <section class="panel"><h2>RTA Data</h2>${rtaHtml(h.rta)}</section>

    <section class="panel"><h2>Exclusive Equipment</h2>${exclusiveEquipmentHtml(h.exclusiveEquipment)}</section>

    <section class="panel"><h2>Awakenings</h2>${awakeningTable(h.awakenings)}</section>

    <section class="panel"><h2>Memory Imprints</h2>${memoryImprintsHtml(h.memoryImprints)}</section>

    <p class="tool-note"><a class="mini-btn" href="heroes.html">← Back to the database</a></p>
  `;

  const rankSelect = document.getElementById("rta-rank-select");
  if (rankSelect) {
    rankSelect.addEventListener("change", () => {
      root.querySelectorAll(".rta-rank-panel").forEach((el) => { el.hidden = el.dataset.idx !== rankSelect.value; });
    });
  }
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
