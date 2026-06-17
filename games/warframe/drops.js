/* Warframe — Drop Table
   Loads the compact drops.json (built from DE's official drop tables via WFCD)
   and provides live search, multi-select facet filters and sorting.
   Row schema: [item, rarityIdx, chance, type("R"|"M"), source, planet, tier] */

const CAP = 500; // max rows rendered at once
let DATA = null;
const sel = { type: new Set(), rarity: new Set(), planet: new Set(), tier: new Set() };
let query = "", sort = "chance-desc";

const els = {
  search: document.getElementById("drop-search"),
  sort: document.getElementById("drop-sort"),
  facets: document.getElementById("drop-facets"),
  results: document.getElementById("drop-results"),
  count: document.getElementById("drop-count"),
  clear: document.getElementById("drop-clear"),
};

const TYPE_LABEL = { R: "Relic", M: "Mission" };
const TIER_ORDER = ["Lith", "Meso", "Neo", "Axi", "Requiem"];

function uniq(arr) { return [...new Set(arr)].filter(Boolean); }

function buildFacets() {
  const planets = uniq(DATA.rows.map((r) => r[5])).sort();
  const tiers = uniq(DATA.rows.map((r) => r[6])).sort((a, b) => TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b));

  const group = (title, key, items, labelFn = (x) => x) => `
    <div class="facet-group">
      <div class="facet-title">${title}</div>
      <div class="facet-chips">
        ${items.map((it) => `<button class="chip-toggle" data-facet="${key}" data-val="${it}">${labelFn(it)}</button>`).join("")}
      </div>
    </div>`;

  els.facets.innerHTML =
    group("Source", "type", ["R", "M"], (x) => TYPE_LABEL[x]) +
    group("Rarity", "rarity", DATA.rarities.map((_, i) => String(i)), (i) => DATA.rarities[i]) +
    group("Relic tier", "tier", tiers) +
    group("Planet", "planet", planets);

  els.facets.querySelectorAll(".chip-toggle").forEach((b) =>
    b.addEventListener("click", () => {
      const f = b.dataset.facet, v = b.dataset.val;
      if (sel[f].has(v)) sel[f].delete(v); else sel[f].add(v);
      b.classList.toggle("on");
      render();
    }));
}

function matches(r) {
  if (sel.type.size && !sel.type.has(r[3])) return false;
  if (sel.rarity.size && !sel.rarity.has(String(r[1]))) return false;
  if (sel.planet.size && !sel.planet.has(r[5])) return false;
  if (sel.tier.size && !sel.tier.has(r[6])) return false;
  if (query && !(r[0].toLowerCase().includes(query) || r[4].toLowerCase().includes(query))) return false;
  return true;
}

function render() {
  let list = DATA.rows.filter(matches);
  const total = list.length;

  if (sort === "chance-desc") list.sort((a, b) => b[2] - a[2]);
  else if (sort === "chance-asc") list.sort((a, b) => a[2] - b[2]);
  else if (sort === "az") list.sort((a, b) => a[0].localeCompare(b[0]));
  else if (sort === "za") list.sort((a, b) => b[0].localeCompare(a[0]));

  const shown = list.slice(0, CAP);
  els.count.textContent = total > CAP
    ? `Showing ${CAP} of ${total.toLocaleString()} — refine to narrow down`
    : `${total.toLocaleString()} result${total === 1 ? "" : "s"}`;

  els.results.innerHTML = shown.map((r) => {
    const rar = DATA.rarities[r[1]] || "";
    const where = r[3] === "M" ? `${r[4]} · ${r[5]}` : r[4];
    return `<div class="drop-row">
      <span class="drop-item">${r[0]}</span>
      <span class="rar rar-${r[1]}">${rar}</span>
      <span class="drop-src"><span class="src-tag tag-${r[3]}">${TYPE_LABEL[r[3]]}</span>${where}</span>
      <span class="drop-chance">${r[2]}%</span>
    </div>`;
  }).join("") || `<p class="no-results">No drops match your filters.</p>`;
}

els.search.addEventListener("input", () => { query = els.search.value.trim().toLowerCase(); render(); });
els.sort.addEventListener("change", () => { sort = els.sort.value; render(); });
els.clear.addEventListener("click", () => {
  Object.values(sel).forEach((s) => s.clear());
  query = ""; els.search.value = "";
  els.facets.querySelectorAll(".chip-toggle.on").forEach((b) => b.classList.remove("on"));
  render();
});

(async function init() {
  try {
    DATA = await (await fetch(`../../data/warframe/drops.json?cb=${Date.now()}`)).json();
    document.getElementById("drop-updated").textContent =
      `${DATA.rows.length.toLocaleString()} drops · updated ${new Date(DATA.updated).toLocaleDateString()}`;
    buildFacets();
    render();
  } catch (e) {
    els.results.innerHTML = `<p class="tool-note">Couldn't load the drop table data.</p>`;
  }
})();
