# Graph Report - .  (2026-08-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1240 nodes · 1895 edges · 195 communities (81 shown, 114 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1fe985ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DDV Items Data Scraper
- HSR Tier List Scraper
- Data Update Automation Hub
- DDV Animal Guide UI
- Game Hub & Checklist Pages
- Outlast/Phasmophobia Game Hubs
- Cloud Sync Auth (GitHub Gist)
- DDV Name Translation & Recipes
- DDV Items Browser UI
- Card Deck Builder UI
- DDV Gifts Tracker UI
- Auth Worker Backend
- Outlast Trials Data Scraper
- Cyberpunk 2077 Builds UI
- Loadout Builder UI
- God of War Builds UI
- Game Codes Scraper
- DDV Friendship Tracker UI
- Expedition 33 Builds UI
- Demonologist Data Scraper
- NTE Teams Data Scraper
- Elden Ring Missables UI
- Expedition 33 Missables UI
- Far Far West Builds UI
- God of War Missables UI
- Far Far West Builds Scraper
- Elden Ring Builds UI
- Game Hub Pages (ER/E33/FFW)
- NTE Tier List UI
- Far Far West Maps Scraper
- HSR Builds Data Scraper
- HSR Teams Data Scraper
- Demonologist Evidence UI
- Murdoku Game Logic
- Marvel Snap Cards Scraper
- DDV Star Path Tracker UI
- Epic Seven Gear Score Calc
- Meta Builds Team UI
- Outlast Trials Maps UI
- HSR Tier List UI
- HSR Banners Scraper
- DDV Game Hub & Tools
- Region Maps UI
- FFXIV Gathering Node Timer
- HSR Builds UI
- Ghost Evidence UI
- Warframe Drop Table UI
- Home Page Cards UI
- Demonologist Demons UI
- Epic Seven Speed Tuning Sim
- HSR Event Calendar UI
- HSR Warp Calendar UI
- Outlast Enemies UI
- Warframe Drops Scraper
- Marvel Snap Codes Scraper
- DDV Recipe Browser UI
- Warframe Cycles UI
- Daily/Weekly Checklist Logic
- i18n Translation Utility
- Demonologist Equipment UI
- Phasmophobia Equipment UI
- Game Hub Page Loader
- Damage Calculator Utility
- Outlast Trials Builds UI
- Epic Seven Game Hub
- Ravenswatch Data Scraper
- Marvel Snap Game Hub
- Phasmophobia Cursed Possessions UI
- Hades & Hercules Portraits
- Games List Data
- Anna Character Portrait
- Ariel Character Portrait
- Aurora Character Portrait
- Belle Character Portrait
- Bruni Character Portrait
- Buzz Lightyear Character Portrait
- Cruella de Vil Character Portrait
- Daisy Duck Character Portrait
- Donald Duck Character Portrait
- Elsa Character Portrait
- EVE Character Portrait
- Flynn Rider Character Portrait
- Gaston Character Portrait
- Goofy Character Portrait
- Jack Skellington Character Portrait
- Jafar Character Portrait
- Kristoff Character Portrait
- Maleficent Character Portrait
- Maui Character Portrait
- Merida Character Portrait
- Merlin Character Portrait
- Mickey Mouse Portrait
- Mike Wazowski Portrait
- Minnie Mouse Portrait
- Mirabel Character Portrait
- Moana Character Portrait
- Mother Gothel Portrait
- Mulan Character Portrait
- Nala Character Portrait
- Olaf Character Portrait
- Oswald the Lucky Rabbit Portrait
- Pocahontas Character Portrait
- Prince Eric Portrait
- Rapunzel Character Portrait
- Remy Character Portrait
- Scar Character Portrait
- Scrooge McDuck Portrait
- Simba Character Portrait
- Snow White Portrait
- Stitch Character Portrait
- Sulley Character Portrait
- The Beast Portrait
- Fairy Godmother Portrait
- The Forgotten Portrait
- Tiana Character Portrait
- Tigger Character Portrait
- Tinker Bell Portrait
- Ursula Character Portrait
- Vanellope Character Portrait
- WALL-E Character Portrait
- Woody Character Portrait
- Cyberpunk 2077 Banner
- Demonologist Game Banner
- Dreamlight Valley Banner
- Elden Ring Banner
- Epic Seven Banner
- Expedition 33 Banner
- Far Far West Banner
- Final Fantasy XIV Banner
- God of War Ragnarok Banner
- Honkai Star Rail Banner
- Marvel Snap Banner
- Neverness to Everness Banner
- Outlast Trials Banner
- Phasmophobia Game Banner
- Warframe Game Banner
- Adler NTE Portrait
- Aurelia NTE Portrait
- Baicang NTE Portrait
- Chiz NTE Portrait
- Daffodil NTE Portrait
- Edgar NTE Portrait
- Esper Zero Portrait
- Fadia NTE Portrait
- Haniel NTE Portrait
- Hathor NTE Portrait
- Hotori NTE Portrait
- Jiuyuan NTE Portrait
- Lacrimosa NTE Portrait
- Mint NTE Portrait
- Nanally NTE Portrait
- Sakiri NTE Portrait
- Skia NTE Portrait
- Crucifix Equipment Icon
- DOTS Projector Icon
- EMF Reader Icon
- Firelight Equipment Icon
- Flashlight Equipment Icon
- Head-Mounted Camera Icon
- Ghost Hunting Matches Icon
- Smudge Sticks Icon
- Insane Away Medication Icon
- Motion Sensor Icon
- Parabolic Microphone Icon
- Photo Camera Icon
- Salt Equipment Icon
- Sound Sensor Icon
- Spirit Box Icon
- Thermometer Equipment Icon
- Tripod Equipment Icon
- UV Flashlight Icon
- Video Camera Icon
- Writing Book Icon
- Game Hub Home Screenshot
- NTE Tier List Screenshot
- Phasmophobia Equipment Screenshot
- Warframe Drops Tracker Screenshot
- Site Favicon Logo
- Demonologist Game Hub Entry
- DDV Catalogue Data Builder
- DDV Animals Data Scraper
- HTTP Fetch Utilities & Scraper
- Asset Hash Stamping Tool
- Ravenswatch Talents UI
- The Other Side Data Scraper
- The Other Side Evidence UI
- Ravenswatch Objects UI
- User Profile & Sync UI
- Deck Code Compiler
- Ravenswatch Heroes UI
- Phasmophobia Ghosts UI
- The Other Side Equipment UI
- Auth Worker README/Docs
- Repo Keep Script

## God Nodes (most connected - your core abstractions)
1. `t()` - 32 edges
2. `NightmareFTW Gaming Tools Hub` - 23 edges
3. `fetch()` - 17 edges
4. `run()` - 16 edges
5. `officialName()` - 12 edges
6. `getText()` - 12 edges
7. `run()` - 11 edges
8. `renderPool()` - 10 edges
9. `clean()` - 10 edges
10. `buildCard()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `drawMap()` --indirect_call--> `t()`  [INFERRED]
  play/murdoku/murdoku.js → games/warframe/worldstate.js
- `ddv()` --indirect_call--> `t()`  [INFERRED]
  scripts/update-codes.js → games/warframe/worldstate.js
- `game8Codes()` --indirect_call--> `t()`  [INFERRED]
  scripts/update-codes.js → games/warframe/worldstate.js
- `run()` --indirect_call--> `t()`  [INFERRED]
  scripts/update-hsr-tierlist.js → games/warframe/worldstate.js
- `articleMeta()` --indirect_call--> `t()`  [INFERRED]
  scripts/update-news.js → games/warframe/worldstate.js

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

## Communities (195 total, 114 thin omitted)

### Community 0 - "DDV Items Data Scraper"
Cohesion: 0.16
Nodes (27): BIOMES, biomesIn(), clean(), collectByHeading(), collectFrom(), dlcOf(), fetchTables(), fs (+19 more)

### Community 1 - "HSR Tier List Scraper"
Cohesion: 0.27
Nodes (9): cleanName(), decode(), { execSync }, fs, getHtml(), OUT, path, run() (+1 more)

### Community 2 - "Data Update Automation Hub"
Cohesion: 0.11
Nodes (34): Update Dreamlight Valley Data, Update Demonologist Data, Update Warframe Drop Table, WFCD Warframe Drop Tables, Update Far Far West Builds, wikily.gg, Update Far Far West Maps, Game8 (+26 more)

### Community 3 - "DDV Animal Guide UI"
Cohesion: 0.14
Nodes (27): approachOf(), BIOME_ORDER, biomeRank(), buildControls(), companionCard(), critterCard(), DAY3, DAYS_FULL (+19 more)

### Community 4 - "Game Hub & Checklist Pages"
Cohesion: 0.11
Nodes (27): FFXIV Daily / Weekly Checklist, Final Fantasy XIV (game hub), FFXIV Gathering Node Timer, God of War Ragnarök Meta Builds, God of War Ragnarök (game hub), God of War Ragnarök Missables Checklist, PowerPyx (data source), Honkai Star Rail Character Builds (+19 more)

### Community 5 - "Outlast/Phasmophobia Game Hubs"
Cohesion: 0.11
Nodes (25): Game8 (data source), Tier List & Builds (Neverness to Everness), Loadout Composition (1 Rig + 1 Tool + 1 Skill + 1 Medicine amp), Recommended Builds (The Outlast Trials), Enemies & Counters (The Outlast Trials), Outlast Wiki (data source), The Outlast Trials Game Hub, Loadout Builder (The Outlast Trials) (+17 more)

### Community 6 - "Cloud Sync Auth (GitHub Gist)"
Cohesion: 0.12
Nodes (29): api(), applyBlob(), closeModal(), cloudPull(), cloudPush(), cloudSignOut(), collect(), fetchGithubUser() (+21 more)

### Community 7 - "DDV Name Translation & Recipes"
Cohesion: 0.16
Nodes (20): ADJ, SMALL, translateName(), tword(), WORD, clean(), dlcOfCollection(), fs (+12 more)

### Community 8 - "DDV Items Browser UI"
Cohesion: 0.20
Nodes (19): biomeLabel(), buildDropdowns(), buildTabs(), CAT_ORDER, DLC_CLASS, els, esc(), from() (+11 more)

### Community 9 - "Card Deck Builder UI"
Cohesion: 0.08
Nodes (47): cardArt(), CARDS, chips(), detail, esc(), openCard(), render(), root (+39 more)

### Community 10 - "DDV Gifts Tracker UI"
Cohesion: 0.16
Nodes (19): charCard(), detail, flashCap(), fons(), giftKind(), giftRow(), GIFTS, ORDER (+11 more)

### Community 11 - "Auth Worker Backend"
Cohesion: 0.17
Nodes (26): auth(), b64u(), checkPassword(), corsHeaders(), dec, enc, fetch(), genRecoveryCode() (+18 more)

### Community 12 - "Outlast Trials Data Scraper"
Cohesion: 0.18
Nodes (19): api(), bullets(), dewiki(), ENV_ORDER, envTrials(), field(), fileUrls(), fs (+11 more)

### Community 13 - "Cyberpunk 2077 Builds UI"
Cohesion: 0.22
Nodes (17): attrBars(), ATTRS, buildCard(), buildFilters(), colorForTree(), cyberDiagram(), esc(), I (+9 more)

### Community 14 - "Loadout Builder UI"
Cohesion: 0.18
Nodes (14): AMP_GROUPS, build, builds, chips(), encode(), optButtons(), persist(), renderSaved() (+6 more)

### Community 15 - "God of War Builds UI"
Cohesion: 0.27
Nodes (15): buildCard(), buildFilters(), esc(), gearDiagram(), I, open, primaryStat(), render() (+7 more)

### Community 16 - "Game Codes Scraper"
Cohesion: 0.28
Nodes (19): altCodes(), clean(), ddv(), ddvPcgamesn(), DIR, epic7(), ffw(), firstCode() (+11 more)

### Community 17 - "DDV Friendship Tracker UI"
Cohesion: 0.22
Nodes (14): DLC, dlcClass(), grid, levels, lvl(), render(), renderSummary(), ROLES (+6 more)

### Community 18 - "Expedition 33 Builds UI"
Cohesion: 0.25
Nodes (14): attrBars(), ATTRS, characterScreen(), elBuilds, elTabs, elTeam, esc(), render() (+6 more)

### Community 19 - "Demonologist Data Scraper"
Cohesion: 0.22
Nodes (14): clean(), demonsWithEvidence(), EVID, { execSync }, fs, get(), ib(), OUT (+6 more)

### Community 20 - "NTE Teams Data Scraper"
Cohesion: 0.18
Nodes (14): CHARS, cleanLabel(), data, { execSync }, FIX, fs, get(), norm() (+6 more)

### Community 21 - "Elden Ring Missables UI"
Cohesion: 0.25
Nodes (13): allItems(), done, esc(), FLAG_LABEL, itemId(), progressEl, render(), renderIntro() (+5 more)

### Community 22 - "Expedition 33 Missables UI"
Cohesion: 0.25
Nodes (13): allItems(), done, esc(), FLAG_LABEL, itemId(), progressEl, render(), renderIntro() (+5 more)

### Community 23 - "Far Far West Builds UI"
Cohesion: 0.36
Nodes (13): buildCard(), BY_ID, esc(), icon(), jokerRow(), openDetail(), RARITY, render() (+5 more)

### Community 24 - "God of War Missables UI"
Cohesion: 0.25
Nodes (13): allItems(), done, esc(), FLAG_LABEL, itemId(), progressEl, render(), renderIntro() (+5 more)

### Community 25 - "Far Far West Builds Scraper"
Cohesion: 0.24
Nodes (13): balancedObj(), clean(), detailOf(), { execSync }, fs, getHtml(), jokerName(), listBuilds() (+5 more)

### Community 26 - "Elden Ring Builds UI"
Cohesion: 0.29
Nodes (12): ATTR_COL, buildCard(), buildFilters(), col(), DMG_STATS, esc(), itemCard(), open (+4 more)

### Community 27 - "Game Hub Pages (ER/E33/FFW)"
Cohesion: 0.18
Nodes (13): Community Elden Ring API, Elden Ring Meta Builds, Elden Ring (game hub), Elden Ring Missables Checklist, Expedition 33 Meta Builds, Clair Obscur: Expedition 33 (game hub), Game8, Expedition 33 Missables Checklist (+5 more)

### Community 28 - "NTE Tier List UI"
Cohesion: 0.26
Nodes (11): CHARACTERS, detail, portrait(), PRYDWEN_TEAMS, render(), root, showBuild(), STAT_HINT (+3 more)

### Community 29 - "Far Far West Maps Scraper"
Cohesion: 0.24
Nodes (11): balancedArray(), { execSync }, fs, getHtml(), OUT, path, regionFrom(), rscOf() (+3 more)

### Community 30 - "HSR Builds Data Scraper"
Cohesion: 0.21
Nodes (17): cleanCell(), cleanName(), decode(), { execSync }, fs, getHtml(), LIST_URLS, OUT (+9 more)

### Community 31 - "HSR Teams Data Scraper"
Cohesion: 0.27
Nodes (11): cleanName(), decode(), ELEMENTS, { execSync }, fs, getHtml(), OUT, parseTeams() (+3 more)

### Community 32 - "Demonologist Evidence UI"
Cohesion: 0.24
Nodes (10): demonMatches(), DEMONS, esc(), EVIDENCE, labelOf(), NEXT, render(), state (+2 more)

### Community 33 - "Murdoku Game Logic"
Cohesion: 0.32
Nodes (15): accuse(), act(), blockedBy(), drawMap(), edgeLine(), edgeWindow(), fixtureLayer(), hint() (+7 more)

### Community 34 - "Marvel Snap Cards Scraper"
Cohesion: 0.27
Nodes (10): decode(), { execSync }, fs, getJson(), norm(), OUT, path, run() (+2 more)

### Community 35 - "DDV Star Path Tracker UI"
Cohesion: 0.31
Nodes (9): build(), checks, dutyCard(), progress(), root, ROUTINE, save(), SEASON (+1 more)

### Community 36 - "Epic Seven Gear Score Calc"
Cohesion: 0.27
Nodes (9): addRow(), breakdownEl, calc(), optionsHtml, rowsEl, scoreEl, SUBSTATS, tierEl (+1 more)

### Community 37 - "Meta Builds Team UI"
Cohesion: 0.42
Nodes (9): dpsBlock(), elBar, esc(), member(), render(), renderTabs(), roleClass(), root (+1 more)

### Community 38 - "Outlast Trials Maps UI"
Cohesion: 0.42
Nodes (8): closeModal(), esc(), mapCard(), matches(), missionPanel(), openMap(), render(), root

### Community 39 - "HSR Tier List UI"
Cohesion: 0.10
Nodes (36): buildSection(), compsFor(), detail, esc(), member(), portrait(), render(), roleClass() (+28 more)

### Community 40 - "HSR Banners Scraper"
Cohesion: 0.27
Nodes (9): decode(), { execSync }, fs, getHtml(), iso(), MON, OUT, path (+1 more)

### Community 41 - "DDV Game Hub & Tools"
Cohesion: 0.25
Nodes (9): DDV Animal Guide, Dreamlight Valley Wiki, DDV Friendship Tracker, Disney Dreamlight Valley (game hub), DDV Items Database, Crystal Dreams (recipe source), Nintendo Life, DDV Recipe Browser (+1 more)

### Community 42 - "Region Maps UI"
Cohesion: 0.33
Nodes (8): active, catOf(), CATS, esc(), renderRegion(), renderTabs(), root, tabsEl

### Community 43 - "FFXIV Gathering Node Timer"
Cohesion: 0.31
Nodes (8): eorzea(), etEl, fmt(), JOB_LABEL, listEl, NODES, nodeState(), render()

### Community 44 - "HSR Builds UI"
Cohesion: 0.53
Nodes (8): buildSection(), detail, esc(), portraitHTML(), render(), roleClass(), root, showBuild()

### Community 45 - "Ghost Evidence UI"
Cohesion: 0.25
Nodes (8): EVIDENCE, ghostMatches(), GHOSTS, NEXT, render(), state, STATE_CLASS, STATE_LABEL

### Community 46 - "Warframe Drop Table UI"
Cohesion: 0.31
Nodes (8): buildFacets(), els, matches(), render(), sel, TIER_ORDER, TYPE_LABEL, uniq()

### Community 47 - "Home Page Cards UI"
Cohesion: 0.43
Nodes (6): cardHtml(), render(), saveOrderFromDom(), savePinnedFromDom(), sortList(), wireCards()

### Community 48 - "Demonologist Demons UI"
Cohesion: 0.43
Nodes (7): card(), esc(), evBar, labelOf(), render(), renderTabs(), root

### Community 49 - "Epic Seven Speed Tuning Sim"
Cohesion: 0.39
Nodes (7): colorFor(), renderRows(), renderSeq(), rowsEl, seqEl, simulate(), units

### Community 50 - "HSR Event Calendar UI"
Cohesion: 0.43
Nodes (7): esc(), fmt(), ms(), render(), root, STATUS, statusOf()

### Community 51 - "HSR Warp Calendar UI"
Cohesion: 0.39
Nodes (7): bannerCard(), esc(), render(), root, STATUS_LABEL, statusOf(), today

### Community 52 - "Outlast Enemies UI"
Cohesion: 0.29
Nodes (7): CATS, DANGER_CLASS, ENEMIES, esc(), filters, render(), root

### Community 53 - "Warframe Drops Scraper"
Cohesion: 0.36
Nodes (7): fs, getJson(), OUT, path, RARITIES, ri(), run()

### Community 54 - "Marvel Snap Codes Scraper"
Cohesion: 0.32
Nodes (7): clean(), { execSync }, fs, getHtml(), OUT, path, run()

### Community 55 - "DDV Recipe Browser UI"
Cohesion: 0.43
Nodes (6): buildStarFilter(), els, matches(), nm(), render(), starSel

### Community 56 - "Warframe Cycles UI"
Cohesion: 0.38
Nodes (6): CYCLES, data, fetchAll(), fmt(), render(), root

### Community 57 - "Daily/Weekly Checklist Logic"
Cohesion: 0.53
Nodes (5): load(), nextReset(), periodKey(), render(), save()

### Community 58 - "i18n Translation Utility"
Cohesion: 0.60
Nodes (5): applyTranslation(), init(), injectSwitcher(), translateText(), walk()

### Community 59 - "Demonologist Equipment UI"
Cohesion: 0.53
Nodes (5): card(), esc(), labelOf(), render(), root

### Community 60 - "Phasmophobia Equipment UI"
Cohesion: 0.33
Nodes (4): CATS, EQUIPMENT, filtersEl, root

### Community 62 - "Damage Calculator Utility"
Cohesion: 0.83
Nodes (3): calc(), fmt(), num()

### Community 63 - "Outlast Trials Builds UI"
Cohesion: 0.40
Nodes (3): BUILDS, root, SLOTS

### Community 64 - "Epic Seven Game Hub"
Cohesion: 0.50
Nodes (4): Epic Seven Damage / EHP Calculator, Epic Seven Gear Score Calculator, Epic Seven (game hub), Epic Seven Speed Tuning / Turn Order

### Community 65 - "Ravenswatch Data Scraper"
Cohesion: 0.17
Nodes (25): api(), clean(), ENT, { execSync }, fileIn(), fs, get(), OUT (+17 more)

### Community 66 - "Marvel Snap Game Hub"
Cohesion: 0.67
Nodes (3): Marvel Snap, Marvel Snap Zone, Update Marvel Snap Cards

### Community 180 - "DDV Catalogue Data Builder"
Cohesion: 0.14
Nodes (19): bigImg(), buildCatalogue(), clean(), fs, { getText }, { officialName }, parseCatalogue(), path (+11 more)

### Community 181 - "DDV Animals Data Scraper"
Cohesion: 0.17
Nodes (19): bigImg(), buildFoodMap(), clean(), DAYS, dlcOf(), fs, get(), { getText } (+11 more)

### Community 182 - "HTTP Fetch Utilities & Scraper"
Cohesion: 0.19
Nodes (12): { execSync }, getJson(), getText(), norm(), wikiItemImg(), clean(), fs, { getJson } (+4 more)

### Community 183 - "Asset Hash Stamping Tool"
Cohesion: 0.17
Nodes (10): auth, crypto, fs, hashes, i18n, missing, path, ROOT (+2 more)

### Community 184 - "Ravenswatch Talents UI"
Cohesion: 0.26
Nodes (11): ALL, card(), chips(), esc(), flatten(), heroBar, render(), renderBars() (+3 more)

### Community 185 - "The Other Side Data Scraper"
Cohesion: 0.26
Nodes (11): clean(), EV, evId(), { execSync }, fs, get(), OUT, path (+3 more)

### Community 186 - "The Other Side Evidence UI"
Cohesion: 0.24
Nodes (10): esc(), EVIDENCE, ghostMatches(), GHOSTS, labelOf(), NEXT, render(), state (+2 more)

### Community 187 - "Ravenswatch Objects UI"
Cohesion: 0.36
Nodes (9): card(), esc(), rarBar, rarClass(), RARITIES, rarRank(), render(), renderBar() (+1 more)

### Community 188 - "User Profile & Sync UI"
Cohesion: 0.51
Nodes (9): api(), loadRecoveryCount(), openEditor(), refreshHeader(), render(), showCodes(), syncNow(), toast() (+1 more)

### Community 189 - "Deck Code Compiler"
Cohesion: 0.31
Nodes (8): archetype(), BY, CARDS, compile(), esc(), msg, out, parseCode()

### Community 190 - "Ravenswatch Heroes UI"
Cohesion: 0.54
Nodes (7): abilityHTML(), detail, esc(), portraitHTML(), render(), root, showHero()

### Community 191 - "Phasmophobia Ghosts UI"
Cohesion: 0.43
Nodes (7): card(), esc(), evBar, labelOf(), render(), renderTabs(), root

### Community 192 - "The Other Side Equipment UI"
Cohesion: 0.48
Nodes (6): card(), esc(), evOrder(), labelOf(), render(), root

### Community 193 - "Auth Worker README/Docs"
Cohesion: 0.40
Nodes (4): NightmareFTW auth + sync Worker, Notes / security, One-time deploy, Password recovery

## Knowledge Gaps
- **455 isolated node(s):** `GAMES`, `ATTRS`, `SLOT_LAYOUT`, `I`, `open` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **114 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `HSR Tier List UI` to `Murdoku Game Logic`, `HSR Tier List Scraper`, `Ravenswatch Data Scraper`, `Meta Builds Team UI`, `Outlast Trials Maps UI`, `DDV Name Translation & Recipes`, `DDV Items Browser UI`, `Card Deck Builder UI`, `FFXIV Gathering Node Timer`, `Outlast Trials Data Scraper`, `Cyberpunk 2077 Builds UI`, `God of War Builds UI`, `Game Codes Scraper`, `HTTP Fetch Utilities & Scraper`, `Far Far West Builds UI`, `Ravenswatch Talents UI`, `Elden Ring Builds UI`, `Deck Code Compiler`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `mealMeta()` connect `DDV Name Translation & Recipes` to `HSR Tier List UI`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `run()` connect `Ravenswatch Data Scraper` to `HSR Tier List UI`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 30 inferred relationships involving `t()` (e.g. with `buildCard()` and `selectTab()`) actually correct?**
  _`t()` has 30 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GAMES`, `ATTRS`, `SLOT_LAYOUT` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Update Automation Hub` be split into smaller, more focused modules?**
  _Cohesion score 0.1051693404634581 - nodes in this community are weakly interconnected._
- **Should `DDV Animal Guide UI` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._