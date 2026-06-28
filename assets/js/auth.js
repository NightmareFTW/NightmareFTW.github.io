/* NightmareFTW — Sign in with GitHub + cross-device settings sync.
   Static-site OAuth: the code→token exchange runs on a Cloudflare Worker (keeps
   the client secret off the site). The token (scope: gist) is then used to keep
   all "nftw:" settings (pins, order, view, checklists, bond/build pins) in a
   private gist, so they follow you across devices. No build step, vanilla JS. */
(function () {
  "use strict";

  var WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  var CLIENT_ID = "Ov23liX86hfhasg45qUr";
  var SCOPE = "gist";
  var REDIRECT = location.origin + "/";        // must match the OAuth App callback
  var GIST_FILE = "nftw-settings.json";
  var TOKEN = "nftw:auth:token", USER = "nftw:auth:user", GIST = "nftw:auth:gist";

  var ls = window.localStorage;
  var tok = function () { try { return ls.getItem(TOKEN); } catch (e) { return null; } };
  var syncable = function (k) { return k && k.indexOf("nftw:") === 0 && k.indexOf("nftw:auth:") !== 0; };
  var pulling = false, pushTimer = null;

  // ---- GitHub gist sync -----------------------------------------------------
  function gh(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: "token " + tok(), Accept: "application/vnd.github+json" }, opts.headers || {});
    return fetch("https://api.github.com" + path, opts);
  }
  function collect() {
    var blob = {};
    for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (syncable(k)) blob[k] = ls.getItem(k); }
    return blob;
  }
  function fileBody(content) { var f = {}; f[GIST_FILE] = { content: content }; return f; }
  function schedulePush() { if (pulling || !tok()) return; clearTimeout(pushTimer); pushTimer = setTimeout(pushSettings, 1500); }

  async function findGist() {
    var id = ls.getItem(GIST); if (id) return id;
    try {
      var r = await gh("/gists?per_page=100"); if (!r.ok) return null;
      var list = await r.json();
      for (var i = 0; i < list.length; i++) if (list[i].files && list[i].files[GIST_FILE]) { ls.setItem(GIST, list[i].id); return list[i].id; }
    } catch (e) {}
    return null;
  }
  async function pushSettings() {
    if (!tok()) return;
    try {
      var content = JSON.stringify(collect());
      var id = await findGist();
      if (id) await gh("/gists/" + id, { method: "PATCH", body: JSON.stringify({ files: fileBody(content) }) });
      else {
        var r = await gh("/gists", { method: "POST", body: JSON.stringify({ description: "NightmareFTW Hub — synced settings", public: false, files: fileBody(content) }) });
        var g = await r.json(); if (g && g.id) ls.setItem(GIST, g.id);
      }
    } catch (e) {}
  }
  async function pullSettings() {
    if (!tok()) return;
    pulling = true;
    try {
      var id = await findGist();
      if (!id) { pulling = false; schedulePush(); return; }   // first sign-in: seed from this device
      var r = await gh("/gists/" + id); if (!r.ok) { pulling = false; return; }
      var g = await r.json(); var file = g.files && g.files[GIST_FILE]; if (!file) { pulling = false; return; }
      var content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
      var blob = JSON.parse(content), changed = false;
      for (var k in blob) if (syncable(k) && ls.getItem(k) !== blob[k]) { ls.setItem(k, blob[k]); changed = true; }
      pulling = false;
      if (changed) location.reload();
    } catch (e) { pulling = false; }
  }

  // ---- OAuth ----------------------------------------------------------------
  function login() {
    var state = Math.random().toString(36).slice(2);
    try { sessionStorage.setItem("nftw:auth:state", state); sessionStorage.setItem("nftw:auth:return", location.href); } catch (e) {}
    location.href = "https://github.com/login/oauth/authorize?client_id=" + CLIENT_ID +
      "&scope=" + SCOPE + "&redirect_uri=" + encodeURIComponent(REDIRECT) + "&state=" + state;
  }
  function logout() { [TOKEN, USER, GIST].forEach(function (k) { ls.removeItem(k); }); render(); }

  async function fetchUser() { try { var r = await gh("/user"); if (r.ok) { var u = await r.json(); ls.setItem(USER, u.login || "GitHub"); } } catch (e) {} }

  async function handleCallback() {
    var p = new URLSearchParams(location.search), code = p.get("code"), state = p.get("state");
    var expect = null, ret = REDIRECT;
    try { expect = sessionStorage.getItem("nftw:auth:state"); ret = sessionStorage.getItem("nftw:auth:return") || REDIRECT; } catch (e) {}
    try {
      if (code && (!expect || expect === state)) {
        var r = await fetch(WORKER + "/?code=" + encodeURIComponent(code), { method: "POST" });
        var data = await r.json();
        if (data && data.access_token) {
          ls.setItem(TOKEN, data.access_token);
          await fetchUser();
          try { sessionStorage.setItem("nftw:auth:justLoggedIn", "1"); } catch (e) {}
          location.replace(ret.split("#")[0].replace(/[?&]code=[^&]*(&state=[^&]*)?/, ""));
          return;
        }
      }
    } catch (e) {}
    history.replaceState({}, "", location.pathname);
    render();
  }

  // ---- UI -------------------------------------------------------------------
  var GH_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
  function render() {
    var nav = document.querySelector(".top-nav"); if (!nav) return;
    var old = nav.querySelector(".auth-btn"); if (old) old.remove();
    var btn = document.createElement("button");
    btn.className = "auth-btn";
    if (tok()) {
      btn.innerHTML = '<span class="auth-dot"></span>' + (ls.getItem(USER) || "GitHub");
      btn.title = "Signed in — your settings sync across devices. Click to sign out.";
      btn.addEventListener("click", function () { if (confirm("Sign out? Your synced settings stay safe in your private gist.")) logout(); });
    } else {
      btn.innerHTML = GH_ICON + "<span>Sign in</span>";
      btn.title = "Sign in with GitHub to sync your pins, order and checklists across devices.";
      btn.addEventListener("click", login);
    }
    nav.appendChild(btn);
  }

  // ---- init -----------------------------------------------------------------
  try {
    var proto = Storage.prototype, _set = proto.setItem;
    proto.setItem = function (k, v) { _set.apply(this, arguments); if (this === window.localStorage && syncable(k)) schedulePush(); };
  } catch (e) {}

  function start() {
    render();
    if (location.search.indexOf("code=") >= 0) handleCallback();
    else { var jl = null; try { jl = sessionStorage.getItem("nftw:auth:justLoggedIn"); sessionStorage.removeItem("nftw:auth:justLoggedIn"); } catch (e) {} if (tok()) pullSettings(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
