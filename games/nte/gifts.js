/* NTE — Bond Gift Planner
   The 5 most affinity-efficient gifts for each character: what to give, how
   much Bond/Affinity it grants, where to buy it and the cost in Fons (the
   in-game currency — no real money). Data compiled from GameWith & ZeroLuck.gg.

   Each gift gets a category icon derived from its vendor (per-item art isn't
   reliably available from a single source yet). Gifts capped at 3 per character
   per day (max 10 across all characters), so spend the +400/+200 slots first. */

// Universal gifts that work on the whole launch cast — handy when you run out
// of a character's favourites for the day.
const UNIVERSAL = [
  { item: "A Handwritten Letter", aff: 2000, cost: null, where: "Warp Exchange Circle Bounty reward" },
  { item: "Fluffy Cotton Wool", aff: 400, cost: null, where: "Free — event / exploration reward" },
];

// character -> top gifts [{ item, aff, cost (Fons, null = not buyable), where }]
const GIFTS = {
  Lacrimosa: [
    { item: "Tomato Family Bucket", aff: 1200, cost: null, where: "Story / event reward" },
    { item: "Bunny Box", aff: 400, cost: 20000, where: "Brown Electronics Store" },
    { item: "Chill Out", aff: 200, cost: 4000, where: "Moby-Dick Bookstore" },
    { item: "Holy Worship Month", aff: 200, cost: 6600, where: "Hillside Blooms Florist" },
    { item: "Tomato 100", aff: 100, cost: 300, where: "Tomato 100 Vending Machine" },
  ],
  Hotori: [
    { item: "Golden Moon", aff: 400, cost: 15000, where: "Brown Electronics Store" },
    { item: "Golden Spring", aff: 200, cost: 7500, where: "Hillside Blooms Florist" },
    { item: "Yellow Glaze Vase", aff: 200, cost: 3600, where: "Hillside Blooms Florist" },
    { item: "Chiyo Family Brew", aff: 100, cost: 300, where: "Budoriya Izakaya" },
    { item: "Ebisu Royal Tower", aff: 100, cost: null, where: "Story acquisition" },
  ],
  Nanally: [
    { item: "Kokoro Rider L1 - Eradicator", aff: 400, cost: 14400, where: "DSD POP" },
    { item: "Kokoro Rider L1 - Metal Strategist", aff: 400, cost: 14400, where: "DSD POP" },
    { item: "Kokoro Rider L1 - Ultimate Skill", aff: 400, cost: null, where: "Gacha Machine" },
    { item: "Blazing Crimson", aff: 200, cost: 5400, where: "Hillside Blooms Florist" },
    { item: "Cool-lala Spicy Snack", aff: 100, cost: 300, where: "2-Four Convenience Store" },
  ],
  Sakiri: [
    { item: "Bunny Box", aff: 400, cost: 20000, where: "Brown Electronics Store" },
    { item: "Blue Fable", aff: 200, cost: 6600, where: "Hillside Blooms Florist" },
    { item: "Fever Dream", aff: 200, cost: 5000, where: "Oops! Chest Gift Shop" },
    { item: "Crave Bites! Milk Flavor", aff: 100, cost: 360, where: "Convenience stores" },
    { item: "Cool-lala Spicy Snack", aff: 100, cost: 300, where: "2-Four Convenience Store" },
  ],
  "Esper Zero": [
    { item: "A Handwritten Letter", aff: 2000, cost: null, where: "Warp Exchange Circle Bounty reward" },
    { item: "Promise", aff: 400, cost: 10000, where: "Oops! Chest Gift Shop" },
    { item: "Fluffy Cotton Wool", aff: 400, cost: null, where: "Free — event / exploration reward" },
    { item: "Fantasia", aff: 200, cost: 3000, where: "Hillside Blooms Florist" },
    { item: "Chill Out", aff: 200, cost: 4000, where: "Moby-Dick Bookstore" },
  ],
  Chiz: [
    { item: "Bunny Box", aff: 400, cost: 20000, where: "Brown Electronics Store" },
    { item: "Fantasia", aff: 200, cost: 3000, where: "Hillside Blooms Florist" },
    { item: "Holy Worship Month", aff: 200, cost: 6600, where: "Hillside Blooms Florist" },
    { item: "Nyanko Punch Taro Pudding Milktea", aff: 100, cost: 450, where: "Crazy Cat Milk Tea Shop" },
    { item: "Puka Sweet Dreams Marshmallow", aff: 100, cost: 660, where: "Puka Candy Shop" },
  ],
  Daffodil: [
    { item: "Promise", aff: 400, cost: 10000, where: "Oops! Chest Gift Shop" },
    { item: "Eternal Purity", aff: 200, cost: 5400, where: "Hillside Blooms Florist" },
    { item: "Lost Eyes", aff: 200, cost: 7500, where: "Oops! Chest Gift Shop" },
    { item: "Nyanko Cozy Uji Matcha", aff: 100, cost: 450, where: "Crazy Cat Milk Tea Shop" },
    { item: "Cooly Cool Refresher", aff: 100, cost: 600, where: "Bamboo Pharmacy" },
  ],
  Baicang: [
    { item: "Gigafluff - Musclology", aff: 400, cost: 12000, where: "DSD POP" },
    { item: "Gigafluff - Reign of Darkness", aff: 400, cost: null, where: "Gacha Machine" },
    { item: "Gigafluff - The Strong", aff: 400, cost: 12000, where: "DSD POP" },
    { item: "9331", aff: 200, cost: 7500, where: "Oops! Chest Gift Shop" },
    { item: "Kids Energy Meal", aff: 100, cost: 450, where: "Food First Family Restaurant" },
  ],
  Jiuyuan: [
    { item: "On Track", aff: 400, cost: 20000, where: "Brown Electronics Store" },
    { item: "Moon Vase", aff: 200, cost: 3000, where: "Hillside Blooms Florist" },
    { item: "Nightingale's Sonata", aff: 200, cost: 6000, where: "Hillside Blooms Florist" },
    { item: "Magi-Puff Whole Wheat Bread", aff: 100, cost: 360, where: "2-Four Convenience Store" },
    { item: "Ebisu Royal Tower", aff: 100, cost: null, where: "Story acquisition" },
  ],
  Hathor: [
    { item: "On Track", aff: 400, cost: 20000, where: "Brown Electronics Store" },
    { item: "Fever Dream", aff: 200, cost: 5000, where: "Oops! Chest Gift Shop" },
    { item: "Nightingale's Sonata", aff: 200, cost: 6000, where: "Hillside Blooms Florist" },
    { item: "Colorful Light Salad", aff: 100, cost: 450, where: "Food First Family Restaurant" },
    { item: "Cooly Cool Refresher", aff: 100, cost: 600, where: "Bamboo Pharmacy" },
  ],
  Haniel: [
    { item: "Asahi Inori - Crimson", aff: 400, cost: 18000, where: "DSD POP" },
    { item: "Asahi Inori - Moonlight", aff: 400, cost: 18000, where: "DSD POP" },
    { item: "Asahi Inori - Moonsilver", aff: 400, cost: null, where: "Gacha Machine" },
    { item: "Fantasia", aff: 200, cost: 3000, where: "Hillside Blooms Florist" },
    { item: "Cool-lala Spicy Snack", aff: 100, cost: 300, where: "2-Four Convenience Store" },
  ],
  Fadia: [
    { item: "Glimmering Ice", aff: 400, cost: 5400, where: "Hillside Blooms Florist" },
    { item: "Balance", aff: 200, cost: 7500, where: "Oops! Chest Gift Shop" },
    { item: "Golden Spring", aff: 200, cost: 7500, where: "Hillside Blooms Florist" },
    { item: "Classic Trio", aff: 100, cost: 660, where: "Marigny Pizza Restaurant" },
    { item: "Deep in the Heart", aff: 100, cost: 1800, where: "A.R.P.T.S Bar" },
  ],
  Mint: [
    { item: "Asahi Inori - Crimson", aff: 400, cost: 18000, where: "DSD POP" },
    { item: "Asahi Inori - Moonlight", aff: 400, cost: 18000, where: "DSD POP" },
    { item: "Asahi Inori - Moonsilver", aff: 400, cost: null, where: "Gacha Machine" },
    { item: "Waltz", aff: 200, cost: 3000, where: "Hillside Blooms Florist" },
    { item: "Gubicrisp", aff: 100, cost: 300, where: "2-Four Convenience Store" },
  ],
  Adler: [
    { item: "Promise", aff: 400, cost: 10000, where: "Oops! Chest Gift Shop" },
    { item: "Golden Dawn", aff: 200, cost: 3600, where: "Hillside Blooms Florist" },
    { item: "Holy Worship Month", aff: 200, cost: 6600, where: "Hillside Blooms Florist" },
    { item: "Great Defender!", aff: 100, cost: 1800, where: "Bamboo Pharmacy" },
    { item: "Purification Guard Lozenges", aff: 100, cost: 420, where: "Bamboo Pharmacy" },
  ],
  Edgar: [
    { item: "Bear-o-metry", aff: 400, cost: 10000, where: "Oops! Chest Gift Shop" },
    { item: "Unrecorded Sound", aff: 400, cost: 15000, where: "Exile on Main St. Record Shop" },
    { item: "Blue Fable", aff: 200, cost: 6600, where: "Hillside Blooms Florist" },
    { item: "Boss's Approval", aff: 200, cost: 4000, where: "Moby-Dick Bookstore" },
    { item: "Bigmouth Custard Baozi", aff: 100, cost: 300, where: "Bigmouth Baozi" },
  ],
  Skia: [
    { item: "Chill Out", aff: 200, cost: 4000, where: "Moby-Dick Bookstore" },
    { item: "Bob's Tea Garden", aff: 100, cost: 300, where: "Convenience stores" },
    { item: "A Handwritten Letter", aff: 2000, cost: null, where: "Warp Exchange Circle Bounty reward" },
    { item: "Promise", aff: 400, cost: 10000, where: "Oops! Chest Gift Shop" },
    { item: "Fluffy Cotton Wool", aff: 400, cost: null, where: "Free — event / exploration reward" },
  ],
  Aurelia: [
    { item: "Ambient Night Light", aff: 400, cost: 18000, where: "Brown Electronics Store" },
    { item: "Promise", aff: 400, cost: 10000, where: "Oops! Chest Gift Shop" },
    { item: "Blue Fable", aff: 200, cost: 6600, where: "Hillside Blooms Florist" },
    { item: "Fantasia", aff: 200, cost: 3000, where: "Hillside Blooms Florist" },
    { item: "Bigmouth Custard Baozi", aff: 100, cost: 300, where: "Bigmouth Baozi" },
  ],
};

// Vendor / source -> category icon + label (for the gift thumbnail).
function giftKind(where) {
  const w = where.toLowerCase();
  if (/florist|blooms/.test(w)) return { icon: "🌷", label: "Flower" };
  if (/electronics/.test(w)) return { icon: "💡", label: "Electronics" };
  if (/dsd pop|gacha/.test(w)) return { icon: "🧸", label: "Figure" };
  if (/bookstore/.test(w)) return { icon: "📖", label: "Book" };
  if (/record/.test(w)) return { icon: "🎵", label: "Record" };
  if (/gift shop|chest/.test(w)) return { icon: "🎁", label: "Gift Shop" };
  if (/vending/.test(w)) return { icon: "🥤", label: "Vending" };
  if (/letter|free|story|event|reward/.test(w)) return { icon: "⭐", label: "Special" };
  return { icon: "🍱", label: "Food & Drink" }; // restaurants, pharmacy, convenience, bar, izakaya
}

const ORDER = ["Lacrimosa", "Hotori", "Nanally", "Sakiri", "Esper Zero", "Chiz", "Daffodil",
  "Baicang", "Jiuyuan", "Hathor", "Haniel", "Fadia", "Mint", "Adler", "Edgar", "Skia", "Aurelia"];

const portrait = (name) => `../../assets/img/nte/${name.toLowerCase().replace(/ /g, "-")}.png`;
const fons = (n) => n == null ? "—" : n.toLocaleString();

const root = document.getElementById("gift-root");
const detail = document.getElementById("gift-detail");

function giftRow(g) {
  const k = giftKind(g.where);
  const tier = g.aff >= 400 ? "aff-hi" : g.aff >= 200 ? "aff-mid" : "aff-lo";
  return `
    <div class="gift-row">
      <span class="gift-icon" title="${k.label}">${k.icon}</span>
      <div class="gift-main">
        <span class="gift-name">${g.item}</span>
        <span class="gift-where">${g.where}</span>
      </div>
      <div class="gift-stats">
        <span class="gift-aff ${tier}">+${g.aff}</span>
        <span class="gift-cost">${g.cost == null ? "not buyable" : "💰 " + fons(g.cost)}</span>
      </div>
    </div>`;
}

function showGifts(name) {
  const list = GIFTS[name] || [];
  detail.style.display = "block";
  detail.innerHTML = `
    <div class="bd-head">
      <div class="bd-title">
        <span class="bd-portrait"><img src="${portrait(name)}" alt="${name}"></span>
        <div><span class="bd-name">${name}</span>
          <div class="gift-sub">Top ${list.length} bond gifts · best value first</div>
        </div>
      </div>
      <button class="mini-btn" id="gd-close">close ×</button>
    </div>
    <div class="gift-list">${list.map(giftRow).join("")}</div>
    <p class="bd-credit">Affinity values &amp; prices via GameWith &amp; ZeroLuck.gg · costs in Fons (in-game currency). Max 3 gifts per character/day.</p>`;
  detail.querySelector("#gd-close").addEventListener("click", () => { detail.style.display = "none"; });
  detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function render() {
  root.innerHTML = ORDER.filter((n) => GIFTS[n]).map((name) => {
    const best = GIFTS[name][0];
    return `<button class="char-card" data-char="${name}">
      <span class="char-portrait"><img src="${portrait(name)}" alt="${name}" loading="lazy"></span>
      <span class="char-name">${name}</span>
      <span class="gift-best">${giftKind(best.where).icon} ${best.item}</span>
      <span class="gift-best-aff">+${best.aff}</span>
    </button>`;
  }).join("");
  root.querySelectorAll("[data-char]").forEach((b) =>
    b.addEventListener("click", () => showGifts(b.dataset.char)));
}

// Render the universal-gifts banner.
const uni = document.getElementById("gift-universal");
if (uni) uni.innerHTML = UNIVERSAL.map((g) =>
  `<span class="uni-chip">${giftKind(g.where).icon} <b>${g.item}</b> +${g.aff} · ${g.where}</span>`).join("");

render();
