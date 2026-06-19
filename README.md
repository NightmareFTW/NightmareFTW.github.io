# NightmareFTW · Gaming Tools Hub

A growing hub of hand-built tools for the games I play — checklists, calculators,
trackers, tier lists, drop tables and more. No frameworks, just vanilla
HTML/CSS/JS, hosted on GitHub Pages.

🔗 **Live:** https://nightmareftw.github.io/

![Home page](assets/screenshots/home.png)

---

## What's inside

Each game has its own page with three tabs — **Tools**, **News** (auto-fetched
headlines) and **Codes** (redeemable codes, kept fresh automatically).

| Game | Tools |
| --- | --- |
| **Phasmophobia** | Ghost Evidence Checker · Cursed Possession Reference · Equipment Guide |
| **The Outlast Trials** | Progression Tracker · Loadout Builder (shareable builds) |
| **Final Fantasy XIV** | Daily/Weekly Checklist (reset-aware) · Gathering Node Timer (live Eorzea clock) |
| **Epic Seven** | Gear Score · Damage / EHP Calculator · Speed Tuning / Turn Order |
| **Warframe** | Worldstate Tracker · Cycle Timers · Drop Table |
| **Neverness to Everness** | Daily Checklist · Tier List & Builds · Bond Gift Planner |

The home page supports live search, sorting and grid / list / compact views.

### A few in action

**Neverness to Everness — Tier List & Builds** (rankings & builds compiled from Game8, shown on-site)

![Neverness to Everness tier list](assets/screenshots/nte-tierlist.png)

**Warframe — Drop Table** (14k+ drops, multi-select filters by source, rarity, relic tier and planet)

![Warframe drop table](assets/screenshots/warframe-drops.png)

**Phasmophobia — Equipment Guide** (every item with images, tier upgrades, usage and tips)

![Phasmophobia equipment guide](assets/screenshots/phasmo-equipment.png)

---

## Tech

- **Vanilla** HTML / CSS / JS — no build step, no dependencies, no framework.
- **GitHub Pages** static hosting.
- A single data file ([`assets/js/data.js`](assets/js/data.js)) drives the game grid
  and each game's tool list, so adding content is a one-file change.
- Live data is pulled client-side where an API allows it (Warframe worldstate &
  cycles via [warframestat.us](https://api.warframestat.us); news via Google News RSS).

## Auto-updating data

Some data refreshes itself via scheduled GitHub Actions so the site stays current
without manual edits:

- **News** — [`update-news.yml`](.github/workflows/update-news.yml) runs every 6 hours and
  refreshes `data/news/*.json` from Google News (fetched server-side, so the site loads
  it instantly with no CORS proxy).
- **Warframe drop table** — [`update-drops.yml`](.github/workflows/update-drops.yml) runs
  weekly and rebuilds `data/warframe/drops.json` from Digital Extremes' official drop
  tables (parsed by [WFCD](https://drops.warframestat.us)).
- **Game codes** are curated in `data/codes/*.json` — auto-scraping them proved too noisy
  to be reliable (no official codes API), so they're kept hand-checked instead.

## Project structure

```
.
├── index.html                # home (game grid + search/sort/views)
├── favicon.svg
├── assets/
│   ├── css/style.css         # all styling (black/red theme)
│   ├── js/
│   │   ├── data.js           # ⭐ central config: games + tools
│   │   ├── home.js           # home grid + search/sort/views
│   │   ├── game.js           # game page: tabs (Tools/News/Codes)
│   │   └── checklist.js       # reusable reset-aware checklist engine
│   └── img/                  # game banners, character portraits, Phasmo equipment
├── games/<game>/             # per-game page + its tool pages
├── data/
│   ├── codes/<game>.json     # redeem codes (curated)
│   ├── news/<game>.json      # headlines (auto-updated)
│   └── warframe/drops.json   # drop table (auto-updated)
└── scripts/                  # Node updaters run by the Actions
```

## Adding a game or tool

Everything is config-driven. To add a tool, append it to the relevant game's
`tools` array in [`assets/js/data.js`](assets/js/data.js):

```js
{
  id: "my-tool",
  name: "My Tool",
  type: "calculator",
  desc: "What it does.",
  href: "games/<game>/my-tool.html",
  available: true,           // false → shows as "soon"
}
```

Then create `games/<game>/my-tool.html`. The home grid and game page update
themselves.

## Credits

Game data and images belong to their respective owners and are used for reference:
Digital Extremes (Warframe, via WFCD), Smilegate (Epic Seven), Square Enix (FFXIV),
Kinetic Games (Phasmophobia), Red Barrels (The Outlast Trials), Hotta Studio /
Perfect World (Neverness to Everness). Tier lists & builds for Neverness to
Everness are compiled from [Game8](https://game8.co/games/Neverness-to-Everness).

---

Built by **NightmareFTW**.
