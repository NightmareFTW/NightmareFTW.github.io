/* ============================================================
   GAMING TOOLS HUB — central config
   To add a game: add an entry to GAMES.
   To add a tool: add it to that game's `tools` array.
   `available: false` shows it as "soon" and disables the link.
   `image` is root-relative; pages add their own base path.
   ============================================================ */

const GAMES = [
  {
    id: "phasmophobia",
    name: "Phasmophobia",
    image: "assets/img/games/phasmophobia.svg",
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
    ],
  },
  {
    id: "outlast-trials",
    name: "The Outlast Trials",
    image: "assets/img/games/outlast-trials.svg",
    color: "#d4842a",
    glow: "rgba(212, 132, 42, 0.22)",
    blurb: "Co-op survival horror.",
    tools: [
      {
        id: "progression",
        name: "Progression Tracker",
        type: "checklist",
        desc: "Track unlocked rigs and your weekly program & challenge runs.",
        href: "games/outlast-trials/progression.html",
        available: true,
      },
    ],
  },
  {
    id: "ffxiv",
    name: "Final Fantasy XIV",
    image: "assets/img/games/ffxiv.svg",
    color: "#3b6fb5",
    glow: "rgba(59, 111, 181, 0.22)",
    blurb: "MMORPG.",
    tools: [
      {
        id: "dailies",
        name: "Daily / Weekly Checklist",
        type: "checklist",
        desc: "Roulettes, Wondrous Tails, Custom Deliveries — auto-resets on the FFXIV clock.",
        href: "games/ffxiv/dailies.html",
        available: true,
      },
    ],
  },
  {
    id: "epic7",
    name: "Epic Seven",
    image: "assets/img/games/epic7.svg",
    color: "#c2497d",
    glow: "rgba(194, 73, 125, 0.22)",
    blurb: "Turn-based gacha RPG.",
    tools: [
      {
        id: "gear-score",
        name: "Gear Score Calculator",
        type: "calculator",
        desc: "Enter a piece's substats and grade its quality instantly.",
        href: "games/epic7/gear-score.html",
        available: true,
      },
    ],
  },
  {
    id: "nte",
    name: "NTE",
    image: "assets/img/games/nte.svg",
    color: "#7c5cff",
    glow: "rgba(124, 92, 255, 0.22)",
    blurb: "Open-world action RPG.",
    tools: [
      {
        id: "dailies",
        name: "Daily Checklist",
        type: "checklist",
        desc: "A simple daily/weekly routine tracker that resets on its own.",
        href: "games/nte/dailies.html",
        available: true,
      },
    ],
  },
];
