/* NTE — Tier List & Builds
   Rankings sourced from Game8 (archives/597305). Each character links to a
   Game8 search for their build & best teams. Update tiers as the meta shifts. */

const TIERS = [
  { tier: "S", chars: [
    { name: "Lacrimosa", role: "DPS" },
    { name: "Hotori", role: "DPS" },
    { name: "Nanally", role: "DPS" },
    { name: "Sakiri", role: "Buff" },
  ]},
  { tier: "A", chars: [
    { name: "Esper Zero", role: "DPS" },
    { name: "Chiz", role: "DPS" },
    { name: "Daffodil", role: "DPS" },
    { name: "Baicang", role: "DPS" },
    { name: "Jiuyuan", role: "DPS" },
    { name: "Hathor", role: "DPS" },
    { name: "Haniel", role: "Buff" },
    { name: "Fadia", role: "Survival" },
  ]},
  { tier: "B", chars: [
    { name: "Mint", role: "DPS" },
    { name: "Adler", role: "Survival" },
  ]},
  { tier: "C", chars: [
    { name: "Edgar", role: "Survival" },
    { name: "Skia", role: "DPS" },
    { name: "Aurelia", role: "DPS" },
  ]},
];

const buildLink = (name) =>
  `https://www.google.com/search?q=${encodeURIComponent(`site:game8.co Neverness to Everness ${name} build team`)}`;

let role = "all";
const root = document.getElementById("tier-root");

function render() {
  root.innerHTML = TIERS.map((row) => {
    const chars = row.chars.filter((c) => role === "all" || c.role === role);
    if (!chars.length) return "";
    const cards = chars.map((c) => `
      <a class="char-card" href="${buildLink(c.name)}" target="_blank" rel="noopener">
        <span class="char-name">${c.name}</span>
        <span class="role-chip role-${c.role}">${c.role}</span>
        <span class="char-link">builds &amp; teams →</span>
      </a>`).join("");
    return `<div class="tier-row">
      <div class="tier-badge tier-${row.tier}">${row.tier}</div>
      <div class="tier-chars">${cards}</div>
    </div>`;
  }).join("");
}

document.querySelectorAll(".filter-btn").forEach((b) =>
  b.addEventListener("click", () => {
    role = b.dataset.role;
    document.querySelectorAll(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
    render();
  }));

render();
