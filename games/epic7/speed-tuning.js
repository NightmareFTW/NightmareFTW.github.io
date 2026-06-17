/* Epic Seven — Speed Tuning / Turn Order Simulator
   Combat Readiness (CR) fills proportionally to Speed; a unit takes its turn
   when CR reaches 100%, then keeps the overflow. This simulates the opening
   turn order from each unit's Speed and starting CR. */

let units = [
  { name: "Hero 1", spd: 250, cr: 0, side: "Ally" },
  { name: "Hero 2", spd: 230, cr: 0, side: "Ally" },
  { name: "Enemy 1", spd: 240, cr: 0, side: "Enemy" },
  { name: "Enemy 2", spd: 210, cr: 0, side: "Enemy" },
];
const TURNS = 12;

const rowsEl = document.getElementById("st-rows");
const seqEl = document.getElementById("st-seq");

function simulate() {
  const live = units
    .map((u, i) => ({ ...u, i, _cr: Math.min(Math.max(u.cr, 0), 99) / 100 }))
    .filter((u) => u.spd > 0);
  if (!live.length) return [];

  const seq = [];
  for (let n = 0; n < TURNS; n++) {
    // time for each unit to reach CR 1.0
    let best = null;
    for (const u of live) {
      const t = (1 - u._cr) / u.spd;
      if (best === null || t < best.t - 1e-9) best = { t, u };
    }
    for (const u of live) u._cr += u.spd * best.t;
    best.u._cr -= 1;
    seq.push(best.u);
  }
  return seq;
}

function colorFor(i) {
  const hues = [0, 200, 40, 280, 160, 320];
  return `hsl(${hues[i % hues.length]}, 70%, 60%)`;
}

function renderRows() {
  rowsEl.innerHTML = units.map((u, i) => `
    <div class="st-row">
      <span class="st-dot" style="background:${colorFor(i)}"></span>
      <input class="st-name" data-i="${i}" data-k="name" value="${u.name}">
      <input class="st-num" type="number" data-i="${i}" data-k="spd" value="${u.spd}" title="Speed">
      <input class="st-num" type="number" data-i="${i}" data-k="cr" value="${u.cr}" title="Starting CR %">
      <button class="st-side ${u.side === "Ally" ? "ally" : "enemy"}" data-i="${i}">${u.side}</button>
      <button class="st-del" data-del="${i}">×</button>
    </div>`).join("");

  rowsEl.querySelectorAll("input").forEach((inp) =>
    inp.addEventListener("input", () => {
      const u = units[inp.dataset.i], k = inp.dataset.k;
      u[k] = k === "name" ? inp.value : parseFloat(inp.value) || 0;
      renderSeq();
    }));
  rowsEl.querySelectorAll(".st-side").forEach((b) =>
    b.addEventListener("click", () => {
      const u = units[b.dataset.i];
      u.side = u.side === "Ally" ? "Enemy" : "Ally";
      renderRows(); renderSeq();
    }));
  rowsEl.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => { units.splice(b.dataset.del, 1); renderRows(); renderSeq(); }));
}

function renderSeq() {
  const seq = simulate();
  if (!seq.length) { seqEl.innerHTML = `<p style="color:var(--muted)">Add a unit with Speed > 0.</p>`; return; }
  seqEl.innerHTML = seq.map((u, n) => `
    <div class="turn-pill ${u.side === "Ally" ? "ally" : "enemy"}">
      <span class="turn-n">${n + 1}</span>
      <span class="st-dot" style="background:${colorFor(u.i)}"></span>
      <span>${u.name}</span>
    </div>`).join("");
}

document.getElementById("st-add").addEventListener("click", () => {
  units.push({ name: `Unit ${units.length + 1}`, spd: 200, cr: 0, side: "Ally" });
  renderRows(); renderSeq();
});

renderRows();
renderSeq();
