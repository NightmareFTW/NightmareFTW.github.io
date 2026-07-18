/* NightmareFTW — profile page.
   Nickname + avatar (with a zoom/rotate/pan crop editor), recovery-code
   management, and sign out. Profile data lives in synced nftw:profile:* keys so
   it follows the account across devices. Self-contained: reads the session from
   localStorage and talks to the Worker directly, so it doesn't depend on
   auth.js load order (auth.js still does the syncing). EN + PT-PT. */
(function () {
  "use strict";
  var WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  var ls = localStorage;
  var L = (ls.getItem("nftw:lang") === "pt") ? "pt" : "en";
  var CTOKEN = "nftw:auth:ctoken", CEMAIL = "nftw:auth:cemail", GTOKEN = "nftw:auth:token", GUSER = "nftw:auth:user", GIST = "nftw:auth:gist";
  var PNICK = "nftw:profile:nick", PAVATAR = "nftw:profile:avatar";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]); }); };
  var ctok = function () { return ls.getItem(CTOKEN); };
  var gtok = function () { return ls.getItem(GTOKEN); };
  var root = document.getElementById("profile-root");

  var T = L === "pt" ? {
    notSignedIn: 'Não tens sessão iniciada. <a href="index.html" style="color:var(--accent)">Vai ao hub</a> e inicia sessão primeiro.',
    nickname: "Nome", nickPlaceholder: "Aparece no cabeçalho", saveNick: "Guardar nome",
    changePic: "Mudar imagem", removePic: "Remover imagem",
    recoveryTitle: "Códigos de recuperação",
    recoveryNote: "Códigos de uso único para repor a password sem email. Guarda-os num sítio seguro. Sempre que recuperas a conta, recebes um conjunto novo, por isso nunca ficas sem.",
    checking: "A verificar…",
    remaining: function (n) { return n + (n === 1 ? " código por usar." : " códigos por usar."); },
    noneYet: "Ainda não tens códigos de recuperação. Gera um conjunto abaixo.",
    genCodes: "Gerar novos códigos",
    genConfirm: "Gerar um conjunto novo de códigos? Os antigos deixam de funcionar.",
    genFail: "Não foi possível gerar os códigos. Tenta outra vez.",
    saveOnce: "Guarda-os agora: só são mostrados uma vez.",
    copy: "Copiar", copied: "Copiado", download: "Transferir",
    accountTitle: "Conta",
    accEmail: function (e) { return "Sessão iniciada com o email <b>" + e + "</b>."; },
    accGithub: function (u) { return "Sessão iniciada com o GitHub como <b>" + u + "</b>."; },
    accSync: "As tuas definições e progresso nos jogos sincronizam com esta conta.",
    signOut: "Terminar sessão", signOutConfirm: "Terminar sessão? Os teus dados sincronizados ficam guardados na conta.",
    nickSaved: "Nome guardado.", picUpdated: "Imagem actualizada.", picRemoved: "Imagem removida.",
    notImage: "Esse ficheiro não é uma imagem.", tooBig: "Escolhe uma imagem com menos de 8 MB.",
    badImage: "Não foi possível processar essa imagem.",
    editTitle: "Ajusta a tua imagem", editHint: "Arrasta para mover. Usa os controlos para ampliar e rodar.",
    zoom: "Ampliação", rotate: "Rotação", rotL: "↺ 90°", rotR: "↻ 90°", reset: "Repor",
    cancel: "Cancelar", savePic: "Guardar imagem",
  } : {
    notSignedIn: 'You\'re not signed in. <a href="index.html" style="color:var(--accent)">Go to the hub</a> and sign in first.',
    nickname: "Nickname", nickPlaceholder: "Shown in the header", saveNick: "Save nickname",
    changePic: "Change picture", removePic: "Remove picture",
    recoveryTitle: "Recovery codes",
    recoveryNote: "One-time codes to reset your password without email. Keep them somewhere safe. Every time you recover your account you get a fresh set, so you never run out.",
    checking: "Checking…",
    remaining: function (n) { return n + (n === 1 ? " unused code." : " unused codes."); },
    noneYet: "You have no recovery codes yet — generate a set below.",
    genCodes: "Generate new codes",
    genConfirm: "Generate a fresh set of recovery codes? Any old codes stop working.",
    genFail: "Couldn't generate codes — try again.",
    saveOnce: "Save these now — they're shown only once.",
    copy: "Copy", copied: "Copied", download: "Download",
    accountTitle: "Account",
    accEmail: function (e) { return "Signed in with email <b>" + e + "</b>."; },
    accGithub: function (u) { return "Signed in with GitHub as <b>" + u + "</b>."; },
    accSync: "Your settings and game progress sync to this account.",
    signOut: "Sign out", signOutConfirm: "Sign out? Your synced data stays safe in your account.",
    nickSaved: "Nickname saved.", picUpdated: "Picture updated.", picRemoved: "Picture removed.",
    notImage: "That file isn't an image.", tooBig: "Please pick an image under 8 MB.",
    badImage: "Couldn't process that image.",
    editTitle: "Adjust your picture", editHint: "Drag to move. Use the controls to zoom and rotate.",
    zoom: "Zoom", rotate: "Rotate", rotL: "↺ 90°", rotR: "↻ 90°", reset: "Reset",
    cancel: "Cancel", savePic: "Save picture",
  };

  function toast(msg, ok) {
    var t = document.getElementById("prof-toast");
    if (t) { t.textContent = msg; t.style.color = ok === false ? "#ff8a82" : "#5bd6a0"; }
  }
  function syncNow() { try { if (window.NFTWAuth && window.NFTWAuth.pushNow) window.NFTWAuth.pushNow(); } catch (e) {} }
  function refreshHeader() { try { if (window.NFTWAuth && window.NFTWAuth.render) window.NFTWAuth.render(); } catch (e) {} }

  async function api(path, opts) {
    opts = opts || {}; opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (ctok()) opts.headers.Authorization = "Bearer " + ctok();
    var r = await fetch(WORKER + path, opts); var d = {}; try { d = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data: d };
  }

  // ---- avatar crop editor (zoom / rotate / pan) ------------------------------
  var STAGE = 280, OUT = 256;
  function openEditor(file) {
    if (!/^image\//.test(file.type)) return toast(T.notImage, false);
    if (file.size > 8 * 1024 * 1024) return toast(T.tooBig, false);
    var url = URL.createObjectURL(file), img = new Image();
    img.onerror = function () { URL.revokeObjectURL(url); toast(T.badImage, false); };
    img.onload = function () {
      var wrap = document.createElement("div");
      wrap.className = "nftw-modal-overlay"; wrap.id = "prof-editor";
      wrap.innerHTML =
        '<div class="nftw-modal prof-editor" role="dialog" aria-modal="true">' +
          '<h3 class="nftw-h">' + esc(T.editTitle) + '</h3>' +
          '<p class="nftw-hint">' + esc(T.editHint) + '</p>' +
          '<canvas class="prof-stage" width="' + STAGE + '" height="' + STAGE + '"></canvas>' +
          '<label class="prof-slider">' + esc(T.zoom) + '<input type="range" class="pe-zoom" min="1" max="4" step="0.01" value="1"></label>' +
          '<label class="prof-slider">' + esc(T.rotate) + '<input type="range" class="pe-rot" min="-180" max="180" step="1" value="0"></label>' +
          '<div class="prof-editor-btns">' +
            '<button type="button" class="btn btn-ghost pe-rl">' + esc(T.rotL) + '</button>' +
            '<button type="button" class="btn btn-ghost pe-rr">' + esc(T.rotR) + '</button>' +
            '<button type="button" class="btn btn-ghost pe-reset">' + esc(T.reset) + '</button>' +
          '</div>' +
          '<div class="prof-editor-actions">' +
            '<button type="button" class="btn btn-ghost pe-cancel">' + esc(T.cancel) + '</button>' +
            '<button type="button" class="btn pe-save">' + esc(T.savePic) + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(wrap);

      var cv = wrap.querySelector(".prof-stage"), ctx = cv.getContext("2d");
      var zoomEl = wrap.querySelector(".pe-zoom"), rotEl = wrap.querySelector(".pe-rot");
      var base = STAGE / Math.min(img.width, img.height);   // "cover" the stage at zoom 1
      var st = { scale: 1, rot: 0, ox: 0, oy: 0 };

      function paint(ctx2, size, guide) {
        var k = size / STAGE;
        ctx2.save();
        ctx2.fillStyle = "#0f1114"; ctx2.fillRect(0, 0, size, size);
        ctx2.translate(size / 2 + st.ox * k, size / 2 + st.oy * k);
        ctx2.rotate(st.rot * Math.PI / 180);
        var s = base * st.scale * k;
        ctx2.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s);
        ctx2.restore();
        if (guide) {                                  // dim everything outside the circle
          ctx2.save();
          ctx2.beginPath(); ctx2.rect(0, 0, size, size);
          ctx2.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2, true);
          ctx2.fillStyle = "rgba(0,0,0,.58)"; ctx2.fill("evenodd");
          ctx2.beginPath(); ctx2.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
          ctx2.strokeStyle = "rgba(255,255,255,.75)"; ctx2.lineWidth = 2; ctx2.stroke();
          ctx2.restore();
        }
      }
      var draw = function () { paint(ctx, STAGE, true); };
      draw();

      // drag to pan
      var dragging = false, lx = 0, ly = 0;
      cv.addEventListener("pointerdown", function (e) { dragging = true; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener("pointermove", function (e) { if (!dragging) return; st.ox += e.clientX - lx; st.oy += e.clientY - ly; lx = e.clientX; ly = e.clientY; draw(); });
      cv.addEventListener("pointerup", function () { dragging = false; });
      cv.addEventListener("pointercancel", function () { dragging = false; });
      cv.addEventListener("wheel", function (e) { e.preventDefault(); st.scale = Math.min(4, Math.max(1, st.scale - e.deltaY * 0.0015)); zoomEl.value = st.scale; draw(); }, { passive: false });

      zoomEl.oninput = function () { st.scale = parseFloat(this.value); draw(); };
      rotEl.oninput = function () { st.rot = parseFloat(this.value); draw(); };
      wrap.querySelector(".pe-rl").onclick = function () { st.rot = ((st.rot - 90 + 540) % 360) - 180; rotEl.value = st.rot; draw(); };
      wrap.querySelector(".pe-rr").onclick = function () { st.rot = ((st.rot + 90 + 540) % 360) - 180; rotEl.value = st.rot; draw(); };
      wrap.querySelector(".pe-reset").onclick = function () { st = { scale: 1, rot: 0, ox: 0, oy: 0 }; zoomEl.value = 1; rotEl.value = 0; draw(); };

      function close() { URL.revokeObjectURL(url); wrap.remove(); }
      wrap.querySelector(".pe-cancel").onclick = close;
      wrap.onclick = function (e) { if (e.target === wrap) close(); };
      wrap.querySelector(".pe-save").onclick = function () {
        var out = document.createElement("canvas"); out.width = OUT; out.height = OUT;
        paint(out.getContext("2d"), OUT, false);
        var data;
        try { data = out.toDataURL("image/jpeg", 0.88); } catch (e) { close(); return toast(T.badImage, false); }
        ls.setItem(PAVATAR, data); syncNow(); close(); render(); refreshHeader(); toast(T.picUpdated);
      };
    };
    img.src = url;
  }

  // ---- page ------------------------------------------------------------------
  function render() {
    if (!ctok() && !gtok()) { root.innerHTML = '<p class="tool-note">' + T.notSignedIn + '</p>'; return; }
    var av = ls.getItem(PAVATAR) || "", nick = ls.getItem(PNICK) || "";
    var cloud = !!ctok(), email = ls.getItem(CEMAIL) || "", gu = ls.getItem(GUSER) || "";
    var initial = (nick || email || gu || "?").charAt(0).toUpperCase();
    root.innerHTML =
      '<div class="prof-grid">' +
        '<section class="panel prof-card">' +
          '<div class="prof-head">' +
            '<div class="prof-avatar">' + (av ? '<img src="' + esc(av) + '" alt="">' : '<span class="prof-avatar-ph">' + esc(initial) + '</span>') + '</div>' +
            '<div class="prof-id"><span class="prof-name">' + esc(nick || email || gu) + '</span>' +
              '<span class="prof-sub">' + (cloud ? esc(email) : esc(gu) + " · GitHub") + '</span></div>' +
          '</div>' +
          '<label class="prof-field">' + esc(T.nickname) +
            '<input type="text" id="prof-nick" maxlength="24" value="' + esc(nick) + '" placeholder="' + esc(T.nickPlaceholder) + '">' +
          '</label>' +
          '<div class="prof-actions">' +
            '<button class="btn" id="prof-save">' + esc(T.saveNick) + '</button>' +
            '<label class="btn btn-ghost" for="prof-avatar-input">' + esc(T.changePic) + '</label>' +
            '<input type="file" id="prof-avatar-input" accept="image/*" hidden>' +
            (av ? '<button class="btn btn-ghost" id="prof-avatar-remove">' + esc(T.removePic) + '</button>' : '') +
          '</div>' +
        '</section>' +
        (cloud ? '<section class="panel prof-card"><h2>' + esc(T.recoveryTitle) + '</h2>' +
          '<p class="prof-note">' + esc(T.recoveryNote) + '</p>' +
          '<p id="prof-rc-count" class="prof-rc-count">' + esc(T.checking) + '</p>' +
          '<div id="prof-rc-codes"></div>' +
          '<button class="btn btn-ghost" id="prof-rc-gen">' + esc(T.genCodes) + '</button>' +
        '</section>' : '') +
        '<section class="panel prof-card"><h2>' + esc(T.accountTitle) + '</h2>' +
          '<p class="prof-note">' + (cloud ? T.accEmail(esc(email)) : T.accGithub(esc(gu))) + ' ' + esc(T.accSync) + '</p>' +
          '<button class="btn btn-danger" id="prof-signout">' + esc(T.signOut) + '</button>' +
        '</section>' +
      '</div>' +
      '<p id="prof-toast" class="prof-toast"></p>';

    document.getElementById("prof-save").onclick = function () {
      var v = document.getElementById("prof-nick").value.trim();
      if (v) ls.setItem(PNICK, v); else ls.removeItem(PNICK);
      syncNow(); toast(T.nickSaved); refreshHeader();
      var n = document.querySelector(".prof-name"); if (n) n.textContent = v || (ctok() ? ls.getItem(CEMAIL) : ls.getItem(GUSER)) || "";
    };
    document.getElementById("prof-avatar-input").onchange = function (e) {
      var file = e.target.files && e.target.files[0]; this.value = "";
      if (file) openEditor(file);
    };
    var rm = document.getElementById("prof-avatar-remove");
    if (rm) rm.onclick = function () { ls.removeItem(PAVATAR); syncNow(); render(); refreshHeader(); toast(T.picRemoved); };
    document.getElementById("prof-signout").onclick = function () {
      if (!confirm(T.signOutConfirm)) return;
      if (window.NFTWAuth && window.NFTWAuth.signOut) window.NFTWAuth.signOut();
      else [CTOKEN, CEMAIL, GTOKEN, GUSER, GIST].forEach(function (k) { ls.removeItem(k); });
      location.href = "index.html";
    };
    if (cloud) { wireRecovery(); loadRecoveryCount(); }
  }

  function wireRecovery() {
    document.getElementById("prof-rc-gen").onclick = async function () {
      if (!confirm(T.genConfirm)) return;
      this.disabled = true;
      var r = await api("/auth/recovery-codes", { method: "POST" });
      this.disabled = false;
      if (!r.ok || !r.data.recovery) return toast(T.genFail, false);
      showCodes(r.data.recovery); loadRecoveryCount();
    };
  }
  async function loadRecoveryCount() {
    var el = document.getElementById("prof-rc-count"); if (!el) return;
    var r = await api("/auth/recovery-count", { method: "GET" });
    var n = r.ok && r.data ? (r.data.count || 0) : 0;
    el.textContent = n > 0 ? T.remaining(n) : T.noneYet;
  }
  function showCodes(codes) {
    var box = document.getElementById("prof-rc-codes"); if (!box) return;
    var text = codes.join("\n");
    box.innerHTML = '<p class="prof-note" style="color:#ffd24a">' + esc(T.saveOnce) + '</p>' +
      '<div class="nftw-codes">' + codes.map(function (c) { return "<code>" + esc(c) + "</code>"; }).join("") + '</div>' +
      '<div class="nftw-codes-actions"><button type="button" class="nftw-copy">' + esc(T.copy) + '</button><button type="button" class="nftw-dl">' + esc(T.download) + '</button></div>';
    box.querySelector(".nftw-copy").onclick = function () { try { navigator.clipboard.writeText(text); this.textContent = T.copied; } catch (e) {} };
    box.querySelector(".nftw-dl").onclick = function () { var a = document.createElement("a"); a.href = "data:text/plain;charset=utf-8," + encodeURIComponent("NightmareFTW recovery codes\n\n" + text + "\n"); a.download = "nightmareftw-recovery-codes.txt"; document.body.appendChild(a); a.click(); a.remove(); };
  }

  render();
})();
