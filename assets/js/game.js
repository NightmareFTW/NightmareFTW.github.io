/* Renders a game detail page with tabs: Tools, News, Codes.
   Reads <body data-game="id">. Tool hrefs in data.js are root-relative. */
(function () {
  const id = document.body.dataset.game;
  const game = GAMES.find((g) => g.id === id);
  if (!game) return;

  // Per-game news search query and which games actually have redeem codes.
  const NEWS_QUERY = {
    phasmophobia: "Phasmophobia game",
    "outlast-trials": "The Outlast Trials game",
    ffxiv: "Final Fantasy XIV",
    epic7: "Epic Seven game",
    nte: "Neverness to Everness game",
    warframe: "Warframe game",
  };
  const CODES_GAMES = new Set(["epic7", "nte", "warframe"]);

  document.title = `${game.name} · NightmareFTW`;
  document.getElementById("bc-game").textContent = game.name;

  document.getElementById("game-hero").innerHTML = `
    <div class="game-hero-banner" style="background:${game.color}">
      <img src="../../${game.banner}" alt="${game.name}">
    </div>
    <div class="game-hero-text">
      <h1>${game.name}</h1>
      <p>${game.blurb}</p>
    </div>`;

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

  // ---- News tab (live via Google News RSS + CORS proxy) ----
  async function loadNews() {
    const root = document.getElementById("news-root");
    const q = NEWS_QUERY[game.id] || game.name;
    const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(rss)}`;
    try {
      const txt = await (await fetch(proxy)).text();
      const xml = new DOMParser().parseFromString(txt, "text/xml");
      const items = [...xml.querySelectorAll("item")].slice(0, 15);
      if (!items.length) throw new Error("empty");
      root.innerHTML = items.map((it) => {
        const title = it.querySelector("title")?.textContent || "";
        const link = it.querySelector("link")?.textContent || "#";
        const src = it.querySelector("source")?.textContent || "";
        const d = it.querySelector("pubDate")?.textContent;
        const date = d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
        return `<a class="news-row" href="${link}" target="_blank" rel="noopener">
          <span class="news-title">${title}</span>
          <span class="news-meta">${src}${src && date ? " · " : ""}${date}</span>
        </a>`;
      }).join("");
    } catch (e) {
      root.innerHTML = `<p class="tool-note">Couldn't load live news right now (the news proxy may be down). Try again later.</p>`;
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
    const codes = data.codes || [];
    const upd = data.updated ? new Date(data.updated).toLocaleString() : "";
    const usedKey = (c) => `nftw:codes:${game.id}:${c}`;

    const rowsHtml = codes.map((c) => {
      const expired = c.expired || (c.expires && new Date(c.expires).getTime() < now);
      const used = localStorage.getItem(usedKey(c.code)) === "1";
      const valid = expired
        ? `<span class="code-valid expired">Expired</span>`
        : c.expires
          ? `<span class="code-valid">Expires ${new Date(c.expires).toLocaleDateString()}</span>`
          : `<span class="code-valid">No expiry listed</span>`;
      return `<div class="code-row ${expired ? "is-expired" : ""} ${used ? "is-used" : ""}" data-code="${c.code}">
        <input type="checkbox" class="code-check" ${used ? "checked" : ""}>
        <div class="code-main">
          <code class="code-text">${esc(c.code)}</code>
          <span class="code-reward">${esc(c.reward || "")}</span>
        </div>
        ${valid}
        <button class="btn code-copy">Copy</button>
      </div>`;
    }).join("");

    root.innerHTML = `
      <p class="codes-updated">${codes.length} codes · updated ${upd || "—"}</p>
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
