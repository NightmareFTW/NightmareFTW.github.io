/* Palworld — Pal detail page.
   Deep-link: pal.html?slug=lamball. Shows full stats/drops/skills, then a
   computed "recommended build" for Combat and for Work — passives in
   Palworld are a shared, breedable pool (not fixed per Pal), so this scores
   every passive this Pal could realistically carry (universally-available
   ones, plus any it's actually listed as exclusive-to) rather than
   pretending each Pal has a bespoke secret loadout. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const WORK_LABEL = {
  EmitFlame: "Kindling", Watering: "Watering", Seeding: "Planting", GenerateElectricity: "Electricity",
  Handcraft: "Handiwork", Collection: "Gathering", Deforest: "Lumbering", Mining: "Mining",
  OilExtraction: "Oil Extraction", ProductMedicine: "Medicine Production", Cool: "Cooling", Transport: "Transporting", MonsterFarm: "Farming",
};
const EFFECT_LABEL = {
  attack: "Attack", defense: "Defense", hp: "HP", moveSpeed: "Move Speed", craftSpeed: "Work Speed",
  swimSpeed: "Swim Speed", airDash: "Aerial Dash", sanityDecrease: "SAN Decay Rate", autoHPRegeneRate: "HP Regen",
  captureLevel: "Capture Power", palExpIncrease: "Pal EXP Gain", breedSpeed: "Breeding Speed", lifeSteal: "Lifesteal",
  fullStomachDecrease: "Food Consumption", reloadSpeedUp: "Reload Speed", jumpPowerIncrease: "Jump Power",
};
const effectLabel = (k) => EFFECT_LABEL[k] || k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const fmtEffect = ([k, v]) => `<span class="ev-chip${v < 0 ? " pw-eff-bad" : ""}">${esc(effectLabel(k))} ${v > 0 ? "+" : ""}${v}${/Rate|Speed|Attack|Defense|HP|Power|Gain|Steal|Consumption/.test(effectLabel(k)) ? "%" : ""}</span>`;

const root = document.getElementById("pw-root");

function statBar(label, val, max) {
  const pct = Math.max(4, Math.min(100, Math.round((val / max) * 100)));
  return `<div class="pw-stat"><span class="pw-stat-label">${esc(label)}</span><span class="pw-stat-bar"><span style="width:${pct}%"></span></span><span class="pw-stat-val">${esc(val)}</span></div>`;
}

function passivesPool(pal, skills) {
  // availableToPals=false means the passive is locked to Rare-spawn / World
  // Tree / mutation Pals (a different system), not normal breeding — only
  // include it here if this specific Pal is its listed exclusive carrier.
  return skills.filter((s) => s.rank > 0 && (s.availableToPals || s.exclusiveTo.includes(pal.name)));
}
function scoreCombat(e) { return (e.attack || 0) * 1.2 + (e.defense || 0) * 0.9 + (e.moveSpeed || 0) * 0.5 + (e.hp || 0) * 0.3 - Math.max(0, -(e.craftSpeed || 0)) * 0.3; }
function scoreWork(e) { return (e.craftSpeed || 0) * 1 + (e.moveSpeed || 0) * 0.3 - Math.max(0, -(e.attack || 0)) * 0.2; }

function buildSection(title, note, list) {
  if (!list.length) return "";
  return `<div class="pw-build">
    <h3 class="pw-build-h">${esc(title)}</h3>
    <p class="pw-build-note">${esc(note)}</p>
    <div class="pw-build-passives">${list.map((s) => `
      <div class="pw-passive">
        <span class="pw-passive-name">${esc(s.name)}${s.exclusiveTo.length ? ' <span class="ev-chip">Signature</span>' : ""}</span>
        <span class="pw-passive-desc">${esc(s.description)}</span>
      </div>`).join("")}</div>
  </div>`;
}

function render(pal, skills) {
  const workEntries = Object.entries(pal.work || {}).sort((a, b) => b[1] - a[1]);
  const pool = passivesPool(pal, skills);
  const combatBuild = [...pool].sort((a, b) => scoreCombat(b.effects) - scoreCombat(a.effects)).filter((s) => scoreCombat(s.effects) > 0).slice(0, 4);
  const workBuild = [...pool].sort((a, b) => scoreWork(b.effects) - scoreWork(a.effects)).filter((s) => scoreWork(s.effects) > 0).slice(0, 4);

  document.title = `${pal.name} · Palworld · NightmareFTW`;
  document.getElementById("bc-pal").textContent = pal.name;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(pal.icon)}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <span class="pw-dex">#${esc(pal.dex)}</span>
        <h1>${esc(pal.name)}</h1>
        <div class="pw-detail-chips">
          ${(pal.elements || []).map((e) => `<span class="pw-el pw-el-${esc(e.toLowerCase())}">${esc(e)}</span>`).join("")}
          ${pal.isBoss ? '<span class="ev-chip confirmed">Boss</span>' : ""}
          ${pal.isTowerBoss ? '<span class="ev-chip confirmed">Tower Boss</span>' : ""}
          ${pal.isRaidBoss ? '<span class="ev-chip confirmed">Raid Boss</span>' : ""}
          <span class="ev-chip">Rarity ${esc(pal.rarity)}</span>
          ${pal.price ? `<span class="ev-chip">${esc(pal.price)}𝝨 catch price</span>` : ""}
        </div>
      </div>
    </div>

    ${pal.description ? `<p class="pw-desc">${esc(pal.description)}</p>` : ""}

    <div class="pw-cols">
      <section class="panel">
        <h2>Base Stats</h2>
        ${statBar("HP", pal.stats.hp, 200)}
        ${statBar("Attack", pal.stats.attack, 200)}
        ${statBar("Ranged Attack", pal.stats.shotAttack, 200)}
        ${statBar("Defense", pal.stats.defense, 200)}
        ${statBar("Support", pal.stats.support, 200)}
        ${statBar("Work Speed", pal.stats.craftSpeed, 200)}
      </section>

      <section class="panel">
        <h2>Work Suitability${pal.bestWork ? ` <span class="ev-chip">Best: <b>${esc(WORK_LABEL[pal.bestWork] || pal.bestWork)}</b></span>` : ""}</h2>
        ${workEntries.length
          ? `<div class="pw-work-grid">${workEntries.map(([k, v]) => `<span class="pw-work"><span>${esc(WORK_LABEL[k] || k)}</span><span class="pw-work-lv">${"●".repeat(v)}${"○".repeat(Math.max(0, 4 - v))}</span></span>`).join("")}</div>`
          : `<p class="tool-note">No base-management work suitability.</p>`}
        ${pal.partnerSkill ? `<h3 class="pw-sub-h">Partner Skill</h3><p class="pw-desc">${esc(pal.partnerSkill)}</p>` : ""}
      </section>
    </div>

    <section class="panel">
      <h2>Recommended Builds</h2>
      <p class="tool-note" style="margin-top:0">Passives are a shared, breedable pool in Palworld — any Pal can carry any non-exclusive passive. These are the highest-scoring picks available to this Pal specifically (its own signature passives included where it has any), not an official loadout.</p>
      <div class="pw-cols">
        ${buildSection("Combat Build", "Best available Attack / Defense / Move Speed passives.", combatBuild) || '<p class="tool-note">No strong combat passives found for this Pal.</p>'}
        ${buildSection("Work Build", "Best available Work Speed / Move Speed passives for base duty.", workBuild) || '<p class="tool-note">No strong work passives found for this Pal.</p>'}
      </div>
    </section>

    ${pal.innatePassives && pal.innatePassives.length ? `
    <section class="panel">
      <h2>Innate Passive Skills</h2>
      <div class="pw-build-passives">${pal.innatePassives.map((n) => {
        const s = skills.find((x) => x.name === n);
        return `<div class="pw-passive"><span class="pw-passive-name">${esc(n)}</span><span class="pw-passive-desc">${esc(s ? s.description : "")}</span></div>`;
      }).join("")}</div>
    </section>` : ""}

    <div class="pw-cols">
      ${pal.skills && pal.skills.length ? `
      <section class="panel">
        <h2>Active Skills</h2>
        <div class="pw-skills">${pal.skills.map((s) => `
          <div class="pw-skill">
            <span class="pw-skill-head"><b>${esc(s.name)}</b><span class="ev-chip">Lv ${esc(s.level)}</span>${s.element ? `<span class="pw-el pw-el-${esc(s.element.toLowerCase())}">${esc(s.element)}</span>` : ""}</span>
            ${s.desc ? `<p class="pw-skill-desc">${esc(s.desc)}</p>` : ""}
          </div>`).join("")}</div>
      </section>` : ""}

      ${pal.drops && pal.drops.length ? `
      <section class="panel">
        <h2>Drops</h2>
        <div class="pw-drops">${pal.drops.map((d) => `
          <span class="pw-drop"><img src="${esc(d.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"><span>${esc(d.item)} ×${esc(d.min)}${d.max !== d.min ? `-${esc(d.max)}` : ""} <span class="tool-note" style="display:inline">(${esc(d.rate)}%)</span></span></span>`).join("")}</div>
      </section>` : ""}
    </div>

    <p class="tool-note"><a class="mini-btn" href="breeding.html?parent=${encodeURIComponent(pal.name)}">Use in Breeding Calculator →</a></p>
  `;
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [palsData, skillsData] = await Promise.all([
      fetch(`../../data/palworld/pals.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/palworld/passive-skills.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const pal = palsData.pals.find((p) => p.slug === slug);
    if (!pal) { root.innerHTML = `<p class="tool-note">Pal not found. <a href="pals.html">Back to the database →</a></p>`; return; }
    render(pal, skillsData.passiveSkills);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load this Pal's data.</p>`;
  }
})();
