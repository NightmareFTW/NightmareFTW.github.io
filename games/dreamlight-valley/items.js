/* Disney Dreamlight Valley — Items Database (catalogue layout).
   Loads items.json and lays the items out by category, like the in-game
   collection: pick a category tab (with its count), then search, filter by
   biome / DLC and sort. Names & locations show the official PT-BR when PT. */

let DATA = null;
let FURN = null;           // lazy-loaded furniture catalogue (loaded on first Furniture tab open)
let furnTheme = "All";
let activeCat = "All";
const sel = { biome: new Set(), dlc: new Set() };
let query = "", sort = "name";
const DLC_CLASS = { "A Rift in Time": "dlc-rift", "Storybook Vale": "dlc-vale", "Wishblossom Mountains": "dlc-wish" };
const PT = localStorage.getItem("nftw:lang") === "pt";
const nm = (it) => (PT && it.name_pt) ? it.name_pt : it.name;
const where = (it) => (PT && it.location_pt) ? it.location_pt : it.location;
const from = (it) => (PT && it.source_pt) ? it.source_pt : it.source;
const biomeLabel = (v) => (PT && DATA && DATA.biomesPt && DATA.biomesPt[v]) ? DATA.biomesPt[v] : v;

// Category order mirrors the in-game collection tabs (ingredients → aquatic →
// foraging → materials → Eternity Isle → décor → gifts). Unknown categories are
// appended after these.
const CAT_ORDER = [
  "Vegetables", "Fruit", "Grains", "Spices", "Dairy and Oil", "Sweets", "Protein", "Seafood", "Ice",
  "Fish", "Gem / Mineral", "Flower",
  "Crafting Material", "Fragment", "Snippet", "Enchantment",
  "Ancient Machine", "Timebending Part",
  "Furniture", "Fence / Paving", "Gift",
];

const els = {
  search: document.getElementById("it-search"),
  sort: document.getElementById("it-sort"),
  tabs: document.getElementById("it-tabs"),
  facets: document.getElementById("it-facets"),
  list: document.getElementById("it-list"),
  count: document.getElementById("it-count"),
  updated: document.getElementById("it-updated"),
  clear: document.getElementById("it-clear"),
};
const uniqSorted = (arr) => [...new Set(arr)].filter(Boolean).sort();

function buildTabs() {
  const counts = {};
  DATA.items.forEach((i) => (counts[i.category] = (counts[i.category] || 0) + 1));
  if (DATA.furnitureCount) counts["Furniture"] = DATA.furnitureCount; // lazy catalogue
  const present = Object.keys(counts);
  const ordered = [...CAT_ORDER.filter((c) => present.includes(c)), ...present.filter((c) => !CAT_ORDER.includes(c)).sort()];
  const tab = (cat, count) => `<button class="cat-tab ${cat === activeCat ? "on" : ""}" data-cat="${cat}"><span class="cat-name">${cat}</span><span class="cat-count">${count}</span></button>`;
  els.tabs.innerHTML = tab("All", DATA.items.length) + ordered.map((c) => tab(c, counts[c])).join("");
  els.tabs.querySelectorAll(".cat-tab").forEach((b) =>
    b.addEventListener("click", () => {
      activeCat = b.dataset.cat;
      els.tabs.querySelectorAll(".cat-tab").forEach((x) => x.classList.toggle("on", x === b));
      if (activeCat === "Furniture") { openFurniture(); return; }
      sel.biome.clear(); sel.dlc.clear(); buildFacets(); render(); // restore biome/DLC filters
    }));
}

// Lazy-load the big furniture catalogue the first time the Furniture tab opens.
async function openFurniture() {
  els.facets.innerHTML = "";
  if (!FURN) {
    els.list.innerHTML = `<p style="color:var(--muted)">Loading furniture…</p>`;
    try { FURN = await (await fetch(`../../data/dreamlight-valley/furniture.json?cb=${Date.now()}`)).json(); }
    catch { els.list.innerHTML = `<p class="tool-note">Couldn't load furniture data.</p>`; return; }
  }
  // Theme sub-filter (each Disney theme is its own collection).
  els.facets.innerHTML = `<div class="facet-group"><span class="facet-title">Theme</span>
    <div class="facet-chips"><select id="furn-theme" class="sort-select">
      <option value="All">All themes (${FURN.count})</option>
      ${FURN.themes.map((t) => `<option value="${t}" ${t === furnTheme ? "selected" : ""}>${t}</option>`).join("")}
    </select></div></div>`;
  document.getElementById("furn-theme").addEventListener("change", (e) => { furnTheme = e.target.value; renderFurniture(); });
  renderFurniture();
}

function renderFurniture() {
  const CAP = 400;
  let list = FURN.items.filter((f) => (furnTheme === "All" || f.theme === furnTheme) &&
    (!query || `${f.name} ${f.name_pt || ""}`.toLowerCase().includes(query)));
  list.sort((a, b) => nm(a).localeCompare(nm(b)));
  const total = list.length, capped = list.length > CAP;
  if (capped) list = list.slice(0, CAP);
  els.count.textContent = `${total} item${total === 1 ? "" : "s"}${capped ? ` · showing ${CAP}, pick a theme or search to narrow` : ""}`;
  els.list.innerHTML = list.map((f) => `
    <div class="rc-card furn-card">
      <div class="rc-top">
        <span class="rc-name">${f.img ? `<img class="rc-img" src="${esc(f.img)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ""}${nm(f)}</span>
        <span class="ev-chip">${esc(f.theme)}</span>
      </div>
    </div>`).join("") || `<p class="no-results">No furniture match.</p>`;
}
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function buildFacets() {
  const biomes = uniqSorted(DATA.items.flatMap((i) => i.biomes));
  const dlcs = uniqSorted(DATA.items.map((i) => i.dlc));
  const group = (title, key, items) => `
    <div class="facet-group">
      <span class="facet-title">${title}</span>
      <div class="facet-chips">
        ${items.map((v) => `<button class="chip-toggle" data-facet="${key}" data-val="${v}">${key === "biome" ? biomeLabel(v) : v}</button>`).join("")}
      </div>
    </div>`;
  els.facets.innerHTML = group("Biome", "biome", biomes) + (dlcs.length ? group("DLC", "dlc", dlcs) : "");
  els.facets.querySelectorAll(".chip-toggle").forEach((b) =>
    b.addEventListener("click", () => {
      const f = b.dataset.facet, v = b.dataset.val;
      if (sel[f].has(v)) sel[f].delete(v); else sel[f].add(v);
      b.classList.toggle("on");
      render();
    }));
}

function matches(it) {
  if (activeCat !== "All" && it.category !== activeCat) return false;
  if (sel.biome.size && !it.biomes.some((b) => sel.biome.has(b))) return false;
  if (sel.dlc.size && !sel.dlc.has(it.dlc)) return false;
  if (query && !`${it.name} ${it.name_pt || ""}`.toLowerCase().includes(query)) return false;
  return true;
}

function render() {
  if (activeCat === "Furniture") { if (FURN) renderFurniture(); return; }
  let list = DATA.items.filter(matches);
  const total = list.length;
  if (sort === "sell-desc") list.sort((a, b) => b.sell - a.sell);
  else if (sort === "energy-desc") list.sort((a, b) => b.energy - a.energy);
  else list.sort((a, b) => nm(a).localeCompare(nm(b)));

  els.count.textContent = `${total} item${total === 1 ? "" : "s"}`;
  els.list.innerHTML = list.map((it) => `
    <div class="rc-card">
      <div class="rc-top">
        <span class="rc-name">${it.img ? `<img class="rc-img" src="${it.img}" alt="" loading="lazy">` : ""}${nm(it)}</span>
        <span>${it.limited ? `<span class="fr-dlc dlc-wish">Limited</span> ` : ""}${it.dlc ? `<span class="fr-dlc ${DLC_CLASS[it.dlc] || ""}">${it.dlc}</span> ` : ""}<span class="ev-chip">${it.category}</span></span>
      </div>
      <p class="it-where"><b>Where:</b> ${where(it)}</p>
      <p class="it-where"><b>From:</b> ${from(it)}</p>
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
  activeCat = "All"; furnTheme = "All"; query = ""; els.search.value = "";
  els.tabs.querySelectorAll(".cat-tab").forEach((b) => b.classList.toggle("on", b.dataset.cat === "All"));
  buildFacets();
  render();
});

(async function init() {
  try {
    DATA = await (await fetch(`../../data/dreamlight-valley/items.json?cb=${Date.now()}`)).json();
    els.updated.textContent = `${DATA.count} items & resources · source: Dreamlight Valley Wiki + game data`;
    buildTabs();
    buildFacets();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load item data.</p>`;
  }
})();
