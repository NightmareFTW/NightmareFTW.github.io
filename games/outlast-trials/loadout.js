/* The Outlast Trials — Loadout Builder
   A loadout = 1 Rig + 1 Tool amp + 1 Skill amp + 1 Medicine amp.
   Builds save to localStorage and can be shared via a ?b= URL link.
   Amp data via the Outlast Wiki. */

const RIGS = ["Stun Rig", "X-Ray Rig", "Blind Rig", "Heal Rig", "Barricade Rig", "Jammer Rig"];
const AMP_GROUPS = {
  Tool: ["Slippers", "Cacophony", "Noise Reduction", "Battery Charger", "Lock Breaker", "Recycle", "Key Master", "Backpack", "Short Circuit"],
  Skill: ["Hide and Breathe", "Hide and Heal", "Hide and Restore", "Quick Escape", "Invisible", "Door Trap Breaker", "Smash", "Strong Arm", "Evasive Maneuver"],
  Medicine: ["Double Doses", "Antitoxin", "Surplus", "Last Chance", "Incognito", "Good Job", "Boosted", "Self Revive", "Bandage Expert"],
};
const KEY = "nftw:outlast:loadouts";

// build = { name, rig, Tool, Skill, Medicine }
let build = { name: "", rig: null, Tool: null, Skill: null, Medicine: null };
let builds = load();

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function persist() { localStorage.setItem(KEY, JSON.stringify(builds)); }

const selectors = document.getElementById("selectors");
const savedList = document.getElementById("saved-list");

function encode(b) { return encodeURIComponent(btoa(JSON.stringify(b))); }
function decode(s) { try { return JSON.parse(atob(decodeURIComponent(s))); } catch { return null; } }
function shareUrl(b) { return `${location.origin}${location.pathname}?b=${encode(b)}`; }

function optButtons(items, key) {
  return items.map((it) =>
    `<button class="opt ${build[key] === it ? "sel" : ""}" data-key="${key}" data-val="${it}">${it}</button>`).join("");
}

function renderSelectors() {
  selectors.innerHTML = `
    <div class="panel">
      <h2>Rig <span style="color:var(--muted);font-weight:400">(pick 1)</span></h2>
      <div class="opt-grid">${optButtons(RIGS, "rig")}</div>
    </div>
    <div class="panel" style="margin-top:18px">
      <h2>Tool Amp</h2>
      <div class="opt-grid">${optButtons(AMP_GROUPS.Tool, "Tool")}</div>
    </div>
    <div class="panel" style="margin-top:18px">
      <h2>Skill Amp</h2>
      <div class="opt-grid">${optButtons(AMP_GROUPS.Skill, "Skill")}</div>
    </div>
    <div class="panel" style="margin-top:18px">
      <h2>Medicine Amp</h2>
      <div class="opt-grid">${optButtons(AMP_GROUPS.Medicine, "Medicine")}</div>
    </div>
    <div class="controls" style="margin-top:18px">
      <input class="gs-stat" id="build-name" placeholder="Build name (e.g. Solo Stealth)" style="flex:1" value="${build.name || ""}">
      <button class="btn" id="save-build">Save</button>
      <button class="btn" id="share-build">Copy share link</button>
    </div>
    <p id="share-msg" style="color:var(--accent-2);font-size:.85rem;margin-top:8px;min-height:1em"></p>`;

  selectors.querySelectorAll(".opt").forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.dataset.key;
      build[k] = build[k] === b.dataset.val ? null : b.dataset.val;
      build.name = document.getElementById("build-name").value;
      renderSelectors();
    }));

  document.getElementById("save-build").addEventListener("click", () => {
    build.name = document.getElementById("build-name").value.trim() || `Build ${builds.length + 1}`;
    builds.unshift({ ...build });
    persist();
    build = { name: "", rig: null, Tool: null, Skill: null, Medicine: null };
    renderSelectors();
    renderSaved();
  });

  document.getElementById("share-build").addEventListener("click", () => {
    build.name = document.getElementById("build-name").value;
    const url = shareUrl(build);
    navigator.clipboard?.writeText(url);
    const msg = document.getElementById("share-msg");
    msg.textContent = "Share link copied to clipboard ✓";
    setTimeout(() => (msg.textContent = ""), 2500);
  });
}

function chips(b) {
  return ["rig", "Tool", "Skill", "Medicine"]
    .map((k) => b[k] ? `<span class="ev-chip ${k === "rig" ? "confirmed" : ""}">${b[k]}</span>` : "")
    .join("");
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
          <button class="mini-btn" data-share="${i}">share</button>
          <button class="mini-btn del" data-del="${i}">×</button>
        </div>
      </div>
      <div class="build-tags">${chips(b)}</div>
    </div>`).join("");

  savedList.querySelectorAll("[data-load]").forEach((b) =>
    b.addEventListener("click", () => {
      build = { ...builds[b.dataset.load] };
      renderSelectors();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
  savedList.querySelectorAll("[data-share]").forEach((b) =>
    b.addEventListener("click", () => {
      navigator.clipboard?.writeText(shareUrl(builds[b.dataset.share]));
      b.textContent = "copied!";
      setTimeout(() => (b.textContent = "share"), 1500);
    }));
  savedList.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => { builds.splice(b.dataset.del, 1); persist(); renderSaved(); }));
}

// Load a shared build from ?b=
const shared = new URLSearchParams(location.search).get("b");
if (shared) {
  const b = decode(shared);
  if (b) build = { name: b.name || "Shared build", rig: b.rig || null, Tool: b.Tool || null, Skill: b.Skill || null, Medicine: b.Medicine || null };
}

renderSelectors();
renderSaved();
