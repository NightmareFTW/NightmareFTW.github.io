/* Warframe — Open-World Cycle Timers
   Live data from the public Warframe API (api.warframestat.us, CORS-enabled).
   Countdowns tick locally from each cycle's expiry; data refreshes every 60s. */

const API = "https://api.warframestat.us/pc";
const CYCLES = [
  { key: "cetusCycle", name: "Cetus · Plains of Eidolon" },
  { key: "vallisCycle", name: "Orb Vallis" },
  { key: "cambionCycle", name: "Cambion Drift · Deimos" },
  { key: "duviriCycle", name: "Duviri" },
  { key: "earthCycle", name: "Earth" },
];

const root = document.getElementById("cycle-root");
let data = {}; // key -> {state, expiry}

function fmt(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

async function fetchAll() {
  await Promise.all(CYCLES.map(async (c) => {
    try {
      const r = await fetch(`${API}/${c.key}`);
      const j = await r.json();
      data[c.key] = { state: j.state || j.active || "—", expiry: new Date(j.expiry).getTime() };
    } catch { data[c.key] = null; }
  }));
  render();
}

function render() {
  const now = Date.now();
  root.innerHTML = CYCLES.map((c) => {
    const d = data[c.key];
    if (!d) return `<div class="cycle-card"><div class="cycle-name">${c.name}</div><span class="cycle-state">unavailable</span></div>`;
    const warm = /day|warm|fass/i.test(d.state);
    return `<div class="cycle-card ${warm ? "warm" : "cool"}">
      <div class="cycle-name">${c.name}</div>
      <div class="cycle-state">${d.state}</div>
      <div class="cycle-timer">${fmt(d.expiry - now)}</div>
    </div>`;
  }).join("");
}

fetchAll();
setInterval(render, 1000);      // local countdown tick
setInterval(fetchAll, 60000);   // refresh data
