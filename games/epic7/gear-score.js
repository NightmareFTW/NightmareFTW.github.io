/* Epic Seven — Gear Score Calculator
   Community-style weighting: each substat's value is multiplied by a weight
   reflecting how valuable that stat is. A piece has up to 4 substats; the score
   is the sum. This is an approximation for grading gear, not an in-game number. */

const SUBSTATS = [
  { id: "spd",   label: "Speed",            weight: 2.0,  pct: false },
  { id: "critc", label: "Crit Chance %",    weight: 1.6,  pct: true },
  { id: "critd", label: "Crit Damage %",    weight: 1.14, pct: true },
  { id: "atkp",  label: "Attack %",         weight: 1.0,  pct: true },
  { id: "defp",  label: "Defense %",        weight: 1.0,  pct: true },
  { id: "hpp",   label: "Health %",         weight: 1.0,  pct: true },
  { id: "eff",   label: "Effectiveness %",  weight: 1.0,  pct: true },
  { id: "res",   label: "Effect Resist %",  weight: 1.0,  pct: true },
  { id: "atkf",  label: "Attack (flat)",    weight: 0.30, pct: false },
  { id: "deff",  label: "Defense (flat)",   weight: 0.30, pct: false },
  { id: "hpf",   label: "Health (flat)",    weight: 0.05, pct: false },
];

const TIERS = [
  { min: 70, label: "God-tier", cls: "t-god" },
  { min: 55, label: "Great",    cls: "t-great" },
  { min: 40, label: "Good",     cls: "t-good" },
  { min: 25, label: "Decent",   cls: "t-decent" },
  { min: 0,  label: "Reroll / fodder", cls: "t-low" },
];

const rowsEl = document.getElementById("gs-rows");
const scoreEl = document.getElementById("gs-score");
const tierEl = document.getElementById("gs-tier");
const breakdownEl = document.getElementById("gs-breakdown");

const optionsHtml = SUBSTATS.map((s) => `<option value="${s.id}">${s.label}</option>`).join("");

function addRow(selected) {
  const row = document.createElement("div");
  row.className = "gs-row";
  row.innerHTML = `
    <select class="gs-stat">${optionsHtml}</select>
    <input class="gs-val" type="number" min="0" step="1" placeholder="value" />
    <button class="gs-del" title="Remove">×</button>`;
  if (selected) row.querySelector(".gs-stat").value = selected;
  rowsEl.appendChild(row);
  row.querySelector(".gs-stat").addEventListener("change", calc);
  row.querySelector(".gs-val").addEventListener("input", calc);
  row.querySelector(".gs-del").addEventListener("click", () => { row.remove(); calc(); });
  calc();
}

function calc() {
  let total = 0;
  const parts = [];
  rowsEl.querySelectorAll(".gs-row").forEach((row) => {
    const id = row.querySelector(".gs-stat").value;
    const val = parseFloat(row.querySelector(".gs-val").value) || 0;
    const sub = SUBSTATS.find((s) => s.id === id);
    if (!sub || !val) return;
    const score = val * sub.weight;
    total += score;
    parts.push(`${sub.label}: ${val}${sub.pct ? "%" : ""} × ${sub.weight} = <b>${score.toFixed(1)}</b>`);
  });

  const tier = TIERS.find((t) => total >= t.min);
  scoreEl.textContent = total.toFixed(1);
  tierEl.textContent = tier.label;
  tierEl.className = `gs-tier ${tier.cls}`;
  breakdownEl.innerHTML = parts.length
    ? parts.map((p) => `<div>${p}</div>`).join("")
    : `<span style="color:var(--muted)">Add substats above to score the gear.</span>`;
}

document.getElementById("gs-add").addEventListener("click", () => addRow());

// Start with 4 rows (a full gear piece) pre-selected to common substats.
["spd", "critc", "critd", "atkp"].forEach(addRow);
