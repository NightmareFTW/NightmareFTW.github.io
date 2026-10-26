/* Warframe — Build Showcase. Browses/likes public builds saved via
   builder.js (worker /builds). Cross-references each build's mod/arcane
   slugs against data/warframe/items.json for names/images, since the
   saved `data` blob only stores slugs, not a content snapshot. */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const root = document.getElementById("wf-showcase");
  const WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  const params = new URLSearchParams(location.search);

  let ITEMS = null;
  let category = params.get("category") || "";
  let sort = "newest";

  const bySlug = (list, slug) => (list || []).find((x) => x.slug === slug) || null;
  function subjectFor(b) {
    const list = b.category === "warframe" ? ITEMS.warframes : b.category === "weapon" ? ITEMS.weapons : ITEMS.companions;
    return bySlug(list, (b.subject || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }
  function subjectImageFor(b) { return (subjectFor(b) || {}).image || ""; }

  // Same best-effort "+NN% Stat Name" parsing as builder.js's statDeltas —
  // duplicated rather than shared, matching this site's per-page script pattern.
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
  // Archon Shard bonuses — hand-kept table duplicated from builder.js (WFCD's
  // item data doesn't carry shard effects; values from the official wiki).
  // Shards are saved in the build's data blob as [color, bonusIndex, tauforged].
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
      { text: "+150 Shield Capacity", tf: "+225 Shield Capacity", flat: { shield: 150 } },
      { text: "+50 Energy Max", tf: "+75 Energy Max", flat: { energy: 50 } },
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
  function statDeltas(subject, equipped, category, shardList) {
    const sums = {};
    equipped.filter(Boolean).forEach((m) => parseEffect(m.effect).forEach(({ stat, pct }) => { sums[stat] = (sums[stat] || 0) + pct; }));
    // Archon Shard bonuses — same hand-kept table as builder.js (duplicated
    // rather than shared, matching this site's per-page script pattern).
    // `pct` stacks with mod percentages; flat Azure values apply after all
    // percentage modifiers, per the wiki's stated ordering.
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
    const rows = [["Health", scaled(subject.health, "health"), ""], ["Shield", scaled(subject.shield, "shield"), ""], ["Armor", scaled(subject.armor, "armor"), ""]];
    if (category === "warframe") {
      rows.push(["Energy", scaled(subject.power, "energy"), ""], ["Sprint Speed", { value: Math.round((subject.sprintSpeed || 1) * (1 + (sums.sprintSpeed || 0) / 100) * 100) / 100, cls: abilityCls(sums.sprintSpeed || 0) }, ""]);
    }
    const abilityRows = category === "warframe" ? [["Duration", ability("duration"), "%"], ["Efficiency", ability("efficiency"), "%"], ["Range", ability("range"), "%"], ["Strength", ability("strength"), "%"]] : [];
    return { rows, abilityRows };
  }
  function statRow(label, d, suffix) { return `<div class="wf-stat-row"><span class="wf-stat-label">${esc(label)}</span><span class="wf-stat-value ${d.cls}">${d.value}${suffix}</span></div>`; }

  async function authedFetch(url, opts = {}) {
    const headers = Object.assign({}, opts.headers);
    if (window.NFTWAuth && window.NFTWAuth.token()) headers.Authorization = `Bearer ${window.NFTWAuth.token()}`;
    return fetch(url, Object.assign({}, opts, { headers }));
  }

  function buildCard(b) {
    const img = subjectImageFor(b);
    return `<a class="wf-build-card" href="builds.html?id=${encodeURIComponent(b.id)}" data-id="${esc(b.id)}">
      <div class="wf-build-card-head">
        ${img ? `<img src="${esc(img)}" alt="">` : ""}
        <div>
          <h3>${esc(b.title)}</h3>
          <p class="wf-build-card-sub">${esc(b.subject)} · ${esc(b.category)}</p>
        </div>
      </div>
      <p class="wf-build-card-meta">
        <span>by ${esc(b.author)}</span>
        <button type="button" class="wf-like-btn" data-like="${esc(b.id)}">♥ <span>${b.likes || 0}</span></button>
      </p>
    </a>`;
  }

  function wireLikeButtons(container) {
    container.querySelectorAll("[data-like]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!window.NFTWAuth || !window.NFTWAuth.token()) { window.NFTWAuth?.open?.("login"); return; }
        const id = btn.dataset.like;
        try {
          const res = await authedFetch(`${WORKER}/builds/${encodeURIComponent(id)}/like`, { method: "POST" });
          const out = await res.json();
          if (res.ok) {
            btn.classList.toggle("wf-liked", !!out.liked);
            btn.querySelector("span").textContent = out.likes;
          }
        } catch (e2) {}
      });
    });
  }

  async function renderList() {
    root.innerHTML = `
      <div class="wf-controls">
        <button type="button" class="wf-tab ${!category ? "active" : ""}" data-cat="">All</button>
        <button type="button" class="wf-tab ${category === "warframe" ? "active" : ""}" data-cat="warframe">Warframes</button>
        <button type="button" class="wf-tab ${category === "weapon" ? "active" : ""}" data-cat="weapon">Weapons</button>
        <button type="button" class="wf-tab ${category === "companion" ? "active" : ""}" data-cat="companion">Companions</button>
        <select id="wf-sort" class="wf-select" style="margin-left:auto">
          <option value="newest" ${sort === "newest" ? "selected" : ""}>Sort: Newest</option>
          <option value="likes" ${sort === "likes" ? "selected" : ""}>Sort: Most liked</option>
        </select>
      </div>
      <div class="wf-build-grid" id="wf-build-grid"><p class="wf-empty">Loading…</p></div>`;

    root.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => { category = b.dataset.cat; renderList(); }));
    document.getElementById("wf-sort").addEventListener("change", (e) => { sort = e.target.value; renderList(); });

    const grid = document.getElementById("wf-build-grid");
    try {
      const qs = new URLSearchParams();
      if (category) qs.set("category", category);
      if (sort === "likes") qs.set("sort", "likes");
      const res = await fetch(`${WORKER}/builds?${qs}`);
      const out = await res.json();
      const builds = out.builds || [];
      grid.innerHTML = builds.length ? builds.map(buildCard).join("") : `<p class="wf-empty">No builds yet — be the first from the <a href="builder.html" style="color:var(--wf-cyan-bright)">Build Creator</a>.</p>`;
      wireLikeButtons(grid);
    } catch (e) {
      grid.innerHTML = `<p class="wf-empty">Couldn't load the showcase right now.</p>`;
    }
  }

  async function renderDetail(id) {
    root.innerHTML = `<p class="wf-empty">Loading…</p>`;
    let b;
    try {
      const res = await fetch(`${WORKER}/builds/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("not found");
      b = await res.json();
    } catch (e) {
      root.innerHTML = `<p class="wf-empty">That build couldn't be found.</p><a class="wf-detail-back" href="builds.html">← Back to showcase</a>`;
      return;
    }
    const data = (() => { try { return JSON.parse(b.data); } catch { return {}; } })();
    const modList = b.category === "warframe" ? ITEMS.mods.filter((m) => m.type === "Warframe Mod") : ITEMS.mods;
    const slotName = (kind, slug) => {
      if (!slug) return null;
      const list = kind === "arcane" ? ITEMS.arcanes : ITEMS.mods;
      return bySlug(list, slug);
    };
    const subjImg = subjectImageFor(b);
    const RARITY_CLASS = { Common: "wf-r-common", Uncommon: "wf-r-uncommon", Rare: "wf-r-rare", Legendary: "wf-r-legendary", Riven: "wf-r-riven" };
    const POLARITY_COLORS = { madurai: "#e0514f", vazarin: "#4d8de0", naramon: "#e0cf4d", zenurik: "#a04de0", penjaga: "#6d8689", umbra: "#e0514f", unairu: "#c9a24d" };
    const polarityLabel = (p) => p.charAt(0).toUpperCase() + p.slice(1);
    const polBadge = (pol) => `<span class="wf-slot-pol" style="cursor:default;${pol ? `--pol:${POLARITY_COLORS[pol]}` : ""}" title="${pol ? esc(polarityLabel(pol)) : "No polarity"}"></span>`;
    const slotHtml = (item, pol) => item
      ? `<div class="wf-slot wf-mod-card ${item.rarity ? RARITY_CLASS[item.rarity] || "" : ""}" style="cursor:default">
          <span class="wf-mod-card-art">${item.image ? `<img src="${esc(item.image)}" alt="">` : `<span class="wf-slot-plus">${esc(item.name[0])}</span>`}</span>
          <span class="wf-mod-card-name">${esc(item.name)}</span>
          ${pol !== undefined ? polBadge(pol) : ""}
        </div>`
      : `<div class="wf-slot wf-slot-empty" style="cursor:default">${pol !== undefined ? polBadge(pol) : `<span class="wf-slot-plus">—</span>`}</div>`;
    const shardHtml = (s) => {
      const info = SHARDS[s.color], b = info.bonuses[s.bonus];
      const label = `${s.tf ? "Tauforged " : ""}${info.name} — ${s.tf ? b.tf : b.text}`;
      return `<div class="wf-slot wf-shard-slot" style="cursor:default" title="${esc(label)}">
        <span class="wf-shard-gem ${s.tf ? "wf-tauforged" : ""}" style="--shard:${info.color}"></span>
        <span class="wf-slot-name">${info.name}</span>
      </div>`;
    };

    const mods = (data.mods || []).map((s) => slotName("mod", s));
    const arcanes = (data.arcanes || []).map((s) => slotName("arcane", s));
    const aura = slotName("mod", data.aura);
    const exilus = slotName("mod", data.exilus);
    // Shards: [color, bonusIndex, tauforged] triples. Drop anything from an
    // unknown colour/bonus so old or hand-edited data blobs can't break
    // rendering of the rest of the build.
    const shards = (data.shards || []).map((s) =>
      Array.isArray(s) && SHARDS[s[0]] && SHARDS[s[0]].bonuses[s[1]] ? { color: s[0], bonus: s[1], tf: !!s[2] } : null
    ).filter(Boolean);
    const helminth = Array.isArray(data.helminth) ? (() => {
      const [slot, name, src] = data.helminth;
      const w = ITEMS.warframes.find((x) => x.name === src);
      const a = w && w.abilities.find((x) => x.name.toLowerCase() === name.toLowerCase());
      return { slot, name, src, desc: (a && a.desc) || "", icon: (a && a.icon) || "" };
    })() : null;
    const isMine = window.NFTWAuth && window.NFTWAuth.token() && window.NFTWAuth.email && b.author === (window.NFTWAuth.email() || "").split("@")[0];

    const subject = subjectFor(b);
    const abilityIconHtml = (item) => item.icon
      ? `<img src="${esc(item.icon)}" alt="" class="wf-ability-icon" loading="lazy">`
      : `<span class="wf-ability-icon wf-ability-icon-fallback">${esc((item.name || "?")[0])}</span>`;
    const abilitiesHtml = subject && subject.abilities && subject.abilities.length
      ? `<div class="wf-abilities">${subject.abilities.map((a, i) => {
          const swapped = helminth && helminth.slot === i;
          const shown = swapped ? helminth : a;
          return `<div class="wf-ability wf-ability-static${swapped ? " wf-ability-helminth" : ""}">
            ${swapped ? `<span class="wf-helminth-badge">HELMINTH</span>` : ""}
            ${abilityIconHtml(shown)}
            <span class="wf-ability-body"><b>${esc(shown.name)}</b><span>${esc(shown.desc || "")}</span>${swapped ? `<span class="wf-muted-note">from ${esc(helminth.src)}</span>` : ""}</span>
          </div>`;
        }).join("")}</div>`
      : "";
    let statPanel = "";
    if (subject && subject.health != null) {
      const d = statDeltas(subject, [...mods, aura, exilus], b.category, b.category === "warframe" ? shards : null);
      statPanel = `<div class="wf-stat-panel">
        <div class="wf-stat-group">${d.rows.map(([l, v, s]) => statRow(l, v, s)).join("")}</div>
        ${d.abilityRows.length ? `<p class="wf-tag" style="margin-top:16px">Ability</p><div class="wf-stat-group">${d.abilityRows.map(([l, v, s]) => statRow(l, v, s)).join("")}</div>` : ""}
      </div>`;
    }

    root.innerHTML = `
      <a class="wf-detail-back" href="builds.html">← Back to showcase</a>
      <section class="wf-panel wf-build-area" style="--wfc: var(--wf-cyan);">
        <div class="wf-corner tl"></div>
        <div class="wf-build-head">
          ${subjImg ? `<img src="${esc(subjImg)}" alt="" class="wf-build-portrait">` : ""}
          <div>
            <h2>${esc(b.title)}</h2>
            <p class="wf-build-card-sub">${esc(b.subject)} · ${esc(b.category)} · by ${esc(b.author)}</p>
          </div>
        </div>
        ${data.notes ? `<p style="margin:0 0 20px; color:var(--wf-muted); font-size:.88rem; line-height:1.5">${esc(data.notes)}</p>` : ""}
        ${abilitiesHtml}

        <div class="wf-arsenal">
          ${statPanel}
          <div class="wf-arsenal-main">
            ${(b.category === "warframe" && aura) || exilus ? `<div class="wf-aura-row">
              ${b.category === "warframe" && aura ? slotHtml(aura) : ""}
              ${exilus ? slotHtml(exilus) : ""}
            </div>` : ""}
            <div class="wf-slot-section">
              <p class="wf-tag" style="color:var(--wf-cyan)">Mods</p>
              <div class="wf-slot-grid wf-slot-grid-4">${mods.map((m, i) => slotHtml(m, (data.polarities || [])[i] ?? null)).join("")}</div>
            </div>
            ${arcanes.length ? `<div class="wf-slot-section">
              <p class="wf-tag" style="color:var(--wf-amber)">Arcanes</p>
              <div class="wf-slot-grid wf-slot-grid-2">${arcanes.map(slotHtml).join("")}</div>
            </div>` : ""}
            ${b.category === "warframe" && shards.length ? `<div class="wf-slot-section">
              <p class="wf-tag" style="color:var(--wf-cyan-bright)">Archon Shards <span class="wf-muted-note" style="text-transform:none; letter-spacing:0; font-weight:400">(5 per Warframe)</span></p>
              <div class="wf-slot-grid wf-slot-grid-5">${shards.map(shardHtml).join("")}</div>
            </div>` : ""}
          </div>
        </div>

        <div class="wf-build-actions">
          <button type="button" class="wf-like-btn" data-like="${esc(b.id)}" style="font-size:.9rem">♥ <span>${b.likes || 0}</span></button>
          ${isMine ? `<button type="button" class="wf-redeem-btn" id="wf-delete" style="color:#ff8a8a; border-color:rgba(255,90,90,.4)">Delete build</button>` : ""}
        </div>
      </section>`;
    wireLikeButtons(root);
    document.getElementById("wf-delete")?.addEventListener("click", async () => {
      const pt = localStorage.getItem("nftw:lang") === "pt";
      if (!confirm(pt ? "Eliminar esta build? Isto não pode ser desfeito." : "Delete this build? This can't be undone.")) return;
      const res = await authedFetch(`${WORKER}/builds/${encodeURIComponent(b.id)}`, { method: "DELETE" });
      if (res.ok) location.href = "builds.html";
    });
  }

  (async function init() {
    try {
      ITEMS = await (await fetch(`../../data/warframe/items.json?cb=${Date.now()}`)).json();
    } catch (e) {
      root.innerHTML = `<p class="wf-empty">Couldn't load the item database.</p>`;
      return;
    }
    const id = params.get("id");
    if (id) renderDetail(id); else renderList();
  })();
})();
