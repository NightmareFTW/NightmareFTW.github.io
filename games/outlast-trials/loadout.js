/* The Outlast Trials — Loadout Builder
   Pick 1 rig + up to 3 amps, save named builds to localStorage. */

const RIGS = ["Stun Rig", "X-Ray Rig", "Blind Rig", "Heal Rig", "Barricade Rig", "Jammer Rig"];
const AMPS = [
  "Slippers", "Hide and Breathe", "Cacophony", "Double Doses", "Hide and Heal",
  "Strong Arm", "Noise Reduction", "Quick Escape", "Antitoxin",
];
const MAX_AMPS = 3;
const KEY = "nftw:outlast:loadouts";

let rig = null;
let amps = [];
let builds = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function persist() { localStorage.setItem(KEY, JSON.stringify(builds)); }

const rigList = document.getElementById("rig-list");
const ampList = document.getElementById("amp-list");
const ampCount = document.getElementById("amp-count");
const savedList = document.getElementById("saved-list");
const nameInput = document.getElementById("build-name");

function renderSelectors() {
  rigList.innerHTML = RIGS.map((r) =>
    `<button class="opt ${rig === r ? "sel" : ""}" data-rig="${r}">${r}</button>`).join("");
  ampList.innerHTML = AMPS.map((a) => {
    const on = amps.includes(a);
    const dim = !on && amps.length >= MAX_AMPS ? "dim" : "";
    return `<button class="opt ${on ? "sel" : ""} ${dim}" data-amp="${a}">${a}</button>`;
  }).join("");
  ampCount.textContent = amps.length;

  rigList.querySelectorAll("[data-rig]").forEach((b) =>
    b.addEventListener("click", () => { rig = b.dataset.rig; renderSelectors(); }));
  ampList.querySelectorAll("[data-amp]").forEach((b) =>
    b.addEventListener("click", () => {
      const a = b.dataset.amp;
      if (amps.includes(a)) amps = amps.filter((x) => x !== a);
      else if (amps.length < MAX_AMPS) amps.push(a);
      renderSelectors();
    }));
}

function renderSaved() {
  if (!builds.length) {
    savedList.innerHTML = `<p style="color:var(--muted);font-size:.9rem">No saved builds yet.</p>`;
    return;
  }
  savedList.innerHTML = builds.map((b, i) => `
    <div class="build-card">
      <div class="build-head">
        <strong>${b.name}</strong>
        <div>
          <button class="mini-btn" data-load="${i}">load</button>
          <button class="mini-btn del" data-del="${i}">×</button>
        </div>
      </div>
      <div class="build-tags">
        <span class="ev-chip confirmed">${b.rig || "no rig"}</span>
        ${b.amps.map((a) => `<span class="ev-chip">${a}</span>`).join("")}
      </div>
    </div>`).join("");

  savedList.querySelectorAll("[data-load]").forEach((b) =>
    b.addEventListener("click", () => {
      const x = builds[b.dataset.load];
      rig = x.rig; amps = [...x.amps]; nameInput.value = x.name;
      renderSelectors();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
  savedList.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => { builds.splice(b.dataset.del, 1); persist(); renderSaved(); }));
}

document.getElementById("save-build").addEventListener("click", () => {
  const name = nameInput.value.trim() || `Build ${builds.length + 1}`;
  builds.unshift({ name, rig, amps: [...amps] });
  persist();
  nameInput.value = "";
  renderSaved();
});

renderSelectors();
renderSaved();
