/* Clair Obscur: Expedition 33 — Missables Checklist.
   Leads with the honest picture (almost nothing is permanently missable),
   flags the Prologue one-shots and points of no return, then tracks the
   return-friendly content. Ticks persist on this device.
   Data: data/expedition-33/missables.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

const KEY = "nftw:exp33:missables";
let DATA = null, hideDone = false;
let done = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
const save = () => localStorage.setItem(KEY, JSON.stringify([...done]));

const FLAG_LABEL = { "one-time": "One-time", "post-game": "Opens later", "story": "Story moment" };

const root = document.getElementById("ms-root");
const progressEl = document.getElementById("ms-progress");

const itemId = (sec, it) => `${slug(sec.title)}__${slug(it.label)}`;
const allItems = () => DATA.sections.flatMap((sec) => sec.items.map((it) => itemId(sec, it)));

function renderIntro() {
  const intro = DATA.intro || {};
  document.getElementById("ms-intro").innerHTML = `
    <div class="ms-intro-card">
      <p class="ms-intro-head">✓ ${esc(intro.headline || "")}</p>
      <ul class="ms-intro-list">${(intro.points || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>`;
}

function sectionHtml(sec) {
  const total = sec.items.length;
  const have = sec.items.filter((it) => done.has(itemId(sec, it))).length;
  const kindClass = `ms-kind-${esc(sec.kind || "list")}`;
  const items = sec.items.map((it) => {
    const id = itemId(sec, it);
    const isDone = done.has(id);
    const flag = it.flag ? `<span class="ms-flag ms-flag-${esc(it.flag).replace(/[^a-z]/g, "")}">${esc(FLAG_LABEL[it.flag] || it.flag)}</span>` : "";
    return `<label class="ms-item ${isDone ? "done" : ""}" data-id="${id}">
      <input type="checkbox" class="ms-check" ${isDone ? "checked" : ""}>
      <span class="ms-item-text">${esc(it.label)}</span>${flag}
    </label>`;
  }).join("");
  return `<section class="ms-section ${kindClass}">
    <div class="ms-sec-head"><h3>${esc(sec.title)}</h3><span class="ms-sec-count">${have}/${total}</span></div>
    ${sec.note ? `<p class="ms-sec-note">${esc(sec.note)}</p>` : ""}
    <div class="ms-items">${items}</div>
  </section>`;
}

function updateProgress() {
  const ids = allItems();
  const have = ids.filter((id) => done.has(id)).length;
  const pct = ids.length ? Math.round((have / ids.length) * 100) : 0;
  progressEl.innerHTML = `<b>${have}/${ids.length}</b> done · ${pct}%`;
}

function render() {
  renderIntro();
  root.className = hideDone ? "ms-hide-done" : "";
  root.innerHTML = DATA.sections.map(sectionHtml).join("");
  root.querySelectorAll(".ms-item").forEach((label) => {
    const id = label.dataset.id;
    const check = label.querySelector(".ms-check");
    check.addEventListener("change", () => {
      if (check.checked) done.add(id); else done.delete(id);
      save();
      label.classList.toggle("done", check.checked);
      const sec = label.closest(".ms-section");
      const items = sec.querySelectorAll(".ms-item");
      const haveN = [...items].filter((x) => x.classList.contains("done")).length;
      sec.querySelector(".ms-sec-count").textContent = `${haveN}/${items.length}`;
      updateProgress();
    });
  });
  updateProgress();
}

document.getElementById("ms-hide").addEventListener("change", (e) => {
  hideDone = e.target.checked;
  root.classList.toggle("ms-hide-done", hideDone);
});
document.getElementById("ms-reset").addEventListener("click", () => {
  if (!done.size || !confirm("Clear every tick on this checklist?")) return;
  done = new Set(); save(); render();
});

(async function init() {
  try {
    DATA = await (await fetch(`../../data/expedition-33/missables.json?cb=${Date.now()}`)).json();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the checklist data.</p>`;
  }
})();
