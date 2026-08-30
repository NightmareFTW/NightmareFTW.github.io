# NightmareFTW · Gaming Tools Hub

A growing hub of hand-built tools for the games I play — checklists, calculators,
trackers, tier lists, drop tables, build guides and more. No frameworks, just
vanilla HTML/CSS/JS, hosted on GitHub Pages.

🔗 **Live:** https://nightmareftw.github.io/

![Home page](assets/screenshots/home.png)

---

## What's inside

18 games, each with its own page and three tabs — **Tools**, **News**
(auto-fetched headlines) and **Codes** (redeemable codes, kept fresh
automatically where a game has any).

| Game | Tools |
| --- | --- |
| **Phasmophobia** | Ghost Evidence Checker · Cursed Possession Reference · Equipment Guide |
| **The Outlast Trials** | Enemies & Counters · Trials & Maps Guide · Recommended Builds · Loadout Builder (shareable builds) |
| **Final Fantasy XIV** | Daily/Weekly Checklist (reset-aware) · Gathering Node Timer (live Eorzea clock) |
| **Epic Seven** | Gear Score · Damage / EHP Calculator · Speed Tuning / Turn Order |
| **Warframe** | Worldstate Tracker · Open-World Cycle Timers · Drop Table |
| **Disney Dreamlight Valley** | Star Path Tracker · Recipe Browser · Friendship Tracker · Items Database · Animal Guide |
| **Neverness to Everness** | Daily Checklist · Tier List & Builds · Bond Gift Planner |
| **Honkai: Star Rail** | Daily/Weekly Checklist · Tier List · Meta Builds (team comps) · Character Builds · Warp Calendar · Event Calendar |
| **Cyberpunk 2077** | Meta Builds (in-game-style skill tree & cyberware body diagram) |
| **God of War Ragnarök** | Meta Builds (gear screen with Kratos in each set) · Missables Checklist |
| **Clair Obscur: Expedition 33** | Meta Builds (in-game build screen — Weapon, Pictos, Luminas) · Missables Checklist |
| **Elden Ring** | Meta Builds (real item icons) · Missables Checklist (NPC questlines) |
| **Demonologist** | Demon Evidence Checker · Demon Reference · Equipment Guide |
| **The Other Side** | Ghost Evidence Checker · Ghost Reference (18 ghosts) · Equipment Guide |
| **Ravenswatch** | Hero Reference (full kits) · Build Directions · Talent Database (26 talents/hero) · Magical Objects |
| **Far Far West** | Meta Builds (top-rated community loadouts, with images) · Maps & Collectibles (interactive region maps, every POI plotted) |
| **Marvel Snap** | Card Database · Deck Builder · Deck Importer (paste a code from Snap Zone/Untapped) |
| **Farever** | Class Builds (3 per class) · Weapons Guide · Dungeons Checklist |

<!-- ➕ New games go here. Each is one object in assets/js/data.js (see "Adding a game or tool"). -->

Two recurring themes in the newer guides:

- **The build tools recreate the game's own UI** so a build is impossible to
  misread — Cyberpunk's perk tree + cyberware body diagram, God of War's gear
  screen with Kratos wearing the set, Expedition 33's build screen, and Elden
  Ring's equipment grid with real item icons.
- **Live, sourced data over hand-typed lists** — tier lists, meta team comps,
  per-character builds, card pools and banner/event calendars are scraped from
  reputable community sites and wikis and refreshed automatically, so they
  track the live patch instead of going stale. The one exception is brand-new
  Early Access titles with no reliable public source yet (Farever) — those are
  hand-written and clearly marked as such instead of guessing.

The home page supports live search, sorting and grid / list / compact views, plus
**pinning** favourite games to a section up top and **drag-to-reorder** for your
own default order (saved on your device).

### Accounts & sync

Sign in with **GitHub** or a plain **email + password** account (backed by a
Cloudflare Worker + D1 — see [`worker/`](worker/)) to sync pins, checklists,
tracked progress and Murdoku saves across every device instead of losing them
to a cleared browser. Signing in is entirely optional — everything also works
fully offline via `localStorage` for anyone who'd rather not create an account.

### Play

A small, separate section for original browser games — no install, no account
needed (though signing in syncs your progress). First up: **Murdoku**, a logic
puzzle on a procedurally-built floor plan — part Sudoku, part detective work:
read each suspect's clues, deduce the exact tile everyone stood on, and name
the culprit. Endless procedurally-generated chapters.

![Murdoku](assets/screenshots/murdoku.png)

### Steam free-game alerts

A notification bell in the header (visible on every page) tracks normally-paid
Steam games that go temporarily free to claim — sourced from the community
[Free Games Info!!!](https://steamcommunity.com/groups/freegamesinfoo) group,
cross-checked against Steam's own store API so only real, currently-live
promos show up. Opt in to native OS notifications for new ones; refreshed
hourly by [`update-steam-free-games.yml`](.github/workflows/update-steam-free-games.yml).

![Steam free-game alerts](assets/screenshots/steam-alerts.png)

### A few in action

**Honkai: Star Rail — Meta Builds & Warp Calendar** — the meta team comps
grouped by element, and a banner calendar with live/upcoming status and recent
history — both scraped from Game8 and auto-updated.

![Honkai Star Rail meta builds](assets/screenshots/hsr-meta-builds.png)
![Honkai Star Rail warp calendar](assets/screenshots/hsr-warp-calendar.png)

**Far Far West — Meta Builds & Maps** — top-rated community loadouts by weapon
(click any for the full kit: weapon stats, joker-rarity layout, spells, hero and
mount, all imported from wikily.gg), and interactive region maps with every
collectible, secret and objective plotted and toggleable by category.

![Far Far West builds](assets/screenshots/ffw-builds.png)
![Far Far West map](assets/screenshots/ffw-maps.png)

**Cyberpunk 2077 / God of War / Expedition 33 / Elden Ring — Meta Builds** — each
recreates that game's build/gear UI: a circuit-style perk tree and 10-slot
cyberware body diagram, a gear screen with Kratos wearing the set, the in-game
Weapon/Pictos/Luminas screen, and a buildtierlist-style equipment grid with real
item icons.

**Farever — Class Builds** — freshly added for this Early Access co-op action
RPG: 3 weapon-based build ideas per class (Warrior, Rogue, Mage, Priest), with
hand-drawn weapon icons since there's no stable public icon source yet for a
game this new.

![Farever class builds](assets/screenshots/farever-builds.png)

**Neverness to Everness — Tier List & Builds** (rankings & builds from Game8;
each character's player-tested team comps embedded from Prydwen)

![Neverness to Everness tier list](assets/screenshots/nte-tierlist.png)

**Warframe — Drop Table** (14k+ drops, multi-select filters by source, rarity, relic tier and planet)

![Warframe drop table](assets/screenshots/warframe-drops.png)

**Phasmophobia — Equipment Guide** (every item with images, tier upgrades, usage and tips)

![Phasmophobia equipment guide](assets/screenshots/phasmo-equipment.png)

---

## Tech

- **Vanilla** HTML / CSS / JS — no build step, no dependencies, no framework.
- **GitHub Pages** static hosting, with a **Cloudflare Worker + D1** backend
  ([`worker/`](worker/)) for accounts and cross-device sync only — the site
  itself needs no backend to work.
- **Cloudflare Web Analytics** — privacy-friendly, cookieless page-view
  tracking (no client-side storage, no cross-site tracking).
- A strict **Content-Security-Policy** on every page, generated from an
  explicit allowlist ([`scripts/add-csp.js`](scripts/add-csp.js)) rather than
  hand-copied, so it can't silently drift from what the site actually loads.
- A single data file ([`assets/js/data.js`](assets/js/data.js)) drives the game grid
  and each game's tool list, so adding content is a one-file change.
- Live data is pulled client-side where an API allows it (Warframe worldstate &
  cycles via [warframestat.us](https://api.warframestat.us); news via Google News RSS),
  and from pre-scraped JSON in `data/<game>/` for everything else.

## Auto-updating data

Some data refreshes itself via scheduled GitHub Actions so the site stays current
without manual edits:

- **News** — [`update-news.yml`](.github/workflows/update-news.yml) runs every 6 hours and
  refreshes `data/news/*.json` from official **Steam dev posts** (full body + image) and
  **Google News** headlines (resolved to the publisher), merged newest-first. Fetched
  server-side, so the site loads it instantly with no CORS proxy.
- **Steam free-game alerts** — [`update-steam-free-games.yml`](.github/workflows/update-steam-free-games.yml)
  runs hourly (see "Steam free-game alerts" above).
- **Honkai: Star Rail** — five scrapers keep HSR current to the live patch: the
  [tier list](.github/workflows/update-hsr-tierlist.yml), [meta team comps](.github/workflows/update-hsr-teams.yml),
  [per-character builds](.github/workflows/update-hsr-builds.yml) and [warp calendar](.github/workflows/update-hsr-banners.yml)
  (weekly, from Game8), plus the [event calendar](.github/workflows/update-hsr-events.yml) (daily, since events rotate fast).
- **Neverness to Everness** — [`update-nte-teams.yml`](.github/workflows/update-nte-teams.yml)
  pulls each character's player-tested team comps from Prydwen weekly.
- **Far Far West** — [`update-ffw-builds.yml`](.github/workflows/update-ffw-builds.yml) (daily) refreshes the
  top-rated community loadouts, and [`update-ffw-maps.yml`](.github/workflows/update-ffw-maps.yml) (weekly)
  rebuilds every region's collectible/secret map data — both from wikily.gg.
- **Marvel Snap** — [`update-marvel-snap.yml`](.github/workflows/update-marvel-snap.yml) runs daily and
  rebuilds the full card database from marvelsnapzone.com's public API.
- **Ravenswatch** — [`update-ravenswatch.yml`](.github/workflows/update-ravenswatch.yml) (weekly) rebuilds
  hero kits, talents and magical objects from the Fandom wiki's API.
- **The Other Side** — [`update-the-other-side.yml`](.github/workflows/update-the-other-side.yml) (weekly)
  rebuilds evidence, ghosts and tools from the Fandom wiki.
- **Demonologist** — [`update-demonologist.yml`](.github/workflows/update-demonologist.yml) (weekly)
  rebuilds demons, evidence and tools from the Fandom wiki.
- **Dreamlight Valley data** — [`update-ddv.yml`](.github/workflows/update-ddv.yml) rebuilds the
  recipes, items, furniture, clothing, animals and Star Path data from the Fandom wiki, with
  official in-game PT-BR names from the game's localization files.
- **Warframe drop table** — [`update-drops.yml`](.github/workflows/update-drops.yml) runs
  weekly and rebuilds `data/warframe/drops.json` from Digital Extremes' official drop
  tables (parsed by [WFCD](https://drops.warframestat.us)).
- **Farever** is the one exception: it's an Early Access title (May 2026) with no
  reliable public wiki/API yet — early research turned up several SEO content-mill
  sites with contradictory, likely-fabricated class names and skill lists, so its
  builds/weapons/dungeons data is hand-written instead of scraped, and kept
  intentionally high-level until better sources exist.
- **Game codes** are curated in `data/codes/*.json` — auto-scraping them proved too noisy
  to be reliable (no official codes API), so they're kept hand-checked instead.
- A shared [`stamp-assets.yml`](.github/workflows/stamp-assets.yml) workflow keeps
  every page's CSS/JS cache-buster and CSP tag in sync on every push, so a
  deploy is never served stale and a new page always gets the same security
  headers automatically.

## Project structure

```
.
├── index.html                # home (game grid + search/sort/views)
├── favicon.svg
├── assets/
│   ├── css/style.css         # all styling (black/red theme)
│   ├── js/
│   │   ├── data.js           # ⭐ central config: games + tools
│   │   ├── home.js           # home grid: search/sort/views + pin & drag-reorder
│   │   ├── game.js           # game page: tabs (Tools/News/Codes) + reset timers
│   │   ├── auth.js           # sign-in (GitHub or email/password) + cross-device sync
│   │   ├── steam-alerts.js   # header notification bell (free Steam game promos)
│   │   ├── i18n.js           # optional PT translation layer
│   │   └── checklist.js      # reusable reset-aware checklist engine
│   └── img/games/            # game banners (Steam key art) + generated art
├── games/<game>/             # per-game page + its tool pages (+ build/data files)
├── play/                     # original browser games (Murdoku)
├── worker/                   # Cloudflare Worker + D1: accounts & cross-device sync
├── data/
│   ├── codes/<game>.json     # redeem codes (curated)
│   ├── news/<game>.json      # headlines (auto-updated)
│   ├── steam-free-games.json # active Steam free-to-claim promos (auto-updated)
│   └── <game>/...            # per-game tool data (builds, tier lists, calendars, drops…)
└── scripts/                  # Node updaters run by the Actions
```

## Adding a game or tool

Everything is config-driven. To add a **game**, append an object to the `GAMES`
array in [`assets/js/data.js`](assets/js/data.js) with a `banner`, `color`, `blurb`
and a `tools` array. To add a **tool**, append it to that game's `tools`:

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
themselves. Data-driven tools follow a pattern: a `scripts/update-*.js` scraper
writes `data/<game>/*.json`, a `.github/workflows/update-*.yml` runs it on a
schedule, and the tool's JS fetches the JSON with a cache-buster. Run
`node scripts/add-csp.js` and `node scripts/stamp-assets.js` afterwards (or let
the `stamp-assets` Action do it on push) so the new page gets its CSP tag and
cache-busters.

## Screenshots

Stored in `assets/screenshots/`. To refresh or add one, capture the tool and save
it under the matching name. Current set:

- [x] `home.png` — home grid
- [x] `murdoku.png` — Murdoku, the browser puzzle game
- [x] `steam-alerts.png` — Steam free-game notification panel
- [x] `nte-tierlist.png` — Neverness to Everness tier list
- [x] `warframe-drops.png` — Warframe drop table
- [x] `phasmo-equipment.png` — Phasmophobia equipment guide
- [x] `hsr-meta-builds.png` — Honkai: Star Rail meta builds
- [x] `hsr-warp-calendar.png` — Honkai: Star Rail warp calendar
- [x] `ffw-builds.png` — Far Far West builds (open a build's full detail)
- [x] `ffw-maps.png` — Far Far West interactive map with markers
- [x] `farever-builds.png` — Farever class builds, expanded

## Credits

Game data and images belong to their respective owners and are used for reference
on this non-commercial personal fan site: Digital Extremes (Warframe, via WFCD),
Smilegate (Epic Seven), Square Enix (FFXIV), Kinetic Games (Phasmophobia),
Red Barrels (The Outlast Trials), Hotta Studio / Perfect World (Neverness to
Everness), HoYoverse (Honkai: Star Rail), Gameloft (Disney Dreamlight Valley),
CD Projekt Red (Cyberpunk 2077), Sony Interactive Entertainment / Santa Monica
Studio (God of War Ragnarök), Sandfall Interactive / Kepler Interactive (Clair
Obscur: Expedition 33), FromSoftware / Bandai Namco (Elden Ring), Clock Wizard
Games (Demonologist), Vectora Games (The Other Side), Passtech Games / Nacon
(Ravenswatch), the Far Far West team, Second Dinner / Marvel / Skystone Games
(Marvel Snap), and Shiro Games (Farever).

Image sources, all property of their publishers: game banners are official Steam
store key art (Epic Seven's is from the Stove channel); Elden Ring item icons come
from the community [Elden Ring API](https://eldenring.fanapis.com); Expedition 33
character portraits & Picto icons, Cyberpunk 2077 cyberware & weapon icons, and
God of War armour renders come from their respective Fandom wikis; Marvel Snap
card art is hotlinked from marvelsnapzone.com; Farever's weapon icons are
hand-drawn (no reliable public art source for a title this new).

Build, tier and meta data is sourced from community guides rather than invented:
Honkai: Star Rail tier list, team comps, builds and banner/event calendars from
[Game8](https://game8.co/games/Honkai-Star-Rail); Neverness to Everness tier &
builds from [Game8](https://game8.co/games/Neverness-to-Everness) with player-tested
team comps from [Prydwen](https://www.prydwen.gg/neverness-to-everness/); God of War
Ragnarök and Expedition 33 missables/favors cross-checked against
[PowerPyx](https://www.powerpyx.com/) and Game8; Ravenswatch, The Other Side and
Demonologist data from their respective Fandom wikis; Far Far West builds and
maps from [wikily.gg](https://farfarwest.wikily.gg); Farever's builds and weapon
data are hand-written by NightmareFTW rather than scraped (see "Auto-updating
data" above for why).

---

Built by **NightmareFTW**.
