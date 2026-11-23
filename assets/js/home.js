/* Home / Hub — the "Showcase" layout.
   A cinematic featured stage that auto-rotates through a handful of games
   (blurred backdrop + a sharp poster in front), an editorial band (What's New +
   Live now) and an editorial mosaic of the whole library. Reads GAMES /
   SITE_UPDATES from data.js, uses each game's real banner art, and links tools
   straight to their pages. All visible strings are English; i18n.js translates
   the page to PT-PT via its dictionary + MutationObserver (only the backdrop
   rotation and hover motion live here). Respects prefers-reduced-motion. */
(function () {
  "use strict";
  if (typeof GAMES === "undefined" || !document.getElementById("heroMain")) return;

  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]); }); };
  var byId = function (id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; return null; };
  var on = function (g) { return g.tools.filter(function (t) { return t.available; }).length; };
  var live = function (g) { return g.tools.filter(function (t) { return t.available && t.type === "live"; }).length; };
  var page = function (g) { return on(g) ? "games/" + g.id + "/index.html" : "#"; };
  var updGame = function (u) { var m = String(u.href || "").match(/games\/([^\/]+)\//); return m ? m[1] : null; };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var DUR = 7200;
  var UPDATES = (typeof SITE_UPDATES !== "undefined" ? SITE_UPDATES : []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });

  function init() {
    // ---- featured set: newest updates' games first, then any remaining live games ----
    var feat = [];
    UPDATES.forEach(function (u) { var g = updGame(u); if (g && byId(g) && feat.indexOf(g) < 0) feat.push(g); });
    GAMES.filter(function (g) { return live(g) > 0; }).forEach(function (g) { if (feat.indexOf(g.id) < 0) feat.push(g.id); });
    feat = feat.slice(0, 5).map(byId).filter(Boolean);

    var bdA = document.getElementById("bdA"), bdB = document.getElementById("bdB"), useA = true;
    var heroMain = document.getElementById("heroMain"), poster = document.getElementById("poster"), sw = document.getElementById("switch");
    var cur = 0, timer = null;

    sw.innerHTML = feat.map(function (g, i) {
      return '<button class="sw" data-i="' + i + '" aria-label="' + esc(g.name) + '" aria-current="' + (i === 0) + '" style="background-image:url(\'' + esc(g.banner) + '\')"><span class="pg"></span></button>';
    }).join("");
    var sws = [].slice.call(sw.children);

    function heroHtml(g) {
      var tools = g.tools.filter(function (t) { return t.available; }), first = tools[0] || null, lv = live(g);
      var ghosts = tools.slice(first ? 1 : 0, first ? 3 : 2).map(function (t) {
        return '<a class="hbtn g" href="' + esc(t.href) + '">' + (t.type === "live" ? '<span class="lv"></span>' : "") + esc(t.name) + "</a>";
      }).join("");
      return '<div class="eye"><span class="d"></span>Now featured' + (lv > 0 ? ' <span class="sep">·</span> Live data' : "") + "</div>" +
        '<h1 class="hero-title"><a href="' + page(g) + '">' + esc(g.name) + "</a></h1>" +
        '<p class="hero-blurb">' + esc(g.blurb) + "</p>" +
        '<div class="acts">' + (first ? '<a class="hbtn p" href="' + esc(first.href) + '">Open ' + esc(first.name) + " →</a>" : "") + ghosts + "</div>";
    }
    function show(i, instant) {
      cur = (i + feat.length) % feat.length; var g = feat[cur];
      var back = useA ? bdB : bdA, front = useA ? bdA : bdB;
      back.style.backgroundImage = "url('" + g.banner + "')";
      if (reduce || instant) { front.classList.remove("on"); back.classList.add("on"); }
      else { back.classList.add("on"); front.classList.remove("on"); }
      useA = !useA;
      heroMain.style.opacity = 0;
      setTimeout(function () { heroMain.innerHTML = heroHtml(g); heroMain.style.transition = "opacity .5s"; heroMain.style.opacity = 1; }, instant ? 0 : 260);
      poster.setAttribute("href", page(g));
      poster.innerHTML = '<img src="' + esc(g.banner) + '" alt="' + esc(g.name) + '" fetchpriority="high" decoding="async"><span class="idx num">' + String(cur + 1).padStart(2, "0") + " / " + String(feat.length).padStart(2, "0") + "</span>";
      sws.forEach(function (b, bi) {
        b.setAttribute("aria-current", bi === cur);
        var pg = b.querySelector(".pg"); pg.style.animation = "none"; void pg.offsetWidth; if (bi === cur && !reduce) pg.style.animation = "";
      });
    }
    function play() { if (reduce || feat.length < 2) return; clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, DUR); }
    sw.addEventListener("click", function (e) { var b = e.target.closest(".sw"); if (!b) return; show(+b.dataset.i); play(); });
    var stage = document.querySelector(".stage");
    stage.addEventListener("mouseenter", function () { clearInterval(timer); });
    stage.addEventListener("mouseleave", play);
    document.documentElement.style.setProperty("--dur", DUR + "ms");
    show(0, true); play();

    // ---- editorial: What's New feature + live list ----
    var u = UPDATES[0], ug = u && byId(updGame(u));
    var feature = document.getElementById("feature");
    feature.setAttribute("href", esc(u ? u.href : "#"));
    feature.innerHTML = (ug ? '<div class="shot" style="background-image:url(\'' + esc(ug.banner) + '\')"></div>' : "") +
      '<div class="fx"><div class="tag">What\'s New</div><h3>' + esc(u ? u.title : "") + "</h3>" +
      "<p>" + esc(u ? u.desc : "") + '</p><span class="go">Read more →</span></div>';

    var lives = GAMES.filter(function (g) { return live(g) > 0; }).sort(function (a, b) { return live(b) - live(a); });
    document.getElementById("liveList").innerHTML = lives.map(function (g) {
      var t = g.tools.filter(function (x) { return x.available && x.type === "live"; })[0];
      return '<a class="lrow" href="' + (t ? esc(t.href) : page(g)) + '"><img src="' + esc(g.banner) + '" alt="" loading="lazy" decoding="async"><span class="n">' + esc(g.name) + '</span><span class="t">' + live(g) + " live</span></a>";
    }).join("");

    // ---- library mosaic ----
    var LIST = GAMES.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    var total = GAMES.reduce(function (a, g) { return a + on(g); }, 0);
    document.getElementById("libc").innerHTML = "· <span>" + GAMES.length + " games</span> · <span>" + total + " tools</span>";
    var grid = document.getElementById("grid"), qEl = document.getElementById("q");
    function card(g) {
      var c = on(g), lv = live(g);
      var ct = c ? (lv > 0 ? '<span class="ct live num">' + c + "</span>" : '<span class="ct num">' + c + "</span>") : "";
      var big = (c >= 5 || lv > 0) ? " big" : "";
      return '<a class="card' + big + '" href="' + page(g) + '" style="--gc:' + g.color + '">' +
        '<img class="ph" src="' + esc(g.banner) + '" alt="" loading="lazy" decoding="async">' +
        (c ? "" : '<span class="soon">Soon</span>') +
        '<span class="cap"><span class="nm">' + esc(g.name) + "</span>" + ct + "</span></a>";
    }
    function render() {
      var q = qEl.value.trim().toLowerCase();
      var vis = LIST.filter(function (g) { return !q || g.name.toLowerCase().indexOf(q) >= 0 || g.tools.some(function (t) { return t.name.toLowerCase().indexOf(q) >= 0; }); });
      grid.innerHTML = vis.length ? vis.map(card).join("") : '<p class="empty">No games match.</p>';
    }
    qEl.addEventListener("input", render);
    document.addEventListener("keydown", function (e) { if (e.key === "/" && document.activeElement !== qEl) { e.preventDefault(); qEl.focus(); } });
    render();

    // ---- header: solid on scroll past the stage ----
    var hdr = document.querySelector(".site-header");
    var onScroll = function () { hdr.classList.toggle("solid", window.scrollY > Math.min(window.innerHeight * 0.8, 560)); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
