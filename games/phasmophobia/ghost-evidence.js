/* Phasmophobia Ghost Evidence Checker
   Evidence states: 0 = unknown, 1 = found (include), -1 = ruled out (exclude).
   A ghost stays possible if: every FOUND evidence is in its set, and no
   RULED-OUT evidence is in its set. Includes special-case hints (e.g. Mimic). */

const EVIDENCE = [
  { id: "emf", label: "EMF Level 5" },
  { id: "dots", label: "D.O.T.S Projector" },
  { id: "ultraviolet", label: "Ultraviolet (Fingerprints)" },
  { id: "ghostwriting", label: "Ghost Writing" },
  { id: "spiritbox", label: "Spirit Box" },
  { id: "freezing", label: "Freezing Temperatures" },
  { id: "orbs", label: "Ghost Orbs" },
];

const GHOSTS = [
  { name: "Spirit", evidence: ["emf", "spiritbox", "ghostwriting"], note: "Smudge sticks stop it hunting for 180s (vs 90s normal)." },
  { name: "Wraith", evidence: ["emf", "spiritbox", "dots"], note: "Never steps in salt; can teleport to a player." },
  { name: "Phantom", evidence: ["spiritbox", "ultraviolet", "dots"], note: "Photo makes it vanish; visible less during hunts." },
  { name: "Poltergeist", evidence: ["spiritbox", "ultraviolet", "ghostwriting"], note: "Throws multiple objects at once." },
  { name: "Banshee", evidence: ["ultraviolet", "dots", "orbs"], note: "Targets one player; sings on the parabolic mic." },
  { name: "Jinn", evidence: ["emf", "ultraviolet", "freezing"], note: "Faster at distance; can't hunt early if you turn off the breaker." },
  { name: "Mare", evidence: ["spiritbox", "ghostwriting", "orbs"], note: "More active in the dark; can turn lights off." },
  { name: "Revenant", evidence: ["ghostwriting", "freezing", "orbs"], note: "Very fast when chasing, slow otherwise. Hide!" },
  { name: "Shade", evidence: ["emf", "ghostwriting", "freezing"], note: "Shy — won't hunt if players are grouped." },
  { name: "Demon", evidence: ["ultraviolet", "ghostwriting", "freezing"], note: "Hunts very often; smudge cooldown shortened." },
  { name: "Yurei", evidence: ["dots", "freezing", "orbs"], note: "Smudging it traps it in a room for a while." },
  { name: "Oni", evidence: ["emf", "dots", "freezing"], note: "More active with people nearby; no airball events." },
  { name: "Yokai", evidence: ["spiritbox", "dots", "orbs"], note: "Talking near it angers it; only hears nearby speech during hunts." },
  { name: "Hantu", evidence: ["ultraviolet", "freezing", "orbs"], note: "Faster in cold rooms, slower in warm. Freezing always present." },
  { name: "Goryo", evidence: ["emf", "ultraviolet", "dots"], note: "Only shows D.O.T.S on a video feed, not in person." },
  { name: "Myling", evidence: ["emf", "ultraviolet", "ghostwriting"], note: "Quieter during hunts; more frequent paranormal sounds." },
  { name: "Onryo", evidence: ["spiritbox", "freezing", "orbs"], note: "Flame (candle) blowing out can trigger a hunt." },
  { name: "The Twins", evidence: ["emf", "spiritbox", "freezing"], note: "Two interaction sources; either twin can hunt." },
  { name: "Raiju", evidence: ["emf", "dots", "orbs"], note: "Faster near active electronics." },
  { name: "Obake", evidence: ["emf", "ultraviolet", "orbs"], note: "May leave unusual (6-finger) fingerprints; UV can fade fast." },
  { name: "The Mimic", evidence: ["spiritbox", "ultraviolet", "freezing"], note: "Mimics other ghosts; ALWAYS shows Ghost Orbs as a 4th fake evidence.", fakeOrbs: true },
  { name: "Moroi", evidence: ["spiritbox", "ghostwriting", "freezing"], note: "Curses via Spirit Box; faster the lower your sanity." },
  { name: "Deogen", evidence: ["spiritbox", "ghostwriting", "dots"], note: "Always senses you; very fast far away, crawls when close." },
  { name: "Thaye", evidence: ["dots", "ghostwriting", "orbs"], note: "Ages over time — starts fast/aggressive, slows down." },
  { name: "Obambo", evidence: ["ghostwriting", "ultraviolet", "dots"], note: "Flickers between calm and aggressive; hunts faster when aggravated." },
  { name: "Gallu", evidence: ["emf", "ultraviolet", "spiritbox"], note: "Protective equipment provokes it, making gear less effective until it tires." },
  { name: "Dayan", evidence: ["emf", "spiritbox", "orbs"], note: "Strengthened by players moving nearby; weakened when you stay still." },
  { name: "Kormos", evidence: ["ultraviolet", "spiritbox", "orbs"], note: "Nearly blind — stay silent and motionless and it may walk right past." },
  { name: "Aswang", evidence: ["dots", "ghostwriting", "freezing"], note: "Accelerates hard with line of sight; break LoS to lose it." },
];

const state = {};
EVIDENCE.forEach((e) => (state[e.id] = 0));

const NEXT = { 0: 1, 1: -1, [-1]: 0 };
const STATE_LABEL = { 0: "—", 1: "FOUND", [-1]: "RULED OUT" };
const STATE_CLASS = { 0: "", 1: "include", [-1]: "exclude" };

function ghostMatches(ghost) {
  // Effective evidence includes the Mimic's fake orbs for inclusion checks.
  const set = new Set(ghost.evidence);
  const effective = new Set(ghost.evidence);
  if (ghost.fakeOrbs) effective.add("orbs");

  for (const ev of EVIDENCE) {
    const s = state[ev.id];
    if (s === 1 && !effective.has(ev.id)) return false; // found but ghost lacks it
    if (s === -1 && set.has(ev.id)) return false;        // ruled out but ghost needs it
  }
  return true;
}

function render() {
  // Evidence buttons
  const evList = document.getElementById("evidence-list");
  const foundCount = Object.values(state).filter((v) => v === 1).length;
  const lockOthers = foundCount >= 3;

  evList.innerHTML = EVIDENCE.map((e) => {
    const s = state[e.id];
    const disabled = lockOthers && s === 0 ? "disabled" : "";
    return `<button class="evidence-btn ${STATE_CLASS[s]} ${disabled}" data-id="${e.id}" ${disabled ? "disabled" : ""}>
      <span>${e.label}</span>
      <span class="state">${STATE_LABEL[s]}</span>
    </button>`;
  }).join("");

  evList.querySelectorAll(".evidence-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      state[id] = NEXT[state[id]];
      render();
    });
  });

  // Ghosts
  const matches = GHOSTS.filter(ghostMatches);
  const anyEvidence = Object.values(state).some((v) => v !== 0);

  document.getElementById("summary").innerHTML = anyEvidence
    ? `<b>${matches.length}</b> of ${GHOSTS.length} ghosts match.`
    : `${GHOSTS.length} ghosts. Mark evidence to narrow down.`;

  const ghostList = document.getElementById("ghost-list");
  ghostList.innerHTML = GHOSTS.map((g) => {
    const isMatch = matches.includes(g);
    const cls = !anyEvidence ? "" : isMatch ? "match" : "ruled-out";
    const chips = g.evidence.map((ev) => {
      const confirmed = state[ev] === 1 ? "confirmed" : "";
      const label = EVIDENCE.find((e) => e.id === ev).label;
      return `<span class="ev-chip ${confirmed}">${label}</span>`;
    }).join("");
    const mimicChip = g.fakeOrbs ? `<span class="ev-chip">+ fake Orbs</span>` : "";
    return `<div class="ghost-item ${cls}" data-name="${g.name}">
      <div class="ghost-head">
        <span class="ghost-name">${g.name}</span>
        <span class="state" style="font-family:var(--mono);font-size:.75rem;color:var(--muted)">▾</span>
      </div>
      <div class="ghost-evidence">${chips}${mimicChip}</div>
      <p class="ghost-detail">${g.note}</p>
    </div>`;
  }).join("");

  ghostList.querySelectorAll(".ghost-item").forEach((item) => {
    item.querySelector(".ghost-head").addEventListener("click", () => {
      item.classList.toggle("open");
    });
  });
}

document.getElementById("reset-btn").addEventListener("click", () => {
  EVIDENCE.forEach((e) => (state[e.id] = 0));
  render();
});

render();
