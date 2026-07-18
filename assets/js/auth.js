/* NightmareFTW — accounts + cross-device settings sync.
   Two ways to sign in, both syncing the same "nftw:" settings (hub pins, order,
   view, checklists, Murdoku boards & solved cases, and every game's progress):
   - Email + password: a Cloudflare Worker + D1 account. The browser keeps only a
     signed session token. Password reset uses one-time RECOVERY CODES (issued at
     sign-up, and re-issued every time you recover) — no email needed.
   - Sign in with GitHub: the original OAuth flow, settings kept in a private gist.
   Profile (nickname + avatar) lives in synced nftw:profile:* keys. EN + PT-PT. */
(function () {
  "use strict";

  var WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  var CLIENT_ID = "Ov23liX86hfhasg45qUr";
  var SCOPE = "gist";
  var REDIRECT = location.origin + "/";
  var GIST_FILE = "nftw-settings.json";
  var TOKEN = "nftw:auth:token", USER = "nftw:auth:user", GIST = "nftw:auth:gist";   // GitHub
  var CTOKEN = "nftw:auth:ctoken", CEMAIL = "nftw:auth:cemail";                       // Cloudflare account
  var PNICK = "nftw:profile:nick", PAVATAR = "nftw:profile:avatar";                   // profile (synced)

  var ls = window.localStorage;
  var gtok = function () { try { return ls.getItem(TOKEN); } catch (e) { return null; } };
  var ctok = function () { try { return ls.getItem(CTOKEN); } catch (e) { return null; } };
  var signedIn = function () { return !!(gtok() || ctok()); };
  var syncable = function (k) { return k && k.indexOf("nftw:") === 0 && k.indexOf("nftw:auth:") !== 0 && k !== "nftw:lang"; };
  var pulling = false, pushTimer = null;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]); }); };
  var displayName = function () { return ls.getItem(PNICK) || ls.getItem(CEMAIL) || ls.getItem(USER) || "Account"; };
  var avatarUrl = function () { return ls.getItem(PAVATAR) || ""; };

  var L = (function () { try { return ls.getItem("nftw:lang") === "pt" ? "pt" : "en"; } catch (e) { return "en"; } })();
  var T = L === "pt" ? {
    signIn: "Entrar", createAccount: "Criar conta", email: "Email", password: "Password",
    newPassword: "Nova password", recoveryCode: "Código de recuperação",
    forgot: "Esqueceste-te da password?",
    signupHint: "Pelo menos 8 caracteres. As tuas definições e progresso nos jogos sincronizam com esta conta.",
    or: "ou", githubBtn: "Entrar com GitHub",
    newHere: "Ainda não tens conta?", createOne: "Cria uma",
    haveAccount: "Já tens conta?", signInLink: "Entra aqui",
    recoverTitle: "Recuperar a conta",
    recoverHint: "Introduz o teu email, um dos teus códigos de recuperação e uma nova password. Cada código só funciona uma vez.",
    resetPassword: "Repor password", backToSignIn: "← Voltar",
    codesTitle: "Guarda os teus códigos de recuperação",
    codesHint: "Se te esqueceres da password, qualquer um destes repõe-na, sem precisar de email. São mostrados <b>só uma vez</b>, por isso guarda-os num sítio seguro.",
    codesAfterRecover: "Password alterada. Aqui tens um conjunto novo de códigos: os antigos deixaram de funcionar.",
    copy: "Copiar", copied: "Copiado", download: "Transferir", done: "Já os guardei — continuar",
    headerSignInTitle: "Entra (ou cria conta) para sincronizar pins, checklists e progresso entre dispositivos.",
    profileTitle: "O teu perfil e conta",
    errEmailTaken: "Esse email já tem conta. Tenta entrar.", errBadCreds: "Email ou password errados.",
    errWeak: "A password tem de ter pelo menos 8 caracteres.", errInvalidEmail: "Esse email não parece válido.",
    errCreate: "Não foi possível criar a conta.", errSignIn: "Não foi possível entrar.",
    errNetwork: "Erro de rede. Tenta outra vez.", errRecovery: "Esse email + código de recuperação não é válido.",
  } : {
    signIn: "Sign in", createAccount: "Create account", email: "Email", password: "Password",
    newPassword: "New password", recoveryCode: "Recovery code",
    forgot: "Forgot password?",
    signupHint: "At least 8 characters. Your settings and game progress sync to this account.",
    or: "or", githubBtn: "Sign in with GitHub",
    newHere: "New here?", createOne: "Create an account",
    haveAccount: "Already have an account?", signInLink: "Sign in",
    recoverTitle: "Recover your account",
    recoverHint: "Enter your email, one of your recovery codes, and a new password. Each code works once.",
    resetPassword: "Reset password", backToSignIn: "← Back",
    codesTitle: "Save your recovery codes",
    codesHint: "If you forget your password, any one of these resets it — no email needed. They're shown <b>only once</b>, so keep them somewhere safe.",
    codesAfterRecover: "Password changed. Here's a fresh set of codes — your old ones no longer work.",
    copy: "Copy", copied: "Copied", download: "Download", done: "I've saved them — continue",
    headerSignInTitle: "Sign in (or create an account) to sync your pins, checklists and game progress across devices.",
    profileTitle: "Your profile & account",
    errEmailTaken: "That email already has an account — try signing in.", errBadCreds: "Wrong email or password.",
    errWeak: "Password must be at least 8 characters.", errInvalidEmail: "That doesn't look like a valid email.",
    errCreate: "Couldn't create the account.", errSignIn: "Couldn't sign in.",
    errNetwork: "Network error — please try again.", errRecovery: "That email + recovery code isn't valid.",
  };

  function collect() { var blob = {}; for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (syncable(k)) blob[k] = ls.getItem(k); } return blob; }
  function applyBlob(blob) { var changed = false; for (var k in blob) if (syncable(k) && ls.getItem(k) !== blob[k]) { ls.setItem(k, blob[k]); changed = true; } return changed; }

  // ---- Cloudflare account API ------------------------------------------------
  async function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (ctok()) opts.headers.Authorization = "Bearer " + ctok();
    var r = await fetch(WORKER + path, opts);
    var d = {}; try { d = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data: d };
  }
  async function cloudPush() { if (!ctok()) return; try { await api("/data", { method: "PUT", body: JSON.stringify({ blob: JSON.stringify(collect()) }) }); } catch (e) {} }
  async function cloudPull() {
    pulling = true;
    try {
      var r = await api("/data", { method: "GET" });
      if (r.status === 401) { cloudSignOut(true); pulling = false; return; }
      if (!r.ok) { pulling = false; return; }
      var remote = {}; try { remote = JSON.parse(r.data.blob || "{}"); } catch (e) {}
      if (!Object.keys(remote).length) { pulling = false; cloudPush(); return; }
      var changed = applyBlob(remote);
      pulling = false;
      if (changed) location.reload();
    } catch (e) { pulling = false; }
  }
  function cloudSignOut(silent) { [CTOKEN, CEMAIL].forEach(function (k) { ls.removeItem(k); }); if (!silent) render(); }

  // ---- GitHub gist sync (original) ------------------------------------------
  function gh(path, opts) { opts = opts || {}; opts.headers = Object.assign({ Authorization: "token " + gtok(), Accept: "application/vnd.github+json" }, opts.headers || {}); return fetch("https://api.github.com" + path, opts); }
  function fileBody(content) { var f = {}; f[GIST_FILE] = { content: content }; return f; }
  async function findGist() {
    var id = ls.getItem(GIST); if (id) return id;
    try { var r = await gh("/gists?per_page=100"); if (!r.ok) return null; var list = await r.json();
      for (var i = 0; i < list.length; i++) if (list[i].files && list[i].files[GIST_FILE]) { ls.setItem(GIST, list[i].id); return list[i].id; } } catch (e) {}
    return null;
  }
  async function gistPush() {
    if (!gtok()) return;
    try { var content = JSON.stringify(collect()); var id = await findGist();
      if (id) await gh("/gists/" + id, { method: "PATCH", body: JSON.stringify({ files: fileBody(content) }) });
      else { var r = await gh("/gists", { method: "POST", body: JSON.stringify({ description: "NightmareFTW Hub — synced settings", public: false, files: fileBody(content) }) }); var g = await r.json(); if (g && g.id) ls.setItem(GIST, g.id); } } catch (e) {}
  }
  async function gistPull() {
    if (!gtok()) return; pulling = true;
    try {
      var id = await findGist(); if (!id) { pulling = false; gistPush(); return; }
      var r = await gh("/gists/" + id); if (!r.ok) { pulling = false; return; }
      var g = await r.json(); var file = g.files && g.files[GIST_FILE]; if (!file) { pulling = false; return; }
      var content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
      var changed = applyBlob(JSON.parse(content)); pulling = false; if (changed) location.reload();
    } catch (e) { pulling = false; }
  }
  function githubLogin() { var state = Math.random().toString(36).slice(2); try { sessionStorage.setItem("nftw:auth:state", state); sessionStorage.setItem("nftw:auth:return", location.href); } catch (e) {} location.href = "https://github.com/login/oauth/authorize?client_id=" + CLIENT_ID + "&scope=" + SCOPE + "&redirect_uri=" + encodeURIComponent(REDIRECT) + "&state=" + state; }
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
        if (data && data.access_token) { ls.setItem(TOKEN, data.access_token); await fetchGithubUser(); try { sessionStorage.setItem("nftw:auth:justLoggedIn", "1"); } catch (e) {} location.replace(ret.split("#")[0].replace(/[?&]code=[^&]*(&state=[^&]*)?/, "")); return; }
      }
    } catch (e) {}
    history.replaceState({}, "", location.pathname); render();
  }

  // ---- unified sync ----------------------------------------------------------
  function schedulePush() { if (pulling || !signedIn()) return; clearTimeout(pushTimer); pushTimer = setTimeout(function () { if (ctok()) cloudPush(); else if (gtok()) gistPush(); }, 1500); }
  function pullActive() { if (ctok()) cloudPull(); else if (gtok()) gistPull(); }

  // ---- icons -----------------------------------------------------------------
  var GH_ICON = '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
  // neutral account icon — the header button is NOT GitHub-only (email accounts too)
  var USER_ICON = '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M8 8a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 8 8Zm0 1.4c-2.9 0-6.2 1.45-6.2 3.3V15h12.4v-2.3c0-1.85-3.3-3.3-6.2-3.3Z"/></svg>';

  // ---- sign-in modal ---------------------------------------------------------
  function closeModal() { var m = document.getElementById("nftw-auth-modal"); if (m) m.remove(); }
  function openModal(startMode) {
    closeModal();
    var mode = startMode || "login"; // login | signup | recover
    var wrap = document.createElement("div"); wrap.id = "nftw-auth-modal"; wrap.className = "nftw-modal-overlay";
    document.body.appendChild(wrap);
    var showErr = function (msg) { var e = wrap.querySelector(".nftw-err"); if (e) { e.textContent = msg; e.hidden = false; } };

    function draw() {
      if (mode === "recover") return drawRecover();
      var signup = mode === "signup";
      wrap.innerHTML =
        '<div class="nftw-modal" role="dialog" aria-modal="true">' +
          '<button class="nftw-modal-x" aria-label="Close">×</button>' +
          '<div class="nftw-tabs">' +
            '<button class="nftw-tab' + (!signup ? " on" : "") + '" data-m="login">' + esc(T.signIn) + '</button>' +
            '<button class="nftw-tab' + (signup ? " on" : "") + '" data-m="signup">' + esc(T.createAccount) + '</button>' +
          '</div>' +
          '<form class="nftw-form">' +
            '<label>' + esc(T.email) + '<input type="email" name="email" autocomplete="email" required></label>' +
            '<label>' + esc(T.password) + '<input type="password" name="password" autocomplete="' + (signup ? "new-password" : "current-password") + '" minlength="8" required></label>' +
            '<p class="nftw-err" hidden></p>' +
            '<button type="submit" class="btn nftw-submit">' + esc(signup ? T.createAccount : T.signIn) + '</button>' +
            (signup ? '<p class="nftw-hint">' + esc(T.signupHint) + '</p>' : '<button type="button" class="nftw-forgot">' + esc(T.forgot) + '</button>') +
          '</form>' +
          '<p class="nftw-switch">' + esc(signup ? T.haveAccount : T.newHere) + ' <button type="button" class="nftw-swap">' + esc(signup ? T.signInLink : T.createOne) + '</button></p>' +
          '<div class="nftw-or"><span>' + esc(T.or) + '</span></div>' +
          '<button class="btn nftw-github">' + GH_ICON + '<span>' + esc(T.githubBtn) + '</span></button>' +
        '</div>';
      wrap.querySelector(".nftw-modal-x").onclick = closeModal;
      wrap.onclick = function (e) { if (e.target === wrap) closeModal(); };
      wrap.querySelectorAll(".nftw-tab").forEach(function (t) { t.onclick = function () { mode = t.dataset.m; draw(); }; });
      wrap.querySelector(".nftw-swap").onclick = function () { mode = signup ? "login" : "signup"; draw(); };
      wrap.querySelector(".nftw-github").onclick = githubLogin;
      var forgot = wrap.querySelector(".nftw-forgot"); if (forgot) forgot.onclick = function () { mode = "recover"; draw(); };
      wrap.querySelector(".nftw-form").onsubmit = onSubmit;
      var first = wrap.querySelector('input[name="email"]'); if (first) first.focus();
    }

    function drawRecover() {
      wrap.innerHTML =
        '<div class="nftw-modal" role="dialog" aria-modal="true">' +
          '<button class="nftw-modal-x" aria-label="Close">×</button>' +
          '<h3 class="nftw-h">' + esc(T.recoverTitle) + '</h3>' +
          '<p class="nftw-hint">' + esc(T.recoverHint) + '</p>' +
          '<form class="nftw-form">' +
            '<label>' + esc(T.email) + '<input type="email" name="email" autocomplete="email" required></label>' +
            '<label>' + esc(T.recoveryCode) + '<input type="text" name="code" placeholder="ABCD-EFGH-JKMN" autocomplete="off" required></label>' +
            '<label>' + esc(T.newPassword) + '<input type="password" name="password" autocomplete="new-password" minlength="8" required></label>' +
            '<p class="nftw-err" hidden></p>' +
            '<button type="submit" class="btn nftw-submit">' + esc(T.resetPassword) + '</button>' +
            '<button type="button" class="nftw-forgot nftw-back">' + esc(T.backToSignIn) + '</button>' +
          '</form>' +
        '</div>';
      wrap.querySelector(".nftw-modal-x").onclick = closeModal;
      wrap.onclick = function (e) { if (e.target === wrap) closeModal(); };
      wrap.querySelector(".nftw-back").onclick = function () { mode = "login"; draw(); };
      wrap.querySelector(".nftw-form").onsubmit = onRecover;
    }

    function showCodes(codes, note) {
      var text = codes.join("\n");
      wrap.innerHTML =
        '<div class="nftw-modal" role="dialog" aria-modal="true">' +
          '<h3 class="nftw-h">' + esc(T.codesTitle) + '</h3>' +
          '<p class="nftw-hint">' + (note ? esc(note) + " " : "") + T.codesHint + '</p>' +
          '<div class="nftw-codes">' + codes.map(function (c) { return "<code>" + esc(c) + "</code>"; }).join("") + '</div>' +
          '<div class="nftw-codes-actions"><button type="button" class="nftw-copy">' + esc(T.copy) + '</button><button type="button" class="nftw-dl">' + esc(T.download) + '</button></div>' +
          '<button type="button" class="btn nftw-done">' + esc(T.done) + '</button>' +
        '</div>';
      wrap.onclick = null; // force acknowledge
      wrap.querySelector(".nftw-copy").onclick = function () { try { navigator.clipboard.writeText(text); this.textContent = T.copied; } catch (e) {} };
      wrap.querySelector(".nftw-dl").onclick = function () { var a = document.createElement("a"); a.href = "data:text/plain;charset=utf-8," + encodeURIComponent("NightmareFTW recovery codes\n\n" + text + "\n"); a.download = "nightmareftw-recovery-codes.txt"; document.body.appendChild(a); a.click(); a.remove(); };
      wrap.querySelector(".nftw-done").onclick = function () { closeModal(); render(); };
    }

    async function onSubmit(ev) {
      ev.preventDefault();
      var f = ev.target, email = f.email.value.trim(), password = f.password.value;
      var btn = f.querySelector(".nftw-submit"); btn.disabled = true;
      try {
        var r = await api("/auth/" + (mode === "signup" ? "signup" : "login"), { method: "POST", body: JSON.stringify({ email: email, password: password }) });
        if (!r.ok || !r.data.token) { btn.disabled = false; return showErr(errMsg(r.data.error, mode)); }
        ls.setItem(CTOKEN, r.data.token); ls.setItem(CEMAIL, r.data.email || email);
        if (mode === "signup") { await cloudPush(); if (r.data.recovery && r.data.recovery.length) return showCodes(r.data.recovery); closeModal(); render(); }
        else { closeModal(); render(); await cloudPull(); }
      } catch (e) { btn.disabled = false; showErr(T.errNetwork); }
    }
    async function onRecover(ev) {
      ev.preventDefault();
      var f = ev.target, email = f.email.value.trim(), code = f.code.value.trim(), password = f.password.value;
      var btn = f.querySelector(".nftw-submit"); btn.disabled = true;
      try {
        var r = await api("/auth/recover", { method: "POST", body: JSON.stringify({ email: email, code: code, password: password }) });
        if (!r.ok || !r.data.token) { btn.disabled = false; return showErr(r.data.error === "weak_password" ? T.errWeak : T.errRecovery); }
        ls.setItem(CTOKEN, r.data.token); ls.setItem(CEMAIL, r.data.email || email);
        render();
        if (r.data.recovery && r.data.recovery.length) { showCodes(r.data.recovery, T.codesAfterRecover); cloudPull(); return; }
        closeModal(); await cloudPull();
      } catch (e) { btn.disabled = false; showErr(T.errNetwork); }
    }
    draw();
  }
  function errMsg(code, mode) {
    return ({ email_taken: T.errEmailTaken, bad_credentials: T.errBadCreds, weak_password: T.errWeak, invalid_email: T.errInvalidEmail })[code] || (mode === "signup" ? T.errCreate : T.errSignIn);
  }

  // ---- header button ---------------------------------------------------------
  function render() {
    var nav = document.querySelector(".top-nav"); if (!nav) return;
    var old = nav.querySelector(".auth-btn"); if (old) old.remove();
    var btn = document.createElement("button"); btn.className = "auth-btn";
    if (signedIn()) {
      var av = avatarUrl();
      btn.innerHTML = (av ? '<img class="auth-av" src="' + esc(av) + '" alt="">' : '<span class="auth-dot"></span>') + esc(displayName());
      btn.title = T.profileTitle;
      btn.addEventListener("click", function () { location.href = "/profile.html"; });
    } else {
      btn.innerHTML = USER_ICON + "<span>" + esc(T.signIn) + "</span>";
      btn.title = T.headerSignInTitle;
      btn.addEventListener("click", function () { openModal("login"); });
    }
    nav.appendChild(btn);
  }

  window.NFTWAuth = {
    signedIn: signedIn, isCloud: function () { return !!ctok(); }, isGitHub: function () { return !!gtok() && !ctok(); },
    email: function () { return ls.getItem(CEMAIL) || ""; }, ghUser: function () { return ls.getItem(USER) || ""; },
    token: function () { return ctok(); }, worker: WORKER,
    signOut: function () { if (ctok()) cloudSignOut(false); else githubLogout(); },
    pushNow: cloudPush, render: render, open: openModal,
  };

  // ---- init ------------------------------------------------------------------
  try { var proto = Storage.prototype, _set = proto.setItem; proto.setItem = function (k, v) { _set.apply(this, arguments); if (this === window.localStorage && syncable(k)) schedulePush(); }; } catch (e) {}
  function start() {
    render();
    if (location.search.indexOf("code=") >= 0) handleCallback();
    else { try { sessionStorage.removeItem("nftw:auth:justLoggedIn"); } catch (e) {} if (signedIn()) pullActive(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
