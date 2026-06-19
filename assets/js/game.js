/* Renders a game detail page with tabs: Tools, News, Codes.
   Reads <body data-game="id">. Tool hrefs in data.js are root-relative. */
(function () {
  const id = document.body.dataset.game;
  const game = GAMES.find((g) => g.id === id);
  if (!game) return;

  // Which games actually have redeem codes (others show a friendly note).
  const CODES_GAMES = new Set(["epic7", "nte", "warframe", "dreamlight-valley"]);

  document.title = `${game.name} · NightmareFTW`;
  document.getElementById("bc-game").textContent = game.name;

  document.getElementById("game-hero").innerHTML = `
    <div class="game-hero-banner" style="background:${game.color}">
      <img src="../../${game.banner}" alt="${game.name}">
    </div>
    <div class="game-hero-text">
      <h1>${game.name}</h1>
      <p>${game.blurb}</p>
    </div>
    ${game.reset ? `<div class="reset-widget" id="reset-widget"></div>` : ""}`;

  // ---- Reset countdowns (only for games with a daily/weekly reset) ----
  if (game.reset) {
    // Next occurrence (ms) of a daily reset at h:m, in UTC or local time.
    const nextDaily = (r) => {
      const now = new Date();
      const d = new Date(now);
      if (r.utc) { d.setUTCHours(r.h, r.m, 0, 0); if (d <= now) d.setUTCDate(d.getUTCDate() + 1); }
      else { d.setHours(r.h, r.m, 0, 0); if (d <= now) d.setDate(d.getDate() + 1); }
      return d.getTime();
    };
    // Next occurrence of a weekly reset on day-of-week `dow` at h:m.
    const nextWeekly = (r) => {
      const now = new Date();
      const d = new Date(now);
      if (r.utc) {
        d.setUTCHours(r.h, r.m, 0, 0);
        let add = (r.dow - d.getUTCDay() + 7) % 7;
        if (add === 0 && d <= now) add = 7;
        d.setUTCDate(d.getUTCDate() + add);
      } else {
        d.setHours(r.h, r.m, 0, 0);
        let add = (r.dow - d.getDay() + 7) % 7;
        if (add === 0 && d <= now) add = 7;
        d.setDate(d.getDate() + add);
      }
      return d.getTime();
    };
    const fmt = (ms) => {
      const s = Math.max(0, Math.floor(ms / 1000));
      const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      const p = (n) => String(n).padStart(2, "0");
      return d > 0 ? `${d}d ${h}h ${p(m)}m` : `${p(h)}:${p(m)}:${p(sec)}`;
    };
    const widget = document.getElementById("reset-widget");
    const tick = () => {
      const now = Date.now();
      const parts = [];
      if (game.reset.daily) parts.push(`<div class="reset-item"><span class="reset-label">Daily reset</span><span class="reset-time">${fmt(nextDaily(game.reset.daily) - now)}</span></div>`);
      if (game.reset.weekly) parts.push(`<div class="reset-item"><span class="reset-label">Weekly reset</span><span class="reset-time">${fmt(nextWeekly(game.reset.weekly) - now)}</span></div>`);
      widget.innerHTML = parts.join("");
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---- Build tabs ----
  const oldGrid = document.getElementById("tool-grid");
  if (oldGrid) oldGrid.remove();
  const main = document.querySelector("main.container");
  main.insertAdjacentHTML("beforeend", `
    <div class="tabs" id="tabs">
      <button class="tab active" data-tab="tools">Tools</button>
      <button class="tab" data-tab="news">News</button>
      <button class="tab" data-tab="codes">Codes</button>
    </div>
    <section class="tab-panel" data-panel="tools">
      <div class="list-controls">
        <input type="search" id="tool-search" class="search-input" placeholder="Search tools…" autocomplete="off">
        <select id="tool-sort" class="sort-select">
          <option value="default">Sort: Default</option>
          <option value="az">Name A–Z</option>
          <option value="za">Name Z–A</option>
        </select>
        <div class="view-toggle" id="tool-view">
          <button data-view="grid" class="active" title="Grid">▦</button>
          <button data-view="list" title="List">≣</button>
        </div>
      </div>
      <div class="tool-grid" id="tool-grid"></div>
      <p id="tool-empty" class="no-results" style="display:none">No tools match.</p>
    </section>
    <section class="tab-panel" data-panel="news" style="display:none">
      <div id="news-root"><p style="color:var(--muted)">Loading news…</p></div>
    </section>
    <section class="tab-panel" data-panel="codes" style="display:none">
      <div id="codes-root"><p style="color:var(--muted)">Loading codes…</p></div>
    </section>`);

  // ---- Tools tab ----
  const localHref = (href) => href.replace(`games/${game.id}/`, "");
  const toolGrid = document.getElementById("tool-grid");
  const toolEmpty = document.getElementById("tool-empty");
  let tq = "", tsort = "default", tview = "grid";

  function renderTools() {
    let list = game.tools.filter((t) =>
      (t.name + " " + t.type).toLowerCase().includes(tq));
    if (tsort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (tsort === "za") list.sort((a, b) => b.name.localeCompare(a.name));

    toolGrid.className = `tool-grid view-${tview}`;
    toolGrid.innerHTML = list.map((tool) => {
      const inner = `<span class="tool-type">${tool.type}</span><h3>${tool.name}</h3><p>${tool.desc}</p>`;
      return tool.available
        ? `<a class="tool-card" href="${localHref(tool.href)}">${inner}</a>`
        : `<div class="tool-card disabled">${inner}<p style="margin-top:10px"><span class="soon-badge">soon</span></p></div>`;
    }).join("");
    toolEmpty.style.display = list.length ? "none" : "block";
    if (!game.tools.length) toolGrid.innerHTML = `<p style="color:var(--muted)">No tools yet — coming soon.</p>`;
  }
  document.getElementById("tool-search").addEventListener("input", (e) => { tq = e.target.value.trim().toLowerCase(); renderTools(); });
  document.getElementById("tool-sort").addEventListener("change", (e) => { tsort = e.target.value; renderTools(); });
  document.getElementById("tool-view").querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      tview = b.dataset.view;
      document.getElementById("tool-view").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      renderTools();
    }));
  renderTools();

  // ---- Tab switching (lazy-load news/codes) ----
  let newsLoaded = false, codesLoaded = false;
  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".tab-panel").forEach((p) =>
        p.style.display = p.dataset.panel === name ? "" : "none");
      if (name === "news" && !newsLoaded) { newsLoaded = true; loadNews(); }
      if (name === "codes" && !codesLoaded) { codesLoaded = true; loadCodes(); }
    }));

  // ---- News tab (reads data/news/<id>.json, refreshed by a GitHub Action) ----
  async function loadNews() {
    const root = document.getElementById("news-root");
    try {
      const res = await fetch(`../../data/news/${game.id}.json?cb=${Date.now()}`);
      if (!res.ok) throw new Error("no file");
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) throw new Error("empty");
      const updated = data.updated ? new Date(data.updated).toLocaleString() : "";
      root.innerHTML =
        `<p class="codes-updated">${items.length} headlines · updated ${updated}</p>` +
        `<div class="news-grid">` + items.map((it, i) => {
          const date = it.date ? new Date(it.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
          return `<a class="news-card" href="../../article.html?g=${game.id}&i=${i}">
            <span class="news-thumb">${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy" onerror="this.closest('.news-thumb').classList.add('no-img')">` : ""}</span>
            <span class="news-body">
              <span class="news-title">${esc(it.title)}</span>
              ${it.summary ? `<span class="news-snippet">${esc(it.summary)}</span>` : ""}
              <span class="news-meta">${esc(it.source || "")}${it.source && date ? " · " : ""}${date}</span>
            </span>
          </a>`;
        }).join("") + `</div>`;
    } catch (e) {
      root.innerHTML = `<p class="tool-note">No news data yet — the news updater hasn't published this game's headlines.</p>`;
    }
  }

  // ---- Codes tab (reads data/codes/<id>.json, kept fresh by a GitHub Action) ----
  async function loadCodes() {
    const root = document.getElementById("codes-root");
    if (!CODES_GAMES.has(game.id)) {
      root.innerHTML = `<p class="tool-note">${game.name} doesn't use redeemable codes.</p>`;
      return;
    }
    try {
      const res = await fetch(`../../data/codes/${game.id}.json?cb=${Date.now()}`);
      if (!res.ok) throw new Error("no file");
      const data = await res.json();
      renderCodes(root, data);
    } catch (e) {
      root.innerHTML = `<p class="tool-note">No codes data yet — the updater hasn't published this game's list.</p>`;
    }
  }

  // Escape user/data text before injecting into innerHTML (codes can contain "<").
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function renderCodes(root, data) {
    const now = Date.now();
    const isExpired = (c) => c.expired || (c.expires && new Date(c.expires).getTime() < now);
    // Newest first (by added date), active above expired. Codes without an
    // `added` date keep their source order (V8 sort is stable).
    const codes = (data.codes || []).slice().sort((a, b) =>
      (isExpired(a) ? 1 : 0) - (isExpired(b) ? 1 : 0) || (b.added || "").localeCompare(a.added || ""));
    const upd = data.updated ? new Date(data.updated).toLocaleString() : "";
    const usedKey = (c) => `nftw:codes:${game.id}:${c}`;
    const fmtDate = (s) => { const d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); };
    const activeCount = codes.filter((c) => !isExpired(c)).length;

    const rowsHtml = codes.map((c) => {
      const expired = isExpired(c);
      const used = localStorage.getItem(usedKey(c.code)) === "1";
      const added = c.added ? fmtDate(c.added) : "";
      const valid = expired
        ? `<span class="code-valid expired">Expired</span>`
        : c.expires
          ? `<span class="code-valid">Expires ${new Date(c.expires).toLocaleDateString()}</span>`
          : `<span class="code-valid ok">Active</span>`;
      return `<div class="code-row ${expired ? "is-expired" : ""} ${used ? "is-used" : ""}" data-code="${c.code}">
        <input type="checkbox" class="code-check" ${used ? "checked" : ""}>
        <div class="code-main">
          <code class="code-text">${esc(c.code)}</code>
          <span class="code-reward">${esc(c.reward || "")}</span>
        </div>
        <div class="code-side">
          ${valid}
          ${added ? `<span class="code-added">Added ${added}</span>` : ""}
        </div>
        <button class="btn code-copy">Copy</button>
      </div>`;
    }).join("");

    root.innerHTML = `
      <p class="codes-updated">${activeCount} active · ${codes.length} total · updated ${upd || "—"}</p>
      <div class="codes-list">${rowsHtml || `<p style="color:var(--muted)">No codes right now.</p>`}</div>`;

    root.querySelectorAll(".code-row").forEach((row) => {
      const code = row.dataset.code;
      const check = row.querySelector(".code-check");
      const setUsed = (v) => {
        if (v) localStorage.setItem(usedKey(code), "1"); else localStorage.removeItem(usedKey(code));
        row.classList.toggle("is-used", v);
        check.checked = v;
      };
      check.addEventListener("change", () => setUsed(check.checked));
      row.querySelector(".code-copy").addEventListener("click", (e) => {
        navigator.clipboard?.writeText(code);
        setUsed(true);
        const btn = e.target;
        btn.textContent = "Copied ✓";
        setTimeout(() => (btn.textContent = "Copy"), 1500);
      });
    });
  }
})();
