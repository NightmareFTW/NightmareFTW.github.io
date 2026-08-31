/* Palworld — Passive Skills Reference.
   The full shared passive-skill pool (~420, ranks -3..5) any Pal can carry —
   this is what powers the "Recommended Builds" section on each Pal's page.
   Data: data/palworld/passive-skills.json (scripts/update-palworld.js). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const EFFECT_LABEL = {
  attack: "Attack", defense: "Defense", hp: "HP", moveSpeed: "Move Speed", craftSpeed: "Work Speed",
  swimSpeed: "Swim Speed", airDash: "Aerial Dash", sanityDecrease: "SAN Decay Rate", autoHPRegeneRate: "HP Regen",
  captureLevel: "Capture Power", palExpIncrease: "Pal EXP Gain", breedSpeed: "Breeding Speed", lifeSteal: "Lifesteal",
};
const effectLabel = (k) => EFFECT_LABEL[k] || k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const fmtEffect = ([k, v]) => `<span class="ev-chip${v < 0 ? " pw-eff-bad" : ""}">${esc(effectLabel(k))} ${v > 0 ? "+" : ""}${v}${/Rate|Speed|Attack|Defense|HP|Power|Gain|Steal|Consumption/.test(effectLabel(k)) ? "%" : ""}</span>`;
const RANK_LABEL = { "-3": "Bad (worst)", "-2": "Bad", "-1": "Bad (mild)", 1: "Rank 1", 2: "Rank 2", 3: "Rank 3", 4: "Rank 4", 5: "Rank 5 (unique)" };

let DATA = null, query = "", fRank = "all";
const els = {
  tabs: document.getElementById("pv-tabs"),
  list: document.getElementById("pv-list"),
  count: document.getElementById("pv-count"),
};

function card(s) {
  const effects = Object.entries(s.effects || {});
  return `<div class="pw-passive-card${s.rank < 0 ? " pw-passive-bad" : ""}">
    <div class="pw-passive-card-head">
      <span class="pw-passive-name">${esc(s.name)}</span>
      <span class="ev-chip pw-rank-chip">${esc(RANK_LABEL[s.rank] || `Rank ${s.rank}`)}</span>
    </div>
    <p class="pw-passive-desc">${esc(s.description)}</p>
    ${effects.length ? `<div class="pw-card-chips">${effects.map(fmtEffect).join("")}</div>` : ""}
    ${s.exclusiveTo.length ? `<p class="tool-note">Exclusive to: ${s.exclusiveTo.map(esc).join(", ")}</p>` : (!s.availableToPals && s.rank > 0 ? `<p class="tool-note">Not obtainable by normal breeding — Rare-spawn / World Tree / mutation Pal only.</p>` : "")}
  </div>`;
}

function render() {
  let list = DATA.passiveSkills.filter((s) =>
    (!query || s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) &&
    (fRank === "all" || (fRank === "bad" ? s.rank < 0 : String(s.rank) === fRank)));
  list.sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
  els.count.textContent = `${list.length} of ${DATA.count} passive skills`;
  els.list.innerHTML = list.map(card).join("") || `<p class="no-results">No passive skills match.</p>`;
}

els.tabs.querySelectorAll(".filter-btn").forEach((b) => b.addEventListener("click", () => {
  fRank = b.dataset.rank;
  els.tabs.querySelectorAll(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
  render();
}));
document.getElementById("pv-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/palworld/passive-skills.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("pv-updated").textContent = `${DATA.count} passive skills · updated ${upd} · source: wikily.gg`;
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load passive skill data.</p>`;
  }
})();
