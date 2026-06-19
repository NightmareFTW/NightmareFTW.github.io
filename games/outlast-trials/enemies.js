/* The Outlast Trials — Enemies & Counters reference.
   Behaviour and how to deal with each Ex-Pop, Night Hunter and Prime Asset.
   Portraits via the Outlast Wiki; behaviour/counters are a play guide. */

const IMG = "https://static.wikia.nocookie.net/outlast/images";
const ENEMIES = [
  // ---- Common ----
  { name: "Grunt", cat: "Common", danger: "Low",
    img: `${IMG}/d/da/Grunt_preview.png`,
    behavior: "The basic Ex-Pop. Patrols rooms and chases the moment it sees or hears you, swinging a melee weapon.",
    counter: "Break line of sight around a corner, vault or slide through gaps, and hide in a locker or under a bed — they quickly lose interest. Cheap to shake off; don't panic-sprint into a dead end." },
  { name: "Big Grunt", cat: "Common", danger: "High",
    img: `${IMG}/8/8f/Big_Grunt_by_William_Par%C3%A9-Jobin.png`,
    behavior: "A massive, simple-minded heavy. Slow but hits like a truck and can smash through some obstacles; melee can down you fast on higher tiers.",
    counter: "Never out-run it in a straight line — use tight corners, vaults and windows it's slow to follow through. A Blind or Stun rig buys an escape. Keep an exit; avoid dead ends entirely." },

  // ---- Specialists ----
  { name: "Screamer", cat: "Specialist", danger: "Medium",
    img: `${IMG}/5/5b/Screamer_Idle_Profile.png`,
    behavior: "Stands dormant until it spots you or hears noise, then lets out a scream that stuns you and alerts every nearby Ex-Pop to your position.",
    counter: "They're stationary — spot them early and sneak past quietly. Never sprint near one. A Blind throwable / rig shuts the scream down if you must pass close." },
  { name: "Pusher", cat: "Specialist", danger: "Medium",
    img: `${IMG}/1/12/The_Pusher_Infobox_Portrait.png`,
    behavior: "Gas-masked Ex-Pop that lobs and sprays psychosis gas, distorting your vision and spawning hallucinations that disorient you.",
    counter: "Leave the cloud immediately — don't fight or loot inside it. The hallucinations can't actually hurt you; keep moving to clean air and reorient." },
  { name: "Pouncer", cat: "Specialist", danger: "Medium",
    img: `${IMG}/7/75/Pouncer_preview_infobox.png`,
    behavior: "Hides in dark corners and vents, then ambushes and pins you in place for a grab.",
    counter: "Carry your light and sweep dark nooks before walking in. Listen for its lurking cue. If grabbed, mash to break free or have a teammate melee it off you." },

  // ---- Night Hunters ----
  { name: "Berserker", cat: "Night Hunter", danger: "High",
    img: `${IMG}/6/61/Berserker_preview.png`,
    behavior: "A relentless Night Hunter that pursues you across the whole trial with high speed and aggression, ignoring most distractions.",
    counter: "Don't duel it — keep doing objectives and rotate. Use rigs to peel it off, never get cornered, and keep two escape routes open at all times." },
  { name: "Night Hunters", cat: "Night Hunter", danger: "High",
    img: `${IMG}/2/20/Night_Hunters_%28evidence%29.png`,
    behavior: "Roaming hunters that track Reagents persistently, showing up in higher MK / escalation runs to keep constant pressure on the team.",
    counter: "Stay mobile and split their attention in co-op. Save Blind/Stun for grab escapes, and don't all funnel into the same room." },

  // ---- Prime Assets (map bosses) ----
  { name: "The Skinner Man", cat: "Prime Asset", where: "Police Station", danger: "Boss",
    img: `${IMG}/0/08/Skinner_Man_Updated.png`,
    behavior: "A flaying killer who stalks the Police Station with a blade, punishing players who linger or loot greedily.",
    counter: "Keep distance and break line of sight constantly; use the environment to lose him. Grab objectives and move — don't get greedy." },
  { name: "Leland Coyle", cat: "Prime Asset", where: "Orphanage", danger: "Boss",
    img: `${IMG}/2/2b/Leland_Coyle_by_William_Par%C3%A9-Jobin.png`,
    behavior: "A corrupt, taunting cop with an electrified baton who charges and stuns. His baton hit is brutal in the open.",
    counter: "Bait the charge, then dodge around cover or a vault as he commits. Fight near windows/vaults so you can break away — never trade in open rooms." },
  { name: "Mother Gooseberry", cat: "Prime Asset", where: "Toy Factory", danger: "Boss",
    img: `${IMG}/f/fc/Mother_Gooseberry_Portrait_Low_Detail.png`,
    behavior: "A deranged clown with a candy cart who deploys 'Gooseberry juice' gas and toys, and sings to track your location.",
    counter: "Avoid her gas and don't linger near the cart. Work objectives while she patrols, and keep rigs ready to escape a grab." },
  { name: "Franco \"Il Bambino\" Barbi", cat: "Prime Asset", where: "The Docks", danger: "Boss",
    img: `${IMG}/8/8f/OLTrials_Franco_MainMenu.png`,
    behavior: "A hulking mobster Prime Asset with devastating melee that bullies you around the Docks.",
    counter: "Use vertical and tight routes to create space; never get cornered against the water. Rigs to break grabs and reset the chase." },
  { name: "Liliya Bogomolova", cat: "Prime Asset", where: "Resort", danger: "Boss",
    img: `${IMG}/4/44/Liliya_Bogomolova_profile.png`,
    behavior: "The Season 5 Prime Asset who stalks the Resort, keeping relentless pressure on the team.",
    counter: "Keep moving and use cover and rotations; prioritise objectives over hiding in place, and save escape rigs for when she closes in." },
];

const CATS = ["All", "Common", "Specialist", "Night Hunter", "Prime Asset"];
const DANGER_CLASS = { Low: "dg-low", Medium: "dg-med", High: "dg-high", Boss: "dg-boss" };
let cat = "All";

const root = document.getElementById("en-root");
const filters = document.getElementById("en-filters");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

filters.innerHTML = CATS.map((c) => `<button class="btn filter-btn ${c === "All" ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
filters.querySelectorAll(".filter-btn").forEach((b) => b.addEventListener("click", () => {
  cat = b.dataset.cat;
  filters.querySelectorAll(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
  render();
}));

function render() {
  const list = ENEMIES.filter((e) => cat === "All" || e.cat === cat);
  root.innerHTML = list.map((e) => `
    <div class="enemy-card">
      <div class="enemy-portrait"><img src="${esc(e.img)}" alt="${esc(e.name)}" loading="lazy" onerror="this.closest('.enemy-portrait').classList.add('no-img')"></div>
      <div class="enemy-info">
        <div class="enemy-top">
          <span class="enemy-name">${esc(e.name)}</span>
          <span class="enemy-tags">
            <span class="ev-chip">${esc(e.cat)}</span>
            ${e.where ? `<span class="ev-chip enemy-where">${esc(e.where)}</span>` : ""}
            <span class="enemy-danger ${DANGER_CLASS[e.danger] || ""}">${esc(e.danger)}</span>
          </span>
        </div>
        <p class="enemy-behavior">${esc(e.behavior)}</p>
        <p class="enemy-counter"><b>How to deal with it:</b> ${esc(e.counter)}</p>
      </div>
    </div>`).join("");
}
render();
