/* Disney Dreamlight Valley — Animal Guide.
   Two tabs: wild Critters (per-species guide — favourite food, weekly schedule,
   DLC, how to approach, plus each colour variant) and Companions (every
   collectible companion grouped by how you get it: event / premium / quest /
   craftable). Tick what you've collected (saved on this device); collected
   entries dim and can be filtered. Names show the official PT-BR when PT. */

let DATA = null, tab = "critters";
let query = "", fBiome = "", fDlc = "", fApproach = "", fSource = "", fOwned = "all";
const KEY = "nftw:ddv:animals";
const PT = localStorage.getItem("nftw:lang") === "pt";
const nm = (o) => (PT && o.name_pt) ? o.name_pt : o.name;
const tr = (o, k) => (PT && o[k + "_pt"]) ? o[k + "_pt"] : o[k]; // food/reward in official PT when available
const biomeLabel = (v) => v; // biome names already match the wild biomes; PT handled by i18n where mapped
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const DLC_CLASS = { "A Rift in Time": "dlc-rift", "Storybook Vale": "dlc-vale", "Wishblossom Mountains": "dlc-wish" };
const SRC_CLASS = { Event: "src-event", Premium: "src-premium", "Quest Reward": "src-quest", Craftable: "src-craft" };

const owned = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
const isOwned = (name) => owned.has(name);
function setOwned(name, v) {
  if (v) owned.add(name); else owned.delete(name);
  localStorage.setItem(KEY, JSON.stringify([...owned]));
}

// Short label for the feeding/approach style (used as a filter).
function approachOf(feeding) {
  if (/^red light/i.test(feeding)) return "Red Light, Green Light";
  if (/^tag\b/i.test(feeding)) return "Tag (chase)";
  if (/^patience/i.test(feeding)) return "Patience (wait)";
  return "Just approach";
}
const DAY3 = { Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat" };
const scheduleText = (sch) => sch.map((s) => `${DAY3[s.day]} ${s.hours}`).join(" · ") || "Always around";

// ---- "Active now" — DDV critters spawn on the player's LOCAL device clock
// (confirmed: gameplay schedules follow real local time + day, reset at local
// midnight), so we read the browser's local time directly; no timezone offset. ----
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function to24(h, ap, isEnd) {
  ap = (ap || "").toUpperCase();
  if (ap === "PM") return h === 12 ? 12 : h + 12;
  if (ap === "AM") return h === 12 ? (isEnd ? 24 : 0) : h;
  return h;
}
// Parse a wiki hours string ("All day", "6 AM to 2 PM", "7-8 AM and 7-8 PM") into [start,end) ranges (24h).
function parseHours(str) {
  if (/all\s*day/i.test(str)) return [[0, 24]];
  const ranges = [];
  for (const part of String(str).split(/\s+and\s+/i)) {
    let m;
    if ((m = part.match(/(\d{1,2})\s*-\s*(\d{1,2})\s*(AM|PM)/i))) ranges.push([to24(+m[1], m[3]), to24(+m[2], m[3], true)]);
    else if ((m = part.match(/(\d{1,2})\s*(AM|PM)?\s*to\s*(\d{1,2})\s*(AM|PM)?/i))) ranges.push([to24(+m[1], m[2] || m[4]), to24(+m[3], m[4] || m[2], true)]);
  }
  return ranges;
}
// Variants active at the local "now": one entry per active variant with its window end.
function activeNow() {
  const now = new Date();
  const day = DAYS_FULL[now.getDay()];
  const hf = now.getHours() + now.getMinutes() / 60;
  const out = [];
  for (const sp of DATA.critters) {
    for (const v of sp.variants || []) {
      const s = (v.schedule || []).find((x) => x.day === day);
      if (!s) continue;
      const win = parseHours(s.hours).find(([a, b]) => hf >= a && hf < b);
      if (win) out.push({ sp, v, end: win[1], allDay: /all\s*day/i.test(s.hours) });
    }
  }
  out.sort((a, b) => (a.allDay - b.allDay) || (a.end - b.end)); // time-limited first
  return out;
}
function fmtEnd(end, allDay) {
  if (allDay) return "all day";
  if (end >= 24) return "until midnight";
  const ap = end >= 12 ? "PM" : "AM", h12 = end % 12 === 0 ? 12 : end % 12;
  return `until ${h12} ${ap}`;
}
function renderActive() {
  const el = document.getElementById("an-active");
  if (!el || !DATA) return;
  const list = activeNow();
  const now = new Date();
  const hf = now.getHours() + now.getMinutes() / 60;
  const timeStr = now.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" });
  const cards = list.map(({ sp, v, end, allDay }) => {
    const soon = !allDay && (end - hf) <= 2; // ending within 2 hours
    return `
    <div class="an-act-card ${isOwned(v.name) ? "is-owned" : ""}">
      <span class="an-act-img">${(v.img || sp.img) ? `<img src="${esc(v.img || sp.img)}" alt="" loading="lazy">` : ""}</span>
      <span class="an-act-text"><span class="an-act-name">${esc(nm(v))}</span><span class="an-act-sp">${esc(nm(sp))} · ${esc(sp.biome)}</span></span>
      <span class="an-act-end ${soon ? "soon" : ""}">${fmtEnd(end, allDay)}</span>
    </div>`;
  }).join("");
  el.innerHTML = `
    <div class="an-act-head">
      <h2 class="an-act-h">Active right now</h2>
      <span class="an-act-time">${esc(timeStr)} · your local time</span>
      <span class="an-act-count">${list.length} active</span>
    </div>
    <p class="an-act-note">Dreamlight Valley critters follow your device's local clock, so this matches your game. Time-limited windows are shown first.</p>
    <div class="an-act-grid">${cards || `<p class="ac-muted">Nothing on a fixed schedule right now — check back later.</p>`}</div>`;
}

const els = {
  tabs: document.getElementById("an-tabs"),
  controls: document.getElementById("an-controls"),
  list: document.getElementById("an-list"),
  count: document.getElementById("an-count"),
  updated: document.getElementById("an-updated"),
};
const uniqSorted = (arr) => [...new Set(arr)].filter(Boolean).sort();
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  const ownedSel = `<select id="f-owned" class="sort-select">${opt("all", "All", fOwned)}${opt("yes", "Collected", fOwned)}${opt("no", "Not collected", fOwned)}</select>`;
  const search = `<input type="search" id="f-search" class="search-input" placeholder="Search…" autocomplete="off" value="${esc(query)}">`;
  if (tab === "critters") {
    const biomes = uniqSorted(DATA.critters.map((c) => c.biome));
    const dlcs = uniqSorted(DATA.critters.map((c) => c.dlc));
    const approaches = uniqSorted(DATA.critters.map((c) => approachOf(c.feeding)));
    els.controls.innerHTML = search +
      `<select id="f-biome" class="sort-select">${opt("", "All biomes", fBiome)}${biomes.map((b) => opt(b, b, fBiome)).join("")}</select>` +
      `<select id="f-dlc" class="sort-select">${opt("", "All DLC", fDlc)}${dlcs.map((d) => opt(d, d, fDlc)).join("")}</select>` +
      `<select id="f-approach" class="sort-select">${opt("", "Any approach", fApproach)}${approaches.map((a) => opt(a, a, fApproach)).join("")}</select>` +
      ownedSel;
  } else {
    const sources = ["Event", "Premium", "Quest Reward", "Craftable"].filter((s) => DATA.companions.some((c) => c.source === s));
    els.controls.innerHTML = search +
      `<select id="f-source" class="sort-select">${opt("", "All sources", fSource)}${sources.map((s) => opt(s, s, fSource)).join("")}</select>` +
      ownedSel;
  }
  const on = (id, fn) => { const e = document.getElementById(id); if (e) e.addEventListener(e.tagName === "INPUT" ? "input" : "change", fn); };
  on("f-search", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  on("f-biome", (e) => { fBiome = e.target.value; render(); });
  on("f-dlc", (e) => { fDlc = e.target.value; render(); });
  on("f-approach", (e) => { fApproach = e.target.value; render(); });
  on("f-source", (e) => { fSource = e.target.value; render(); });
  on("f-owned", (e) => { fOwned = e.target.value; render(); });
}

function ownedFilterVariants(variants) {
  if (fOwned === "yes") return variants.filter((v) => isOwned(v.name));
  if (fOwned === "no") return variants.filter((v) => !isOwned(v.name));
  return variants;
}

function critterCard(c) {
  let variants = c.variants;
  if (query) variants = variants.filter((v) => `${v.name} ${v.name_pt || ""}`.toLowerCase().includes(query));
  variants = ownedFilterVariants(variants);
  const have = c.variants.filter((v) => isOwned(v.name)).length;
  return `
    <div class="animal-card">
      <div class="ac-head">
        <span class="ac-img">${c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy">` : ""}</span>
        <div class="ac-title">
          <span class="ac-name">${esc(nm(c))}</span>
          <span class="ac-chips"><span class="ev-chip">${esc(c.biome)}</span>${c.dlc ? `<span class="fr-dlc ${DLC_CLASS[c.dlc] || ""}">${esc(c.dlc)}</span>` : ""}</span>
        </div>
        <span class="ac-progress">${have}/${c.variants.length}</span>
      </div>
      <div class="ac-body">
        <p class="ac-line">🍽 <b>Favourite:</b> ${esc(tr(c, "favoriteFood"))}${c.likedFood ? ` · <span class="ac-muted"><b class="ac-lbl">Liked:</b> ${esc(tr(c, "likedFood"))}</span>` : ""}</p>
        <p class="ac-line">🤝 <b>How to approach:</b> ${esc(c.feeding)}</p>
        ${c.favReward ? `<p class="ac-line ac-muted">🎁 ${esc(tr(c, "favReward"))}</p>` : ""}
        <div class="variant-grid">
          ${variants.map((v) => `
            <label class="variant-row ${isOwned(v.name) ? "is-owned" : ""}">
              <input type="checkbox" class="var-check" data-name="${esc(v.name)}" ${isOwned(v.name) ? "checked" : ""}>
              <span class="var-img">${v.img ? `<img src="${esc(v.img)}" alt="" loading="lazy">` : ""}</span>
              <span class="var-text"><span class="var-name">${esc(nm(v))}</span><span class="var-sched">${esc(scheduleText(v.schedule))}</span></span>
            </label>`).join("") || `<p class="ac-muted" style="grid-column:1/-1">No variants match.</p>`}
        </div>
      </div>
    </div>`;
}

function companionCard(c) {
  return `
    <label class="animal-card comp-card ${isOwned(c.name) ? "is-owned" : ""}">
      <input type="checkbox" class="var-check comp-check" data-name="${esc(c.name)}" ${isOwned(c.name) ? "checked" : ""}>
      <span class="comp-img">${c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy">` : ""}</span>
      <span class="comp-body">
        <span class="comp-name">${esc(nm(c))}</span>
        <span class="src-badge ${SRC_CLASS[c.source] || ""}">${esc(c.source)}</span>
        <span class="comp-obtain">${esc(c.obtain)}</span>
      </span>
    </label>`;
}

function render() {
  if (tab === "critters") {
    let list = DATA.critters.filter((c) =>
      (!fBiome || c.biome === fBiome) && (!fDlc || c.dlc === fDlc) && (!fApproach || approachOf(c.feeding) === fApproach));
    // owned/search apply to variants; hide a species with no matching variants
    list = list.filter((c) => {
      let vs = c.variants;
      if (query) vs = vs.filter((v) => `${v.name} ${v.name_pt || ""}`.toLowerCase().includes(query)) ;
      vs = ownedFilterVariants(vs);
      return vs.length || (!query && fOwned === "all");
    });
    const totalVars = DATA.critters.reduce((n, c) => n + c.variants.length, 0);
    const haveVars = DATA.critters.reduce((n, c) => n + c.variants.filter((v) => isOwned(v.name)).length, 0);
    els.count.textContent = `${list.length} species · ${haveVars}/${totalVars} critters collected`;
    els.list.className = "animal-grid";
    els.list.innerHTML = list.map(critterCard).join("") || `<p class="no-results">No critters match.</p>`;
  } else {
    let list = DATA.companions.filter((c) =>
      (!fSource || c.source === fSource) &&
      (fOwned === "all" || (fOwned === "yes") === isOwned(c.name)) &&
      (!query || `${c.name} ${c.name_pt || ""}`.toLowerCase().includes(query)));
    const have = DATA.companions.filter((c) => isOwned(c.name)).length;
    els.count.textContent = `${list.length} of ${DATA.companions.length} companions · ${have} collected`;
    els.list.className = "companion-grid";
    els.list.innerHTML = list.map(companionCard).join("") || `<p class="no-results">No companions match.</p>`;
  }
  els.list.querySelectorAll(".var-check").forEach((ch) => ch.addEventListener("change", () => {
    setOwned(ch.dataset.name, ch.checked);
    const card = ch.closest(".variant-row") || ch.closest(".comp-card");
    if (card) card.classList.toggle("is-owned", ch.checked);
    // refresh counts / progress without losing scroll
    if (tab === "critters") { const c = ch.closest(".animal-card"); if (c) { const sp = DATA.critters.find((s) => s.variants.some((v) => v.name === ch.dataset.name)); if (sp) c.querySelector(".ac-progress").textContent = `${sp.variants.filter((v) => isOwned(v.name)).length}/${sp.variants.length}`; } }
    updateCounts();
    renderActive();
  }));
}

function updateCounts() {
  document.getElementById("cnt-critters").textContent = DATA.critters.reduce((n, c) => n + c.variants.length, 0);
  document.getElementById("cnt-companions").textContent = DATA.companions.length;
}

els.tabs.querySelectorAll(".cat-tab").forEach((b) => b.addEventListener("click", () => {
  tab = b.dataset.tab; query = ""; fOwned = "all"; fBiome = fDlc = fApproach = fSource = "";
  els.tabs.querySelectorAll(".cat-tab").forEach((x) => x.classList.toggle("on", x === b));
  buildControls(); render();
}));

(async function init() {
  try {
    DATA = await (await fetch(`../../data/dreamlight-valley/animals.json?cb=${Date.now()}`)).json();
    els.updated.textContent = `${DATA.critters.length} wild species · ${DATA.companions.length} companions · source: Dreamlight Valley Wiki`;
    updateCounts();
    buildControls();
    render();
    renderActive();
    setInterval(renderActive, 60000); // keep "active now" current
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load animal data.</p>`;
  }
})();
