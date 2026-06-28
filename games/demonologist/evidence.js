/* Demonologist — Demon Evidence Checker.
   Data-driven from data/demonologist/data.json (scraped from the Demonologist
   Wiki). Evidence states: 0 = unknown, 1 = found (include), -1 = ruled out.
   A demon stays possible if every FOUND evidence is in its set and no RULED-OUT
   evidence is. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let EVIDENCE = [], DEMONS = [], state = {};
const NEXT = { 0: 1, 1: -1, [-1]: 0 };
const STATE_LABEL = { 0: "—", 1: "FOUND", [-1]: "RULED OUT" };
const STATE_CLASS = { 0: "", 1: "include", [-1]: "exclude" };
const labelOf = (id) => (EVIDENCE.find((e) => e.id === id) || {}).label || id;

function demonMatches(d) {
  const set = new Set(d.evidence);
  for (const ev of EVIDENCE) {
    const s = state[ev.id];
    if (s === 1 && !set.has(ev.id)) return false;
    if (s === -1 && set.has(ev.id)) return false;
  }
  return true;
}

function render() {
  const evList = document.getElementById("evidence-list");
  const foundCount = Object.values(state).filter((v) => v === 1).length;
  const lockOthers = foundCount >= 3;

  evList.innerHTML = EVIDENCE.map((e) => {
    const s = state[e.id];
    const disabled = lockOthers && s === 0;
    return `<button class="evidence-btn ${STATE_CLASS[s]}" data-id="${e.id}" ${disabled ? "disabled" : ""}>
      <span>${esc(e.label)}</span><span class="state">${STATE_LABEL[s]}</span>
    </button>`;
  }).join("");
  evList.querySelectorAll(".evidence-btn").forEach((btn) =>
    btn.addEventListener("click", () => { state[btn.dataset.id] = NEXT[state[btn.dataset.id]]; render(); }));

  const matches = DEMONS.filter(demonMatches);
  const anyEvidence = Object.values(state).some((v) => v !== 0);
  document.getElementById("summary").innerHTML = anyEvidence
    ? `<b>${matches.length}</b> of ${DEMONS.length} demons match.`
    : `${DEMONS.length} demons. Mark evidence to narrow down.`;

  document.getElementById("ghost-list").innerHTML = DEMONS.map((d) => {
    const isMatch = matches.includes(d);
    const cls = !anyEvidence ? "" : isMatch ? "match" : "ruled-out";
    const chips = d.evidence.map((ev) => `<span class="ev-chip ${state[ev] === 1 ? "confirmed" : ""}">${esc(labelOf(ev))}</span>`).join("");
    const tells = [d.strengths ? `<b>Strength:</b> ${esc(d.strengths)}` : "", d.weaknesses ? `<b>Weakness:</b> ${esc(d.weaknesses)}` : ""].filter(Boolean).join("<br>");
    return `<div class="ghost-item ${cls}" data-name="${esc(d.name)}">
      <div class="ghost-head"><span class="ghost-name">${esc(d.name)}</span><span class="state" style="font-family:var(--mono);font-size:.75rem;color:var(--muted)">▾</span></div>
      <div class="ghost-evidence">${chips}</div>
      ${tells ? `<p class="ghost-detail">${tells}</p>` : ""}
    </div>`;
  }).join("");
  document.querySelectorAll(".ghost-item").forEach((item) =>
    item.querySelector(".ghost-head").addEventListener("click", () => item.classList.toggle("open")));
}

document.getElementById("reset-btn").addEventListener("click", () => { EVIDENCE.forEach((e) => (state[e.id] = 0)); render(); });

(async function init() {
  try {
    const d = await (await fetch(`../../data/demonologist/data.json?cb=${Date.now()}`)).json();
    EVIDENCE = d.evidences; DEMONS = d.demons;
    EVIDENCE.forEach((e) => (state[e.id] = 0));
    render();
  } catch (e) {
    document.getElementById("ghost-list").innerHTML = `<p class="tool-note">Couldn't load the demon data yet — the updater hasn't published it.</p>`;
  }
})();
