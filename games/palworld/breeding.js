/* Palworld — Breeding Calculator.
   Formula (per wikily.gg, matches the well-documented community formula):
   floor((parent1.combiRank + parent2.combiRank + 1) / 2), then the pal on
   the full roster with the closest combiRank (ties favor the lower rank) —
   UNLESS the exact parent pair has an explicit override (data.breedingOverrides),
   which always wins. Data: data/palworld/pals.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MAX_RANK = 9000; // sentinel for "excluded from normal breeding math" (e.g. not-yet-fully-catalogued pals)

let DATA = null;
const slot = { 1: null, 2: null };
const els = {
  1: { search: document.getElementById("p1-search"), results: document.getElementById("p1-results"), picked: document.getElementById("p1-picked") },
  2: { search: document.getElementById("p2-search"), results: document.getElementById("p2-results"), picked: document.getElementById("p2-picked") },
};
const resultEl = document.getElementById("bd-result");

function overrideKey(a, b) { return [a, b].sort().join("|"); }

function pickResult(p) {
  return `<a class="pw-pick-result" data-name="${esc(p.name)}"><img src="${esc(p.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span>${esc(p.name)}</span><span class="tool-note">#${esc(p.dex)}</span></a>`;
}

function renderPicked(n) {
  const p = slot[n];
  els[n].picked.innerHTML = p
    ? `<span class="pw-pick-chip"><img src="${esc(p.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer"><b>${esc(p.name)}</b><button type="button" class="pw-pick-clear" data-n="${n}" aria-label="Clear">✕</button></span>`
    : "";
  els[n].search.style.display = p ? "none" : "";
}

function wireSlot(n) {
  els[n].search.addEventListener("input", () => {
    const q = els[n].search.value.trim().toLowerCase();
    if (!q) { els[n].results.innerHTML = ""; els[n].results.hidden = true; return; }
    const matches = DATA.pals.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
    els[n].results.innerHTML = matches.map(pickResult).join("") || `<p class="no-results">No Pal matches.</p>`;
    els[n].results.hidden = false;
  });
  els[n].results.addEventListener("click", (e) => {
    const a = e.target.closest(".pw-pick-result");
    if (!a) return;
    slot[n] = DATA.pals.find((p) => p.name === a.dataset.name) || null;
    els[n].search.value = "";
    els[n].results.hidden = true;
    renderPicked(n);
    compute();
  });
  els[n].picked.addEventListener("click", (e) => {
    const btn = e.target.closest(".pw-pick-clear");
    if (!btn) return;
    slot[+btn.dataset.n] = null;
    renderPicked(+btn.dataset.n);
    resultEl.innerHTML = "";
  });
}

function closestByRank(target, exclude) {
  let best = null, bestDiff = Infinity;
  for (const p of DATA.pals) {
    if (exclude.has(p.name) || p.combiRank == null || p.combiRank >= MAX_RANK) continue;
    const diff = Math.abs(p.combiRank - target);
    if (diff < bestDiff || (diff === bestDiff && p.combiRank < best.combiRank)) { best = p; bestDiff = diff; }
  }
  return best;
}

function compute() {
  const p1 = slot[1], p2 = slot[2];
  if (!p1 || !p2) { resultEl.innerHTML = ""; return; }

  const ov = DATA.breedingOverrides.find((o) => overrideKey(o.a, o.b) === overrideKey(p1.name, p2.name));
  let child, via;
  if (ov) {
    child = DATA.pals.find((p) => p.name === ov.child);
    via = "exclusive combo";
  } else {
    const target = Math.floor((p1.combiRank + p2.combiRank + 1) / 2);
    child = closestByRank(target, new Set());
    via = `formula → target rank ${target}`;
  }

  resultEl.innerHTML = !child ? `<p class="tool-note">Couldn't determine a result for this pair.</p>` : `
    <div class="pw-bd-result">
      <span class="pw-bd-plus">→</span>
      <a class="pw-card pw-bd-child" href="pal.html?slug=${encodeURIComponent(child.slug)}">
        <span class="pw-card-img"><img src="${esc(child.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>
        <span class="pw-card-body">
          <span class="pw-card-top"><span class="pw-card-name">${esc(child.name)}</span><span class="pw-dex">#${esc(child.dex)}</span></span>
          <span class="tool-note">${esc(via)}</span>
        </span>
      </a>
    </div>`;
}

wireSlot(1);
wireSlot(2);

(async function init() {
  try {
    DATA = await (await fetch(`../../data/palworld/pals.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("bd-updated").textContent = `${DATA.count} Pals · ${DATA.breedingOverrides.length} exclusive combos · updated ${upd}`;
    const wantParent = new URLSearchParams(location.search).get("parent");
    if (wantParent) { slot[1] = DATA.pals.find((p) => p.name === wantParent) || null; renderPicked(1); }
  } catch (e) {
    resultEl.innerHTML = `<p class="tool-note">Couldn't load Pal data.</p>`;
  }
})();
