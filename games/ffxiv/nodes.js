/* FFXIV Gathering Node Timer
   The Eorzea clock and countdowns are exact (1 Eorzea hour = 175 real seconds).
   NODES below is a starter dataset — edit freely. Each node lists the Eorzea
   hours it spawns at; nodes stay up for `dur` Eorzea hours (default 2). */

const DUR = 2; // Eorzea hours a node stays up

const NODES = [
  { job: "MIN", item: "Rarefied Bismuth Ore",      loc: "Urqopacha",          lv: 100, times: [4, 16] },
  { job: "BTN", item: "Rarefied Windsbalm Bay Leaf", loc: "Kozama'uka",        lv: 100, times: [6, 18] },
  { job: "MIN", item: "Rarefied Gold Ore",         loc: "Yak T'el",            lv: 100, times: [8, 20] },
  { job: "BTN", item: "Rarefied Mountain Flax",    loc: "Shaaloani",           lv: 100, times: [10, 22] },
  { job: "MIN", item: "Rarefied Acacia Logs",      loc: "Heritage Found",      lv: 100, times: [0, 12] },
  { job: "BTN", item: "Rarefied Dark Mahogany Log", loc: "Living Memory",      lv: 100, times: [2, 14] },
  { job: "MIN", item: "Unspoiled Stellar Marble",  loc: "Urqopacha",           lv: 100, times: [3, 15] },
  { job: "BTN", item: "Unspoiled Ye'sup Fleaf",    loc: "Kozama'uka",          lv: 100, times: [5, 17] },
  { job: "MIN", item: "Folklore Ore Deposit",      loc: "Shaaloani",           lv: 100, times: [9, 21] },
  { job: "BTN", item: "Folklore Mature Tree",      loc: "Yak T'el",            lv: 100, times: [11, 23] },
];

const JOB_LABEL = { MIN: "Miner", BTN: "Botanist" };
let filter = "all";

function eorzea() {
  const unix = Date.now() / 1000;
  const totalEtHours = unix / 175; // 1 ET hour = 175 real seconds
  const hour = Math.floor(totalEtHours % 24);
  const min = Math.floor(((unix * 60) / 175) % 60);
  return { totalEtHours, hour, min };
}

/* Returns {up, etRemaining} for a node: etRemaining is ET hours until it
   closes (if up) or until it next opens. */
function nodeState(node, totalEtHours) {
  let best = null; // smallest "until next open"
  let active = null;
  for (const t of node.times) {
    const prevStart = 24 * Math.floor((totalEtHours - t) / 24) + t;
    if (totalEtHours < prevStart + DUR) {
      const rem = prevStart + DUR - totalEtHours;
      if (active === null || rem < active) active = rem;
    } else {
      const nextStart = prevStart + 24;
      const until = nextStart - totalEtHours;
      if (best === null || until < best) best = until;
    }
  }
  if (active !== null) return { up: true, etRemaining: active };
  return { up: false, etRemaining: best };
}

function fmt(realSeconds) {
  const s = Math.max(0, Math.round(realSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

const listEl = document.getElementById("node-list");
const etEl = document.getElementById("et-time");

function render() {
  const { totalEtHours, hour, min } = eorzea();
  etEl.textContent = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

  let rows = NODES.map((n) => ({ ...n, ...nodeState(n, totalEtHours) }));
  rows.sort((a, b) => (a.up === b.up ? a.etRemaining - b.etRemaining : a.up ? -1 : 1));

  rows = rows.filter((n) => {
    if (filter === "all") return true;
    if (filter === "up") return n.up;
    return n.job === filter;
  });

  listEl.innerHTML = rows.map((n) => {
    const real = n.etRemaining * 175;
    const statusCls = n.up ? "up" : "";
    const statusTxt = n.up
      ? `<span class="node-status up">UP · closes in ${fmt(real)}</span>`
      : `<span class="node-status">in ${fmt(real)}</span>`;
    return `<div class="node-row ${statusCls}">
      <div class="node-job ${n.job}">${n.job}</div>
      <div class="node-info">
        <strong>${n.item}</strong>
        <span>${n.loc} · Lv ${n.lv} · ${JOB_LABEL[n.job]} · ET ${n.times.map((t) => String(t).padStart(2, "0") + ":00").join(" / ")}</span>
      </div>
      ${statusTxt}
    </div>`;
  }).join("") || `<p style="color:var(--muted)">No nodes match this filter.</p>`;
}

document.querySelectorAll(".filter-btn").forEach((b) =>
  b.addEventListener("click", () => {
    filter = b.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
    render();
  }));

render();
setInterval(render, 1000);
