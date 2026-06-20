/* Disney Dreamlight Valley — Items Database (catalogue layout).
   Items are laid out by category like the in-game collection: pick a category
   tab, then narrow with the Biome / DLC / Theme dropdowns, search and sort.
   "All" shows everything in the database — including the big Furniture and
   Clothing catalogues, which are lazy-loaded (kept out of items.json) and
   merged in once ready. Names & locations show the official PT-BR when PT. */

let DATA = null;
let activeCat = "All", catTheme = "All", query = "", sort = "name";
let biomeFilter = "", dlcFilter = "";
const CAP = 400;
// Big per-theme catalogues are lazy-loaded on demand (and for "All").
const LAZY = {
  Furniture: { file: "furniture.json", countKey: "furnitureCount", data: null },
  Clothing: { file: "clothing.json", countKey: "clothingCount", data: null },
};
const isLazy = (c) => Object.prototype.hasOwnProperty.call(LAZY, c);
const DLC_CLASS = { "A Rift in Time": "dlc-rift", "Storybook Vale": "dlc-vale", "Wishblossom Mountains": "dlc-wish" };
const PT = localStorage.getItem("nftw:lang") === "pt";
const nm = (it) => (PT && it.name_pt) ? it.name_pt : it.name;
const where = (it) => (PT && it.location_pt) ? it.location_pt : it.location;
const from = (it) => (PT && it.source_pt) ? it.source_pt : it.source;
const biomeLabel = (v) => (PT && DATA && DATA.biomesPt && DATA.biomesPt[v]) ? DATA.biomesPt[v] : v;
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// In-game collection order: ingredients → aquatic → foraging → materials →
// Eternity Isle → décor → catalogues → gifts.
const CAT_ORDER = [
  "Vegetables", "Fruit", "Grains", "Spices", "Dairy and Oil", "Sweets", "Protein", "Seafood", "Ice",
  "Fish", "Gem / Mineral", "Flower",
  "Crafting Material", "Fragment", "Snippet", "Enchantment",
  "Ancient Machine", "Timebending Part",
  "Furniture", "Fence / Paving", "Clothing", "Gift",
];

const els = {
  search: document.getElementById("it-search"),
  sort: document.getElementById("it-sort"),
  biome: document.getElementById("it-biome"),
  dlc: document.getElementById("it-dlc"),
  theme: document.getElementById("it-theme"),
  tabs: document.getElementById("it-tabs"),
  list: document.getElementById("it-list"),
  count: document.getElementById("it-count"),
  updated: document.getElementById("it-updated"),
  clear: document.getElementById("it-clear"),
};
const uniqSorted = (arr) => [...new Set(arr)].filter(Boolean).sort();

function buildTabs() {
  const counts = {};
  DATA.items.forEach((i) => (counts[i.category] = (counts[i.category] || 0) + 1));
  for (const cat in LAZY) { const n = DATA[LAZY[cat].countKey]; if (n) counts[cat] = n; }
  const total = DATA.items.length + Object.keys(LAZY).reduce((n, c) => n + (DATA[LAZY[c].countKey] || 0), 0);
  const present = Object.keys(counts);
  const ordered = [...CAT_ORDER.filter((c) => present.includes(c)), ...present.filter((c) => !CAT_ORDER.includes(c)).sort()];
  const tab = (cat, count, label) => `<button class="cat-tab ${cat === activeCat ? "on" : ""}" data-cat="${esc(cat)}"><span class="cat-name">${esc(label || cat)}</span><span class="cat-count">${count}</span></button>`;
  els.tabs.innerHTML = tab("All", total) + ordered.map((c) => tab(c, counts[c])).join("");
  els.tabs.querySelectorAll(".cat-tab").forEach((b) =>
    b.addEventListener("click", () => { activeCat = b.dataset.cat; selectTab(); }));
}

// Fill the Biome / DLC dropdowns once.
function buildDropdowns() {
  const biomes = uniqSorted(DATA.items.flatMap((i) => i.biomes));
  const dlcs = uniqSorted(DATA.items.map((i) => i.dlc));
  els.biome.innerHTML = `<option value="">All biomes</option>` + biomes.map((b) => `<option value="${esc(b)}">${esc(biomeLabel(b))}</option>`).join("");
  els.dlc.innerHTML = `<option value="">All DLC</option>` + dlcs.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
}

async function loadCatalogue(cat) {
  const L = LAZY[cat];
  if (L.data) return L.data;
  try { L.data = await (await fetch(`../../data/dreamlight-valley/${L.file}?v=${DATA.updated.slice(0, 10)}`)).json(); }
  catch { L.data = { items: [], themes: [], count: 0 }; }
  return L.data;
}

// Switch to the active tab: set which dropdowns show, lazy-load as needed.
async function selectTab() {
  els.tabs.querySelectorAll(".cat-tab").forEach((x) => x.classList.toggle("on", x.dataset.cat === activeCat));
  catTheme = "All"; biomeFilter = ""; dlcFilter = ""; els.biome.value = ""; els.dlc.value = "";
  const cat = activeCat;
  if (isLazy(cat)) {
    els.biome.style.display = els.dlc.style.display = "none";
    els.list.innerHTML = `<p style="color:var(--muted)">Loading ${cat.toLowerCase()}…</p>`;
    const data = await loadCatalogue(cat);
    els.theme.style.display = "";
    els.theme.innerHTML = `<option value="All">All themes (${data.count})</option>` + data.themes.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
    if (activeCat === cat) render();
    return;
  }
  els.theme.style.display = "none";
  els.biome.style.display = els.dlc.style.display = "";
  render();
  // "All" should show everything — pull in the catalogues in the background.
  if (cat === "All" && Object.values(LAZY).some((L) => !L.data)) {
    await Promise.all(Object.keys(LAZY).map(loadCatalogue));
    if (activeCat === "All") render();
  }
}

// The pool of items for the current tab (All merges the loaded catalogues).
function pool() {
  if (isLazy(activeCat)) return LAZY[activeCat].data ? LAZY[activeCat].data.items : [];
  if (activeCat === "All") {
    let list = DATA.items;
    for (const c in LAZY) if (LAZY[c].data) list = list.concat(LAZY[c].data.items.map((f) => ({ ...f, category: c })));
    return list;
  }
  return DATA.items.filter((i) => i.category === activeCat);
}

function matches(it) {
  if (it.theme) { // catalogue item (furniture/clothing)
    if (biomeFilter || dlcFilter) return false;
    if (catTheme !== "All" && it.theme !== catTheme) return false;
  } else {
    if (biomeFilter && !(it.biomes || []).includes(biomeFilter)) return false;
    if (dlcFilter && it.dlc !== dlcFilter) return false;
  }
  if (query && !`${it.name} ${it.name_pt || ""}`.toLowerCase().includes(query)) return false;
  return true;
}

function itemCard(it) {
  if (it.theme) return `
    <div class="rc-card furn-card">
      <div class="rc-top">
        <span class="rc-name">${it.img ? `<img class="rc-img" src="${esc(it.img)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ""}${nm(it)}</span>
        <span class="ev-chip">${esc(it.theme)}</span>
      </div>
    </div>`;
  return `
    <div class="rc-card">
      <div class="rc-top">
        <span class="rc-name">${it.img ? `<img class="rc-img" src="${esc(it.img)}" alt="" loading="lazy">` : ""}${nm(it)}</span>
        <span>${it.limited ? `<span class="fr-dlc dlc-wish">Limited</span> ` : ""}${it.dlc ? `<span class="fr-dlc ${DLC_CLASS[it.dlc] || ""}">${it.dlc}</span> ` : ""}<span class="ev-chip">${esc(it.category)}</span></span>
      </div>
      <p class="it-where"><b>Where:</b> ${where(it)}</p>
      <p class="it-where"><b>From:</b> ${from(it)}</p>
      <div class="rc-meta">
        <span>💰 ${(it.sell || 0).toLocaleString()}</span>
        <span>⚡ ${(it.energy || 0).toLocaleString()}</span>
        ${it.growTime && it.growTime !== "—" ? `<span>⏱ ${it.growTime}</span>` : ""}
      </div>
    </div>`;
}

function render() {
  let list = pool().filter(matches);
  if (sort === "sell-desc") list.sort((a, b) => (b.sell || 0) - (a.sell || 0));
  else if (sort === "energy-desc") list.sort((a, b) => (b.energy || 0) - (a.energy || 0));
  else list.sort((a, b) => nm(a).localeCompare(nm(b)));

  const total = list.length, capped = total > CAP;
  if (capped) list = list.slice(0, CAP);
  els.count.textContent = `${total} item${total === 1 ? "" : "s"}${capped ? ` · showing ${CAP}, narrow with a filter or search` : ""}`;
  els.list.innerHTML = list.map(itemCard).join("") || `<p class="no-results">No items match.</p>`;
}

els.search.addEventListener("input", () => { query = els.search.value.trim().toLowerCase(); render(); });
els.sort.addEventListener("change", () => { sort = els.sort.value; render(); });
els.biome.addEventListener("change", () => { biomeFilter = els.biome.value; render(); });
els.dlc.addEventListener("change", () => { dlcFilter = els.dlc.value; render(); });
els.theme.addEventListener("change", () => { catTheme = els.theme.value; render(); });
els.clear.addEventListener("click", () => {
  query = ""; els.search.value = ""; biomeFilter = ""; dlcFilter = ""; catTheme = "All";
  els.biome.value = ""; els.dlc.value = ""; activeCat = "All"; selectTab();
});

(async function init() {
  try {
    DATA = await (await fetch(`../../data/dreamlight-valley/items.json?cb=${Date.now()}`)).json();
    els.updated.textContent = `${DATA.count} items & resources · source: Dreamlight Valley Wiki + game data`;
    buildTabs();
    buildDropdowns();
    selectTab();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load item data.</p>`;
  }
})();
