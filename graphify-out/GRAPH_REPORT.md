# Graph Report - .  (2026-07-08)

## Corpus Check
- Large corpus: 310 files · ~1,116,567 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1033 nodes · 1485 edges · 180 communities (67 shown, 113 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dreamlight Valley Data Catalogue
- Marvel Snap Card Database
- Data Auto-Update Workflows & Sources
- Dreamlight Valley Animals/Critters
- FFXIV & God of War Guide Pages
- Outlast Trials & NTE Guide Pages
- GitHub Login & Gist Sync
- DDV Translation & Recipes
- Dreamlight Valley Items Browser
- Marvel Snap Deck Builder
- NTE Gifts Tool
- News Aggregator (Google News)
- Outlast Data Updater
- Cyberpunk 2077 Builds
- Outlast Loadout Builder
- God of War Ragnarok Builds
- Redeem Codes Scraper
- DDV Friendship Tracker
- HSR Character Builds
- Demonologist Data Updater
- NTE Teams Updater
- missables.js module
- missables.js module
- Far Far West Builds
- missables.js module
- Far Far West Builds Updater
- Epic7 Builds & Damage
- Elden Ring / Expedition 33 Guides
- HSR Tier List
- Far Far West Maps Updater
- HSR Builds Updater
- HSR Teams Updater
- Demonologist Evidence
- Murdoku Game
- Marvel Snap Updater
- DDV Star Path
- Epic7 Gear Score
- HSR Meta Builds
- Outlast Trials & Maps
- engine.js module
- update-hsr-banners.js module
- DDV Animal Guide
- maps.js module
- nodes.js module
- builds.js module
- ghost-evidence.js module
- drops.js module
- home.js module
- demons.js module
- speed-tuning.js module
- event-calendar.js module
- warp-calendar.js module
- enemies.js module
- update-drops.js module
- update-marvel-snap-codes.js module
- recipes.js module
- cycles.js module
- checklist.js module
- i18n.js module
- equipment.js module
- equipment.js module
- game.js module
- damage.js module
- builds.js module
- Epic Seven Damage / EHP Calculator
- tier-list.js module
- Marvel Snap
- cursed-possessions.js module
- Hades
- data.js module
- Anna
- Ariel
- Aurora
- Belle
- Bruni the Fire Spirit
- Buzz Lightyear
- Cruella de Vil
- Daisy Duck
- Donald Duck
- Elsa
- EVE
- Flynn Rider
- Gaston
- Goofy
- Jack Skellington
- Jafar
- Kristoff
- Maleficent
- Maui
- Merida
- Merlin
- Mickey Mouse
- Mike Wazowski
- Minnie Mouse
- Mirabel
- Moana
- Mother Gothel
- Mulan
- Nala
- Olaf
- Oswald the Lucky Rabbit
- Pocahontas
- Prince Eric
- Rapunzel
- Remy
- Scar
- Scrooge McDuck
- Simba
- Snow White
- Stitch
- Sulley
- The Beast
- The Fairy Godmother
- The Forgotten
- Tiana
- Tigger
- Tinker Bell
- Ursula
- Vanellope
- WALL-E
- Woody
- Cyberpunk 2077
- Demonologist
- Disney Dreamlight Valley
- Elden Ring
- Epic Seven (New Era)
- Clair Obscur: Expedition 33
- Far Far West
- Final Fantasy XIV Online
- God of War Ragnarok
- Honkai: Star Rail (The Lethe Below the
- Marvel Snap
- Neverness to Everness
- The Outlast Trials
- Phasmophobia
- Warframe
- Adler
- Aurelia
- Baicang
- Chiz
- Daffodil
- Edgar
- Esper Zero
- Fadia
- Haniel
- Hathor
- Hotori
- Jiuyuan
- Lacrimosa
- Mint
- Nanally
- Sakiri
- Skia
- Crucifix
- D.O.T.S Projector
- EMF Reader
- Firelight
- Flashlight
- Head Gear (Head-Mounted Camera)
- Igniter (Ghost Huntin' Safety Matches)
- Incense (Smudge Sticks)
- Medication (Insane Away)
- Motion Sensor
- Parabolic Microphone
- Photo Camera
- Salt
- Sound Sensor
- Spirit Box
- Thermometer
- Tripod
- UV Flashlight
- Video Camera
- Writing Book
- Home Page Screenshot
- NTE Tier List Screenshot
- Phasmophobia Equipment Page Screenshot
- Warframe Drops Tracker Screenshot
- Site Favicon / Logo Mark
- Demonologist (game hub)

## God Nodes (most connected - your core abstractions)
1. `t()` - 23 edges
2. `NightmareFTW Gaming Tools Hub` - 23 edges
3. `run()` - 16 edges
4. `officialName()` - 11 edges
5. `run()` - 11 edges
6. `renderPool()` - 10 edges
7. `buildCard()` - 9 edges
8. `critterCard()` - 9 edges
9. `render()` - 9 edges
10. `esc()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `render()` --indirect_call--> `tag()`  [INFERRED]
  games/marvel-snap/cards.js → scripts/update-news.js
- `renderPool()` --indirect_call--> `tag()`  [INFERRED]
  games/marvel-snap/deck-builder.js → scripts/update-news.js
- `pickPositions()` --indirect_call--> `t()`  [INFERRED]
  play/murdoku/engine.js → games/warframe/worldstate.js
- `drawMap()` --indirect_call--> `t()`  [INFERRED]
  play/murdoku/murdoku.js → games/warframe/worldstate.js
- `ddv()` --indirect_call--> `t()`  [INFERRED]
  scripts/update-codes.js → games/warframe/worldstate.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Scheduled scrape-and-commit workflow pattern** — _github_workflows_update_ddv_update_dreamlight_valley_data, _github_workflows_update_demonologist_update_demonologist_data, _github_workflows_update_drops_update_warframe_drop_table, _github_workflows_update_ffw_builds_update_far_far_west_builds, _github_workflows_update_ffw_maps_update_far_far_west_maps, _github_workflows_update_hsr_banners_update_honkai_star_rail_warp_calendar, _github_workflows_update_hsr_builds_update_honkai_star_rail_character_builds, _github_workflows_update_hsr_events_update_honkai_star_rail_event_calendar, _github_workflows_update_hsr_teams_update_honkai_star_rail_meta_teams, _github_workflows_update_hsr_tierlist_update_honkai_star_rail_tier_list, _github_workflows_update_marvel_snap_update_marvel_snap_cards, _github_workflows_update_news_update_game_news, _github_workflows_update_nte_teams_update_neverness_to_everness_teams [INFERRED 0.85]
- **Cross-game Meta Builds tool pattern** — games_elden_ring_builds_meta_builds, games_expedition_33_builds_meta_builds, games_far_far_west_builds_meta_builds [INFERRED 0.85]
- **Cross-game Missables Checklist tool pattern (on-device ticks)** — games_elden_ring_missables_missables_checklist, games_expedition_33_missables_missables_checklist [INFERRED 0.85]
- **Dreamlight Valley character roster** — assets_img_ddv_anna_anna, assets_img_ddv_ariel_ariel, assets_img_ddv_aurora_aurora, assets_img_ddv_belle_belle, assets_img_ddv_bruni_the_fire_spirit_bruni_the_fire_spirit, assets_img_ddv_buzz_lightyear_buzz_lightyear, assets_img_ddv_cruella_de_vil_cruella_de_vil, assets_img_ddv_daisy_duck_daisy_duck [INFERRED 0.75]
- **Dreamlight Valley character roster** — assets_img_ddv_donald_duck_donald_duck, assets_img_ddv_elsa_elsa, assets_img_ddv_eve_eve, assets_img_ddv_flynn_rider_flynn_rider, assets_img_ddv_gaston_gaston, assets_img_ddv_goofy_goofy, assets_img_ddv_hades_hades, assets_img_ddv_hercules_hercules [INFERRED 0.75]
- **Disney Dreamlight Valley character roster** — assets_img_ddv_jack_skellington_jack_skellington, assets_img_ddv_jafar_jafar, assets_img_ddv_kristoff_kristoff, assets_img_ddv_maleficent_maleficent, assets_img_ddv_maui_maui, assets_img_ddv_merida_merida, assets_img_ddv_merlin_merlin, assets_img_ddv_mickey_mouse_mickey_mouse [INFERRED 0.75]
- **Disney Dreamlight Valley character roster** — assets_img_ddv_mike_wazowski_mike_wazowski, assets_img_ddv_minnie_mouse_minnie_mouse, assets_img_ddv_mirabel_mirabel, assets_img_ddv_moana_moana, assets_img_ddv_mother_gothel_mother_gothel, assets_img_ddv_mulan_mulan, assets_img_ddv_nala_nala, assets_img_ddv_olaf_olaf [INFERRED 0.75]
- **Disney Dreamlight Valley character roster** — assets_img_ddv_oswald_oswald, assets_img_ddv_pocahontas_pocahontas, assets_img_ddv_prince_eric_prince_eric, assets_img_ddv_rapunzel_rapunzel, assets_img_ddv_remy_remy, assets_img_ddv_scar_scar, assets_img_ddv_scrooge_mcduck_scrooge_mcduck, assets_img_ddv_simba_simba [INFERRED 0.75]
- **Disney Dreamlight Valley character roster** — assets_img_ddv_snow_white_snow_white, assets_img_ddv_stitch_stitch, assets_img_ddv_sulley_sulley, assets_img_ddv_the_beast_the_beast, assets_img_ddv_the_fairy_godmother_the_fairy_godmother, assets_img_ddv_the_forgotten_the_forgotten, assets_img_ddv_tiana_tiana, assets_img_ddv_tigger_tigger [INFERRED 0.75]
- **NTE character roster** — assets_img_nte_daffodil_daffodil, assets_img_nte_edgar_edgar, assets_img_nte_esper_zero_esper_zero, assets_img_nte_fadia_fadia, assets_img_nte_haniel_haniel, assets_img_nte_hathor_hathor, assets_img_nte_hotori_hotori, assets_img_nte_jiuyuan_jiuyuan [INFERRED 0.75]
- **Phasmophobia equipment set** — assets_img_phasmo_firelight_firelight, assets_img_phasmo_flashlight_flashlight, assets_img_phasmo_headgear_headgear, assets_img_phasmo_igniter_igniter, assets_img_phasmo_incense_incense, assets_img_phasmo_medication_medication, assets_img_phasmo_motionsensor_motion_sensor, assets_img_phasmo_parabolic_parabolic_microphone [INFERRED 0.75]
- **Phasmophobia equipment set** — assets_img_phasmo_photocamera_photo_camera, assets_img_phasmo_salt_salt, assets_img_phasmo_soundsensor_sound_sensor, assets_img_phasmo_spiritbox_spirit_box, assets_img_phasmo_thermometer_thermometer, assets_img_phasmo_tripod_tripod, assets_img_phasmo_uv_uv_flashlight, assets_img_phasmo_videocamera_video_camera [INFERRED 0.75]

## Communities (180 total, 113 thin omitted)

### Community 0 - "Dreamlight Valley Data Catalogue"
Cohesion: 0.06
Nodes (61): bigImg(), buildCatalogue(), clean(), fs, { officialName }, path, fs, load() (+53 more)

### Community 1 - "Marvel Snap Card Database"
Cohesion: 0.07
Nodes (38): cardArt(), CARDS, chips(), detail, esc(), openCard(), render(), root (+30 more)

### Community 2 - "Data Auto-Update Workflows & Sources"
Cohesion: 0.11
Nodes (34): Update Dreamlight Valley Data, Update Demonologist Data, Update Warframe Drop Table, WFCD Warframe Drop Tables, Update Far Far West Builds, wikily.gg, Update Far Far West Maps, Game8 (+26 more)

### Community 3 - "Dreamlight Valley Animals/Critters"
Cohesion: 0.14
Nodes (27): approachOf(), BIOME_ORDER, biomeRank(), buildControls(), companionCard(), critterCard(), DAY3, DAYS_FULL (+19 more)

### Community 4 - "FFXIV & God of War Guide Pages"
Cohesion: 0.11
Nodes (27): FFXIV Daily / Weekly Checklist, Final Fantasy XIV (game hub), FFXIV Gathering Node Timer, God of War Ragnarök Meta Builds, God of War Ragnarök (game hub), God of War Ragnarök Missables Checklist, PowerPyx (data source), Honkai Star Rail Character Builds (+19 more)

### Community 5 - "Outlast Trials & NTE Guide Pages"
Cohesion: 0.11
Nodes (25): Game8 (data source), Tier List & Builds (Neverness to Everness), Loadout Composition (1 Rig + 1 Tool + 1 Skill + 1 Medicine amp), Recommended Builds (The Outlast Trials), Enemies & Counters (The Outlast Trials), Outlast Wiki (data source), The Outlast Trials Game Hub, Loadout Builder (The Outlast Trials) (+17 more)

### Community 6 - "GitHub Login & Gist Sync"
Cohesion: 0.16
Nodes (22): collect(), fetchUser(), fileBody(), findGist(), gh(), handleCallback(), login(), logout() (+14 more)

### Community 7 - "DDV Translation & Recipes"
Cohesion: 0.17
Nodes (19): ADJ, SMALL, translateName(), tword(), WORD, clean(), dlcOfCollection(), fs (+11 more)

### Community 8 - "Dreamlight Valley Items Browser"
Cohesion: 0.20
Nodes (19): biomeLabel(), buildDropdowns(), buildTabs(), CAT_ORDER, DLC_CLASS, els, esc(), from() (+11 more)

### Community 9 - "Marvel Snap Deck Builder"
Cohesion: 0.23
Nodes (19): addCard(), artCard(), BY, CARDS, chips(), deck, deckEl, esc() (+11 more)

### Community 10 - "NTE Gifts Tool"
Cohesion: 0.16
Nodes (19): charCard(), detail, flashCap(), fons(), giftKind(), giftRow(), GIFTS, ORDER (+11 more)

### Community 11 - "News Aggregator (Google News)"
Cohesion: 0.20
Nodes (19): articleMeta(), bbcodeToHtml(), decode(), decodeEntities(), fetchT(), fs, googleNews(), NAMED (+11 more)

### Community 12 - "Outlast Data Updater"
Cohesion: 0.18
Nodes (19): api(), bullets(), dewiki(), ENV_ORDER, envTrials(), field(), fileUrls(), fs (+11 more)

### Community 13 - "Cyberpunk 2077 Builds"
Cohesion: 0.22
Nodes (17): attrBars(), ATTRS, buildCard(), buildFilters(), colorForTree(), cyberDiagram(), esc(), I (+9 more)

### Community 14 - "Outlast Loadout Builder"
Cohesion: 0.18
Nodes (14): AMP_GROUPS, build, builds, chips(), encode(), optButtons(), persist(), renderSaved() (+6 more)

### Community 15 - "God of War Ragnarok Builds"
Cohesion: 0.27
Nodes (15): buildCard(), buildFilters(), esc(), gearDiagram(), I, open, primaryStat(), render() (+7 more)

### Community 16 - "Redeem Codes Scraper"
Cohesion: 0.30
Nodes (15): altCodes(), clean(), ddv(), ddvPcgamesn(), DIR, epic7(), firstCode(), fs (+7 more)

### Community 17 - "DDV Friendship Tracker"
Cohesion: 0.22
Nodes (14): DLC, dlcClass(), grid, levels, lvl(), render(), renderSummary(), ROLES (+6 more)

### Community 18 - "HSR Character Builds"
Cohesion: 0.25
Nodes (14): attrBars(), ATTRS, characterScreen(), elBuilds, elTabs, elTeam, esc(), render() (+6 more)

### Community 19 - "Demonologist Data Updater"
Cohesion: 0.22
Nodes (14): clean(), demonsWithEvidence(), EVID, { execSync }, fs, get(), ib(), OUT (+6 more)

### Community 20 - "NTE Teams Updater"
Cohesion: 0.18
Nodes (14): CHARS, cleanLabel(), data, { execSync }, FIX, fs, get(), norm() (+6 more)

### Community 21 - "missables.js module"
Cohesion: 0.25
Nodes (13): allItems(), done, esc(), FLAG_LABEL, itemId(), progressEl, render(), renderIntro() (+5 more)

### Community 22 - "missables.js module"
Cohesion: 0.25
Nodes (13): allItems(), done, esc(), FLAG_LABEL, itemId(), progressEl, render(), renderIntro() (+5 more)

### Community 23 - "Far Far West Builds"
Cohesion: 0.36
Nodes (13): buildCard(), BY_ID, esc(), icon(), jokerRow(), openDetail(), RARITY, render() (+5 more)

### Community 24 - "missables.js module"
Cohesion: 0.25
Nodes (13): allItems(), done, esc(), FLAG_LABEL, itemId(), progressEl, render(), renderIntro() (+5 more)

### Community 25 - "Far Far West Builds Updater"
Cohesion: 0.24
Nodes (13): balancedObj(), clean(), detailOf(), { execSync }, fs, getHtml(), jokerName(), listBuilds() (+5 more)

### Community 26 - "Epic7 Builds & Damage"
Cohesion: 0.29
Nodes (12): ATTR_COL, buildCard(), buildFilters(), col(), DMG_STATS, esc(), itemCard(), open (+4 more)

### Community 27 - "Elden Ring / Expedition 33 Guides"
Cohesion: 0.18
Nodes (13): Community Elden Ring API, Elden Ring Meta Builds, Elden Ring (game hub), Elden Ring Missables Checklist, Expedition 33 Meta Builds, Clair Obscur: Expedition 33 (game hub), Game8, Expedition 33 Missables Checklist (+5 more)

### Community 28 - "HSR Tier List"
Cohesion: 0.26
Nodes (11): CHARACTERS, detail, portrait(), PRYDWEN_TEAMS, render(), root, showBuild(), STAT_HINT (+3 more)

### Community 29 - "Far Far West Maps Updater"
Cohesion: 0.24
Nodes (11): balancedArray(), { execSync }, fs, getHtml(), OUT, path, regionFrom(), rscOf() (+3 more)

### Community 30 - "HSR Builds Updater"
Cohesion: 0.27
Nodes (11): cleanName(), decode(), { execSync }, fs, getHtml(), OUT, parseBuilds(), path (+3 more)

### Community 31 - "HSR Teams Updater"
Cohesion: 0.27
Nodes (11): cleanName(), decode(), ELEMENTS, { execSync }, fs, getHtml(), OUT, parseTeams() (+3 more)

### Community 32 - "Demonologist Evidence"
Cohesion: 0.24
Nodes (10): demonMatches(), DEMONS, esc(), EVIDENCE, labelOf(), NEXT, render(), state (+2 more)

### Community 33 - "Murdoku Game"
Cohesion: 0.42
Nodes (10): act(), checkWin(), drawFixture(), drawMap(), drawShelfWall(), hint(), load(), refresh() (+2 more)

### Community 34 - "Marvel Snap Updater"
Cohesion: 0.27
Nodes (10): decode(), { execSync }, fs, getJson(), norm(), OUT, path, run() (+2 more)

### Community 35 - "DDV Star Path"
Cohesion: 0.31
Nodes (9): build(), checks, dutyCard(), progress(), root, ROUTINE, save(), SEASON (+1 more)

### Community 36 - "Epic7 Gear Score"
Cohesion: 0.27
Nodes (9): addRow(), breakdownEl, calc(), optionsHtml, rowsEl, scoreEl, SUBSTATS, tierEl (+1 more)

### Community 37 - "HSR Meta Builds"
Cohesion: 0.42
Nodes (9): dpsBlock(), elBar, esc(), member(), render(), renderTabs(), roleClass(), root (+1 more)

### Community 38 - "Outlast Trials & Maps"
Cohesion: 0.42
Nodes (8): closeModal(), esc(), mapCard(), matches(), missionPanel(), openMap(), render(), root

### Community 39 - "engine.js module"
Cohesion: 0.38
Nodes (9): buildMap(), candidateClues(), clueText(), context(), count(), generateCase(), holdsUnary(), mulberry32() (+1 more)

### Community 40 - "update-hsr-banners.js module"
Cohesion: 0.27
Nodes (9): decode(), { execSync }, fs, getHtml(), iso(), MON, OUT, path (+1 more)

### Community 41 - "DDV Animal Guide"
Cohesion: 0.25
Nodes (9): DDV Animal Guide, Dreamlight Valley Wiki, DDV Friendship Tracker, Disney Dreamlight Valley (game hub), DDV Items Database, Crystal Dreams (recipe source), Nintendo Life, DDV Recipe Browser (+1 more)

### Community 42 - "maps.js module"
Cohesion: 0.33
Nodes (8): active, catOf(), CATS, esc(), renderRegion(), renderTabs(), root, tabsEl

### Community 43 - "nodes.js module"
Cohesion: 0.31
Nodes (8): eorzea(), etEl, fmt(), JOB_LABEL, listEl, NODES, nodeState(), render()

### Community 44 - "builds.js module"
Cohesion: 0.53
Nodes (8): buildSection(), detail, esc(), portraitHTML(), render(), roleClass(), root, showBuild()

### Community 45 - "ghost-evidence.js module"
Cohesion: 0.25
Nodes (8): EVIDENCE, ghostMatches(), GHOSTS, NEXT, render(), state, STATE_CLASS, STATE_LABEL

### Community 46 - "drops.js module"
Cohesion: 0.31
Nodes (8): buildFacets(), els, matches(), render(), sel, TIER_ORDER, TYPE_LABEL, uniq()

### Community 47 - "home.js module"
Cohesion: 0.43
Nodes (6): cardHtml(), render(), saveOrderFromDom(), savePinnedFromDom(), sortList(), wireCards()

### Community 48 - "demons.js module"
Cohesion: 0.43
Nodes (7): card(), esc(), evBar, labelOf(), render(), renderTabs(), root

### Community 49 - "speed-tuning.js module"
Cohesion: 0.39
Nodes (7): colorFor(), renderRows(), renderSeq(), rowsEl, seqEl, simulate(), units

### Community 50 - "event-calendar.js module"
Cohesion: 0.43
Nodes (7): esc(), fmt(), ms(), render(), root, STATUS, statusOf()

### Community 51 - "warp-calendar.js module"
Cohesion: 0.39
Nodes (7): bannerCard(), esc(), render(), root, STATUS_LABEL, statusOf(), today

### Community 52 - "enemies.js module"
Cohesion: 0.29
Nodes (7): CATS, DANGER_CLASS, ENEMIES, esc(), filters, render(), root

### Community 53 - "update-drops.js module"
Cohesion: 0.36
Nodes (7): fs, getJson(), OUT, path, RARITIES, ri(), run()

### Community 54 - "update-marvel-snap-codes.js module"
Cohesion: 0.32
Nodes (7): clean(), { execSync }, fs, getHtml(), OUT, path, run()

### Community 55 - "recipes.js module"
Cohesion: 0.43
Nodes (6): buildStarFilter(), els, matches(), nm(), render(), starSel

### Community 56 - "cycles.js module"
Cohesion: 0.38
Nodes (6): CYCLES, data, fetchAll(), fmt(), render(), root

### Community 57 - "checklist.js module"
Cohesion: 0.53
Nodes (5): load(), nextReset(), periodKey(), render(), save()

### Community 58 - "i18n.js module"
Cohesion: 0.60
Nodes (5): applyTranslation(), init(), injectSwitcher(), translateText(), walk()

### Community 59 - "equipment.js module"
Cohesion: 0.53
Nodes (5): card(), esc(), labelOf(), render(), root

### Community 60 - "equipment.js module"
Cohesion: 0.33
Nodes (4): CATS, EQUIPMENT, filtersEl, root

### Community 62 - "damage.js module"
Cohesion: 0.80
Nodes (4): $(), calc(), fmt(), num()

### Community 63 - "builds.js module"
Cohesion: 0.40
Nodes (3): BUILDS, root, SLOTS

### Community 64 - "Epic Seven Damage / EHP Calculator"
Cohesion: 0.50
Nodes (4): Epic Seven Damage / EHP Calculator, Epic Seven Gear Score Calculator, Epic Seven (game hub), Epic Seven Speed Tuning / Turn Order

### Community 65 - "tier-list.js module"
Cohesion: 0.67
Nodes (3): esc(), render(), root

### Community 66 - "Marvel Snap"
Cohesion: 0.67
Nodes (3): Marvel Snap, Marvel Snap Zone, Update Marvel Snap Cards

## Knowledge Gaps
- **400 isolated node(s):** `GAMES`, `ATTRS`, `SLOT_LAYOUT`, `I`, `open` (+395 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **113 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `Marvel Snap Card Database` to `Murdoku Game`, `HSR Meta Builds`, `Outlast Trials & Maps`, `engine.js module`, `Dreamlight Valley Items Browser`, `Marvel Snap Deck Builder`, `DDV Translation & Recipes`, `nodes.js module`, `News Aggregator (Google News)`, `Cyberpunk 2077 Builds`, `Outlast Data Updater`, `God of War Ragnarok Builds`, `Redeem Codes Scraper`, `Far Far West Builds`, `Epic7 Builds & Damage`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `mealMeta()` connect `DDV Translation & Recipes` to `Marvel Snap Card Database`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `buildCard()` connect `Cyberpunk 2077 Builds` to `Marvel Snap Card Database`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `t()` (e.g. with `buildCard()` and `selectTab()`) actually correct?**
  _`t()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GAMES`, `ATTRS`, `SLOT_LAYOUT` to the rest of the system?**
  _400 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dreamlight Valley Data Catalogue` be split into smaller, more focused modules?**
  _Cohesion score 0.05789235639981909 - nodes in this community are weakly interconnected._
- **Should `Marvel Snap Card Database` be split into smaller, more focused modules?**
  _Cohesion score 0.0664451827242525 - nodes in this community are weakly interconnected._