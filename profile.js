/* NightmareFTW — profile page.
   Lets a signed-in user set a nickname + avatar (stored in synced nftw:profile:*
   keys, so they follow the account across devices), manage recovery codes
   (Cloudflare email accounts only), and sign out. Self-contained: reads the
   session from localStorage and talks to the Worker directly, so it doesn't
   depend on auth.js load order (auth.js still handles the actual syncing). */
(function () {
  "use strict";
  var WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  var ls = localStorage;
  var CTOKEN = "nftw:auth:ctoken", CEMAIL = "nftw:auth:cemail", GTOKEN = "nftw:auth:token", GUSER = "nftw:auth:user", GIST = "nftw:auth:gist";
  var PNICK = "nftw:profile:nick", PAVATAR = "nftw:profile:avatar";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]); }); };
  var ctok = function () { return ls.getItem(CTOKEN); };
  var gtok = function () { return ls.getItem(GTOKEN); };
  var root = document.getElementById("profile-root");

  function toast(msg, ok) {
    var t = document.getElementById("prof-toast");
    if (!t) { t = document.createElement("p"); t.id = "prof-toast"; t.className = "prof-toast"; root.appendChild(t); }
    t.textContent = msg; t.style.color = ok === false ? "#ff8a82" : "#5bd6a0";
  }
  function syncNow() { try { if (window.NFTWAuth && window.NFTWAuth.pushNow) window.NFTWAuth.pushNow(); } catch (e) {} }

  async function api(path, opts) {
    opts = opts || {}; opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (ctok()) opts.headers.Authorization = "Bearer " + ctok();
    var r = await fetch(WORKER + path, opts); var d = {}; try { d = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data: d };
  }

  // resize an uploaded image to a square avatar (cover-crop) and return a data URL
  function toAvatar(file, cb) {
    if (!/^image\//.test(file.type)) return cb(null, "That file isn't an image.");
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var SIZE = 160, c = document.createElement("canvas"); c.width = SIZE; c.height = SIZE;
      var g = c.getContext("2d"); var s = Math.min(img.width, img.height);
      g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      try { cb(c.toDataURL("image/jpeg", 0.85)); } catch (e) { cb(null, "Couldn't process that image."); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null, "Couldn't read that image."); };
    img.src = url;
  }

  function render() {
    if (!ctok() && !gtok()) {
      root.innerHTML = '<p class="tool-note">You\'re not signed in. <a href="index.html" style="color:var(--accent)">Go to the hub</a> and sign in first.</p>';
      return;
    }
    var av = ls.getItem(PAVATAR) || "", nick = ls.getItem(PNICK) || "";
    var cloud = !!ctok(), email = ls.getItem(CEMAIL) || "", gu = ls.getItem(GUSER) || "";
    var initial = (nick || email || gu || "?").charAt(0).toUpperCase();
    root.innerHTML =
      '<div class="prof-grid">' +
        '<section class="panel prof-card">' +
          '<div class="prof-head">' +
            '<div class="prof-avatar">' + (av ? '<img src="' + esc(av) + '" alt="avatar">' : '<span class="prof-avatar-ph">' + esc(initial) + '</span>') + '</div>' +
            '<div class="prof-id"><span class="prof-name">' + esc(nick || email || gu) + '</span>' +
              '<span class="prof-sub">' + (cloud ? esc(email) : esc(gu) + ' · GitHub') + '</span></div>' +
          '</div>' +
          '<label class="prof-field">Nickname' +
            '<input type="text" id="prof-nick" maxlength="24" value="' + esc(nick) + '" placeholder="Shown in the header">' +
          '</label>' +
          '<div class="prof-actions">' +
            '<button class="btn" id="prof-save">Save nickname</button>' +
            '<label class="btn btn-ghost" for="prof-avatar-input">Change picture</label>' +
            '<input type="file" id="prof-avatar-input" accept="image/*" hidden>' +
            (av ? '<button class="btn btn-ghost" id="prof-avatar-remove">Remove picture</button>' : '') +
          '</div>' +
        '</section>' +
        (cloud ? '<section class="panel prof-card"><h2>Recovery codes</h2>' +
          '<p class="prof-note">One-time codes to reset your password without email. Keep them safe.</p>' +
          '<p id="prof-rc-count" class="prof-rc-count">Checking…</p>' +
          '<div id="prof-rc-codes"></div>' +
          '<button class="btn btn-ghost" id="prof-rc-gen">Generate new codes</button>' +
        '</section>' : '') +
        '<section class="panel prof-card"><h2>Account</h2>' +
          '<p class="prof-note">' + (cloud ? 'Signed in with email <b>' + esc(email) + '</b>.' : 'Signed in with GitHub as <b>' + esc(gu) + '</b>.') + ' Your settings and game progress sync to this account.</p>' +
          '<button class="btn btn-danger" id="prof-signout">Sign out</button>' +
        '</section>' +
      '</div>' +
      '<p id="prof-toast" class="prof-toast"></p>';

    document.getElementById("prof-save").onclick = function () {
      var v = document.getElementById("prof-nick").value.trim();
      if (v) ls.setItem(PNICK, v); else ls.removeItem(PNICK);
      syncNow(); toast("Nickname saved."); refreshHeader();
    };
    document.getElementById("prof-avatar-input").onchange = function (e) {
      var file = e.target.files && e.target.files[0]; if (!file) return;
      if (file.size > 8 * 1024 * 1024) return toast("Please pick an image under 8 MB.", false);
      toAvatar(file, function (dataUrl, err) {
        if (!dataUrl) return toast(err || "Couldn't process that image.", false);
        ls.setItem(PAVATAR, dataUrl); syncNow(); toast("Picture updated."); render(); refreshHeader();
      });
    };
    var rm = document.getElementById("prof-avatar-remove");
    if (rm) rm.onclick = function () { ls.removeItem(PAVATAR); syncNow(); toast("Picture removed."); render(); refreshHeader(); };
    document.getElementById("prof-signout").onclick = function () {
      if (!confirm("Sign out? Your synced data stays safe in your account.")) return;
      if (window.NFTWAuth && window.NFTWAuth.signOut) window.NFTWAuth.signOut();
      else [CTOKEN, CEMAIL, GTOKEN, GUSER, GIST].forEach(function (k) { ls.removeItem(k); });
      location.href = "index.html";
    };
    if (cloud) { wireRecovery(); loadRecoveryCount(); }
  }

  function refreshHeader() { try { if (window.NFTWAuth && window.NFTWAuth.render) window.NFTWAuth.render(); } catch (e) {} }

  function wireRecovery() {
    document.getElementById("prof-rc-gen").onclick = async function () {
      if (!confirm("Generate a fresh set of recovery codes? Any old codes stop working.")) return;
      this.disabled = true;
      var r = await api("/auth/recovery-codes", { method: "POST" });
      this.disabled = false;
      if (!r.ok || !r.data.recovery) return toast("Couldn't generate codes — try again.", false);
      showCodes(r.data.recovery);
      loadRecoveryCount();
    };
  }
  async function loadRecoveryCount() {
    var el = document.getElementById("prof-rc-count"); if (!el) return;
    var r = await api("/auth/recovery-count", { method: "GET" });
    var n = r.ok && r.data ? r.data.count : 0;
    el.textContent = n > 0 ? n + " unused code" + (n === 1 ? "" : "s") + " remaining." : "You have no recovery codes yet — generate a set below.";
  }
  function showCodes(codes) {
    var box = document.getElementById("prof-rc-codes"); if (!box) return;
    var text = codes.join("\n");
    box.innerHTML = '<p class="prof-note" style="color:#ffd24a">Save these now — they\'re shown only once.</p>' +
      '<div class="nftw-codes">' + codes.map(function (c) { return "<code>" + esc(c) + "</code>"; }).join("") + '</div>' +
      '<div class="nftw-codes-actions"><button type="button" class="nftw-copy">Copy</button><button type="button" class="nftw-dl">Download</button></div>';
    box.querySelector(".nftw-copy").onclick = function () { try { navigator.clipboard.writeText(text); this.textContent = "Copied"; } catch (e) {} };
    box.querySelector(".nftw-dl").onclick = function () { var a = document.createElement("a"); a.href = "data:text/plain;charset=utf-8," + encodeURIComponent("NightmareFTW recovery codes\n(each works once to reset your password)\n\n" + text + "\n"); a.download = "nightmareftw-recovery-codes.txt"; document.body.appendChild(a); a.click(); a.remove(); };
  }

  render();
})();
