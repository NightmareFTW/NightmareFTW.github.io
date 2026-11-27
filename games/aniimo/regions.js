/* Aniimo — Regions / Habitats.
   Renders every region from data/aniimo/regions.json: its official art (or an
   element-tinted gradient when the site hasn't published art yet), description,
   local mechanics, and the Aniimo that live there (each linking to its page),
   with a jump to that region on the interactive map. The original Idyll
   regions and the new Whisperwake Isles zones are grouped separately. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ELEMENT_COLOR = {
  Fire: "#f2543d", Water: "#3d9bf2", Grass: "#6bbf3f", Electric: "#e0c23a", Ice: "#38b6e0",
  Wind: "#7fd9c4", Dark: "#a866e0", Holy: "#f2e6a3", Rock: "#a9835a",
};
// The Whisperwake Isles zones added in the Season 1 Part 2 update.
const WHISPERWAKE = new Set(["Crescent Bay", "Rosy Mirelands", "Wildwater Gorge", "Cloudreach Falls"]);

const els = { list: document.getElementById("rg-list") };

function dominantColor(creatures) {
  const counts = {};
  for (const c of creatures) for (const e of (c.elements || [])) counts[e] = (counts[e] || 0) + 1;
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return ELEMENT_COLOR[top] || "#4a4a55";
}

function regionCard(r) {
  const creatures = r.creatures || [];
  const shot = r.image
    ? `background-image:url('${esc(r.image)}')`
    : (() => { const c = dominantColor(creatures); return `background:linear-gradient(135deg, ${c}44, ${c}14 60%, #0c0c10)`; })();
  const crs = creatures.map((c) => c.slug
    ? `<a class="rg-cr" href="aniimo.html?slug=${encodeURIComponent(c.slug)}" title="${esc(c.name)}"><img src="${esc(c.icon || "")}" alt="${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'"></a>`
    : `<span class="rg-cr" title="${esc(c.name)}"><img src="${esc(c.icon || "")}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'"></span>`).join("");
  return `<div class="rg-card">
    <div class="rg-shot" style="${shot}"><span class="rg-name">${esc(r.name)}</span></div>
    <div class="rg-body">
      ${r.description ? `<p class="rg-desc">${esc(r.description)}</p>` : ""}
      ${(r.mechanics && r.mechanics.length) ? `<div class="rg-mech">${r.mechanics.map((m) => `<span class="ev-chip">${esc(typeof m === "string" ? m : (m.name || m.title || ""))}</span>`).join("")}</div>` : ""}
      ${creatures.length ? `<div class="rg-cr-lbl">${creatures.length} Aniimo here</div><div class="rg-crs">${crs}</div>` : `<div class="rg-cr-lbl" style="margin-top:auto">No Aniimo recorded here yet</div>`}
      <div class="rg-foot"><a class="mini-btn" href="map.html?region=${encodeURIComponent(r.name)}">View on the map →</a></div>
    </div>
  </div>`;
}

function section(title, tag, tagColor, sub, regions) {
  if (!regions.length) return "";
  const sorted = [...regions].sort((a, b) => (b.creatures || []).length - (a.creatures || []).length);
  return `<h2 class="rg-section-title">${esc(title)}${tag ? ` <span class="tag" style="background:${tagColor}22;color:${tagColor}">${esc(tag)}</span>` : ""}</h2>
    <p class="rg-section-sub">${esc(sub)}</p>
    <div class="rg-grid">${sorted.map(regionCard).join("")}</div>`;
}

(async function init() {
  try {
    const DATA = await (await fetch(`../../data/aniimo/regions.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("rg-updated").textContent = `${DATA.count} regions · updated ${upd}`;
    const whisper = DATA.regions.filter((r) => WHISPERWAKE.has(r.name));
    const idyll = DATA.regions.filter((r) => !WHISPERWAKE.has(r.name));
    els.list.innerHTML =
      section("Idyll", "", "", "The original overworld.", idyll) +
      section("Whisperwake Isles", "New", "#ff4350", "Added in the Season 1 Part 2 update — the official site is still filling in art and spawns for these.", whisper);
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load region data.</p>`;
  }
})();
