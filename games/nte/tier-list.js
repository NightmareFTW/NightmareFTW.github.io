/* NTE — Tier List & Builds
   Rankings and builds compiled from Game8. Clicking a character shows their
   build (Arc, Cartridge, stat priority, recommended team) on-page. */

const STAT_HINT = {
  DPS: "CRIT Rate → CRIT DMG, then ATK. Energy Recharge for ult uptime.",
  Buff: "ATK and Energy Recharge — maximise buff uptime and how often you ult.",
  Survival: "HP / DEF for bulk, plus Energy Recharge to keep shields/heals flowing.",
};

const CHARACTERS = [
  { name: "Lacrimosa", tier: "S", role: "DPS", arc: "The Last Rose", cart: "Diabolos", team: ["Sakiri", "Haniel", "Daffodil"],
    note: "DoT-focused — stack Nightmare & Scorch. Her DoT scales off ATK, so grab CRIT first, then ATK; Chaos DMG main stat with The Last Rose." },
  { name: "Hotori", tier: "S", role: "DPS", arc: "Marching Beyond Time", cart: "Lost Radiance", team: ["Esper Zero", "Nanally", "Jiuyuan"],
    note: "Burst sub-DPS — feeds on recorded Esper cycles for massive ultimates." },
  { name: "Nanally", tier: "S", role: "DPS", arc: "Ready-Ready", cart: "Fireflies and the Forest", team: ["Sakiri", "Jiuyuan", "Esper Zero"],
    note: "Blossom/Charge core — empower Vita Buds through team synergy." },
  { name: "Sakiri", tier: "S", role: "Buff", arc: "Good Boy's Grand Adventure", cart: "Speedy Hedgehog", team: ["Baicang", "Adler", "Edgar"],
    note: "Pulls enemies together and buffs team ATK by 30%. Fits almost every top team." },

  { name: "Esper Zero", tier: "A", role: "DPS", arc: "The Rain That Shook the World", cart: "Lost Radiance", team: ["Nanally", "Sakiri", "Jiuyuan"],
    note: "The premier cycler — enables faster rotations for the whole team." },
  { name: "Chiz", tier: "A", role: "DPS", arc: "Contemplative Cat", cart: "Lost Radiance", team: ["Hathor", "Jiuyuan", "Adler"] },
  { name: "Daffodil", tier: "A", role: "DPS", arc: "Youthful Fantasy", cart: "Diabolos", team: ["Baicang", "Jiuyuan", "Haniel"],
    note: "Boss breaker — specialises in white-bar (Break) damage." },
  { name: "Baicang", tier: "A", role: "DPS", arc: "Camellia Society", cart: "Crimson: Twin Butterflies", team: ["Daffodil", "Adler", "Haniel"] },
  { name: "Jiuyuan", tier: "A", role: "DPS", arc: "Reality Refuge", cart: "Fireflies and the Forest", team: ["Nanally", "Sakiri", "Esper Zero"],
    note: "Strong enemy-gathering for AoE setups." },
  { name: "Hathor", tier: "A", role: "DPS", arc: "Raging Flames", cart: "Street Boxer", team: ["Jiuyuan", "Esper Zero", "Fadia"],
    note: "Flexible between Charge and Stain reactions; relies on feather stacks." },
  { name: "Haniel", tier: "A", role: "Buff", arc: "Blow up the Crowd", cart: "Speedy Hedgehog", team: ["Nanally", "Sakiri", "Daffodil"],
    note: "Pure buffer that also helps apply Nova." },
  { name: "Fadia", tier: "A", role: "Survival", arc: "Eternal Waltz", cart: "Devil's Blood: Curse", team: ["Nanally", "Sakiri", "Daffodil"],
    note: "Team damage-share with damage reflection." },

  { name: "Mint", tier: "B", role: "DPS", arc: "Clear Skies", cart: "Fireflies and the Forest", team: ["Esper Zero", "Skia", "Adler"],
    note: "Best F2P DPS option — strong parry potential." },
  { name: "Adler", tier: "B", role: "Survival", arc: "Umbrella", cart: "Kingdom's Guard", team: ["Baicang", "Sakiri", "Daffodil"],
    note: "Team-wide shields plus DoT — lots of value with little setup." },

  { name: "Edgar", tier: "C", role: "Survival", arc: "Call of the Twisted City", cart: "Thea's Night Tavern", team: ["Nanally", "Jiuyuan", "Esper Zero"],
    note: "Healer with a stationary healing area." },
  { name: "Skia", tier: "C", role: "DPS", arc: "Watch Your Heads!", cart: "Street Boxer", team: ["Sakiri", "Esper Zero", "Fadia"] },
  { name: "Aurelia", tier: "C", role: "DPS", arc: "Stellar Veil", cart: "Devil's Blood: Curse", team: ["Sakiri", "Daffodil", "Haniel"] },
];

const TIER_ORDER = ["S", "A", "B", "C"];
let role = "all";

const root = document.getElementById("tier-root");
const detail = document.getElementById("build-detail");

const portrait = (name) => `../../assets/img/nte/${name.toLowerCase().replace(/ /g, "-")}.png`;

// One labelled team line: the character (carry, highlighted) + 3 teammates you
// can click to jump to.
function teamBlock(label, carry, members, isMeta) {
  const chips = `<span class="ev-chip team-carry">${carry}</span>` +
    members.map((t) => `<span class="ev-chip" data-jump="${t}">${t}</span>`).join("");
  return `<div class="team-line ${isMeta ? "team-meta" : ""}">
    <span class="team-label">${label}</span>
    <div class="bd-team">${chips}</div>
  </div>`;
}

function showBuild(name) {
  const c = CHARACTERS.find((x) => x.name === name);
  if (!c) return;
  detail.style.display = "block";
  detail.innerHTML = `
    <div class="bd-head">
      <div class="bd-title">
        <span class="bd-portrait"><img src="${portrait(c.name)}" alt="${c.name}"></span>
        <div>
          <span class="bd-name">${c.name}</span>
          <div style="margin-top:6px">
            <span class="tier-badge tier-${c.tier} bd-tier">${c.tier}</span>
            <span class="role-chip role-${c.role}">${c.role}</span>
          </div>
        </div>
      </div>
      <button class="mini-btn" id="bd-close">close ×</button>
    </div>
    <div class="bd-grid">
      <div class="bd-item"><span class="bd-label">Best Arc</span><b>${c.arc}</b></div>
      <div class="bd-item"><span class="bd-label">Best Cartridge</span><b>${c.cart}</b></div>
      <div class="bd-item bd-wide"><span class="bd-label">Stat priority</span><b>${STAT_HINT[c.role]}</b></div>
      <div class="bd-item bd-wide bd-teams">
        ${teamBlock("Recommended team", c.name, c.team, true)}
        <a class="team-source-link" href="https://www.prydwen.gg/neverness-to-everness/characters/${c.name.toLowerCase().replace(/ /g, "-")}" target="_blank" rel="noopener">More tested team variations (incl. budget options) on Prydwen ↗</a>
        <span class="bd-team-hint">Tap a teammate to jump to their build.</span>
      </div>
      ${c.note ? `<div class="bd-item bd-wide"><span class="bd-label">Notes</span><span class="bd-note">${c.note}</span></div>` : ""}
    </div>
    <p class="bd-credit">Builds &amp; tier compiled from Game8. Open the Prydwen link above for player-tested team variations.</p>`;

  detail.querySelector("#bd-close").addEventListener("click", () => { detail.style.display = "none"; });
  detail.querySelectorAll("[data-jump]").forEach((el) =>
    el.addEventListener("click", () => showBuild(el.dataset.jump)));
  detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function render() {
  root.innerHTML = TIER_ORDER.map((tier) => {
    const chars = CHARACTERS.filter((c) => c.tier === tier && (role === "all" || c.role === role));
    if (!chars.length) return "";
    const cards = chars.map((c) => `
      <button class="char-card" data-char="${c.name}">
        <span class="char-portrait"><img src="${portrait(c.name)}" alt="${c.name}" loading="lazy"></span>
        <span class="char-name">${c.name}</span>
        <span class="role-chip role-${c.role}">${c.role}</span>
      </button>`).join("");
    return `<div class="tier-row">
      <div class="tier-badge tier-${tier}">${tier}</div>
      <div class="tier-chars">${cards}</div>
    </div>`;
  }).join("");

  root.querySelectorAll("[data-char]").forEach((b) =>
    b.addEventListener("click", () => showBuild(b.dataset.char)));
}

document.querySelectorAll(".filter-btn").forEach((b) =>
  b.addEventListener("click", () => {
    role = b.dataset.role;
    document.querySelectorAll(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
    render();
  }));

render();
