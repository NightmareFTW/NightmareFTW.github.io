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
     eligible pool. */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const root = document.getElementById("wf-builder");
  const WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  const REGULAR_SLOTS = 8;
  const ARCANE_SLOTS = 2;
  const CAPACITY = 60; // rank 30 + Orokin Reactor/Catalyst

  let DATA = null;
  let category = "warframe"; // warframe | weapon | companion
  let subject = null;        // the chosen item object
  let mods = new Array(REGULAR_SLOTS).fill(null);
  let aura = null, exilus = null;
  let arcanes = new Array(ARCANE_SLOTS).fill(null);
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

  function polarityIcon(p) {
    const COLORS = { madurai: "#e0514f", vazarin: "#4d8de0", naramon: "#e0cf4d", zenurik: "#a04de0", penjaga: "#6d8689", umbra: "#e0514f", unairu: "#c9a24d" };
    return `<span class="wf-pol" style="background:${COLORS[p] || "#6d8689"}" title="${esc(p || "")}"></span>`;
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

  function slotButton(kind, idx, item, pool) {
    const empty = !item;
    return `<button type="button" class="wf-slot ${empty ? "wf-slot-empty" : ""}" data-kind="${kind}" data-idx="${idx}">
      ${empty
        ? `<span class="wf-slot-plus">+</span>`
        : `${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy">` : `<span class="wf-slot-plus">${esc(item.name[0])}</span>`}
           <span class="wf-slot-name">${esc(item.name)}</span>
           ${item.polarity ? polarityIcon(item.polarity) : ""}`}
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

      ${subject ? `
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
            <div class="wf-abilities">${subject.abilities.map((a) => `<div class="wf-ability"><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div>`).join("")}</div>
          ` : ""}

          <div class="wf-capacity">
            <div class="wf-capacity-bar"><div class="wf-capacity-fill ${over ? "wf-over" : ""}" style="width:${Math.min(100, (used / CAPACITY) * 100)}%"></div></div>
            <p class="${over ? "wf-over-text" : ""}">${used} / ${CAPACITY} capacity ${over ? "— over capacity" : ""} <span class="wf-muted-note">(rank 30 + reactor assumed)</span></p>
          </div>

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

          <div class="wf-slot-section">
            <p class="wf-tag">Build details</p>
            <input type="text" id="wf-title" class="wf-input" placeholder="Build title…" value="${esc(title)}" style="margin-bottom:8px">
            <textarea id="wf-notes" class="wf-input" placeholder="Notes (playstyle, forma order, anything else)…" rows="3" style="width:100%; resize:vertical; font-family:inherit">${esc(notes)}</textarea>
          </div>

          <div class="wf-build-actions">
            <button type="button" class="wf-code-copy" id="wf-save">Save to showcase</button>
            <span id="wf-save-msg" class="wf-muted-note"></span>
          </div>
        </section>
      ` : `<p class="wf-empty">Pick a ${esc(category)} above to start modding.</p>`}

      <div class="wf-picker" id="wf-picker" hidden>
        <div class="wf-picker-inner">
          <div class="wf-picker-head">
            <input type="search" id="wf-picker-search" class="wf-input" placeholder="Search…" autocomplete="off">
            <button type="button" class="wf-picker-close" id="wf-picker-close" aria-label="Close">&times;</button>
          </div>
          <div class="wf-picker-list" id="wf-picker-list"></div>
        </div>
      </div>`;

    wire();
  }

  function wire() {
    root.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
      category = b.dataset.cat; subject = null; mods = new Array(REGULAR_SLOTS).fill(null);
      aura = null; exilus = null; arcanes = new Array(ARCANE_SLOTS).fill(null);
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
        render();
      }));
    }
    searchEl.addEventListener("input", (e) => renderSubjectList(e.target.value.trim()));
    if (subject) renderSubjectList("");

    document.getElementById("wf-title")?.addEventListener("input", (e) => { title = e.target.value; });
    document.getElementById("wf-notes")?.addEventListener("input", (e) => { notes = e.target.value; });

    root.querySelectorAll(".wf-slot").forEach((btn) => btn.addEventListener("click", () => openPicker(btn.dataset.kind, Number(btn.dataset.idx))));
    document.getElementById("wf-save")?.addEventListener("click", saveBuild);
  }

  function openPicker(kind, idx) {
    const picker = document.getElementById("wf-picker");
    const listEl = document.getElementById("wf-picker-list");
    const searchEl = document.getElementById("wf-picker-search");
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
    function renderList(q) {
      const list = (q ? pool.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())) : pool).slice(0, 80);
      listEl.innerHTML = list.map((m) => `<button type="button" class="wf-picker-item" data-slug="${esc(m.slug)}">
        ${m.image ? `<img src="${esc(m.image)}" alt="">` : ""}
        <span class="wf-picker-item-body"><b>${esc(m.name)}</b><span>${esc(m.effect || m.type || "")}</span></span>
        ${m.polarity ? polarityIcon(m.polarity) : ""}
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
        arcanes: arcanes.map((a) => a && a.slug), notes: notes.trim(),
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
