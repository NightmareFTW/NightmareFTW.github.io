/* Aniimo — Homeland Guide (interactive).
   darksteelhyren's "RV / Homeland Guide" (Steam Community — see DATA.source/
   author in data/aniimo/homeland.json), restructured into a per-RV-level
   picker (one level's production/farm/Aniimo setup at a time, with the
   author's screenshots) plus a collapsible "Mechanics & deep dives" section
   for the standalone lessons. Content is transcribed from the guide's own
   heading structure, not re-authored — see parseSteamGuideHTML() in
   scripts/update-aniimo.js for how the JSON was derived. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let DATA = null, LEVELS = [], cur = null;

const els = {
  updated: document.getElementById("hg-updated"),
  overview: document.getElementById("hg-overview"),
  rvNav: document.getElementById("hg-rv-nav"),
  rvContent: document.getElementById("hg-rv-content"),
  lessons: document.getElementById("hg-lessons"),
  mechTitle: document.getElementById("hg-mech-title"),
};

/* ---- shared block/item rendering (same structure the guide uses) ---- */
function renderProdItem(it) {
  return `<div class="hg-prod-item"><h4>${esc(it.num)}) ${esc(it.text)}</h4>${it.sub && it.sub.length ? `<ul>${it.sub.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}</div>`;
}
function renderItems(items, opts = {}) {
  const out = []; let i = 0;
  while (i < items.length) {
    const kind = items[i].kind;
    if (kind === "bullet") {
      const g = []; while (i < items.length && items[i].kind === "bullet") g.push(items[i++]);
      out.push(`<ul class="hg-list">${g.map((it) => `<li>${esc(it.text)}</li>`).join("")}</ul>`);
    } else if (kind === "numbered") {
      const g = []; while (i < items.length && items[i].kind === "numbered") g.push(items[i++]);
      out.push(opts.asProduction
        ? `<div class="hg-prod-grid">${g.map(renderProdItem).join("")}</div>`
        : `<ul class="hg-list">${g.map((it) => `<li><b>${esc(it.num)})</b> ${esc(it.text)}</li>`).join("")}</ul>`);
    } else { out.push(`<p>${esc(items[i].text)}</p>`); i++; }
  }
  return out.join("");
}
function renderBlock(block) {
  const h = block.heading;
  if (h === "Note" || h === "Warning") {
    const cls = h === "Note" ? "note" : "warning";
    return `<div class="hg-callout ${cls}"><span class="hg-callout-label">${h === "Note" ? "Note" : "Warning — untested"}</span>${renderItems(block.items)}</div>`;
  }
  if (h === "Production") return `<p class="hg-step-block-title">Production</p>${renderItems(block.items, { asProduction: true })}`;
  if (h === "Farm/Tree Summary" || h === "Aniimo Summary") return `<p class="hg-step-block-title">${esc(h)}</p>${renderItems(block.items)}`;
  if (h === "Visual") {
    const imgs = (block.images || []).map((src) => `<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="Homeland base layout screenshot" loading="lazy" referrerpolicy="no-referrer"></a>`).join("");
    return `${renderItems(block.items)}<div class="hg-images">${imgs}</div>`;
  }
  return renderItems(block.items);
}

/* ---- per-RV picker ---- */
function showLevel(lv) {
  cur = lv;
  const sec = DATA.sections.find((s) => s.type === "rv" && s.level === lv);
  [...els.rvNav.querySelectorAll(".hg-lv")].forEach((b) => b.classList.toggle("on", +b.dataset.lv === lv));
  const idx = LEVELS.indexOf(lv), prev = LEVELS[idx - 1], next = LEVELS[idx + 1];
  els.rvContent.innerHTML = `
    <div class="hg-rv-head">
      <h3>RV${sec.level} &rarr; RV${sec.next}</h3>
      <div class="hg-np">
        <button data-go="${prev ?? ""}" ${prev ? "" : "disabled"}>&larr; RV${prev ?? ""}</button>
        <button data-go="${next ?? ""}" ${next ? "" : "disabled"}>RV${next ?? ""} &rarr;</button>
      </div>
    </div>
    ${sec.blocks.map(renderBlock).join("") || `<p style="color:var(--muted)">Just follow the tutorial for this level.</p>`}`;
  els.rvContent.querySelectorAll(".hg-np button").forEach((b) => b.addEventListener("click", () => { if (b.dataset.go) { showLevel(+b.dataset.go); els.rvContent.scrollIntoView({ behavior: "smooth", block: "start" }); } }));
}

/* ---- lessons accordion ---- */
function lessonTitle(sec) {
  return sec.title || (sec.blocks || []).map((b) => b.heading).find(Boolean) || "Tip";
}
function renderLessons() {
  const lessons = DATA.sections.filter((s) => s.type === "lesson");
  if (!lessons.length) return;
  els.mechTitle.hidden = false;
  els.lessons.innerHTML = lessons.map((sec, i) => {
    const body = sec.blocks.map((b) => (b.heading && b.heading !== lessonTitle(sec) ? `<p class="hg-step-block-title">${esc(b.heading)}</p>` : "") + renderBlock(b)).join("");
    return `<div class="hg-acc" data-i="${i}">
      <button type="button" class="hg-acc-head"><span>${esc(lessonTitle(sec))}</span><span class="chev">&rsaquo;</span></button>
      <div class="hg-acc-body">${body}</div>
    </div>`;
  }).join("");
  els.lessons.querySelectorAll(".hg-acc-head").forEach((h) => h.addEventListener("click", () => h.closest(".hg-acc").classList.toggle("open")));
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/aniimo/homeland.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    els.updated.innerHTML = `RV1 &rarr; RV${DATA.maxLevel} &middot; updated ${esc(upd)}`;

    const ov = DATA.sections.find((s) => s.type === "overview");
    if (ov) els.overview.innerHTML = `<div class="hg-overview">${ov.blocks.map((b) => (b.heading && b.heading !== "Overview" ? `<div class="hg-sub"><h3>${esc(b.heading)}</h3>${renderItems(b.items)}</div>` : `<div class="hg-sub">${renderItems(b.items)}</div>`)).join("")}</div>`;

    LEVELS = DATA.sections.filter((s) => s.type === "rv").map((s) => s.level).sort((a, b) => a - b);
    els.rvNav.innerHTML = LEVELS.map((lv) => `<button type="button" class="hg-lv" data-lv="${lv}">RV${lv}</button>`).join("");
    els.rvNav.querySelectorAll(".hg-lv").forEach((b) => b.addEventListener("click", () => showLevel(+b.dataset.lv)));
    showLevel(LEVELS[0]);
    renderLessons();
  } catch (e) {
    els.rvContent.innerHTML = `<p class="tool-note">Couldn't load the Homeland guide data.</p>`;
  }
})();
