/* Warframe hub page — bespoke (see assets/css/games/warframe.css for why
   this doesn't use the shared generic game.js template). Same data
   sources and behaviour as every other game page (GAMES.warframe.tools,
   data/news/warframe.json, data/codes/warframe.json, the same
   nftw:codes:warframe:<code> localStorage key a visitor's "used" marks
   already live under), just its own markup/visuals. */
(function () {
  const game = GAMES.find((g) => g.id === "warframe");
  if (!game) return;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ICONS = {
    worldstate: '<circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"></path>',
    cycles: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2"></path>',
    drops: '<rect x="3" y="4" width="18" height="16" rx="1"></rect><path d="M3 9h18M9 9v11"></path>',
  };
  const icon = (id) => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${ICONS[id] || ICONS.worldstate}</svg>`;

  document.getElementById("bc-game").textContent = game.name;
  document.getElementById("wf-blurb").textContent = game.blurb;

  // ---- Reset countdowns ----
  if (game.reset) {
    const nextDaily = (r) => {
      const now = new Date(), d = new Date(now);
      if (r.utc) { d.setUTCHours(r.h, r.m, 0, 0); if (d <= now) d.setUTCDate(d.getUTCDate() + 1); }
      else { d.setHours(r.h, r.m, 0, 0); if (d <= now) d.setDate(d.getDate() + 1); }
      return d.getTime();
    };
    const nextWeekly = (r) => {
      const now = new Date(), d = new Date(now);
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
    const widget = document.getElementById("wf-reset");
    const tick = () => {
      const now = Date.now();
      const parts = [];
      if (game.reset.daily) parts.push(`<div class="wf-reset-item"><p>Daily reset</p><p>${fmt(nextDaily(game.reset.daily) - now)}</p></div>`);
      if (game.reset.daily && game.reset.weekly) parts.push(`<div class="wf-reset-divider"></div>`);
      if (game.reset.weekly) parts.push(`<div class="wf-reset-item"><p>Weekly reset</p><p>${fmt(nextWeekly(game.reset.weekly) - now)}</p></div>`);
      widget.innerHTML = parts.join("");
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---- Tools tab ----
  const localHref = (href) => href.replace(`games/${game.id}/`, "");
  const toolGrid = document.getElementById("wf-tool-grid");
  const toolEmpty = document.getElementById("wf-tool-empty");
  let tq = "", tsort = "default", tview = "grid";

  function renderTools() {
    let list = game.tools.filter((t) => (t.name + " " + t.type).toLowerCase().includes(tq));
    if (tsort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (tsort === "za") list.sort((a, b) => b.name.localeCompare(a.name));

    toolGrid.classList.toggle("wf-view-list", tview === "list");
    toolGrid.innerHTML = list.map((tool) => {
      const inner = `<span class="wf-tag"><span class="wf-dot${tool.type === "database" ? " amber" : ""}"></span>${esc(tool.type)}</span>
        <h3>${esc(tool.name)}</h3><p>${esc(tool.desc)}</p>`;
      return tool.available
        ? `<a class="wf-tool-card" href="${localHref(tool.href)}">${icon(tool.id)}${inner}</a>`
        : `<div class="wf-tool-card wf-disabled">${icon(tool.id)}${inner}<span class="wf-soon">soon</span></div>`;
    }).join("");
    toolEmpty.style.display = list.length ? "none" : "block";
    if (!game.tools.length) toolGrid.innerHTML = `<p class="wf-empty">No tools yet — coming soon.</p>`;
  }
  document.getElementById("wf-tool-search").addEventListener("input", (e) => { tq = e.target.value.trim().toLowerCase(); renderTools(); });
  document.getElementById("wf-tool-sort").addEventListener("change", (e) => { tsort = e.target.value; renderTools(); });
  document.getElementById("wf-tool-view").querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      tview = b.dataset.view;
      document.getElementById("wf-tool-view").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      renderTools();
    }));
  renderTools();

  // ---- Tab switching (lazy-load news/codes) ----
  let newsLoaded = false, codesLoaded = false;
  document.querySelectorAll(".wf-tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      document.querySelectorAll(".wf-tab").forEach((t) => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
      document.querySelectorAll(".wf-panel-body").forEach((p) => p.toggleAttribute("data-active", p.dataset.panel === name));
      if (name === "news" && !newsLoaded) { newsLoaded = true; loadNews(); }
      if (name === "codes" && !codesLoaded) { codesLoaded = true; loadCodes(); }
    }));

  // ---- News tab ----
  async function loadNews() {
    const root = document.getElementById("wf-news-root");
    try {
      const res = await fetch(`../../data/news/${game.id}.json?cb=${Date.now()}`);
      if (!res.ok) throw new Error("no file");
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) throw new Error("empty");
      root.innerHTML = `<div class="wf-news-grid">` + items.map((it, i) => {
        const date = it.date ? new Date(it.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
        return `<a class="wf-news-card" href="../../article.html?g=${game.id}&i=${i}">
          <span class="wf-news-thumb">${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy" onerror="this.closest('.wf-news-thumb').classList.add('wf-no-img')">` : ""}</span>
          <span class="wf-news-body">
            <span class="wf-news-title">${esc(it.title)}</span>
            ${it.summary ? `<span class="wf-news-snippet">${esc(it.summary)}</span>` : ""}
            <span class="wf-news-meta">${esc(it.source || "")}${it.source && date ? " · " : ""}${date}</span>
          </span>
        </a>`;
      }).join("") + `</div>`;
    } catch (e) {
      root.innerHTML = `<p class="wf-empty">No news data yet — the news updater hasn't published this game's headlines.</p>`;
    }
  }

  // ---- Codes tab ----
  async function loadCodes() {
    const root = document.getElementById("wf-codes-root");
    try {
      const res = await fetch(`../../data/codes/${game.id}.json?cb=${Date.now()}`);
      if (!res.ok) throw new Error("no file");
      const data = await res.json();
      renderCodes(root, data);
    } catch (e) {
      root.innerHTML = `<p class="wf-empty">No codes data yet — the updater hasn't published this game's list.</p>`;
    }
  }

  function renderCodes(root, data) {
    const now = Date.now();
    const isExpired = (c) => c.expired || (c.expires && new Date(c.expires).getTime() < now);
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
        ? `<span class="wf-code-valid wf-expired">Expired</span>`
        : c.expires
          ? `<span class="wf-code-valid">Expires ${new Date(c.expires).toLocaleDateString()}</span>`
          : `<span class="wf-code-valid wf-ok">Active</span>`;
      return `<div class="wf-code-row ${expired ? "wf-is-expired" : ""} ${used ? "wf-is-used" : ""}" data-code="${esc(c.code)}">
        <input type="checkbox" class="wf-code-check" ${used ? "checked" : ""} aria-label="Mark used">
        <div class="wf-code-main">
          <code class="wf-code-text">${esc(c.code)}</code>
          <span class="wf-code-reward">${esc(c.reward || "")}</span>
        </div>
        <div class="wf-code-side">
          ${valid}
          ${added ? `<span class="wf-code-added">Added ${added}</span>` : ""}
        </div>
        <button class="wf-code-copy">Copy</button>
      </div>`;
    }).join("");

    root.innerHTML = `
      <div class="wf-codes-head">
        <p class="wf-codes-updated">${activeCount} active · ${codes.length} total · updated ${upd || "—"}</p>
        ${data.redeem ? `<a class="wf-redeem-btn" href="${esc(data.redeem)}" target="_blank" rel="noopener">Redeem codes ↗</a>` : ""}
      </div>
      ${data.note ? `<p class="wf-codes-note">${esc(data.note)}</p>` : ""}
      <div class="wf-codes-list">${rowsHtml || `<p class="wf-empty">No codes right now.</p>`}</div>`;

    root.querySelectorAll(".wf-code-row").forEach((row) => {
      const code = row.dataset.code;
      const check = row.querySelector(".wf-code-check");
      const setUsed = (v) => {
        if (v) localStorage.setItem(usedKey(code), "1"); else localStorage.removeItem(usedKey(code));
        row.classList.toggle("wf-is-used", v);
        check.checked = v;
      };
      check.addEventListener("change", () => setUsed(check.checked));
      row.querySelector(".wf-code-copy").addEventListener("click", (e) => {
        navigator.clipboard?.writeText(code);
        setUsed(true);
        const btn = e.target;
        btn.textContent = "Copied ✓";
        setTimeout(() => (btn.textContent = "Copy"), 1500);
      });
    });
  }
})();
