/* Vampire Survivors — Achievements Checklist.
   Every achievement (in-game "Unlocks"), all DLCs included, grouped by
   version/DLC. Steam hides some achievement descriptions until you earn
   them — the wiki documents the real text regardless, so it's shown here
   in full. Ticks persist on this device.
   Data: data/vampire-survivors/achievements.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY = "nftw:vs:achievements";

let DATA = null, query = "", fGroup = "", hideDone = false;
let done = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
const save = () => localStorage.setItem(KEY, JSON.stringify([...done]));
const idOf = (a) => `${a.group}::${a.name}`;

const els = {
  controls: document.getElementById("va-controls"),
  list: document.getElementById("va-list"),
  progress: document.getElementById("va-progress"),
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;

function buildControls() {
  els.controls.innerHTML = `
    <input type="search" id="f-search" class="search-input" placeholder="Search achievements…" autocomplete="off" value="${esc(query)}">
    <select id="f-group" class="sort-select">${opt("", "All groups", fGroup)}${DATA.groups.map((g) => opt(g, g, fGroup)).join("")}</select>
    <label class="pw-boss-toggle"><input type="checkbox" id="f-hide" ${hideDone ? "checked" : ""}> Hide completed</label>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-group").addEventListener("change", (e) => { fGroup = e.target.value; render(); });
  document.getElementById("f-hide").addEventListener("change", (e) => { hideDone = e.target.checked; render(); });
}

function itemImg(a) {
  const init = esc((a.name || "?").charAt(0));
  return a.icon
    ? `<img class="ms-item-img" src="${esc(a.icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.ms-item-img').classList.add('no-img');this.remove()" data-init="${init}">`
    : "";
}

function row(a) {
  const id = idOf(a);
  const isDone = done.has(id);
  return `<label class="ms-item ${isDone ? "done" : ""}" data-id="${esc(id)}">
    <input type="checkbox" class="ms-check" ${isDone ? "checked" : ""}>
    <span class="ms-item-img${a.icon ? "" : " no-img"}" data-init="${esc((a.name || "?").charAt(0))}">${itemImg(a)}</span>
    <span class="ms-item-body">
      <span class="ms-item-text">${esc(a.name)}</span>
      <span class="ms-item-meta">${esc(a.description)}${a.unlocks && a.unlocks !== a.name ? ` · Unlocks: ${esc(a.unlocks)}` : ""}</span>
    </span>
  </label>`;
}

function render() {
  const byGroup = {};
  for (const a of DATA.achievements) {
    if (fGroup && a.group !== fGroup) continue;
    if (query && !(`${a.name} ${a.description}`.toLowerCase().includes(query))) continue;
    if (hideDone && done.has(idOf(a))) continue;
    (byGroup[a.group] = byGroup[a.group] || []).push(a);
  }
  const groups = DATA.groups.filter((g) => byGroup[g] && byGroup[g].length);
  els.list.innerHTML = groups.map((g) => `
    <section class="ms-section">
      <div class="ms-sec-head"><h3>${esc(g)}</h3><span class="ms-sec-count">${byGroup[g].filter((a) => done.has(idOf(a))).length}/${byGroup[g].length}</span></div>
      <div class="ms-items">${byGroup[g].map(row).join("")}</div>
    </section>`).join("") || `<p class="no-results">No achievements match.</p>`;

  els.list.querySelectorAll(".ms-item").forEach((label) => {
    const id = label.dataset.id;
    label.querySelector(".ms-check").addEventListener("change", (e) => {
      if (e.target.checked) done.add(id); else done.delete(id);
      save();
      label.classList.toggle("done", e.target.checked);
      updateProgress();
      if (hideDone && e.target.checked) render();
    });
  });
  updateProgress();
}

function updateProgress() {
  const have = DATA.achievements.filter((a) => done.has(idOf(a))).length;
  els.progress.innerHTML = `<b>${have}/${DATA.count}</b> unlocked · ${Math.round((have / DATA.count) * 100)}%`;
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/vampire-survivors/achievements.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("va-updated").textContent = `${DATA.count} achievements · ${DATA.groups.length} groups · updated ${upd}`;
    buildControls();
    render();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load achievement data.</p>`;
  }
})();
