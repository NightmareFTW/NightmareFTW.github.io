/* ============================================================
   GAMING TOOLS HUB — central config
   To add a game: add an entry to GAMES.
   To add a tool: add it to that game's `tools` array.
   `available: false` shows it as "soon" and disables the link.
   ============================================================ */

const GAMES = [
  {
    id: "phasmophobia",
    name: "Phasmophobia",
    icon: "P",
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
    icon: "O",
    color: "#d4842a",
    glow: "rgba(212, 132, 42, 0.22)",
    blurb: "Co-op survival horror.",
    tools: [
      {
        id: "unlocks",
        name: "Unlock Tracker",
        type: "checklist",
        desc: "Track rigs, perks and amps you've unlocked.",
        href: "#",
        available: false,
      },
    ],
  },
  {
    id: "ffxiv",
    name: "Final Fantasy XIV",
    icon: "XIV",
    color: "#3b6fb5",
    glow: "rgba(59, 111, 181, 0.22)",
    blurb: "MMORPG.",
    tools: [
      {
        id: "dailies",
        name: "Daily / Weekly Checklist",
        type: "checklist",
        desc: "Roulettes, tribal quests, weekly raids — reset-aware.",
        href: "#",
        available: false,
      },
    ],
  },
  {
    id: "epic7",
    name: "Epic Seven",
    icon: "E7",
    color: "#c2497d",
    glow: "rgba(194, 73, 125, 0.22)",
    blurb: "Turn-based gacha RPG.",
    tools: [
      {
        id: "gear-score",
        name: "Gear Score Calculator",
        type: "calculator",
        desc: "Evaluate gear efficiency and reforge value.",
        href: "#",
        available: false,
      },
    ],
  },
  {
    id: "nte",
    name: "NTE",
    icon: "NTE",
    color: "#7c5cff",
    glow: "rgba(124, 92, 255, 0.22)",
    blurb: "Open-world action RPG.",
    tools: [],
  },
];
