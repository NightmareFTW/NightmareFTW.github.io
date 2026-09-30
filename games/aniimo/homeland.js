/* Aniimo — Homeland Guide.
   Full reproduction of darksteelhyren's "RV / Homeland Guide" on Steam
   Community (see DATA.source/author in data/aniimo/homeland.json): a
   set-it-and-forget-it route through every RV level, with the author's own
   screenshots. Content is transcribed straight from the guide's own
   heading structure (Note/Warning/Production/Farm-Tree Summary/Aniimo
   Summary/Visual), not re-authored — see parseSteamGuideHTML() in
   scripts/update-aniimo.js for how the JSON was derived from the guide's
   own HTML. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let DATA = null;

const els = {
  updated: document.getElementById("hg-updated"),
  nav: document.getElementById("hg-nav"),
  root: document.getElementById("hg-root"),
};

function renderProdItem(it) {
  return `<div class="hg-prod-item"><h4>${esc(it.num)}) ${esc(it.text)}</h4>${it.sub && it.sub.length ? `<ul>${it.sub.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}</div>`;
}

// Renders a mixed sequence of {kind: "text"|"bullet"|"numbered"} items,
// grouping consecutive same-kind items into one <p>/<ul>/grid each.
function renderItems(items, opts = {}) {
  const out = [];
  let i = 0;
  while (i < items.length) {
    const kind = items[i].kind;
    if (kind === "bullet") {
      const group = [];
      while (i < items.length && items[i].kind === "bullet") group.push(items[i++]);
      out.push(`<ul class="hg-list">${group.map((it) => `<li>${esc(it.text)}</li>`).join("")}</ul>`);
    } else if (kind === "numbered") {
      const group = [];
      while (i < items.length && items[i].kind === "numbered") group.push(items[i++]);
      out.push(opts.asProduction
        ? `<div class="hg-prod-grid">${group.map(renderProdItem).join("")}</div>`
        : `<ul class="hg-list">${group.map((it) => `<li><b>${esc(it.num)})</b> ${esc(it.text)}</li>`).join("")}</ul>`);
    } else {
      out.push(`<p>${esc(items[i].text)}</p>`);
      i++;
    }
  }
  return out.join("");
}

function renderBlock(block) {
  const h = block.heading;
  if (h === "Note" || h === "Warning") {
    const cls = h === "Note" ? "note" : "warning";
    const label = h === "Note" ? "Note" : "Warning — untested";
    return `<div class="hg-callout ${cls}"><span class="hg-callout-label">${esc(label)}</span>${renderItems(block.items)}</div>`;
  }
  if (h === "Production") {
    return `<p class="hg-step-block-title">Production</p>${renderItems(block.items, { asProduction: true })}`;
  }
  if (h === "Farm/Tree Summary" || h === "Aniimo Summary") {
    return `<p class="hg-step-block-title">${esc(h)}</p>${renderItems(block.items)}`;
  }
  if (h === "Visual") {
    const imgs = block.images.map((src) =>
      `<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="Homeland base layout screenshot" loading="lazy" referrerpolicy="no-referrer"></a>`).join("");
    return `${renderItems(block.items)}<div class="hg-images">${imgs}</div>`;
  }
  return renderItems(block.items);
}

function renderRvStep(sec) {
  const inner = sec.blocks.map(renderBlock).join("");
  return `<section class="rr-step" id="rv-${sec.level}">
    <h3 class="rr-step-head"><span class="rr-step-num">${sec.level}</span>RV${sec.level} &rarr; RV${sec.next}</h3>
    ${inner}
  </section>`;
}

function renderLesson(sec) {
  const inner = sec.blocks.map(renderBlock).join("");
  return `<div class="hg-lesson" id="lesson-${sec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">
    <span class="hg-lesson-tag">Lesson</span>
    <h3>${esc(sec.title)}</h3>
    ${inner}
  </div>`;
}

// Overview/Closing: a list of headed sub-blocks (FAQ-style for Closing:
// "Prismana?", "Rushing?", ...). None of their headings are the special
// content ones (Note/Production/...), so each is just paragraphs/lists.
// The lead block repeats the section's own name as its heading, so that
// one renders without a redundant <h3>.
function renderNamed(sec, id, skipHeading) {
  const inner = sec.blocks.map((b) => {
    const body = renderItems(b.items);
    if (!b.heading || b.heading === skipHeading) return `<div class="hg-sub">${body}</div>`;
    return `<div class="hg-sub"><h3>${esc(b.heading)}</h3>${body}</div>`;
  }).join("");
  return `<section class="panel hg-section" id="${id}">${inner}</section>`;
}

function render() {
  const parts = [];
  for (const sec of DATA.sections) {
    if (sec.type === "overview") parts.push(renderNamed(sec, "hg-overview", "Overview"));
    else if (sec.type === "rv") parts.push(renderRvStep(sec));
    else if (sec.type === "lesson") parts.push(renderLesson(sec));
    else if (sec.type === "closing") parts.push(renderNamed(sec, "hg-closing", null));
  }
  els.root.innerHTML = parts.join("");
}

function renderNav() {
  const rvLevels = DATA.sections.filter((s) => s.type === "rv").map((s) => s.level);
  const chips = [`<a class="filter-btn" href="#hg-overview">Overview</a>`,
    ...rvLevels.map((lv) => `<a class="filter-btn" href="#rv-${lv}">RV${lv}</a>`),
    `<a class="filter-btn" href="#hg-closing">Closing</a>`];
  els.nav.innerHTML = `<div class="filter-bar">${chips.join("")}</div>`;
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/aniimo/homeland.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    els.updated.innerHTML = `RV1 &rarr; RV${DATA.maxLevel} &middot; updated ${esc(upd)}`;
    renderNav();
    render();
  } catch (e) {
    els.root.innerHTML = `<p class="tool-note">Couldn't load the Homeland guide data.</p>`;
  }
})();
