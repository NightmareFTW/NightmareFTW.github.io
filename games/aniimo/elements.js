/* Aniimo — Element Chart.
   Renders the 9x9 element type-effectiveness grid from data/aniimo/elements.json
   (rows attack, columns defend), coloured by multiplier. Tapping any element
   highlights its attack row and defence column and shows a plain-language
   summary of everything it is strong and weak against. Pure reference data —
   the official wiki has no type chart, so this is the community-datamined set. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ELEMENT_COLOR = {
  Fire: "#f2543d", Water: "#3d9bf2", Grass: "#6bbf3f", Electric: "#e0c23a", Ice: "#38b6e0",
  Wind: "#7fd9c4", Rock: "#a9835a", Holy: "#f2e6a3", Dark: "#a866e0",
};

let DATA = null, ELS = [], CHART = null, selected = null;
const grid = document.getElementById("el-grid"), sumEl = document.getElementById("el-sum");

const rel = (atk, def) => CHART[atk].strong.includes(def) ? "super" : (CHART[atk].resisted.includes(def) ? "resist" : "neutral");
const mult = { super: "1.6", resist: "0.6", neutral: "1" };

function renderGrid() {
  let html = `<div class="el-corner">ATK&nbsp;↓<br>DEF&nbsp;→</div>`;
  for (const d of ELS) html += `<div class="el-h col${selected === d ? " on" : ""}" data-el="${esc(d)}" style="background:${ELEMENT_COLOR[d]}" title="${esc(d)}">${esc(d)}</div>`;
  for (const a of ELS) {
    html += `<div class="el-h row${selected === a ? " on" : ""}" data-el="${esc(a)}" style="background:${ELEMENT_COLOR[a]}" title="${esc(a)}">${esc(a)}</div>`;
    for (const d of ELS) {
      const r = rel(a, d);
      const hl = selected && (a === selected || d === selected) ? " hl" : "";
      html += `<div class="el-cell ${r}${hl}" title="${esc(a)} → ${esc(d)}: ${mult[r]}×">${mult[r]}</div>`;
    }
  }
  grid.innerHTML = html;
  grid.classList.toggle("sel", !!selected);
  grid.querySelectorAll(".el-h").forEach((h) => h.addEventListener("click", () => select(h.dataset.el === selected ? null : h.dataset.el)));
}

function pills(list) {
  return list.length
    ? list.map((e) => `<span class="pill" style="background:${ELEMENT_COLOR[e]}">${esc(e)}</span>`).join("")
    : `<span style="color:var(--muted);font-size:.85rem">none</span>`;
}

function renderSummary() {
  if (!selected) { sumEl.innerHTML = `<p class="el-hint">Tap an element in the grid to see its matchups.</p>`; return; }
  const e = selected;
  const weakTo = ELS.filter((x) => CHART[x].strong.includes(e));
  const resists = ELS.filter((x) => CHART[x].resisted.includes(e));
  sumEl.innerHTML = `<div class="el-sum">
    <h3><span class="dot" style="background:${ELEMENT_COLOR[e]}"></span>${esc(e)}</h3>
    <div class="row"><span class="lbl">Strong against</span>${pills(CHART[e].strong)}</div>
    <div class="row"><span class="lbl">Deals less to</span>${pills(CHART[e].resisted)}</div>
    <div class="row" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><span class="lbl">Weak to</span>${pills(weakTo)}</div>
    <div class="row"><span class="lbl">Resists</span>${pills(resists)}</div>
  </div>`;
}

function select(el) { selected = el; renderGrid(); renderSummary(); }

(async function init() {
  try {
    DATA = await (await fetch(`../../data/aniimo/elements.json?cb=${Date.now()}`)).json();
    ELS = DATA.elements; CHART = DATA.chart;
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("el-updated").textContent = `9 elements · updated ${upd}`;
    renderGrid();
    renderSummary();
  } catch (e) {
    grid.innerHTML = `<p class="tool-note">Couldn't load the element chart.</p>`;
  }
})();
