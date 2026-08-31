/* Farever — Dungeons Checklist.
   Simple "have I cleared this" tracker, one tick per dungeon. Ticks persist
   on this device (no reset — dungeons don't come back to being uncleared).
   Data: data/farever/dungeons.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

const KEY = "nftw:farever:dungeons";
let DATA = null, hideDone = false;
let done = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
const save = () => localStorage.setItem(KEY, JSON.stringify([...done]));

const root = document.getElementById("fv-root");
const progressEl = document.getElementById("fv-progress");

const itemId = (sec, it) => `${slug(sec.title)}__${slug(it.label)}`;
const allItems = () => DATA.sections.flatMap((sec) => sec.items.map((it) => itemId(sec, it)));

function renderIntro() {
  const intro = DATA.intro || {};
  document.getElementById("fv-intro").innerHTML = `
    <div class="ms-intro-card">
      <p class="ms-intro-head">⚠ ${esc(intro.headline || "")}</p>
      <ul class="ms-intro-list">${(intro.points || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>`;
}

function itemMeta(it) {
  const parts = [];
  if (it.level) parts.push(`Lv ${it.level}`);
  if (it.boss) parts.push(`Boss: ${esc(it.boss)}`);
  return parts.length ? `<span class="ms-item-meta">${parts.join(" · ")}</span>` : "";
}

function itemImg(it) {
  const init = esc((it.label || "?").charAt(0));
  const pic = it.image
    ? `<img src="${esc(it.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.ms-item-img').classList.add('no-img');this.remove()">`
    : "";
  return `<span class="ms-item-img${it.image ? "" : " no-img"}" data-init="${init}">${pic}</span>`;
}

function sectionHtml(sec) {
  const total = sec.items.length;
  const have = sec.items.filter((it) => done.has(itemId(sec, it))).length;
  const items = sec.items.map((it) => {
    const id = itemId(sec, it);
    const isDone = done.has(id);
    return `<label class="ms-item ${isDone ? "done" : ""}" data-id="${id}">
      <input type="checkbox" class="ms-check" ${isDone ? "checked" : ""}>
      ${itemImg(it)}
      <span class="ms-item-body">
        <span class="ms-item-text">${esc(it.label)}</span>
        ${itemMeta(it)}
      </span>
    </label>`;
  }).join("");
  return `<section class="ms-section">
    <div class="ms-sec-head"><h3>${esc(sec.title)}</h3><span class="ms-sec-count">${have}/${total}</span></div>
    ${sec.note ? `<p class="ms-sec-note">${esc(sec.note)}</p>` : ""}
    <div class="ms-items">${items}</div>
  </section>`;
}

function updateProgress() {
  const ids = allItems();
  const have = ids.filter((id) => done.has(id)).length;
  const pct = ids.length ? Math.round((have / ids.length) * 100) : 0;
  progressEl.innerHTML = `<b>${have}/${ids.length}</b> cleared · ${pct}%`;
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

document.getElementById("fv-hide").addEventListener("change", (e) => {
  hideDone = e.target.checked;
  root.classList.toggle("ms-hide-done", hideDone);
});
document.getElementById("fv-reset").addEventListener("click", () => {
  if (!done.size || !confirm("Clear every tick on this checklist?")) return;
  done = new Set(); save(); render();
});

(async function init() {
  try {
    DATA = await (await fetch(`../../data/farever/dungeons.json?cb=${Date.now()}`)).json();
    render();
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load the checklist data.</p>`;
  }
})();
