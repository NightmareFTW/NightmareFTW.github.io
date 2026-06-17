/* Disney Dreamlight Valley — Star Path Tracker
   Current season's duties with a detailed how-to for each. Checked state is
   saved per device. Update SEASON + DUTIES when a new Star Path begins. */

const SEASON = {
  name: "Godly Glamor",
  number: 23,
  theme: "Mount Olympus / Greek gods",
  start: "2026-06-03",
  end: "2026-07-28",
};

// Star Path duties rotate — only a few are active at a time, but every duty in
// the season is listed here with how to clear it.
const DUTIES = [
  { name: "Uproot Night Thorns", how: "Night Thorns are the dark spiky weeds that spawn around the Valley overnight. Walk up to each and hold the interact button to clear it. They respawn daily, so check every biome." },
  { name: "Collect Star Coins", how: "Just earn Star Coins through normal play — sell crops, fish, gems or crafted goods at any time. Selling a stack of high-value crops (like Pumpkins) is the fastest way to bank coins." },
  { name: "Get crafty!", how: "Open any Crafting Station and craft anything — even cheap items like Soft Wood Fences or Hardwood. Craft in bulk to knock this out instantly." },
  { name: "Change outfit", how: "Open your wardrobe, then add or swap any single clothing piece and confirm. Swapping a hat or shoes counts." },
  { name: "Find gems with your pickaxe", how: "Mine the shiny dark rock nodes (dig spots that sparkle) in any biome with your Pickaxe. A Pickaxe Polish potion boosts gem yield. Forgotten Lands and the Mines give the best gems." },
  { name: "Start Discussions", how: "Talk to villagers and pick the daily 'Discussion' (speech-bubble) option. Each villager offers one discussion per day, so hop between several villagers to complete it." },
  { name: "Finish some Dreamlight Duties", how: "Open the Dreamlight Menu (the moon icon), complete the listed daily/one-off duties, then press to redeem them. Redeeming is what counts toward this." },
  { name: "Earn 5,000 Dreamlight", how: "Dreamlight comes from completing quests and redeeming Dreamlight Duties. Stack several duties and redeem them together; first-time activities (new fish, new photos) give big chunks." },
  { name: "Catch Fish", how: "Fish at any rippling/​bubbling spot in the Valley. Note: catching Seaweed does NOT count — aim for the white or gold ripple circles for real fish." },
  { name: "Harvest Spinach", how: "Buy Spinach Seeds from Goofy's stall in the Glade of Trust, plant and water them, then harvest when grown (~25 min). WALL-E's garden harvests do NOT count — grow them in the open village." },
  { name: "Sell Spinach", how: "Sell your harvested Spinach to any stall or Goofy. Wait until this specific duty is ACTIVE before selling, otherwise the sale won't be counted — hold your Spinach until then." },
  { name: "Take a selfie with Merlin", how: "Equip the Royal Camera (Touch of Magic tool), stand near Merlin, open camera mode and make sure Merlin is in frame, then take the photo." },
];

const KEY = "nftw:ddv:starpath";
let checks = {};
try { checks = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { checks = {}; }
const save = () => localStorage.setItem(KEY, JSON.stringify(checks));

document.getElementById("season-info").innerHTML =
  `<b>Season ${SEASON.number}: ${SEASON.name}</b> · ${SEASON.theme} · ${SEASON.start} → ${SEASON.end}`;

const root = document.getElementById("sp-root");
function render() {
  const done = DUTIES.filter((_, i) => checks[i]).length;
  document.getElementById("sp-progress").textContent = `${done}/${DUTIES.length} duties done`;
  root.innerHTML = DUTIES.map((d, i) => `
    <div class="cp-card ${checks[i] ? "is-checked" : ""}" data-i="${i}">
      <div class="cp-head">
        <label class="sp-check-wrap">
          <input type="checkbox" class="sp-check" ${checks[i] ? "checked" : ""}>
          <span class="cp-name">${d.name}</span>
        </label>
        <span class="cp-toggle">▾</span>
      </div>
      <div class="cp-detail"><p><b>How to.</b> ${d.how}</p></div>
    </div>`).join("");

  root.querySelectorAll(".cp-card").forEach((card) => {
    const i = card.dataset.i;
    card.querySelector(".cp-toggle").addEventListener("click", () => card.classList.toggle("open"));
    card.querySelector(".cp-name").addEventListener("click", () => card.classList.toggle("open"));
    card.querySelector(".sp-check").addEventListener("change", (e) => {
      checks[i] = e.target.checked; save();
      card.classList.toggle("is-checked", e.target.checked);
      document.getElementById("sp-progress").textContent =
        `${DUTIES.filter((_, k) => checks[k]).length}/${DUTIES.length} duties done`;
    });
  });
}

document.getElementById("sp-reset").addEventListener("click", () => { checks = {}; save(); render(); });
render();
