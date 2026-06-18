/* Disney Dreamlight Valley — Items Database
   Loads items.json (farmable ingredients) and offers live search plus
   multi-select filters by cooking category and biome, with sorting. */

let DATA = null;
const sel = { category: new Set(), biome: new Set(), dlc: new Set() };
let query = "", sort = "name";
const DLC_CLASS = { "A Rift in Time": "dlc-rift", "Storybook Vale": "dlc-vale", "Wishblossom Mountains": "dlc-wish" };
const PT = localStorage.getItem("nftw:lang") === "pt";
const nm = (it) => (PT && it.name_pt) ? it.name_pt : it.name;

const els = {
  search: document.getElementById("it-search"),
  sort: document.getElementById("it-sort"),
  facets: document.getElementById("it-facets"),
  list: document.getElementById("it-list"),
  count: document.getElementById("it-count"),
  updated: document.getElementById("it-updated"),
  clear: document.getElementById("it-clear"),
};

const uniqSorted = (arr) => [...new Set(arr)].filter(Boolean).sort();

function buildFacets() {
  const cats = uniqSorted(DATA.items.map((i) => i.category));
  const biomes = uniqSorted(DATA.items.flatMap((i) => i.biomes));
  const dlcs = uniqSorted(DATA.items.map((i) => i.dlc));
  const group = (title, key, items) => `
    <div class="facet-group">
      <span class="facet-title">${title}</span>
      <div class="facet-chips">
        ${items.map((v) => `<button class="chip-toggle" data-facet="${key}" data-val="${v}">${v}</button>`).join("")}
      </div>
    </div>`;
  els.facets.innerHTML = group("Category", "category", cats) + group("Biome", "biome", biomes) +
    (dlcs.length ? group("DLC", "dlc", dlcs) : "");
  els.facets.querySelectorAll(".chip-toggle").forEach((b) =>
    b.addEventListener("click", () => {
      const f = b.dataset.facet, v = b.dataset.val;
      if (sel[f].has(v)) sel[f].delete(v); else sel[f].add(v);
      b.classList.toggle("on");
      render();
    }));
}

function matches(it) {
  if (sel.category.size && !sel.category.has(it.category)) return false;
  if (sel.biome.size && !it.biomes.some((b) => sel.biome.has(b))) return false;
  if (sel.dlc.size && !sel.dlc.has(it.dlc)) return false;
  if (query && !`${it.name} ${it.name_pt || ""}`.toLowerCase().includes(query)) return false;
  return true;
}

function render() {
  let list = DATA.items.filter(matches);
  const total = list.length;
  if (sort === "sell-desc") list.sort((a, b) => b.sell - a.sell);
  else if (sort === "energy-desc") list.sort((a, b) => b.energy - a.energy);
  else list.sort((a, b) => nm(a).localeCompare(nm(b)));

  els.count.textContent = `${total} item${total === 1 ? "" : "s"}`;
  els.list.innerHTML = list.map((it) => `
    <div class="rc-card">
      <div class="rc-top">
        <span class="rc-name">${nm(it)}</span>
        <span>${it.limited ? `<span class="fr-dlc dlc-wish">Limited</span> ` : ""}${it.dlc ? `<span class="fr-dlc ${DLC_CLASS[it.dlc] || ""}">${it.dlc}</span> ` : ""}<span class="ev-chip">${it.category}</span></span>
      </div>
      <p class="it-where"><b>Where:</b> ${it.location}</p>
      <p class="it-where"><b>From:</b> ${it.source}</p>
      <div class="rc-meta">
        <span>💰 ${it.sell.toLocaleString()}</span>
        <span>⚡ ${it.energy.toLocaleString()}</span>
        ${it.growTime && it.growTime !== "—" ? `<span>⏱ ${it.growTime}</span>` : ""}
      </div>
    </div>`).join("") || `<p class="no-results">No items match.</p>`;
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
    DATA = await (await fetch(`../../data/dreamlight-valley/items.json?cb=${Date.now()}`)).json();
    els.updated.textContent = `${DATA.count} farmable items · source: Dreamlight Valley Wiki`;
    buildFacets();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load item data.</p>`;
  }
})();
