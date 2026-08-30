/* Farever — Class Builds.
   3 weapon-based build ideas per class (Warrior, Rogue, Mage, Priest).
   Reuses the shared .cb-* build shell (see games/elden-ring/builds.js for
   the original); re-themed for Farever in CSS. No item icons/numeric stats
   here — Farever doesn't have a stable public API for those yet, so builds
   are described by weapon + role instead. Data: data/farever/builds.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const DIFF_LABEL = { beginnerfriendly: "Beginner Friendly", medium: "Medium", hard: "Hard" };

let DATA = null, filter = "all", open = new Set();
const root = document.getElementById("fv-root");

function weaponCard(w) {
  return `<div class="cb-weapon">
    <span class="cb-weapon-ico"></span>
    <span class="cb-weapon-body">
      ${w.role ? `<span class="cb-weapon-role">${esc(w.role)}</span>` : ""}
      <span class="cb-weapon-name">${esc(w.name)}</span>
      ${w.why ? `<span class="cb-weapon-why">${esc(w.why)}</span>` : ""}
    </span>
  </div>`;
}

function buildCard(b) {
  const isOpen = open.has(b.id);
  return `<article class="cb-build" data-id="${b.id}">
    <button class="cb-build-head" aria-expanded="${isOpen}">
      <div class="cb-build-title">
        <span class="cb-build-tags">
          <span class="role-chip role-${esc(b.class)}">${esc(b.class)}</span>
          <span class="cb-arch">${esc(b.role)}</span>
          <span class="cb-diff cb-diff-${esc(b.difficulty)}">${esc(DIFF_LABEL[b.difficulty] || b.difficulty)}</span>
        </span>
        <span class="cb-name">${esc(b.name)}</span>
      </div>
      <span class="cb-caret">▾</span>
    </button>
    <p class="cb-summary">${esc(b.summary)}</p>
    <div class="cb-detail" ${isOpen ? "" : "hidden"}>
      <div class="cb-sec"><h4 class="cb-sec-h">Weapons</h4>
        <div class="cb-weapon-grid">${(b.weapons || []).map(weaponCard).join("")}</div></div>
      <div class="cb-sec"><h4 class="cb-sec-h">How to play it</h4>
        <ol class="cb-play">${(b.howto || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ol></div>
      <div class="cb-procon">
        <div class="cb-pros"><span class="cb-pc-h">Pros</span><ul>${(b.pros || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
        <div class="cb-cons"><span class="cb-pc-h">Cons</span><ul>${(b.cons || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      </div>
    </div>
  </article>`;
}

function render() {
  let list = DATA.builds;
  if (filter !== "all") list = list.filter((b) => b.class === filter);
  root.innerHTML = list.map(buildCard).join("") || `<p class="no-results">No builds match.</p>`;
  root.querySelectorAll(".cb-build-head").forEach((head) => {
    head.addEventListener("click", () => {
      const card = head.closest(".cb-build"), id = card.dataset.id, willOpen = !open.has(id);
      if (willOpen) open.add(id); else open.delete(id);
      card.classList.toggle("open", willOpen);
      head.setAttribute("aria-expanded", String(willOpen));
      const d = card.querySelector(".cb-detail");
      if (willOpen) d.removeAttribute("hidden"); else d.setAttribute("hidden", "");
    });
  });
}

function buildFilters() {
  const el = document.getElementById("fv-filters");
  const classes = [...new Set(DATA.builds.map((b) => b.class))];
  const chips = [["all", "All classes"]].concat(classes.map((c) => [c, c]));
  el.innerHTML = chips.map(([k, label]) => `<button class="cb-fchip ${k === filter ? "on" : ""}" data-k="${k}">${esc(label)}</button>`).join("");
  el.querySelectorAll(".cb-fchip").forEach((b) => b.addEventListener("click", () => {
    filter = b.dataset.k;
    el.querySelectorAll(".cb-fchip").forEach((x) => x.classList.toggle("on", x === b));
    render();
  }));
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/farever/builds.json?cb=${Date.now()}`)).json();
    document.getElementById("fv-version").textContent = `${DATA.builds.length} builds across ${new Set(DATA.builds.map((b) => b.class)).size} classes`;
    document.getElementById("fv-note").textContent = DATA.note || "";
    buildFilters();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load build data.</p>`;
  }
})();
