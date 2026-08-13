/* NightmareFTW — Steam free-game promo alerts.
   Reads data/steam-free-games.json (refreshed hourly by
   update-steam-free-games.js from the "Free Games Info!!!" Steam group —
   normally-paid games that are temporarily free to claim) and shows a bell
   with an unseen-count badge in the header, everywhere on the site.

   "Seen" (clears the badge) and "notified" (stops the same item firing a
   second native Notification) are tracked as synced nftw:notify:* keys, so
   they follow the account across devices for free via auth.js's existing
   sync — no backend changes needed. Works for signed-out visitors too
   (local-only until they sign in, same as pins/checklists). EN + PT-PT. */
(function () {
  "use strict";

  var DATA_URL = "/data/steam-free-games.json";
  var SEEN = "nftw:notify:steamSeen", NOTIFIED = "nftw:notify:steamNotified", ENABLED = "nftw:notify:steamEnabled";
  var MAX_TRACKED = 200;
  var ls = window.localStorage;

  var L = (function () { try { return ls.getItem("nftw:lang") === "pt" ? "pt" : "en"; } catch (e) { return "en"; } })();
  var T = L === "pt" ? {
    title: "Jogos grátis na Steam",
    empty: "Sem promoções de jogos grátis neste momento.",
    normally: function (p) { return "Normalmente " + p; },
    claim: "Resgatar na Steam →",
    notify: "Avisar-me quando aparecer um novo",
    note: "Algumas promoções são por tempo limitado — confirma na página da loja antes que acabe.",
    source: "Fonte: grupo Steam Free Games Info!!!",
  } : {
    title: "Free Steam games",
    empty: "No free-game promos right now.",
    normally: function (p) { return "Normally " + p; },
    claim: "Claim on Steam →",
    notify: "Notify me when a new one shows up",
    note: "Some giveaways are time-limited — confirm on the store page before it's gone.",
    source: "Source: the Free Games Info!!! Steam group",
  };

  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]); }); };
  var readSet = function (k) { try { var a = JSON.parse(ls.getItem(k) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  var writeSet = function (k, arr) { try { ls.setItem(k, JSON.stringify(arr.slice(-MAX_TRACKED))); } catch (e) {} };
  var addAll = function (k, ids) { var s = readSet(k); ids.forEach(function (id) { if (s.indexOf(id) < 0) s.push(id); }); writeSet(k, s); };
  var notifyEnabled = function () { return ls.getItem(ENABLED) === "1"; };

  var BELL_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 1a1 1 0 0 0-1 1v.1A4.502 4.502 0 0 0 3.5 6.5V10l-1.24 1.65a.6.6 0 0 0 .48.95h10.52a.6.6 0 0 0 .48-.95L12.5 10V6.5A4.502 4.502 0 0 0 9 2.1V2a1 1 0 0 0-1-1Zm0 13a1.8 1.8 0 0 0 1.74-1.35H6.26A1.8 1.8 0 0 0 8 14Z"/></svg>';

  var items = [];
  var panelOpen = false;

  function unseenCount() {
    var seen = readSet(SEEN);
    return items.filter(function (it) { return seen.indexOf(it.appid) < 0; }).length;
  }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(L === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "short" }); } catch (e) { return ""; }
  }

  function renderPanel(panel) {
    if (!items.length) {
      panel.innerHTML = '<div class="steam-panel-head"><b>' + esc(T.title) + '</b></div><p class="steam-panel-empty">' + esc(T.empty) + '</p>' + footer(panel);
      wireFooter(panel);
      return;
    }
    panel.innerHTML =
      '<div class="steam-panel-head"><b>' + esc(T.title) + '</b></div>' +
      '<div class="steam-panel-list">' +
      items.map(function (it) {
        return '<a class="steam-panel-item" href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
          (it.image ? '<img src="' + esc(it.image) + '" alt="" loading="lazy">' : '') +
          '<span class="steam-panel-item-body">' +
            '<span class="steam-panel-item-name">' + esc(it.name) + '</span>' +
            '<span class="steam-panel-item-meta">' + (it.normalPrice ? esc(T.normally(it.normalPrice)) + " · " : "") + esc(fmtDate(it.postedAt)) + '</span>' +
          '</span>' +
          '<span class="steam-panel-item-cta">' + esc(T.claim) + '</span>' +
        '</a>';
      }).join("") +
      '</div>' + footer(panel);
    wireFooter(panel);
  }

  function footer(panel) {
    var checked = notifyEnabled() ? " checked" : "";
    return '<label class="steam-panel-notify"><input type="checkbox" class="sp-notify-cb"' + checked + '>' + esc(T.notify) + '</label>' +
      '<p class="steam-panel-note">' + esc(T.note) + '</p>';
  }
  function wireFooter(panel) {
    var cb = panel.querySelector(".sp-notify-cb");
    if (!cb) return;
    cb.onchange = function () {
      if (this.checked) {
        if (!("Notification" in window)) { this.checked = false; return; }
        Notification.requestPermission().then(function (perm) {
          if (perm === "granted") { try { ls.setItem(ENABLED, "1"); } catch (e) {} }
          else { cb.checked = false; }
        });
      } else {
        try { ls.setItem(ENABLED, "0"); } catch (e) {}
      }
    };
  }

  function updateBadge(wrap) {
    var badge = wrap.querySelector(".bell-badge");
    var n = unseenCount();
    if (n > 0) { badge.textContent = n > 9 ? "9+" : String(n); badge.hidden = false; }
    else badge.hidden = true;
  }

  function openPanel(wrap) {
    panelOpen = true;
    var panel = wrap.querySelector(".steam-panel");
    renderPanel(panel);
    panel.hidden = false;
    addAll(SEEN, items.map(function (it) { return it.appid; }));
    updateBadge(wrap);
  }
  function closePanel(wrap) {
    panelOpen = false;
    var panel = wrap.querySelector(".steam-panel");
    if (panel) panel.hidden = true;
  }

  function inject() {
    var nav = document.querySelector(".top-nav");
    if (!nav || nav.querySelector(".bell-wrap")) return;
    var wrap = document.createElement("div"); wrap.className = "bell-wrap";
    wrap.innerHTML = '<button class="bell-btn" type="button" title="' + esc(T.title) + '" aria-label="' + esc(T.title) + '">' + BELL_ICON + '<span class="bell-badge" hidden></span></button><div class="steam-panel" hidden></div>';
    var anchor = nav.querySelector(".gh-link") || nav.querySelector(".auth-btn") || null;
    nav.insertBefore(wrap, anchor);

    wrap.querySelector(".bell-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      if (panelOpen) closePanel(wrap); else openPanel(wrap);
    });
    document.addEventListener("click", function (e) { if (panelOpen && !wrap.contains(e.target)) closePanel(wrap); });

    updateBadge(wrap);
    return wrap;
  }

  function maybeNotify() {
    if (!notifyEnabled() || !("Notification" in window) || Notification.permission !== "granted") return;
    var notified = readSet(NOTIFIED);
    var fresh = items.filter(function (it) { return notified.indexOf(it.appid) < 0; }).slice(0, 3);
    if (!fresh.length) return;
    fresh.forEach(function (it) {
      try {
        var n = new Notification(it.name, { body: T.normally(it.normalPrice || "") + " — " + T.claim, icon: it.image || undefined });
        n.onclick = function () { window.open(it.url, "_blank"); };
      } catch (e) {}
    });
    addAll(NOTIFIED, fresh.map(function (it) { return it.appid; }));
  }

  function start() {
    var wrap = inject();
    fetch(DATA_URL + "?cb=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
      items = (data && Array.isArray(data.items)) ? data.items : [];
      if (wrap) updateBadge(wrap);
      maybeNotify();
    }).catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
