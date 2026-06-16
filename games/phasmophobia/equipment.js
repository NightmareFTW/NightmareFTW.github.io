/* Phasmophobia — Equipment Guide
   Per item: category, the evidence/purpose, the 3 tiers (what each upgrade
   changes), how to use it properly, and tips. Images via the Phasmophobia Wiki. */

const EQUIPMENT = [
  // ---------- Evidence tools ----------
  {
    id: "emf", name: "EMF Reader", cat: "Evidence", evidence: "EMF Level 5",
    purpose: "Detects electromagnetic activity. A reading of EMF 5 is one of the seven evidences.",
    tiers: [
      "GheistField Meter — dial display, ~1.7 m range, needle sways with age.",
      "K2 Meter — five LED lights, ~2 m range, the classic reader.",
      "EMF ParaMeter — PDA style, logs the location and value of the last reading.",
    ],
    use: "Carry it near interaction spots (doors, switches, thrown items). Levels 2–4 only confirm activity; a clear flash to 5 is the evidence.",
    tip: "Place it down after an interaction to catch the EMF without holding everything. Raiju can make it malfunction.",
  },
  {
    id: "spiritbox", name: "Spirit Box", cat: "Evidence", evidence: "Spirit Box",
    purpose: "Lets you talk to the ghost; a spoken response is the evidence.",
    tiers: [
      "Short range — must be very close, lights off.",
      "Larger response range and on-screen text of responses.",
      "Widest range — responses from further away and more reliably.",
    ],
    use: "Turn the lights off, get close (often alone), and ask: \"Are you here?\", \"Where are you?\". A voice reply = evidence.",
    tip: "Many ghosts only answer when you're alone or at lower sanity. Lights off is essential.",
  },
  {
    id: "thermometer", name: "Thermometer", cat: "Evidence", evidence: "Freezing Temperatures",
    purpose: "Reads room temperature. Sub-zero (visible breath) in the ghost room is the evidence.",
    tiers: ["Standard reading speed.", "Faster readings.", "Fastest, and holds the lowest reading."],
    use: "Sweep rooms to find the coldest. Freezing only appears in the ghost's favourite room, so it also helps locate the room.",
    tip: "If you can see your breath, it's freezing. Hantu always has freezing and moves faster in the cold.",
  },
  {
    id: "uv", name: "UV Light", cat: "Evidence", evidence: "Ultraviolet (Fingerprints)",
    purpose: "Reveals fingerprints and footprints left by ghost interactions.",
    tiers: ["UV flashlight — dim beam.", "Brighter UV with a wider beam.", "Strongest UV, easiest to spot prints."],
    use: "Shine on door handles, light switches, windows and keyboards after the ghost touches them. Glowing prints = evidence.",
    tip: "Obake can leave a six-finger print and its prints fade faster than normal. Check switches and handles first.",
  },
  {
    id: "dots", name: "D.O.T.S. Projector", cat: "Evidence", evidence: "D.O.T.S",
    purpose: "Projects a grid of green dots; a ghost silhouette walking through them is the evidence.",
    tiers: ["Smaller dot area.", "Wider coverage.", "Widest coverage."],
    use: "Place in the ghost room covering a doorway, ideally with a video camera pointed at it. Watch the feed for a moving silhouette.",
    tip: "It's far easier to spot D.O.T.S through a video camera on the truck monitor than with your eyes.",
  },
  {
    id: "videocamera", name: "Video Camera", cat: "Evidence", evidence: "Ghost Orbs",
    purpose: "On night vision it reveals ghost orbs, and it streams D.O.T.S and remote rooms to the truck.",
    tiers: ["Basic camera.", "Improved night vision.", "Best night vision and clarity."],
    use: "Mount on a tripod in the ghost room with night vision on; watch the truck monitor for floating orbs near the centre.",
    tip: "Orbs only appear on the night-vision camera feed, never to the naked eye.",
  },
  {
    id: "writingbook", name: "Ghost Writing Book", cat: "Evidence", evidence: "Ghost Writing",
    purpose: "The ghost writes or draws in it.",
    tiers: ["Plain book.", "A light indicates when it has been written in.", "Clearer indicator / faster to notice."],
    use: "Place it flat on the floor in the ghost room and leave it — it can't be written in while held. A used page = evidence.",
    tip: "Spread a few around the room. Myling and Mare write often; some ghosts never will.",
  },
  // ---------- Tracking / objectives ----------
  {
    id: "photocamera", name: "Photo Camera", cat: "Tracking",
    purpose: "Takes photos for money and objectives (ghost, bone, interactions, cursed object, dirty water…).",
    tiers: ["Fewer photos, basic quality.", "More photos and better range.", "Most photos and best quality."],
    use: "Photograph the ghost, the bone, fingerprints and interactions. Each valid photo pays out.",
    tip: "Always grab the Bone (it's an objective) and a clear ghost photo for bonus cash.",
  },
  {
    id: "parabolic", name: "Parabolic Microphone", cat: "Tracking",
    purpose: "Picks up faint paranormal sounds at distance to help locate the ghost room.",
    tiers: ["Short detection range.", "Longer range.", "Longest range and clearest spikes."],
    use: "Point it down hallways and open areas; audio spikes and whispers point you toward the ghost.",
    tip: "Invaluable on large maps for narrowing down the room before you commit.",
  },
  {
    id: "soundsensor", name: "Sound Sensor", cat: "Tracking",
    purpose: "Monitors sound in an area and reports it on the truck map.",
    tiers: ["Covers a small area.", "Larger area.", "Largest area and labels the sound type."],
    use: "Place to cover rooms you can't watch; the truck map lights up where sound happens.",
    tip: "Great for covering big open sections to triangulate the room.",
  },
  {
    id: "motionsensor", name: "Motion Sensor", cat: "Tracking",
    purpose: "Pings when something crosses it — useful for tracking ghost movement.",
    tiers: ["Basic trigger.", "Clearer indicator.", "Best indicator and range."],
    use: "Mount across a doorway (not on your own path); it lights up and notifies the truck on movement.",
    tip: "Place facing across a door away from where you walk to avoid false triggers.",
  },
  // ---------- Protection ----------
  {
    id: "crucifix", name: "Crucifix", cat: "Protection",
    purpose: "Prevents a hunt from starting within its radius (it does not stop one already in progress).",
    tiers: ["~3 m radius, limited uses.", "Larger radius.", "Largest radius and shows remaining uses."],
    use: "Place or hold it near the ghost room or during a cursed event. It burns a charge each time it blocks a hunt.",
    tip: "Position it where the ghost starts hunts (its room). Useless once a hunt is already active.",
  },
  {
    id: "incense", name: "Incense (Smudge Sticks)", cat: "Protection",
    purpose: "Blinds the ghost and blocks hunts for a short time; can stop the ghost finding you mid-hunt.",
    tiers: ["Short burn time.", "Longer burn.", "Longest burn / extra use."],
    use: "Light with an igniter. During a hunt, smudge at the ghost's location to blind it for ~6 s and break its line on you.",
    tip: "Smudging a Spirit stops it hunting for 180 s. Keep one as your emergency escape.",
  },
  {
    id: "salt", name: "Salt", cat: "Protection",
    purpose: "Ghosts may step in it, leaving UV footprints; also an objective.",
    tiers: ["A couple of piles.", "More piles.", "Most piles."],
    use: "Place piles in doorways and the ghost room, then check with UV for glowing footsteps.",
    tip: "A Wraith never steps in salt — disturbed salt with no footprints is a strong hint.",
  },
  // ---------- Utility ----------
  {
    id: "medication", name: "Sanity Medication", cat: "Utility",
    purpose: "Restores sanity, lowering the chance of a hunt.",
    tiers: ["Small restore.", "Medium restore.", "Large restore."],
    use: "Take when your sanity drops low, especially before sanity-dependent objectives.",
    tip: "Don't burn it early — save it for when low sanity actually puts you at risk.",
  },
  {
    id: "igniter", name: "Igniter (Lighter)", cat: "Utility",
    purpose: "Lights incense, candles and firelights — needed for several other items.",
    tiers: ["Limited uses.", "More uses.", "Unlimited uses."],
    use: "Equip and use on incense or candles to light them. Required for smudging and summoning circles.",
    tip: "The Tier III igniter never runs out — a quality-of-life upgrade worth buying early.",
  },
  {
    id: "firelight", name: "Firelight (Candle)", cat: "Utility",
    purpose: "A portable light source that keeps working when electronics are unreliable.",
    tiers: ["Dim, short.", "Brighter.", "Brightest / longest."],
    use: "Light it for steady ambient light in a room while you work, without relying on the breaker.",
    tip: "An Onryo can trigger a hunt when a flame is blown out — watch your candles around it.",
  },
  {
    id: "flashlight", name: "Flashlight", cat: "Utility",
    purpose: "Standard light. Flashlights flicker just before a hunt — a free early warning.",
    tiers: ["Basic beam.", "Brighter beam.", "Strong, wide beam."],
    use: "Light your way; watch for flickering, which signals an imminent hunt so you can hide.",
    tip: "If every flashlight in the area flickers, a hunt is starting — get to safety now.",
  },
  {
    id: "tripod", name: "Tripod", cat: "Utility",
    purpose: "Mounts a video camera for a stable, aimed view.",
    tiers: ["Standard.", "Standard.", "Standard."],
    use: "Place it, then put a video camera on top pointing at the room centre or the D.O.T.S projector.",
    tip: "Essential for hands-free orb and D.O.T.S monitoring from the truck.",
  },
  {
    id: "headgear", name: "Head Gear (Head Cam)", cat: "Utility",
    purpose: "A worn camera that streams your night-vision view to the truck.",
    tiers: ["Basic feed.", "Improved feed.", "Best feed."],
    use: "Wear it so a teammate in the truck can see what you see and guide you.",
    tip: "Perfect for a solo investigator relaying their view to someone watching the monitors.",
  },
];

const CATS = ["All", "Evidence", "Tracking", "Protection", "Utility"];
let cat = "All";

const filtersEl = document.getElementById("eq-filters");
const root = document.getElementById("eq-root");

filtersEl.innerHTML = CATS.map((c) =>
  `<button class="btn filter-btn ${c === "All" ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");

function render() {
  const items = EQUIPMENT.filter((e) => cat === "All" || e.cat === cat);
  root.innerHTML = items.map((e) => `
    <div class="eq-card">
      <div class="eq-top">
        <div class="eq-img"><img src="../../assets/img/phasmo/${e.id}.png" alt="${e.name}" loading="lazy"></div>
        <div>
          <span class="eq-name">${e.name}</span>
          <div class="eq-chips">
            <span class="ev-chip">${e.cat}</span>
            ${e.evidence ? `<span class="ev-chip confirmed">${e.evidence}</span>` : ""}
          </div>
        </div>
      </div>
      <p class="eq-purpose">${e.purpose}</p>
      <div class="eq-tiers">
        ${e.tiers.map((t, i) => `<div class="eq-tier"><span class="eq-tier-n">T${i + 1}</span><span>${t}</span></div>`).join("")}
      </div>
      <p class="eq-line"><b>How to use.</b> ${e.use}</p>
      <p class="eq-line"><b style="color:var(--accent-2)">Tip.</b> ${e.tip}</p>
    </div>`).join("");
}

filtersEl.querySelectorAll(".filter-btn").forEach((b) =>
  b.addEventListener("click", () => {
    cat = b.dataset.cat;
    filtersEl.querySelectorAll(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
    render();
  }));

render();
