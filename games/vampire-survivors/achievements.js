/* Vampire Survivors — Achievements Checklist.
   Every achievement (in-game "Unlocks"), all DLCs included, grouped by
   version/DLC. Steam hides some achievement descriptions until you earn
   them — the wiki documents the real text regardless, so it's shown here
   in full. Ticks persist on this device.
   Data: data/vampire-survivors/achievements.json. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY = "nftw:vs:achievements";

// Native confirm() dialogs aren't part of the DOM, so assets/js/i18n.js's
// text-node translator can't reach them — check the language directly here,
// same as steam-alerts.js does for its own native Notification popups.
const PT = localStorage.getItem("nftw:lang") === "pt";
const confirmUnlockAll = (n) => confirm(PT ? `Marcar todas as ${n} conquistas como desbloqueadas?` : `Mark all ${n} achievements as unlocked?`);
const confirmUnlockGroup = (n, group) => confirm(PT ? `Marcar as ${n} conquistas de "${group}" como desbloqueadas?` : `Mark all ${n} achievements in "${group}" as unlocked?`);

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
    <label class="pw-boss-toggle"><input type="checkbox" id="f-hide" ${hideDone ? "checked" : ""}> Hide completed</label>
    <button type="button" class="mini-btn" id="f-unlock-dlc" ${fGroup ? "" : "hidden"}>Unlock <b>${esc(fGroup)}</b></button>
    <button type="button" class="mini-btn" id="f-unlock-all">Unlock all</button>`;
  document.getElementById("f-search").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("f-group").addEventListener("change", (e) => {
    fGroup = e.target.value;
    const btn = document.getElementById("f-unlock-dlc");
    if (btn) { btn.hidden = !fGroup; btn.innerHTML = `Unlock <b>${esc(fGroup)}</b>`; }
    render();
  });
  document.getElementById("f-hide").addEventListener("change", (e) => { hideDone = e.target.checked; render(); });
  document.getElementById("f-unlock-all").addEventListener("click", () => {
    if (!confirmUnlockAll(DATA.count)) return;
    DATA.achievements.forEach((a) => done.add(idOf(a)));
    save();
    render();
  });
  document.getElementById("f-unlock-dlc").addEventListener("click", () => {
    if (!fGroup) return;
    const list = DATA.achievements.filter((a) => a.group === fGroup);
    if (!confirmUnlockGroup(list.length, fGroup)) return;
    list.forEach((a) => done.add(idOf(a)));
    save();
    render();
  });
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

// Deep-link from a character's unlock guide (achievements.html?highlight=Name)
// — scroll to and flash the matching row instead of filtering the list down,
// so it still reads as "here it is" rather than hiding everything else.
function highlightFromQuery() {
  const want = new URLSearchParams(location.search).get("highlight");
  if (!want) return;
  const a = DATA.achievements.find((x) => x.name.toLowerCase() === want.toLowerCase());
  if (!a) return;
  hideDone = false;
  render();
  const row = els.list.querySelector(`.ms-item[data-id="${CSS.escape(idOf(a))}"]`);
  if (row) { row.scrollIntoView({ behavior: "smooth", block: "center" }); row.classList.add("vs-flash"); setTimeout(() => row.classList.remove("vs-flash"), 2200); }
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/vampire-survivors/achievements.json?cb=${Date.now()}`)).json();
    const upd = DATA.updated ? new Date(DATA.updated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    document.getElementById("va-updated").textContent = `${DATA.count} achievements · ${DATA.groups.length} groups · updated ${upd}`;
    buildControls();
    render();
    highlightFromQuery();
  } catch (e) {
    els.list.innerHTML = `<p class="tool-note">Couldn't load achievement data.</p>`;
  }
})();
