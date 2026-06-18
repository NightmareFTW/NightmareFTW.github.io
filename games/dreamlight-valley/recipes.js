/* Disney Dreamlight Valley — Recipe Browser
   Loads recipes.json and offers live search (by recipe or ingredient),
   star-level filter (multi-select) and sorting. */

let DATA = null;
const starSel = new Set();
let query = "", sort = "sell-desc";
const PT = localStorage.getItem("nftw:lang") === "pt";
const nm = (o) => (PT && o.name_pt) ? o.name_pt : o.name;

const els = {
  search: document.getElementById("rc-search"),
  sort: document.getElementById("rc-sort"),
  stars: document.getElementById("rc-stars"),
  list: document.getElementById("rc-list"),
  count: document.getElementById("rc-count"),
  updated: document.getElementById("rc-updated"),
};

function buildStarFilter() {
  els.stars.innerHTML = [1, 2, 3, 4, 5].map((s) =>
    `<button class="chip-toggle" data-star="${s}">${"⭐".repeat(s)}</button>`).join("");
  els.stars.querySelectorAll(".chip-toggle").forEach((b) =>
    b.addEventListener("click", () => {
      const s = +b.dataset.star;
      if (starSel.has(s)) starSel.delete(s); else starSel.add(s);
      b.classList.toggle("on");
      render();
    }));
}

function matches(r) {
  if (starSel.size && !starSel.has(r.stars)) return false;
  if (query) {
    const hay = (r.name + " " + (r.name_pt || "") + " " +
      r.ingredients.map((i) => `${i.name} ${i.name_pt || ""}`).join(" ")).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function render() {
  let list = DATA.recipes.filter(matches);
  const total = list.length;
  if (sort === "sell-desc") list.sort((a, b) => b.sell - a.sell);
  else if (sort === "sell-asc") list.sort((a, b) => a.sell - b.sell);
  else if (sort === "energy-desc") list.sort((a, b) => b.energy - a.energy);
  else if (sort === "stars-desc") list.sort((a, b) => b.stars - a.stars);
  else if (sort === "az") list.sort((a, b) => nm(a).localeCompare(nm(b)));

  els.count.textContent = `${total} recipe${total === 1 ? "" : "s"}`;
  els.list.innerHTML = list.map((r) => `
    <div class="rc-card">
      <div class="rc-top">
        <span class="rc-name">${nm(r)}${r.dlc ? ` <span class="fr-dlc ${({ "A Rift in Time": "dlc-rift", "Storybook Vale": "dlc-vale", "Wishblossom Mountains": "dlc-wish" })[r.dlc] || ""}">${r.dlc}</span>` : ""}</span>
        <span class="rc-stars">${"⭐".repeat(r.stars)}</span>
      </div>
      <div class="rc-ing">${r.ingredients.map((i) => `<span class="rc-chip">${i.q > 1 ? i.q + "× " : ""}${nm(i)}</span>`).join("")}</div>
      <div class="rc-meta">
        <span>💰 ${r.sell ? r.sell.toLocaleString() : "—"}</span>
        <span>⚡ ${r.energy ? r.energy.toLocaleString() : "—"}</span>
      </div>
    </div>`).join("") || `<p class="no-results">No recipes match.</p>`;
}

els.search.addEventListener("input", () => { query = els.search.value.trim().toLowerCase(); render(); });
els.sort.addEventListener("change", () => { sort = els.sort.value; render(); });

(async function init() {
  try {
    DATA = await (await fetch(`../../data/dreamlight-valley/recipes.json?cb=${Date.now()}`)).json();
    els.updated.textContent = `${DATA.count} recipes · sources: Crystal Dreams + Nintendo Life`;
    buildStarFilter();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load recipe data.</p>`;
  }
})();
