/* Warframe — Build Creator. Mods a Warframe/weapon/companion with real item
   data (data/warframe/items.json, see scripts/update-warframe-items.js) and
   saves the result to the public showcase (worker /builds, see worker/src/index.js).

   Simplifications, clearly surfaced in the UI rather than hidden:
   - Capacity assumes rank 30 + an installed Orokin Reactor/Catalyst (60),
     the state almost every real build is actually played at, rather than
     making the player simulate ranking up. No per-slot manual polarity
     placement either — matching-polarity mods are auto-discounted
     best-fit against the subject's innate polarities instead.
   - Mod compatibility is filtered by the source data's own `type` field
     (e.g. "Primary Mod", "Melee Mod") plus augments matched by exact
     subject name — not a full simulation of every sub-weapon-type's exact
     eligible pool.
   - Archon Shard bonuses are a small hand-kept table (official wiki values;
     WFCD's item data doesn't carry shard effects): Tauforged is 1.5x, the
     flat Azure values apply after percentage modifiers, and the in-game
     no-shield/no-energy Warframe exclusions are honoured. */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const root = document.getElementById("wf-builder");
  const WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  const REGULAR_SLOTS = 8;
  const ARCANE_SLOTS = 2;
  const CAPACITY = 60; // rank 30 + Orokin Reactor/Catalyst
  const RARITY_CLASS = { Common: "wf-r-common", Uncommon: "wf-r-uncommon", Rare: "wf-r-rare", Legendary: "wf-r-legendary", Riven: "wf-r-riven" };
  const RARITY_ORDER = ["Common", "Uncommon", "Rare", "Legendary", "Riven"];

  // Archon Shards (Warframe-only, 5 slots). Values are the in-game numbers
  // from the official wiki (current as of Update 35.0's six-shard expansion):
  // each socketed shard grants one chosen bonus, Tauforged shards give 1.5x.
  // `pct` bonuses stack additively with mods; `flat` Azure bonuses are added
  // after all percentage modifiers, per the wiki's own wording. `no` lists
  // Warframes that can't receive that bonus (no shields / no energy).
  const SHARD_SLOTS = 5;
  const SHARDS = {
    crimson: { name: "Crimson", color: "#d14b4b", bonuses: [
      { text: "+10% Ability Strength", tf: "+15% Ability Strength", pct: { strength: 10 } },
      { text: "+10% Ability Duration", tf: "+15% Ability Duration", pct: { duration: 10 } },
      { text: "+25% Melee Critical Damage", tf: "+37.5% Melee Critical Damage" },
      { text: "+25% Primary Status Chance", tf: "+37.5% Primary Status Chance" },
      { text: "+25% Secondary Critical Chance", tf: "+37.5% Secondary Critical Chance" },
    ] },
    amber: { name: "Amber", color: "#e2b13c", bonuses: [
      { text: "+25% Casting Speed", tf: "+37.5% Casting Speed" },
      { text: "+15% Parkour Velocity", tf: "+22.5% Parkour Velocity" },
      { text: "+30% Maximum Energy filled on Spawn", tf: "+45% Maximum Energy filled on Spawn" },
      { text: "+100% Effectiveness on Health Orbs", tf: "+150% Effectiveness on Health Orbs" },
      { text: "+50% Effectiveness on Energy Orbs", tf: "+75% Effectiveness on Energy Orbs" },
    ] },
    azure: { name: "Azure", color: "#4a94d1", bonuses: [
      { text: "+150 Max Health", tf: "+225 Max Health", flat: { health: 150 } },
      { text: "+150 Shield Capacity", tf: "+225 Shield Capacity", flat: { shield: 150 }, no: ["inaros", "inaros-prime", "kullervo", "nidus", "nidus-prime"] },
      { text: "+50 Energy Max", tf: "+75 Energy Max", flat: { energy: 50 }, no: ["hildryn", "hildryn-prime", "lavos"] },
      { text: "+150 Armor", tf: "+225 Armor", flat: { armor: 150 } },
      { text: "+5 Health/s Regenerated", tf: "+7.5 Health/s Regenerated" },
    ] },
    topaz: { name: "Topaz", color: "#e58a2b", bonuses: [
      { text: "+1 Max Health per enemy killed with Blast Damage (max 300)", tf: "+2 Max Health per enemy killed with Blast Damage (max 450)" },
      { text: "Regenerate +5 Shield on a Blast kill", tf: "Regenerate +7.5 Shield on a Blast kill" },
      { text: "+1% Secondary Critical Chance per Heat kill (max 50%)", tf: "+1.5% Secondary Critical Chance per Heat kill (max 75%)" },
      { text: "+10% Ability Damage on enemies affected by Radiation Status", tf: "+15% Ability Damage on enemies affected by Radiation Status" },
    ] },
    violet: { name: "Violet", color: "#9a5fd3", bonuses: [
      { text: "+10% Ability Damage on enemies affected by Electricity Status", tf: "+15% Ability Damage on enemies affected by Electricity Status" },
      { text: "+30% Primary Electricity Damage (+10% per Crimson, Azure or Violet Shard)", tf: "+45% Primary Electricity Damage (+15% per Crimson, Azure or Violet Shard)" },
      { text: "+25% Melee Critical Damage (doubles with 500+ Max Energy)", tf: "+37.5% Melee Critical Damage (doubles with 500+ Max Energy)" },
      { text: "Health pickups give +20% Energy · Energy pickups give +20% Health", tf: "Health pickups give +30% Energy · Energy pickups give +30% Health" },
    ] },
    emerald: { name: "Emerald", color: "#3fb27f", bonuses: [
      { text: "Toxin Status Effects deal +30% more damage", tf: "Toxin Status Effects deal +45% more damage" },
      { text: "Recover +2 Health on enemies damaged by Toxin Status", tf: "Recover +3 Health on enemies damaged by Toxin Status" },
      { text: "+10% Ability Damage on enemies affected by Corrosion Status", tf: "+15% Ability Damage on enemies affected by Corrosion Status" },
      { text: "+2 max stacks of Corrosion Status", tf: "+3 max stacks of Corrosion Status" },
    ] },
  };

  // Helminth: subsuming a built Warframe permanently unlocks its one
  // predetermined ability for infusion onto any other Warframe's 1st-4th
  // slot. List is the official wiki's subsumption chart (ability, source
  // Warframe) — descriptions/icons aren't duplicated here, they're looked
  // up live from DATA.warframes by matching the source Warframe's name,
  // since we already have that data loaded for every frame.
  const HELMINTH_ABILITIES = [
    ["Shuriken", "Ash"], ["Petrify", "Atlas"], ["Silence", "Banshee"],
    ["Lull", "Baruuk"], ["Sentient Wrath", "Caliban"], ["Elemental Ward", "Chroma"],
    ["Fractured Blast", "Citrine"], ["Evade", "Cyte-09"], ["Wyrd Scythes", "Dagath"],
    ["Dark Verse", "Dante"], ["Fire Blast", "Ember"], ["Rest & Rage", "Equinox"],
    ["Radial Blind", "Excalibur"], ["Self Portrait", "Follie"], ["Ice Wave", "Frost"],
    ["Spectrorage", "Gara"], ["Blood Altar", "Garuda"], ["Thermal Sunder", "Gauss"],
    ["Nourish", "Grendel"], ["Coil Horizon", "Gyre"], ["Condemn", "Harrow"],
    ["Pillage", "Hildryn"], ["Tempest Barrage", "Hydroid"], ["Desiccation", "Inaros"],
    ["Quiver", "Ivara"], ["Ophanim Eyes", "Jade"], ["Ensnare", "Khora"],
    ["Omamori", "Koumei"], ["Wrathful Advance", "Kullervo"], ["Vial Rush", "Lavos"],
    ["Banish", "Limbo"], ["Decoy", "Loki"], ["Pull", "Mag"],
    ["Shooting Gallery", "Mesa"], ["Eclipse", "Mirage"], ["Neote", "Narin"],
    ["Terrify", "Nekros"], ["Fire Walker", "Nezha"], ["Larva", "Nidus"],
    ["Brightbonnet", "Nokko"], ["Null Star", "Nova"], ["Mind Control", "Nyx"],
    ["Smite", "Oberon"], ["Resonator", "Octavia"], ["Webbed Embrace", "Oraxia"],
    ["Dispensary", "Protea"], ["Chyrinka Pillar", "Qorvex"], ["Reave", "Revenant"],
    ["Roar", "Rhino"], ["Molt", "Saryn"], ["Gloom", "Sevagoth"],
    ["Jade Stars", "Sirius & Orion"], ["Tharros Strike", "Styanax"], ["Pyrotechnics", "Temple"],
    ["Spellbind", "Titania"], ["Well of Life", "Trinity"], ["Remedium", "Uriel"],
    ["Warcry", "Valkyr"], ["Tesla Nervos", "Vauban"], ["Shock", "Volt"],
    ["Lycath's Hunt", "Voruna"], ["Breach Surge", "Wisp"], ["Defy", "Wukong"],
    ["Xata's Whisper", "Xaku"], ["Aquablades", "Yareli"], ["Airburst", "Zephyr"],
  ];
  // A Warframe can't infuse an ability it already has, including its own.
  function helminthPoolFor(subj) {
    const own = new Set((subj.abilities || []).map((a) => a.name.toLowerCase()));
    return HELMINTH_ABILITIES.filter(([name, src]) => src !== subj.name && !own.has(name.toLowerCase()));
  }
  function helminthLookup(name, src) {
    const w = DATA.warframes.find((x) => x.name === src);
    const a = w && w.abilities.find((x) => x.name.toLowerCase() === name.toLowerCase());
    return { name, src, desc: (a && a.desc) || "", image: (w && w.image) || "" };
  }

  // Mods store one summary line like "+99% Ability Duration -66% Ability Range" —
  // parse each signed-percentage/stat-name pair for the stat panel's colored deltas.
  // Best-effort text parsing against that convention, not a full mod-effect
  // simulator (no caps/clamps, no non-percent effects) — same spirit as this
  // tool's other documented simplifications (capacity, polarity matching).
  const STAT_ALIASES = [
    [/strength/i, "strength"], [/efficiency/i, "efficiency"], [/range/i, "range"], [/duration/i, "duration"],
    [/health/i, "health"], [/shield/i, "shield"], [/armor/i, "armor"], [/energy/i, "energy"], [/sprint/i, "sprintSpeed"],
  ];
  function parseEffect(effect) {
    const out = [];
    const re = /([+-]\d+(?:\.\d+)?)%\s+([A-Za-z][A-Za-z ]*?)(?=\s[+-]\d|$)/g;
    let m;
    while ((m = re.exec(effect || ""))) {
      const hit = STAT_ALIASES.find(([rx]) => rx.test(m[2]));
      if (hit) out.push({ stat: hit[1], pct: parseFloat(m[1]) });
    }
    return out;
  }
  function statDeltas(subject, equipped, shardList) {
    const sums = {};
    equipped.filter(Boolean).forEach((m) => parseEffect(m.effect).forEach(({ stat, pct }) => { sums[stat] = (sums[stat] || 0) + pct; }));
    // Shard bonuses: `pct` stacks with the mod percentages above; `flat` is
    // added after all percentage modifiers (the wiki's stated ordering).
    const flats = {};
    (shardList || []).filter(Boolean).forEach((s) => {
      const b = (SHARDS[s.color] || {}).bonuses ? SHARDS[s.color].bonuses[s.bonus] : null;
      if (!b) return;
      const m = s.tf ? 1.5 : 1;
      if (b.pct) for (const k in b.pct) sums[k] = (sums[k] || 0) + b.pct[k] * m;
      if (b.flat) for (const k in b.flat) flats[k] = (flats[k] || 0) + b.flat[k] * m;
    });
    const abilityCls = (pct) => (pct > 0 ? "wf-stat-up" : pct < 0 ? "wf-stat-down" : "");
    // Colour by the actual before/after change, so a flat shard bonus shows
    // green even when no percentage mod touches that stat.
    const scaled = (n, stat) => {
      const base = n || 0, pct = sums[stat] || 0, flat = flats[stat] || 0;
      const value = Math.round((base * (1 + pct / 100) + flat) * 10) / 10;
      return { value, cls: value > base ? "wf-stat-up" : value < base ? "wf-stat-down" : "" };
    };
    const ability = (stat) => { const pct = sums[stat] || 0; return { value: Math.round(100 + pct), cls: abilityCls(pct) }; };
    return {
      health: scaled(subject.health, "health"), shield: scaled(subject.shield, "shield"), armor: scaled(subject.armor, "armor"),
      energy: scaled(subject.power, "energy"),
      sprintSpeed: { value: Math.round((subject.sprintSpeed || 1) * (1 + (sums.sprintSpeed || 0) / 100) * 100) / 100, cls: abilityCls(sums.sprintSpeed || 0) },
      strength: ability("strength"), efficiency: ability("efficiency"), range: ability("range"), duration: ability("duration"),
    };
  }
  function statRow(label, d, suffix) {
    return `<div class="wf-stat-row"><span class="wf-stat-label">${esc(label)}</span><span class="wf-stat-value ${d.cls}">${d.value}${suffix || ""}</span></div>`;
  }

  let DATA = null;
  let category = "warframe"; // warframe | weapon | companion
  let subject = null;        // the chosen item object
  let mods = new Array(REGULAR_SLOTS).fill(null);
  let aura = null, exilus = null;
  let arcanes = new Array(ARCANE_SLOTS).fill(null);
  let shards = new Array(SHARD_SLOTS).fill(null);
  let helminth = null; // { slot: 0-3, name, src } — the one ability slot a Helminth infusion replaces
  let title = "", notes = "";

  function subjectsFor(cat) {
    if (cat === "warframe") return DATA.warframes;
    if (cat === "weapon") return DATA.weapons;
    return DATA.companions;
  }

  // Which mod `type` values apply to a given subject, by category/type.
  function modPoolFor(cat, subj) {
    if (cat === "warframe") return (m) => m.type === "Warframe Mod";
    if (cat === "companion") return (m) => m.type === "Companion Mod";
    // weapon
    const t = (subj.type || "").toLowerCase();
    const cats = subj.category; // Primary | Secondary | Melee
    return (m) => {
      if (cats === "Melee") return m.type === "Melee Mod" || m.type === "Stance Mod";
      if (t.includes("shotgun")) return m.type === "Shotgun Mod" || m.type === `${cats} Mod`;
      return m.type === `${cats} Mod`;
    };
  }
  function augmentMatches(m, subj) { return m.isAugment && m.compatName === subj.name; }
  function auraPoolFor() { return (m) => m.compatName === "AURA"; }
  function arcanePoolFor(cat) {
    return (a) => cat === "warframe" ? !/Secondary|Primary|Melee/.test(a.type) : /Secondary|Primary|Melee/.test(a.type) === (cat === "weapon");
  }

  // Greedy best-fit: each placed mod whose polarity still has an unused
  // match among the subject's innate polarities gets the drain halved.
  function computeCapacity() {
    const pool = subject && subject.polarities ? subject.polarities.slice() : [];
    const placed = mods.filter(Boolean);
    let used = 0;
    for (const m of placed) {
      const i = pool.indexOf(m.polarity);
      const drain = m.baseDrain || 0;
      if (i >= 0) { pool.splice(i, 1); used += Math.ceil(drain / 2); }
      else used += drain;
    }
    return used;
  }

  // Generic slot read/write so drag-and-drop swapping works the same way
  // across the mods array, the arcanes array, the shards array and the
  // single-value aura/exilus slots.
  function getSlot(kind, idx) {
    if (kind === "mod") return mods[idx];
    if (kind === "arcane") return arcanes[idx];
    if (kind === "shard") return shards[idx];
    if (kind === "aura") return aura;
    return exilus;
  }
  function setSlot(kind, idx, val) {
    if (kind === "mod") mods[idx] = val;
    else if (kind === "arcane") arcanes[idx] = val;
    else if (kind === "shard") shards[idx] = val;
    else if (kind === "aura") aura = val;
    else exilus = val;
  }

  function modCardInner(item) {
    return `<span class="wf-mod-card-art">${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy">` : `<span class="wf-slot-plus">${esc(item.name[0])}</span>`}</span>
      <span class="wf-mod-card-name">${esc(item.name)}</span>`;
  }
  function slotButton(kind, idx, item) {
    const empty = !item;
    const rarityCls = !empty && item.rarity ? RARITY_CLASS[item.rarity] || "" : "";
    return `<button type="button" class="wf-slot ${empty ? "wf-slot-empty" : "wf-mod-card " + rarityCls}" data-kind="${kind}" data-idx="${idx}"${empty ? "" : ' draggable="true"'}>
      ${empty ? `<span class="wf-slot-plus">+</span>` : modCardInner(item)}
    </button>`;
  }
  function shardSlotButton(idx, s) {
    const info = s && SHARDS[s.color];
    const b = info && info.bonuses[s.bonus];
    const label = info && b ? `${s.tf ? "Tauforged " : ""}${info.name} — ${s.tf ? b.tf : b.text}` : "";
    return `<button type="button" class="wf-slot wf-shard-slot ${info ? "" : "wf-slot-empty"}" data-kind="shard" data-idx="${idx}"${label ? ` title="${esc(label)}"` : ""}${info ? ' draggable="true"' : ""}>
      ${info ? `<span class="wf-shard-gem ${s.tf ? "wf-tauforged" : ""}" style="--shard:${info.color}"></span><span class="wf-slot-name">${info.name}</span>` : `<span class="wf-slot-plus">+</span>`}
    </button>`;
  }

  function render() {
    const cats = [["warframe", "Warframe"], ["weapon", "Weapon"], ["companion", "Companion"]];
    const used = subject ? computeCapacity() : 0;
    const over = used > CAPACITY;

    root.innerHTML = `
      <div class="wf-controls" style="margin-bottom:22px">
        ${cats.map(([id, label]) => `<button type="button" class="wf-tab ${category === id ? "active" : ""}" data-cat="${id}">${label}</button>`).join("")}
      </div>

      <div class="wf-controls">
        <input type="search" id="wf-subject-search" class="wf-input" placeholder="Search ${esc(category)}…" autocomplete="off" value="${subject ? esc(subject.name) : ""}">
      </div>
      <div id="wf-subject-list" class="wf-subject-list"></div>

      ${subject ? (() => {
        const deltas = subject.health != null ? statDeltas(subject, [...mods, aura, exilus], category === "warframe" ? shards : null) : null;
        const statPanel = deltas ? `
          <div class="wf-stat-panel">
            <p class="wf-tag">Capacity</p>
            <div class="wf-capacity-bar"><div class="wf-capacity-fill ${over ? "wf-over" : ""}" style="width:${Math.min(100, (used / CAPACITY) * 100)}%"></div></div>
            <p class="wf-muted-note ${over ? "wf-over-text" : ""}" style="margin:4px 0 16px">${used} / ${CAPACITY}${over ? " — over capacity" : ""}</p>
            <div class="wf-stat-group">
              ${statRow("Health", deltas.health)}${statRow("Shield", deltas.shield)}${statRow("Armor", deltas.armor)}
              ${category === "warframe" ? statRow("Energy", deltas.energy) + statRow("Sprint Speed", deltas.sprintSpeed) : ""}
            </div>
            ${category === "warframe" ? `
            <p class="wf-tag" style="margin-top:16px">Ability</p>
            <div class="wf-stat-group">
              ${statRow("Duration", deltas.duration, "%")}${statRow("Efficiency", deltas.efficiency, "%")}${statRow("Range", deltas.range, "%")}${statRow("Strength", deltas.strength, "%")}
            </div>` : ""}
          </div>` : "";
        return `
        <section class="wf-panel wf-build-area" style="--wfc: var(--wf-cyan);">
          <div class="wf-corner tl"></div>
          <div class="wf-build-head">
            ${subject.image ? `<img src="${esc(subject.image)}" alt="" class="wf-build-portrait">` : ""}
            <div>
              <h2>${esc(subject.name)}${subject.isPrime ? ` <span class="wf-tag" style="color:var(--wf-amber); display:inline-flex"><span class="wf-dot amber"></span>PRIME</span>` : ""}</h2>
              ${subject.health != null ? `<p class="wf-build-stats">HP ${subject.health} · Shield ${subject.shield} · Armor ${subject.armor}</p>` : ""}
              ${subject.passive ? `<p class="wf-build-passive">${esc(subject.passive)}</p>` : ""}
            </div>
          </div>

          ${subject.abilities && subject.abilities.length ? `
            <div class="wf-abilities">${subject.abilities.map((a, i) => {
              const swapped = category === "warframe" && helminth && helminth.slot === i;
              const shown = swapped ? helminth : a;
              return `<button type="button" class="wf-ability${swapped ? " wf-ability-helminth" : ""}${category === "warframe" ? "" : " wf-ability-static"}" ${category === "warframe" ? `data-helminth-slot="${i}"` : "disabled"}>
                ${swapped ? `<span class="wf-helminth-badge">HELMINTH</span>` : ""}
                <b>${esc(shown.name)}</b><span>${esc(shown.desc)}</span>
                ${swapped ? `<span class="wf-muted-note">from ${esc(helminth.src)}</span>` : ""}
              </button>`;
            }).join("")}</div>
          ` : ""}

          <div class="wf-arsenal">
            ${statPanel}
            <div class="wf-arsenal-main">
              ${!deltas ? `
              <div class="wf-capacity">
                <div class="wf-capacity-bar"><div class="wf-capacity-fill ${over ? "wf-over" : ""}" style="width:${Math.min(100, (used / CAPACITY) * 100)}%"></div></div>
                <p class="${over ? "wf-over-text" : ""}">${used} / ${CAPACITY} capacity ${over ? "— over capacity" : ""} <span class="wf-muted-note">(rank 30 + reactor assumed)</span></p>
              </div>` : ""}

              <div class="wf-slot-section">
                <p class="wf-tag" style="color:var(--wf-cyan)">Mods</p>
                <div class="wf-slot-grid">${mods.map((m, i) => slotButton("mod", i, m)).join("")}</div>
              </div>

              ${category !== "companion" ? `
              <div class="wf-slot-section">
                <p class="wf-tag" style="color:var(--wf-amber)">${category === "warframe" ? "Aura" : "Exilus"}</p>
                <div class="wf-slot-grid wf-slot-grid-1">${slotButton(category === "warframe" ? "aura" : "exilus", 0, category === "warframe" ? aura : exilus)}</div>
              </div>` : ""}

              <div class="wf-slot-section">
                <p class="wf-tag" style="color:var(--wf-amber)">Arcanes</p>
                <div class="wf-slot-grid wf-slot-grid-2">${arcanes.map((a, i) => slotButton("arcane", i, a)).join("")}</div>
              </div>

              ${category === "warframe" ? `
              <div class="wf-slot-section">
                <p class="wf-tag" style="color:var(--wf-amber)">Archon Shards <span class="wf-muted-note" style="text-transform:none; letter-spacing:0; font-weight:400">(5 per Warframe)</span></p>
                <div class="wf-slot-grid wf-slot-grid-5">${shards.map((s, i) => shardSlotButton(i, s)).join("")}</div>
              </div>` : ""}
            </div>
          </div>

          <div class="wf-slot-section">
            <p class="wf-tag">Build details</p>
            <input type="text" id="wf-title" class="wf-input" placeholder="Build title…" value="${esc(title)}" style="margin-bottom:8px">
            <textarea id="wf-notes" class="wf-input" placeholder="Notes (playstyle, forma order, anything else)…" rows="3" style="width:100%; resize:vertical; font-family:inherit">${esc(notes)}</textarea>
          </div>

          <div class="wf-build-actions">
            <button type="button" class="wf-code-copy" id="wf-save">Save to showcase</button>
            <span id="wf-save-msg" class="wf-muted-note"></span>
          </div>
        </section>`;
      })() : `<p class="wf-empty">Pick a ${esc(category)} above to start modding.</p>`}

      <div class="wf-picker" id="wf-picker" hidden>
        <div class="wf-picker-inner">
          <div class="wf-picker-head">
            <input type="search" id="wf-picker-search" class="wf-input" placeholder="Search…" autocomplete="off">
            <button type="button" class="wf-picker-close" id="wf-picker-close" aria-label="Close">&times;</button>
          </div>
          <div class="wf-picker-filters" id="wf-picker-filters" hidden></div>
          <div class="wf-picker-list" id="wf-picker-list"></div>
        </div>
      </div>`;

    wire();
  }

  function wire() {
    root.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
      category = b.dataset.cat; subject = null; mods = new Array(REGULAR_SLOTS).fill(null);
      aura = null; exilus = null; arcanes = new Array(ARCANE_SLOTS).fill(null);
      shards = new Array(SHARD_SLOTS).fill(null); helminth = null;
      render();
    }));

    const searchEl = document.getElementById("wf-subject-search");
    const listEl = document.getElementById("wf-subject-list");
    function renderSubjectList(q) {
      if (!q) { listEl.innerHTML = ""; return; }
      const qq = q.toLowerCase();
      const matches = subjectsFor(category).filter((s) => s.name.toLowerCase().includes(qq)).slice(0, 12);
      listEl.innerHTML = matches.map((s) => `<button type="button" class="wf-subject-item" data-slug="${esc(s.slug)}">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}${esc(s.name)}</button>`).join("");
      listEl.querySelectorAll("[data-slug]").forEach((btn) => btn.addEventListener("click", () => {
        subject = subjectsFor(category).find((s) => s.slug === btn.dataset.slug);
        mods = new Array(REGULAR_SLOTS).fill(null); aura = null; exilus = null; arcanes = new Array(ARCANE_SLOTS).fill(null);
        shards = new Array(SHARD_SLOTS).fill(null); helminth = null;
        render();
      }));
    }
    searchEl.addEventListener("input", (e) => renderSubjectList(e.target.value.trim()));
    if (subject) renderSubjectList("");

    document.getElementById("wf-title")?.addEventListener("input", (e) => { title = e.target.value; });
    document.getElementById("wf-notes")?.addEventListener("input", (e) => { notes = e.target.value; });

    root.querySelectorAll(".wf-slot").forEach((btn) => btn.addEventListener("click", () => openPicker(btn.dataset.kind, Number(btn.dataset.idx))));
    root.querySelectorAll("[data-helminth-slot]").forEach((btn) => btn.addEventListener("click", () => openHelminthPicker(Number(btn.dataset.helminthSlot))));
    document.getElementById("wf-save")?.addEventListener("click", saveBuild);
    wireDrag();
  }

  // Desktop-only in practice: native HTML5 drag-and-drop doesn't fire from a
  // touch tap, so this is pure addition on top of the click-to-pick flow
  // above — mobile is unaffected. Dragging one filled slot onto another of
  // the same kind swaps them (an empty target just moves it), matching how
  // the real Arsenal lets you drag-reorder equipped mods.
  let dragSrc = null;
  function wireDrag() {
    root.querySelectorAll(".wf-slot[draggable]").forEach((el) => {
      el.addEventListener("dragstart", () => { dragSrc = { kind: el.dataset.kind, idx: Number(el.dataset.idx) }; });
      el.addEventListener("dragend", () => { dragSrc = null; root.querySelectorAll(".wf-drag-over").forEach((x) => x.classList.remove("wf-drag-over")); });
    });
    root.querySelectorAll(".wf-slot").forEach((el) => {
      el.addEventListener("dragover", (e) => { if (dragSrc && dragSrc.kind === el.dataset.kind) { e.preventDefault(); el.classList.add("wf-drag-over"); } });
      el.addEventListener("dragleave", () => el.classList.remove("wf-drag-over"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("wf-drag-over");
        if (!dragSrc || dragSrc.kind !== el.dataset.kind) return;
        const toIdx = Number(el.dataset.idx);
        if (dragSrc.idx !== toIdx) {
          const a = getSlot(dragSrc.kind, dragSrc.idx), b = getSlot(dragSrc.kind, toIdx);
          setSlot(dragSrc.kind, dragSrc.idx, b);
          setSlot(dragSrc.kind, toIdx, a);
          render();
        }
        dragSrc = null;
      });
    });
  }

  function openPicker(kind, idx) {
    const picker = document.getElementById("wf-picker");
    const listEl = document.getElementById("wf-picker-list");
    const searchEl = document.getElementById("wf-picker-search");
    const filtersEl = document.getElementById("wf-picker-filters");
    if (kind === "shard") { openShardPicker(idx); return; }
    searchEl.hidden = false;
    let pool;
    if (kind === "mod") {
      const base = modPoolFor(category, subject);
      pool = DATA.mods.filter((m) => base(m) || augmentMatches(m, subject));
    } else if (kind === "aura") {
      pool = DATA.mods.filter(auraPoolFor());
    } else if (kind === "exilus") {
      const base = modPoolFor(category, subject);
      pool = DATA.mods.filter((m) => (base(m) || augmentMatches(m, subject)) && m.compatName !== "AURA");
    } else {
      pool = DATA.arcanes.filter(arcanePoolFor(category));
    }

    // Filter row — type chips (only when the pool actually spans more than
    // one, e.g. Melee's "Melee Mod" + "Stance Mod"), a rarity select, and an
    // Augments-only toggle, mirroring how the in-game browser narrows mods.
    const types = [...new Set(pool.map((m) => m.type))];
    const rarities = [...new Set(pool.map((m) => m.rarity).filter(Boolean))].sort((a, b) => RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b));
    // WFCD's own `isAugment` flag is true for every single mod (a quirk of
    // their data, not the game) — compatName naming this exact subject is
    // the only reliable signal that a mod is actually subject-specific.
    const isSubjAugment = (m) => m.compatName === subject.name;
    const hasAugments = pool.some(isSubjAugment) && pool.some((m) => !isSubjAugment(m));
    let typeFilter = "", rarityFilter = "", augOnly = false;

    function filterRowHtml() {
      if (types.length < 2 && rarities.length < 2 && !hasAugments) return "";
      return `
        ${types.length > 1 ? `<div class="wf-picker-chips">
          <button type="button" class="wf-picker-chip ${!typeFilter ? "active" : ""}" data-type="">All</button>
          ${types.map((t) => `<button type="button" class="wf-picker-chip ${typeFilter === t ? "active" : ""}" data-type="${esc(t)}">${esc(t.replace(/ Mod$/, ""))}</button>`).join("")}
        </div>` : ""}
        <div class="wf-picker-chips">
          ${rarities.length > 1 ? `<select class="wf-select wf-picker-rarity" id="wf-picker-rarity-select">
            <option value="">All rarities</option>
            ${rarities.map((r) => `<option value="${esc(r)}" ${rarityFilter === r ? "selected" : ""}>${esc(r)}</option>`).join("")}
          </select>` : ""}
          ${hasAugments ? `<button type="button" class="wf-picker-chip ${augOnly ? "active" : ""}" id="wf-picker-aug-toggle">Augments only</button>` : ""}
        </div>`;
    }

    function renderList(q) {
      let list = pool;
      if (typeFilter) list = list.filter((m) => m.type === typeFilter);
      if (rarityFilter) list = list.filter((m) => m.rarity === rarityFilter);
      if (augOnly) list = list.filter(isSubjAugment);
      if (q) list = list.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
      list = list.slice(0, 80);
      listEl.innerHTML = list.map((m) => `<button type="button" class="wf-picker-item wf-mod-card ${RARITY_CLASS[m.rarity] || ""}" data-slug="${esc(m.slug)}" title="${esc(m.effect || m.type || "")}">
        ${modCardInner(m)}
      </button>`).join("") || `<p class="wf-empty">No matches.</p>`;
      listEl.querySelectorAll("[data-slug]").forEach((btn) => btn.addEventListener("click", () => {
        const item = pool.find((m) => m.slug === btn.dataset.slug);
        if (kind === "mod") mods[idx] = item;
        else if (kind === "aura") aura = item;
        else if (kind === "exilus") exilus = item;
        else arcanes[idx] = item;
        closePicker();
        render();
      }));
    }
    function drawFilters() {
      filtersEl.hidden = !filterRowHtml();
      filtersEl.innerHTML = filterRowHtml();
      filtersEl.querySelectorAll("[data-type]").forEach((btn) => btn.addEventListener("click", () => { typeFilter = btn.dataset.type; drawFilters(); renderList(searchEl.value.trim()); }));
      filtersEl.querySelector("#wf-picker-rarity-select")?.addEventListener("change", (e) => { rarityFilter = e.target.value; renderList(searchEl.value.trim()); });
      filtersEl.querySelector("#wf-picker-aug-toggle")?.addEventListener("click", () => { augOnly = !augOnly; drawFilters(); renderList(searchEl.value.trim()); });
    }
    drawFilters();
    renderList("");
    searchEl.value = "";
    searchEl.oninput = () => renderList(searchEl.value.trim());
    picker.hidden = false;
    document.getElementById("wf-picker-close").onclick = closePicker;
    picker.onclick = (e) => { if (e.target === picker) closePicker(); };
  }
  // Archon Shard picker: colour row + Tauforged toggle + that colour's bonus
  // list. Simpler than a search list because the whole pool is ~30 fixed rows.
  function openShardPicker(idx) {
    const picker = document.getElementById("wf-picker");
    const listEl = document.getElementById("wf-picker-list");
    const searchEl = document.getElementById("wf-picker-search");
    document.getElementById("wf-picker-filters").hidden = true;
    searchEl.hidden = true;
    const cur = shards[idx];
    let color = cur ? cur.color : "crimson";
    let tf = !!(cur && cur.tf);
    function draw() {
      const info = SHARDS[color];
      listEl.innerHTML = `
        <div class="wf-shard-colors">
          ${Object.keys(SHARDS).map((id) => `
            <button type="button" class="wf-shard-color-btn ${color === id ? "active" : ""}" data-color="${id}" style="--shard:${SHARDS[id].color}">
              <span class="wf-shard-gem ${tf ? "wf-tauforged" : ""}"></span>${SHARDS[id].name}
            </button>`).join("")}
        </div>
        <label class="wf-shard-tf"><input type="checkbox" id="wf-shard-tf" ${tf ? "checked" : ""}> Tauforged <span class="wf-muted-note">(1.5× bonuses)</span></label>
        ${info.bonuses.map((b, bi) => {
          const blocked = b.no && b.no.indexOf(subject.slug) >= 0;
          return `<button type="button" class="wf-picker-item wf-shard-bonus ${blocked ? "wf-disabled" : ""}" data-bonus="${bi}" ${blocked ? "disabled" : ""}>
            <span>${esc(tf ? b.tf : b.text)}</span>${blocked ? `<span class="wf-muted-note">Not eligible on ${esc(subject.name)}</span>` : ""}
          </button>`;
        }).join("")}
        ${cur ? `<button type="button" class="wf-shard-unsocket" id="wf-shard-unsocket">Unsocket shard</button>` : ""}`;
      listEl.querySelectorAll("[data-color]").forEach((btn) => btn.addEventListener("click", () => { color = btn.dataset.color; draw(); }));
      listEl.querySelector("#wf-shard-tf")?.addEventListener("change", (e) => { tf = e.target.checked; draw(); });
      listEl.querySelectorAll("[data-bonus]").forEach((btn) => btn.addEventListener("click", () => {
        shards[idx] = { color, bonus: Number(btn.dataset.bonus), tf };
        closePicker();
        render();
      }));
      listEl.querySelector("#wf-shard-unsocket")?.addEventListener("click", () => {
        shards[idx] = null;
        closePicker();
        render();
      });
    }
    draw();
    picker.hidden = false;
    document.getElementById("wf-picker-close").onclick = closePicker;
    picker.onclick = (e) => { if (e.target === picker) closePicker(); };
  }
  // Helminth picker: a searchable grid of every subsumable ability (one per
  // built, non-Prime/non-Umbra Warframe), reusing the mod-card grid visual
  // with the source Warframe's own portrait standing in for an ability icon
  // (WFCD's data has no per-ability icon field).
  function openHelminthPicker(slotIdx) {
    const picker = document.getElementById("wf-picker");
    const listEl = document.getElementById("wf-picker-list");
    const searchEl = document.getElementById("wf-picker-search");
    document.getElementById("wf-picker-filters").hidden = true;
    searchEl.hidden = false;
    const pool = helminthPoolFor(subject).map(([name, src]) => helminthLookup(name, src));
    function renderList(q) {
      const list = (q ? pool.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.src.toLowerCase().includes(q.toLowerCase())) : pool);
      listEl.innerHTML = (helminth && helminth.slot === slotIdx ? `<button type="button" class="wf-picker-item wf-shard-unsocket" id="wf-helminth-revert" style="grid-column:1/-1">Revert to ${esc(subject.abilities[slotIdx].name)}</button>` : "")
        + (list.map((a) => `<button type="button" class="wf-picker-item wf-mod-card" data-name="${esc(a.name)}" data-src="${esc(a.src)}" title="${esc(a.desc)}">
            <span class="wf-mod-card-art">${a.image ? `<img src="${esc(a.image)}" alt="" loading="lazy">` : `<span class="wf-slot-plus">${esc(a.name[0])}</span>`}</span>
            <span class="wf-mod-card-name">${esc(a.name)}</span>
          </button>`).join("") || `<p class="wf-empty">No matches.</p>`);
      listEl.querySelector("#wf-helminth-revert")?.addEventListener("click", () => { helminth = null; closePicker(); render(); });
      listEl.querySelectorAll("[data-name]").forEach((btn) => btn.addEventListener("click", () => {
        helminth = { slot: slotIdx, name: btn.dataset.name, src: btn.dataset.src, desc: pool.find((a) => a.name === btn.dataset.name).desc };
        closePicker();
        render();
      }));
    }
    renderList("");
    searchEl.value = "";
    searchEl.oninput = () => renderList(searchEl.value.trim());
    picker.hidden = false;
    document.getElementById("wf-picker-close").onclick = closePicker;
    picker.onclick = (e) => { if (e.target === picker) closePicker(); };
  }
  function closePicker() { const p = document.getElementById("wf-picker"); if (p) p.hidden = true; }

  async function saveBuild() {
    const msg = document.getElementById("wf-save-msg");
    if (!window.NFTWAuth || !window.NFTWAuth.token()) {
      msg.textContent = "Sign in (email account) to save to the showcase.";
      window.NFTWAuth?.open?.("login");
      return;
    }
    if (!title.trim()) { msg.textContent = "Give the build a title first."; return; }
    const payload = {
      category, subject: subject.name, title: title.trim(),
      author: (window.NFTWAuth.email && window.NFTWAuth.email()) ? window.NFTWAuth.email().split("@")[0] : "Tenno",
      data: {
        mods: mods.map((m) => m && m.slug), aura: aura && aura.slug, exilus: exilus && exilus.slug,
        arcanes: arcanes.map((a) => a && a.slug),
        shards: shards.map((s) => (s ? [s.color, s.bonus, s.tf ? 1 : 0] : null)),
        helminth: helminth ? [helminth.slot, helminth.name, helminth.src] : null,
        notes: notes.trim(),
      },
    };
    msg.textContent = "Saving…";
    try {
      const res = await fetch(`${WORKER}/builds`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.NFTWAuth.token()}` },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      if (!res.ok || !out.id) { msg.textContent = "Couldn't save — try again."; return; }
      msg.innerHTML = `Saved ✓ <a href="builds.html?id=${encodeURIComponent(out.id)}" style="color:var(--wf-cyan-bright)">View in showcase →</a>`;
    } catch (e) {
      msg.textContent = "Network error — try again.";
    }
  }

  (async function init() {
    try {
      DATA = await (await fetch(`../../data/warframe/items.json?cb=${Date.now()}`)).json();
      render();
    } catch (e) {
      root.innerHTML = `<p class="wf-empty">Couldn't load the item database.</p>`;
    }
  })();
})();
