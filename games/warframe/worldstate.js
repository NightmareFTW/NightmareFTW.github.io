/* Warframe — Worldstate Tracker
   Live data from api.warframestat.us (CORS-enabled). Refreshes every 60s;
   countdowns tick locally from each item's expiry. */

const API = "https://api.warframestat.us/pc";
const state = {};

function fmt(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${h}h`;
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}
const t = (iso) => new Date(iso).getTime();

async function load() {
  const get = async (p) => { try { return await (await fetch(`${API}/${p}`)).json(); } catch { return null; } };
  const [sortie, fissures, voidTrader, arbitration] = await Promise.all([
    get("sortie"), get("fissures"), get("voidTrader"), get("arbitration"),
  ]);
  state.sortie = sortie; state.fissures = fissures;
  state.voidTrader = voidTrader; state.arbitration = arbitration;
  render();
}

function section(title, body) {
  return `<div class="panel ws-section"><h2>${title}</h2>${body}</div>`;
}

function render() {
  const now = Date.now();
  const out = [];

  // Sortie
  const s = state.sortie;
  if (s && s.variants) {
    out.push(section("Sortie",
      `<p class="ws-sub">${s.boss || ""} · ${s.faction || ""} <span class="ws-timer">${fmt(t(s.expiry) - now)}</span></p>` +
      s.variants.map((v) => `<div class="ws-row"><span class="ws-tag">${v.missionType}</span><div class="ws-info"><strong>${v.modifier}</strong><span>${v.node}</span></div></div>`).join("")));
  }

  // Arbitration
  const a = state.arbitration;
  if (a && a.node && !/SolNode/.test(a.node) && a.type !== "Unknown") {
    out.push(section("Arbitration",
      `<div class="ws-row"><span class="ws-tag">${a.type || ""}</span><div class="ws-info"><strong>${a.node}</strong><span>${a.enemy || ""}</span></div><span class="ws-timer">${fmt(t(a.expiry) - now)}</span></div>`));
  }

  // Baro Ki'Teer
  const b = state.voidTrader;
  if (b) {
    const arrived = b.active;
    out.push(section("Baro Ki'Teer",
      arrived
        ? `<p class="ws-sub">At <strong>${b.location}</strong> · leaves in <span class="ws-timer">${fmt(t(b.expiry) - now)}</span></p>` +
          (b.inventory && b.inventory.length
            ? `<div class="ws-baro">${b.inventory.slice(0, 30).map((i) => `<span class="ev-chip">${i.item}</span>`).join("")}</div>`
            : `<p class="ws-sub">Inventory loading…</p>`)
        : `<p class="ws-sub">Away — arrives at <strong>${b.location || "?"}</strong> in <span class="ws-timer">${fmt(t(b.activation) - now)}</span></p>`));
  }

  // Fissures
  const f = state.fissures;
  if (f && f.length) {
    const order = { Lith: 1, Meso: 2, Neo: 3, Axi: 4, Requiem: 5, Omnia: 6 };
    const sorted = [...f].sort((x, y) => (order[x.tier] || 9) - (order[y.tier] || 9));
    out.push(section("Void Fissures",
      sorted.map((x) => `<div class="ws-row">
        <span class="ws-tag tier-${x.tier}">${x.tier}</span>
        <div class="ws-info"><strong>${x.missionType}${x.isHard ? " · Steel Path" : ""}${x.isStorm ? " · Railjack" : ""}</strong><span>${x.node}</span></div>
        <span class="ws-timer">${fmt(t(x.expiry) - now)}</span>
      </div>`).join("")));
  }

  document.getElementById("ws-root").innerHTML = out.join("") || `<p style="color:var(--muted)">Could not load worldstate.</p>`;
}

load();
setInterval(render, 1000);
setInterval(load, 60000);
