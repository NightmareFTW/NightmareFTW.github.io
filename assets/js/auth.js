/* NightmareFTW — accounts + cross-device settings sync.
   Two ways to sign in, both syncing the same "nftw:" settings (hub pins, order,
   view, checklists, Murdoku boards & solved cases, future games):
   - Email + password: a Cloudflare Worker + D1 account. The password never
     leaves the Worker in plaintext; the browser keeps only a signed session
     token. Settings are stored as one JSON blob per account.
   - Sign in with GitHub: the original OAuth flow (token exchanged on the same
     Worker), settings kept in a private gist.
   Whichever you use, the data follows you across devices. Vanilla JS, no build. */
(function () {
  "use strict";

  var WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  var CLIENT_ID = "Ov23liX86hfhasg45qUr";
  var SCOPE = "gist";
  var REDIRECT = location.origin + "/";        // must match the OAuth App callback
  var GIST_FILE = "nftw-settings.json";
  var TOKEN = "nftw:auth:token", USER = "nftw:auth:user", GIST = "nftw:auth:gist";   // GitHub
  var CTOKEN = "nftw:auth:ctoken", CEMAIL = "nftw:auth:cemail";                       // Cloudflare account

  var ls = window.localStorage;
  var gtok = function () { try { return ls.getItem(TOKEN); } catch (e) { return null; } };
  var ctok = function () { try { return ls.getItem(CTOKEN); } catch (e) { return null; } };
  var signedIn = function () { return !!(gtok() || ctok()); };
  // nftw:lang is a per-device UI preference — never sync it, or a stale value
  // reverts the switcher's choice on the next load.
  var syncable = function (k) { return k && k.indexOf("nftw:") === 0 && k.indexOf("nftw:auth:") !== 0 && k !== "nftw:lang"; };
  var pulling = false, pushTimer = null;

  function collect() {
    var blob = {};
    for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (syncable(k)) blob[k] = ls.getItem(k); }
    return blob;
  }
  // Apply a { key: value } blob into localStorage; reload if anything changed.
  function applyBlob(blob) {
    var changed = false;
    for (var k in blob) if (syncable(k) && ls.getItem(k) !== blob[k]) { ls.setItem(k, blob[k]); changed = true; }
    return changed;
  }

  // ---- Cloudflare account API ------------------------------------------------
  async function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (ctok()) opts.headers.Authorization = "Bearer " + ctok();
    var r = await fetch(WORKER + path, opts);
    var d = {}; try { d = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data: d };
  }
  async function cloudPush() {
    if (!ctok()) return;
    try { await api("/data", { method: "PUT", body: JSON.stringify({ blob: JSON.stringify(collect()) }) }); } catch (e) {}
  }
  async function cloudPull() {
    pulling = true;
    try {
      var r = await api("/data", { method: "GET" });
      if (r.status === 401) { cloudSignOut(true); pulling = false; return; }
      if (!r.ok) { pulling = false; return; }
      var remote = {}; try { remote = JSON.parse(r.data.blob || "{}"); } catch (e) {}
      if (!Object.keys(remote).length) { pulling = false; cloudPush(); return; }  // empty account: seed from this device
      var changed = applyBlob(remote);
      pulling = false;
      if (changed) location.reload();
    } catch (e) { pulling = false; }
  }
  function cloudSignOut(silent) { [CTOKEN, CEMAIL].forEach(function (k) { ls.removeItem(k); }); if (!silent) render(); }

  // ---- GitHub gist sync (original) ------------------------------------------
  function gh(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: "token " + gtok(), Accept: "application/vnd.github+json" }, opts.headers || {});
    return fetch("https://api.github.com" + path, opts);
  }
  function fileBody(content) { var f = {}; f[GIST_FILE] = { content: content }; return f; }
  async function findGist() {
    var id = ls.getItem(GIST); if (id) return id;
    try {
      var r = await gh("/gists?per_page=100"); if (!r.ok) return null;
      var list = await r.json();
      for (var i = 0; i < list.length; i++) if (list[i].files && list[i].files[GIST_FILE]) { ls.setItem(GIST, list[i].id); return list[i].id; }
    } catch (e) {}
    return null;
  }
  async function gistPush() {
    if (!gtok()) return;
    try {
      var content = JSON.stringify(collect());
      var id = await findGist();
      if (id) await gh("/gists/" + id, { method: "PATCH", body: JSON.stringify({ files: fileBody(content) }) });
      else { var r = await gh("/gists", { method: "POST", body: JSON.stringify({ description: "NightmareFTW Hub — synced settings", public: false, files: fileBody(content) }) }); var g = await r.json(); if (g && g.id) ls.setItem(GIST, g.id); }
    } catch (e) {}
  }
  async function gistPull() {
    if (!gtok()) return;
    pulling = true;
    try {
      var id = await findGist();
      if (!id) { pulling = false; gistPush(); return; }
      var r = await gh("/gists/" + id); if (!r.ok) { pulling = false; return; }
      var g = await r.json(); var file = g.files && g.files[GIST_FILE]; if (!file) { pulling = false; return; }
      var content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
      var changed = applyBlob(JSON.parse(content));
      pulling = false;
      if (changed) location.reload();
    } catch (e) { pulling = false; }
  }
  function githubLogin() {
    var state = Math.random().toString(36).slice(2);
    try { sessionStorage.setItem("nftw:auth:state", state); sessionStorage.setItem("nftw:auth:return", location.href); } catch (e) {}
    location.href = "https://github.com/login/oauth/authorize?client_id=" + CLIENT_ID + "&scope=" + SCOPE + "&redirect_uri=" + encodeURIComponent(REDIRECT) + "&state=" + state;
  }
  function githubLogout() { [TOKEN, USER, GIST].forEach(function (k) { ls.removeItem(k); }); render(); }
  async function fetchGithubUser() { try { var r = await gh("/user"); if (r.ok) { var u = await r.json(); ls.setItem(USER, u.login || "GitHub"); } } catch (e) {} }
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
          await fetchGithubUser();
          try { sessionStorage.setItem("nftw:auth:justLoggedIn", "1"); } catch (e) {}
          location.replace(ret.split("#")[0].replace(/[?&]code=[^&]*(&state=[^&]*)?/, ""));
          return;
        }
      }
    } catch (e) {}
    history.replaceState({}, "", location.pathname);
    render();
  }

  // ---- unified sync ----------------------------------------------------------
  function schedulePush() {
    if (pulling || !signedIn()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { if (ctok()) cloudPush(); else if (gtok()) gistPush(); }, 1500);
  }
  function pullActive() { if (ctok()) cloudPull(); else if (gtok()) gistPull(); }

  // ---- login modal -----------------------------------------------------------
  var GH_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]); }); };

  function closeModal() { var m = document.getElementById("nftw-auth-modal"); if (m) m.remove(); }
  function openModal() {
    closeModal();
    var mode = "login"; // or "signup"
    var wrap = document.createElement("div");
    wrap.id = "nftw-auth-modal";
    wrap.className = "nftw-modal-overlay";
    document.body.appendChild(wrap);
    function draw() {
      wrap.innerHTML =
        '<div class="nftw-modal" role="dialog" aria-modal="true">' +
          '<button class="nftw-modal-x" aria-label="Close">×</button>' +
          '<div class="nftw-tabs">' +
            '<button class="nftw-tab' + (mode === "login" ? " on" : "") + '" data-m="login">Sign in</button>' +
            '<button class="nftw-tab' + (mode === "signup" ? " on" : "") + '" data-m="signup">Create account</button>' +
          '</div>' +
          '<form class="nftw-form">' +
            '<label>Email<input type="email" name="email" autocomplete="email" required></label>' +
            '<label>Password<input type="password" name="password" autocomplete="' + (mode === "signup" ? "new-password" : "current-password") + '" minlength="8" required></label>' +
            '<p class="nftw-err" hidden></p>' +
            '<button type="submit" class="btn nftw-submit">' + (mode === "signup" ? "Create account" : "Sign in") + '</button>' +
            (mode === "login" ? '<button type="button" class="nftw-forgot">Forgot password?</button>' : '<p class="nftw-hint">At least 8 characters. Your settings sync to this account.</p>') +
          '</form>' +
          '<div class="nftw-or"><span>or</span></div>' +
          '<button class="btn nftw-github">' + GH_ICON + '<span>Sign in with GitHub</span></button>' +
        '</div>';
      wrap.querySelector(".nftw-modal-x").onclick = closeModal;
      wrap.onclick = function (e) { if (e.target === wrap) closeModal(); };
      wrap.querySelectorAll(".nftw-tab").forEach(function (t) { t.onclick = function () { mode = t.dataset.m; draw(); }; });
      wrap.querySelector(".nftw-github").onclick = githubLogin;
      var forgot = wrap.querySelector(".nftw-forgot"); if (forgot) forgot.onclick = onForgot;
      wrap.querySelector(".nftw-form").onsubmit = onSubmit;
    }
    function showErr(msg) { var e = wrap.querySelector(".nftw-err"); if (e) { e.textContent = msg; e.hidden = false; } }
    async function onSubmit(ev) {
      ev.preventDefault();
      var f = ev.target, email = f.email.value.trim(), password = f.password.value;
      var btn = f.querySelector(".nftw-submit"); btn.disabled = true;
      try {
        var r = await api("/auth/" + (mode === "signup" ? "signup" : "login"), { method: "POST", body: JSON.stringify({ email: email, password: password }) });
        if (!r.ok || !r.data.token) { btn.disabled = false; return showErr(errMsg(r.data.error, mode)); }
        ls.setItem(CTOKEN, r.data.token); ls.setItem(CEMAIL, r.data.email || email);
        closeModal(); render();
        if (mode === "signup") { await cloudPush(); }         // seed the new account with this device's data
        else { await cloudPull(); }                            // bring the account's data down (may reload)
      } catch (e) { btn.disabled = false; showErr("Network error — please try again."); }
    }
    async function onForgot() {
      var email = (wrap.querySelector('input[name="email"]').value || "").trim();
      if (!email) return showErr("Enter your email above first, then click Forgot password.");
      try { await api("/auth/reset-request", { method: "POST", body: JSON.stringify({ email: email }) }); } catch (e) {}
      showErr("If that email has an account, a reset link is on its way.");
    }
    draw();
    var first = wrap.querySelector('input[name="email"]'); if (first) first.focus();
  }
  function errMsg(code, mode) {
    return ({
      email_taken: "That email already has an account — try signing in.",
      bad_credentials: "Wrong email or password.",
      weak_password: "Password must be at least 8 characters.",
      invalid_email: "That doesn't look like a valid email.",
    })[code] || (mode === "signup" ? "Couldn't create the account." : "Couldn't sign in.");
  }

  // ---- header button ---------------------------------------------------------
  function render() {
    var nav = document.querySelector(".top-nav"); if (!nav) return;
    var old = nav.querySelector(".auth-btn"); if (old) old.remove();
    var btn = document.createElement("button");
    btn.className = "auth-btn";
    if (ctok()) {
      var email = ls.getItem(CEMAIL) || "Account";
      btn.innerHTML = '<span class="auth-dot"></span>' + esc(email);
      btn.title = "Signed in — your settings sync across devices. Click to sign out.";
      btn.addEventListener("click", function () { if (confirm("Sign out? Your synced settings stay safe in your account.")) cloudSignOut(false); });
    } else if (gtok()) {
      btn.innerHTML = '<span class="auth-dot"></span>' + esc(ls.getItem(USER) || "GitHub");
      btn.title = "Signed in with GitHub — settings sync across devices. Click to sign out.";
      btn.addEventListener("click", function () { if (confirm("Sign out? Your synced settings stay safe in your private gist.")) githubLogout(); });
    } else {
      btn.innerHTML = GH_ICON.replace('width="14" height="14"', 'width="13" height="13"') + "<span>Sign in</span>";
      btn.title = "Sign in to sync your pins, checklists and game progress across devices.";
      btn.addEventListener("click", openModal);
    }
    nav.appendChild(btn);
  }

  // ---- init ------------------------------------------------------------------
  try {
    var proto = Storage.prototype, _set = proto.setItem;
    proto.setItem = function (k, v) { _set.apply(this, arguments); if (this === window.localStorage && syncable(k)) schedulePush(); };
  } catch (e) {}

  function start() {
    render();
    if (location.search.indexOf("code=") >= 0) handleCallback();
    else { try { sessionStorage.removeItem("nftw:auth:justLoggedIn"); } catch (e) {} if (signedIn()) pullActive(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
