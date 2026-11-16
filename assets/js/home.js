/* Home / Hub — the "Console" launcher.
   A fixed game index (the rail) on the left and a stage on the right that
   swaps the active game client-side: hero key art, its tools as a menu, and a
   "What's New" feed. Reads GAMES / SITE_UPDATES from data.js. Keyboard-driven
   (/ to search, ↑/↓ to move through the library, Enter to open the first tool)
   and a clickable "spectrum" strip mapping the whole library. Pins reuse the
   real synced nftw:pinnedGames key (auth.js syncs them across devices). All
   visible strings are English; i18n.js translates the page to PT-PT via its
   dictionary + MutationObserver, so no language branching lives here (only the
   date format is picked directly, same as the rest of the site). */
(function () {
  "use strict";
  if (typeof GAMES === "undefined" || !document.getElementById("rail-list")) return;

  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]); }); };
  var LIST = GAMES.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  var UPDATES = (typeof SITE_UPDATES !== "undefined" ? SITE_UPDATES : []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });

  var LANG = (function () { try { return localStorage.getItem("nftw:lang") === "pt" ? "pt" : "en"; } catch (e) { return "en"; } })();
  var fmtDate = function (iso) {
    try { return new Date(iso + "T00:00:00").toLocaleDateString(LANG === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "short" }); }
    catch (e) { return iso; }
  };
  var liveCount = function (g) { return g.tools.filter(function (t) { return t.available && t.type === "live"; }).length; };
  var onCount = function (g) { return g.tools.filter(function (t) { return t.available; }).length; };
  var gamePage = function (g) { return onCount(g) ? "games/" + g.id + "/index.html" : null; };

  var PIN_KEY = "nftw:pinnedGames";
  var loadPins = function () { try { var a = JSON.parse(localStorage.getItem(PIN_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  var savePins = function (a) { try { localStorage.setItem(PIN_KEY, JSON.stringify(a)); } catch (e) {} };
  var pins = loadPins().filter(function (id) { return byId(id); });
  var isPinned = function (id) { return pins.indexOf(id) >= 0; };

  var PIN_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M9 3h6l-1 2v5l3 3v2h-5v5l-1 2-1-2v-5H4v-2l3-3V5z" fill="currentColor"/></svg>';

  function byId(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return null; }
  function idxOf(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return i; return -1; }
  function updGame(u) { var m = String(u.href || "").match(/games\/([^\/]+)\//); return m ? m[1] : null; }

  var el = {
    railList: document.getElementById("rail-list"), railEmpty: document.getElementById("rail-empty"),
    libCount: document.getElementById("lib-count"), pinned: document.getElementById("pinned"), pinnedList: document.getElementById("pinned-list"),
    spectrum: document.getElementById("spectrum"), hero: document.getElementById("hero"), tools: document.getElementById("tools"),
    toolCount: document.getElementById("tool-count"), feed: document.getElementById("feed"), feedCount: document.getElementById("feed-count"),
    crumb: document.getElementById("crumb"), q: document.getElementById("q"), filters: document.getElementById("filters"),
  };
  var state = { active: null, query: "", filter: "all" };

  // ---------- matching / filtering ----------
  function matchQuery(g, q) {
    if (!q) return true;
    if (g.name.toLowerCase().indexOf(q) >= 0) return true;
    return g.tools.some(function (t) { return t.name.toLowerCase().indexOf(q) >= 0 || t.type.indexOf(q) >= 0; });
  }
  function matchFilter(g, f) {
    if (f === "all") return true;
    if (f === "live") return liveCount(g) > 0;
    return g.tools.some(function (t) { return t.available && t.type === f; });
  }
  function visibleGames() { return LIST.filter(function (g) { return matchQuery(g, state.query) && matchFilter(g, state.filter); }); }

  // ---------- rail ----------
  function rowHtml(g, withIx) {
    var i = idxOf(g.id), lc = liveCount(g), on = onCount(g);
    var ct = lc > 0 ? '<span class="ct live num">' + on + "</span>" : '<span class="ct num">' + on + "</span>";
    var ixCell = withIx ? '<span class="ix num">' + String(i + 1).padStart(2, "0") + "</span>" : "";
    var pinned = isPinned(g.id);
    return '<div class="g-row" data-id="' + g.id + '" aria-current="' + (g.id === state.active) + '" style="--g:' + g.color + '">' +
      ixCell +
      '<img class="th" src="' + esc(g.banner) + '" alt="" width="34" height="22" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
      '<button class="nm" type="button" data-open="' + g.id + '">' + esc(g.name) + "</button>" + ct +
      '<button class="pin' + (pinned ? " on" : "") + '" type="button" data-pin="' + g.id + '" aria-pressed="' + pinned + '" title="Pin game" aria-label="Pin game">' + PIN_SVG + "</button>" +
      "</div>";
  }
  function renderRail() {
    var vis = visibleGames();
    el.railList.innerHTML = vis.map(function (g) { return rowHtml(g, true); }).join("");
    el.railEmpty.hidden = vis.length > 0;
    el.libCount.textContent = (state.query || state.filter !== "all") ? (vis.length + " of " + LIST.length) : String(LIST.length);

    var plist = pins.map(byId).filter(Boolean);
    if (plist.length && !state.query && state.filter === "all") {
      el.pinned.hidden = false;
      el.pinnedList.innerHTML = plist.map(function (g) { return rowHtml(g, false); }).join("");
    } else { el.pinned.hidden = true; el.pinnedList.innerHTML = ""; }
    markCurrent();
  }

  // ---------- spectrum ----------
  function renderSpectrum() {
    el.spectrum.innerHTML = LIST.map(function (g) {
      return '<button data-open="' + g.id + '" title="' + esc(g.name) + '" aria-label="' + esc(g.name) + '" aria-current="' + (g.id === state.active) + '" style="--seg:' + g.color + ";background-image:url(" + JSON.stringify(g.banner) + ')"></button>';
    }).join("");
  }

  // ---------- stage ----------
  function heroHtml(g) {
    var i = idxOf(g.id), lc = liveCount(g), on = onCount(g), page = gamePage(g), pinned = isPinned(g.id);
    var name = page ? '<a href="' + esc(page) + '">' + esc(g.name) + "</a>" : esc(g.name);
    return "" +
      (g.banner ? '<div class="hero-art" style="background-image:url(' + JSON.stringify(g.banner) + ')"></div>' : "") +
      '<div class="hero-wm num" aria-hidden="true">' + String(i + 1).padStart(2, "0") + "</div>" +
      '<div class="hero-in">' +
        '<div class="eyebrow"><span class="idx num"><b>' + String(i + 1).padStart(2, "0") + "</b> / " + String(LIST.length).padStart(2, "0") + "</span><span class=\"rule\"></span>" +
          (lc > 0 ? '<span class="live-pill"><i></i>Live data</span>' : "") + "</div>" +
        "<h1>" + name + "</h1>" +
        '<p class="blurb">' + esc(g.blurb) + "</p>" +
        '<div class="meta"><span><b>' + on + "</b> tool" + (on === 1 ? "" : "s") + "</span>" +
          (lc > 0 ? '<span class="sep"></span><span style="color:var(--c-accent)"><b style="color:var(--c-accent)">' + lc + "</b> live</span>" : "") +
          '<span class="sep"></span>' +
          '<button class="pinbtn' + (pinned ? " on" : "") + '" type="button" data-pin="' + g.id + '" aria-pressed="' + pinned + '">' + PIN_SVG + "<span>" + (pinned ? "Unpin" : "Pin") + "</span></button>" +
        "</div>" +
      "</div>";
  }
  function toolHtml(t, i) {
    var tag = t.type === "live"
      ? '<span class="ttype live">live</span>'
      : '<span class="ttype">' + esc(t.type) + "</span>";
    var status = t.available ? "" : '<span class="soon">soon</span>';
    var inner =
      '<span class="tix num">' + String(i + 1).padStart(2, "0") + "</span>" +
      '<span class="tbody"><span class="trow"><span class="tname">' + esc(t.name) + "</span>" + (t.available ? tag : status) + "</span>" +
      '<span class="tdesc">' + esc(t.desc || "") + "</span></span>" +
      '<span class="arrow">→</span>';
    if (t.available && t.href) return '<a class="tool" href="' + esc(t.href) + '">' + inner + "</a>";
    return '<div class="tool off">' + inner + "</div>";
  }
  function renderStage() {
    var g = byId(state.active) || LIST[0];
    el.hero.innerHTML = heroHtml(g);
    el.tools.style.setProperty("--gc", g.color);
    var tools = g.tools.slice().sort(function (a, b) { return (b.available ? 1 : 0) - (a.available ? 1 : 0); });
    el.tools.className = "tools" + (tools.length === 1 ? " one" : "");
    el.tools.innerHTML = tools.map(function (t, i) { return toolHtml(t, i); }).join("");
    el.toolCount.textContent = g.tools.length + " total";
    el.crumb.innerHTML = '<span class="sm">Hub / </span><b>' + esc(g.name) + "</b>";
    markCurrent();
  }
  function markCurrent() {
    [el.railList, el.pinnedList, el.spectrum].forEach(function (c) {
      if (!c) return;
      c.querySelectorAll("[data-id],[data-open]").forEach(function (n) {
        var id = n.dataset.id || n.dataset.open;
        if (n.classList.contains("g-row") || n.parentElement === el.spectrum) n.setAttribute("aria-current", id === state.active);
      });
    });
  }

  // ---------- feed ----------
  function renderFeed() {
    el.feedCount.textContent = UPDATES.length + " updates";
    el.feed.innerHTML = UPDATES.map(function (u, i) {
      var gid = updGame(u); var g = gid && byId(gid);
      var color = g ? g.color : "var(--line-2)";
      return '<a class="fitem' + (i === 0 ? " new" : "") + '" href="' + esc(u.href) + '"' + (gid ? ' data-go="' + gid + '"' : "") + ">" +
        '<span class="fd num">' + esc(fmtDate(u.date)) + (i === 0 ? " <b>NEW</b>" : "") + "</span>" +
        '<span class="fk" style="--fc:' + color + '"></span>' +
        '<span><span class="ft">' + esc(u.title) + '</span><span class="fx">' + esc(u.desc) + "</span></span></a>";
    }).join("");
  }

  // ---------- navigation ----------
  function setActive(id, opts) {
    opts = opts || {};
    var g = byId(id); if (!g) return;
    state.active = id;
    renderStage();
    if (opts.scrollTop !== false) { var s = document.getElementById("scroll"); if (s) s.scrollTop = 0; }
    if (opts.hash !== false && history.replaceState) history.replaceState(null, "", "#g/" + id);
  }
  function togglePin(id) {
    if (isPinned(id)) pins = pins.filter(function (x) { return x !== id; });
    else pins = [id].concat(pins);
    savePins(pins);
    renderRail();
    if (state.active === id) renderStage(); // refresh hero pin button
  }

  // ---------- wiring ----------
  function onOpen(e) {
    var pin = e.target.closest("[data-pin]"); if (pin) { e.preventDefault(); togglePin(pin.dataset.pin); return; }
    var opener = e.target.closest("[data-open]") || e.target.closest("[data-id]");
    if (opener) { e.preventDefault(); setActive(opener.dataset.open || opener.dataset.id); }
  }
  el.railList.addEventListener("click", onOpen);
  el.pinnedList.addEventListener("click", onOpen);
  el.spectrum.addEventListener("click", onOpen);
  el.hero.addEventListener("click", function (e) { var pin = e.target.closest("[data-pin]"); if (pin) { e.preventDefault(); togglePin(pin.dataset.pin); } });
  el.feed.addEventListener("click", function (e) { var a = e.target.closest("[data-go]"); if (a) setActive(a.dataset.go); });

  el.q.addEventListener("input", function () { state.query = el.q.value.trim().toLowerCase(); renderRail(); });
  el.filters.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-f]"); if (!b) return;
    state.filter = b.dataset.f;
    el.filters.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    renderRail();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== el.q) { e.preventDefault(); el.q.focus(); el.q.select(); return; }
    if (e.key === "Escape" && document.activeElement === el.q) { el.q.value = ""; state.query = ""; renderRail(); el.q.blur(); return; }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && document.activeElement !== el.q) {
      var vis = visibleGames(); if (!vis.length) return;
      e.preventDefault();
      var cur = vis.findIndex(function (g) { return g.id === state.active; });
      var ni = e.key === "ArrowDown" ? cur + 1 : cur - 1;
      if (ni < 0) ni = vis.length - 1; if (ni >= vis.length) ni = 0;
      setActive(vis[ni].id);
      var row = el.railList.querySelector('[data-id="' + vis[ni].id + '"]');
      if (row && row.scrollIntoView) row.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter" && document.activeElement !== el.q && document.activeElement !== el.filters) {
      var g = byId(state.active); if (!g) return;
      var first = g.tools.find(function (t) { return t.available && t.href; });
      if (first) window.location.href = first.href;
    }
  });

  // ---------- init ----------
  function initialId() {
    var m = (location.hash || "").match(/^#g\/(.+)$/);
    if (m && byId(decodeURIComponent(m[1]))) return decodeURIComponent(m[1]);
    for (var i = 0; i < UPDATES.length; i++) { var gid = updGame(UPDATES[i]); if (gid && byId(gid)) return gid; }
    return LIST[0].id;
  }
  function init() {
    renderSpectrum();
    renderFeed();
    state.active = initialId();
    renderRail();
    setActive(state.active, { hash: false, scrollTop: false });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
