/* Disney Dreamlight Valley — Star Path Tracker
   Shows both duty types: the repeatable Routine Duties (with detailed how-to)
   and the Weekly Duties (loaded from starpath.json, revealed week by week).
   Checked state saved per device. */

const SEASON = {
  name: "Godly Glamor", number: 23, theme: "Mount Olympus / Greek gods",
  start: "2026-06-03", end: "2026-07-28",
};

// Repeatable routine duties (rotate during the season) with how-to.
const ROUTINE = [
  { name: "Uproot Night Thorns", how: "Clear the dark spiky weeds that spawn around the Valley overnight — walk up and hold interact. They respawn daily; check every biome." },
  { name: "Collect Star Coins", how: "Earn Star Coins through normal play — sell crops, fish, gems or crafted goods. Selling a stack of high-value crops is fastest." },
  { name: "Get crafty!", how: "Craft anything at a Crafting Station — even cheap items like fences. Craft in bulk to finish instantly." },
  { name: "Change outfit", how: "Open your wardrobe and add or swap any single clothing piece, then confirm." },
  { name: "Find gems with your pickaxe", how: "Mine the sparkling dark rock nodes in any biome. A Pickaxe Polish potion boosts yield; Forgotten Lands and the Mines give the best gems." },
  { name: "Start Discussions", how: "Talk to villagers and pick the daily 'Discussion' option. One per villager per day, so hop between several." },
  { name: "Finish some Dreamlight Duties", how: "Open the Dreamlight Menu (moon icon), complete the listed duties and redeem them — redeeming is what counts." },
  { name: "Earn 5,000 Dreamlight", how: "From completing quests and redeeming Dreamlight Duties. First-time activities give big chunks." },
  { name: "Catch Fish", how: "Fish at any ripple in the Valley. Seaweed does NOT count — aim for the white/gold ripple circles." },
  { name: "Harvest Spinach", how: "Buy Spinach Seeds from Goofy in the Glade of Trust, plant, water and harvest. WALL-E's garden doesn't count." },
  { name: "Sell Spinach", how: "Sell harvested Spinach to any stall. Wait until this duty is ACTIVE before selling, or it won't count." },
  { name: "Take a selfie with Merlin", how: "Equip the Royal Camera, stand near Merlin with him in frame, and take the photo." },
];

const KEY = "nftw:ddv:starpath";
let checks = {};
try { checks = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { checks = {}; }
const save = () => localStorage.setItem(KEY, JSON.stringify(checks));

document.getElementById("season-info").innerHTML =
  `<b>Season ${SEASON.number}: ${SEASON.name}</b> · ${SEASON.theme} · ${SEASON.start} → ${SEASON.end}`;

const root = document.getElementById("sp-root");

function dutyCard(id, name, how, meta) {
  return `<div class="cp-card ${checks[id] ? "is-checked" : ""}" data-id="${id}">
    <div class="cp-head">
      <label class="sp-check-wrap">
        <input type="checkbox" class="sp-check" ${checks[id] ? "checked" : ""}>
        <span class="cp-name">${name}</span>
      </label>
      <span>${meta || ""}<span class="cp-toggle">▾</span></span>
    </div>
    <div class="cp-detail"><p><b>How to.</b> ${how}</p></div>
  </div>`;
}

function progress() {
  const all = root.querySelectorAll(".sp-check");
  const done = [...all].filter((c) => c.checked).length;
  document.getElementById("sp-progress").textContent = `${done}/${all.length} duties done`;
}

function wireCards() {
  root.querySelectorAll(".cp-card").forEach((card) => {
    const id = card.dataset.id;
    card.querySelector(".cp-toggle").addEventListener("click", () => card.classList.toggle("open"));
    card.querySelector(".cp-name").addEventListener("click", () => card.classList.toggle("open"));
    card.querySelector(".sp-check").addEventListener("change", (e) => {
      checks[id] = e.target.checked; save();
      card.classList.toggle("is-checked", e.target.checked);
      progress();
    });
  });
}

async function build() {
  let html = `<h2 class="sp-section">Routine Duties <span class="sp-hint">repeatable</span></h2>` +
    ROUTINE.map((d, i) => dutyCard(`r${i}`, d.name, d.how)).join("");

  try {
    const data = await (await fetch(`../../data/dreamlight-valley/starpath.json?cb=${Date.now()}`)).json();
    for (const w of data.weeks) {
      if (!w.duties.length) continue;
      html += `<h2 class="sp-section">Week ${w.week} <span class="sp-hint">${w.unlocks || ""}</span></h2>`;
      html += w.duties.map((d, j) =>
        dutyCard(`w${w.week}_${j}`, d.name, d.how, `<span class="sp-tokens">${d.qty ? d.qty + "× · " : ""}${d.tokens || ""}🪙</span>`)).join("");
    }
  } catch (e) { /* weekly data optional */ }

  root.innerHTML = html;
  wireCards();
  progress();
}

document.getElementById("sp-reset").addEventListener("click", () => { checks = {}; save(); build(); });
build();
