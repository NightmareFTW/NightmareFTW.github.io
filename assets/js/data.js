/* ============================================================
   GAMING TOOLS HUB — central config
   To add a game: add an entry to GAMES.
   To add a tool: add it to that game's `tools` array.
   `available: false` shows it as "soon" and disables the link.
   `banner` is root-relative key art; pages add their own base path.
   ============================================================ */

const GAMES = [
  {
    id: "phasmophobia",
    name: "Phasmophobia",
    banner: "assets/img/games/phasmophobia-header.jpg",
    color: "#4a9d5b",
    glow: "rgba(74, 157, 91, 0.25)",
    blurb: "Co-op horror ghost hunting.",
    tools: [
      {
        id: "ghost-evidence",
        name: "Ghost Evidence Checker",
        type: "tracker",
        desc: "Select the evidence you've found and instantly narrow down the ghost.",
        href: "games/phasmophobia/ghost-evidence.html",
        available: true,
      },
      {
        id: "cursed-possessions",
        name: "Cursed Possession Reference",
        type: "reference",
        desc: "All 7 cursed possessions — usage, risks and tips for each.",
        href: "games/phasmophobia/cursed-possessions.html",
        available: true,
      },
      {
        id: "equipment",
        name: "Equipment Guide",
        type: "guide",
        desc: "Every item with images, tier upgrades, usage and tips.",
        href: "games/phasmophobia/equipment.html",
        available: true,
      },
    ],
  },
  {
    id: "outlast-trials",
    name: "The Outlast Trials",
    banner: "assets/img/games/outlast-trials-header.jpg",
    color: "#d4842a",
    glow: "rgba(212, 132, 42, 0.22)",
    blurb: "Co-op survival horror.",
    // Daily reset 15:00 UTC (10:00 EST); weekly reset Tuesday 15:00 UTC.
    reset: { daily: { h: 15, m: 0, utc: true }, weekly: { dow: 2, h: 15, m: 0, utc: true } },
    tools: [
      {
        id: "progression",
        name: "Progression Tracker",
        type: "checklist",
        desc: "Track unlocked rigs and your weekly program & challenge runs.",
        href: "games/outlast-trials/progression.html",
        available: true,
      },
      {
        id: "loadout",
        name: "Loadout Builder",
        type: "builder",
        desc: "Build and save your rig + amp loadouts for different play styles.",
        href: "games/outlast-trials/loadout.html",
        available: true,
      },
    ],
  },
  {
    id: "ffxiv",
    name: "Final Fantasy XIV",
    banner: "assets/img/games/ffxiv-header.jpg",
    color: "#3b6fb5",
    glow: "rgba(59, 111, 181, 0.22)",
    blurb: "MMORPG.",
    // Daily reset 15:00 UTC; weekly reset Tuesday 08:00 UTC.
    reset: { daily: { h: 15, m: 0, utc: true }, weekly: { dow: 2, h: 8, m: 0, utc: true } },
    tools: [
      {
        id: "dailies",
        name: "Daily / Weekly Checklist",
        type: "checklist",
        desc: "Roulettes, Wondrous Tails, Custom Deliveries — auto-resets on the FFXIV clock.",
        href: "games/ffxiv/dailies.html",
        available: true,
      },
      {
        id: "nodes",
        name: "Gathering Node Timer",
        type: "timer",
        desc: "Live Eorzea clock showing which unspoiled nodes are up right now.",
        href: "games/ffxiv/nodes.html",
        available: true,
      },
    ],
  },
  {
    id: "epic7",
    name: "Epic Seven",
    banner: "assets/img/games/epic7-promo.jpg",
    color: "#c2497d",
    glow: "rgba(194, 73, 125, 0.22)",
    blurb: "Turn-based gacha RPG.",
    // Global server daily reset 10:00 UTC.
    reset: { daily: { h: 10, m: 0, utc: true } },
    tools: [
      {
        id: "gear-score",
        name: "Gear Score Calculator",
        type: "calculator",
        desc: "Enter a piece's substats and grade its quality instantly.",
        href: "games/epic7/gear-score.html",
        available: true,
      },
      {
        id: "damage",
        name: "Damage / EHP Calculator",
        type: "calculator",
        desc: "Crit-adjusted effective attack and effective HP from defense.",
        href: "games/epic7/damage.html",
        available: true,
      },
      {
        id: "speed-tuning",
        name: "Speed Tuning / Turn Order",
        type: "simulator",
        desc: "Simulate opening turn order from each unit's Speed and starting CR.",
        href: "games/epic7/speed-tuning.html",
        available: true,
      },
    ],
  },
  {
    id: "warframe",
    name: "Warframe",
    banner: "assets/img/games/warframe-header.jpg",
    color: "#2a8fa8",
    glow: "rgba(42, 143, 168, 0.22)",
    blurb: "Sci-fi co-op looter shooter.",
    // Daily reset 00:00 UTC; weekly reset Monday 00:00 UTC.
    reset: { daily: { h: 0, m: 0, utc: true }, weekly: { dow: 1, h: 0, m: 0, utc: true } },
    tools: [
      {
        id: "worldstate",
        name: "Worldstate Tracker",
        type: "live",
        desc: "Live Sortie, Fissures, Arbitration and Baro Ki'Teer — straight from the API.",
        href: "games/warframe/worldstate.html",
        available: true,
      },
      {
        id: "cycles",
        name: "Open-World Cycle Timers",
        type: "live",
        desc: "Live day/night & warm/cold timers for Cetus, Vallis, Cambion, Duviri and Earth.",
        href: "games/warframe/cycles.html",
        available: true,
      },
      {
        id: "drops",
        name: "Drop Table",
        type: "database",
        desc: "Searchable relic & mission drops with multi-select filters and sorting.",
        href: "games/warframe/drops.html",
        available: true,
      },
    ],
  },
  {
    id: "dreamlight-valley",
    name: "Disney Dreamlight Valley",
    banner: "assets/img/games/dreamlight-valley-header.jpg",
    color: "#6a4fb3",
    glow: "rgba(106, 79, 179, 0.24)",
    blurb: "Cozy life-sim adventure.",
    // Daily reset 05:00 local time (villager favourites & daily activities).
    reset: { daily: { h: 5, m: 0, utc: false } },
    tools: [
      {
        id: "star-path",
        name: "Star Path Tracker",
        type: "checklist",
        desc: "Current season's duties with detailed how-to for each, tracked on your device.",
        href: "games/dreamlight-valley/star-path.html",
        available: true,
      },
      {
        id: "recipes",
        name: "Recipe Browser",
        type: "database",
        desc: "Searchable recipes — ingredients, star rating and value.",
        href: "games/dreamlight-valley/recipes.html",
        available: true,
      },
      {
        id: "friendship",
        name: "Friendship Tracker",
        type: "tracker",
        desc: "Track each villager's friendship level, with tips on levelling up fast.",
        href: "games/dreamlight-valley/friendship.html",
        available: true,
      },
      {
        id: "items",
        name: "Items Database",
        type: "database",
        desc: "Every item with where to farm it — searchable and filterable.",
        href: "games/dreamlight-valley/items.html",
        available: true,
      },
    ],
  },
  {
    id: "nte",
    name: "NTE",
    banner: "assets/img/games/nte-header.jpg",
    color: "#7c5cff",
    glow: "rgba(124, 92, 255, 0.22)",
    blurb: "Open-world action RPG.",
    // Daily reset 04:00 local time.
    reset: { daily: { h: 4, m: 0, utc: false } },
    tools: [
      {
        id: "dailies",
        name: "Daily Checklist",
        type: "checklist",
        desc: "A simple daily/weekly routine tracker that resets on its own.",
        href: "games/nte/dailies.html",
        available: true,
      },
      {
        id: "tier-list",
        name: "Tier List & Builds",
        type: "tier list",
        desc: "Character rankings (via Game8) with links to builds and best teams.",
        href: "games/nte/tier-list.html",
        available: true,
      },
    ],
  },
];
