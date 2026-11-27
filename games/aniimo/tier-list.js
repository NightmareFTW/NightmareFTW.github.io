/* Aniimo — Tier List.
   Renders Game8's S-to-D ranking (data/aniimo/tiers.json), filterable by role
   and element, with each Aniimo's icon pulled from our creature database and
   linking to its full page. Regional/Prismana form variants are hidden by
   default behind a toggle to keep the core ranking readable. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TIER_COLOR = { OP: "#ffd23d", SS: "#ff4b4b", S: "#ff8a3d", A: "#5fd068", B: "#4d9de0", C: "#bf40bf", D: "#8b4513" };
const ROLE_COLOR = { DPS: "#ff6470", BREAK: "#e0a23a", HEAL: "#34d399", REGEN: "#3d9bf2", SUPPORT: "#a866e0" };
const ELEMENT_COLOR = {
  Fire: "#f2543d", Water: "#3d9bf2", Grass: "#6bbf3f", Electric: "#e0c23a", Ice: "#38b6e0",
  Wind: "#7fd9c4", Dark: "#a866e0", Holy: "#f2e6a3", Rock: "#a9835a",
};
const ROLES = ["DPS", "BREAK", "HEAL", "REGEN", "SUPPORT"];

let DATA = null, ICON = null, fRole = "", fElement = "", showForms = false;
const els = { controls: document.getElementById("tl-controls"), list: document.getElementById("tl-list") };

function controls() {
  const btn = (val, cur, label) => `<button class="tl-btn${val === cur ? " on" : ""}" data-v="${esc(val)}">${esc(label)}</button>`;
  const elements = [...new Set(DATA.tiers.flatMap((t) => t.entries.flatMap((e) => e.elements)))].sort();
  els.controls.innerHTML = `
    <div class="tl-group-f" id="g-role"><span class="lbl">Role</span>
      ${btn("", fRole, "All")}${ROLES.map((r) => btn(r, fRole, r)).join("")}</div>
    <div class="tl-group-f" id="g-elem"><span class="lbl">Element</span>
      ${btn("", fElement, "All")}${elements.map((e) => btn(e, fElement, e)).join("")}</div>
    <button class="tl-btn${showForms ? " on" : ""}" id="g-forms">Show form variants</button>`;
  document.getElementById("g-role").addEventListener("click", (e) => { const b = e.target.closest(".tl-btn"); if (b) { fRole = b.dataset.v; controls(); render(); } });
  document.getElementById("g-elem").addEventListener("click", (e) => { const b = e.target.closest(".tl-btn"); if (b) { fElement = b.dataset.v; controls(); render(); } });
  document.getElementById("g-forms").addEventListener("click", () => { showForms = !showForms; controls(); render(); });
}

function chip(e) {
  const icon = e.slug && ICON.get(e.base.toLowerCase());
  const roleColor = ROLE_COLOR[e.role] || "#9aa0ad";
  const elColor = ELEMENT_COLOR[e.elements[0]] || "#888";
  const inner = `
    <span class="tl-ic">${icon ? `<img src="${esc(icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : `<img alt="" style="visibility:hidden">`}</span>
    <span class="b">
      <span class="n">${esc(e.name)}</span>
      <span class="meta">
        <span class="rc" style="background:${roleColor}26;color:${roleColor}">${esc(e.role)}</span>
        <span style="width:7px;height:7px;border-radius:50%;background:${elColor};flex:none" title="${esc(e.elements.join(" / "))}"></span>
        ${e.form && e.form !== "Basic" ? `<span class="form">${esc(e.form)}</span>` : ""}
        ${e.isNew ? `<span class="new">NEW</span>` : ""}
      </span>
    </span>`;
  return e.slug
    ? `<a class="tl-chip" href="aniimo.html?slug=${encodeURIComponent(e.slug)}">${inner}</a>`
    : `<span class="tl-chip">${inner}</span>`;
}

function render() {
  const match = (e) => (showForms || e.form === "Basic") && (!fRole || e.role === fRole) && (!fElement || e.elements.includes(fElement));
  const order = DATA.order.filter((t) => DATA.tiers.some((x) => x.tier === t));
  let html = "", shown = 0;
  for (const tier of order) {
    const row = DATA.tiers.find((t) => t.tier === tier);
    if (!row) continue;
    const entries = row.entries.filter(match);
    if (!entries.length) continue;
    shown += entries.length;
    const col = TIER_COLOR[tier] || "#666";
    html += `<div class="tl-row">
      <div class="tl-letter" style="background:${col}">${esc(tier)}</div>
      <div class="tl-group">${entries.map(chip).join("")}</div>
    </div>`;
  }
  els.list.innerHTML = html || `<p class="tl-empty">No Aniimo match these filters.</p>`;
}

(async function init() {
  try {
    const [tiers, creatures] = await Promise.all([
      fetch(`../../data/aniimo/tiers.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/aniimo/creatures.json?cb=${Date.now()}`).then((r) => r.json()).catch(() => null),
    ]);
    DATA = tiers;
    ICON = new Map((creatures ? creatures.creatures : []).map((c) => [c.name.toLowerCase(), c.icon]));
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("tl-updated").textContent = `${DATA.count} ranked · updated ${upd}`;
    controls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load the Aniimo tier list.</p>`;
  }
})();
