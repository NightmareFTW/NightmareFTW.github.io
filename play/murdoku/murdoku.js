/* Murdoku — tile-grid UI with a hand-drawn pixel-art store (CC0, original).
   The map is a grid: named areas span several tiles. Pick a suspect, then use
   Place / Crosses / Notes / Erase to work out the exact tile each person stood
   on from the spatial clues. Avatars come from DiceBear. Board + progress persist
   under "nftw:murdoku:*", so they save on-device and sync to your account. */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const SOLVED = "nftw:murdoku:solved", CURKEY = "nftw:murdoku:case", STATE = "nftw:murdoku:state";
  const avatar = (name) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&radius=50`;
  const mmss = (s) => `${String((s / 60) | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const root = document.getElementById("md-root");
  let C = null, caseNum = 0, sel = 0, mode = "place";
  let placements = {}, crosses = {}, notes = {}, secs = 0, timer = null, won = false;
  const START = (new URLSearchParams(location.search).get("case") | 0) || lsGet(CURKEY, 0) || 0;

  // ---------- pixel-art tileset (drawn on a canvas) ----------
  const ZTINT = { green: "#b7e0a5", yellow: "#f2df84", grey: "#d2d2db" };
  function drawMap() {
    const cv = document.getElementById("md-canvas"); if (!cv) return;
    const TS = C.TS, W = C.W, H = C.H;
    cv.width = W * TS; cv.height = H * TS;
    const g = cv.getContext("2d");
    const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    for (const t of C.tiles) {
      const px = t.x * TS, py = t.y * TS;
      if (t.wall) { drawShelfWall(r, px, py, t); continue; }
      // floor: zone tint or aisle tan, with a faint checker + grout
      const zone = t.zone >= 0 ? C.zones[t.zone] : null;
      const base = zone ? ZTINT[zone.color] : "#e9dcc2";
      r(px, py, TS, TS, base);
      if ((t.x + t.y) % 2 === 0) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(px, py, TS, TS); }
      g.fillStyle = "rgba(0,0,0,.10)"; g.fillRect(px, py + TS - 1, TS, 1); g.fillRect(px + TS - 1, py, 1, TS);
      if (t.fixture) drawFixture(r, g, px, py, t.fixture);
    }
  }
  function drawShelfWall(r, px, py, t) {
    r(px, py, 16, 16, "#7a5236");
    r(px, py + 2, 16, 2, "#5c3d26"); r(px, py + 8, 16, 2, "#5c3d26"); r(px, py + 14, 16, 2, "#4a3020");
    const pal = ["#d34", "#e83", "#4a3", "#39c", "#dc3", "#c69"];
    for (let i = 0; i < 3; i++) { const c = pal[(t.x + t.y + i) % pal.length]; r(px + 1 + i * 5, py + 4, 3, 3, c); r(px + 1 + i * 5, py + 10, 3, 3, pal[(t.x + i + 3) % pal.length]); }
  }
  function drawFixture(r, g, px, py, key) {
    const P = (x, y, w, h, c) => r(px + x, py + y, w, h, c);
    switch (key) {
      case "apples": P(0, 9, 16, 7, "#7a5030"); P(0, 8, 16, 2, "#946039"); P(2, 3, 4, 4, "#d33"); P(7, 2, 4, 4, "#e14"); P(11, 4, 4, 4, "#c22"); P(4, 2, 1, 2, "#4a3"); P(9, 1, 1, 2, "#4a3"); break;
      case "bread": P(0, 10, 16, 6, "#8a5a3c"); P(2, 5, 5, 6, "#d9a24a"); P(9, 5, 5, 6, "#c98f3e"); P(2, 5, 5, 2, "#e8bd6c"); break;
      case "cheese": P(0, 9, 16, 7, "#cfc0a0"); P(0, 6, 16, 3, "rgba(150,220,230,.5)"); P(3, 10, 5, 4, "#f2c94c"); P(9, 10, 4, 4, "#e0b23a"); break;
      case "flowers": P(4, 10, 8, 6, "#a5673a"); P(6, 4, 1, 6, "#3a8a3a"); P(9, 4, 1, 6, "#3a8a3a"); P(3, 2, 4, 4, "#e76fa1"); P(8, 1, 4, 4, "#f2a0c0"); P(6, 4, 4, 3, "#e05a90"); break;
      case "plant": P(5, 10, 6, 6, "#b06a3a"); P(3, 2, 10, 9, "#3f9a4f"); P(5, 4, 6, 4, "#2f7a3f"); P(7, 1, 2, 3, "#4fb35f"); break;
      case "banner": P(7, 6, 2, 10, "#8a8a8a"); P(2, 1, 12, 7, "#e0483a"); P(4, 3, 8, 1, "#fff"); P(4, 5, 6, 1, "#fff"); break;
      case "tills": P(2, 8, 12, 8, "#9aa0a8"); P(4, 2, 8, 6, "#2b3550"); P(5, 3, 6, 2, "#5bd6a0"); P(0, 14, 16, 2, "#555"); break;
      case "crates": P(2, 3, 12, 12, "#a06a3a"); P(2, 6, 12, 1, "#7a4e28"); P(2, 10, 12, 1, "#7a4e28"); P(7, 3, 1, 12, "#7a4e28"); break;
      case "barrel": P(4, 2, 8, 13, "#9a5a2a"); P(4, 5, 8, 1, "#6a3a18"); P(4, 9, 8, 1, "#6a3a18"); P(4, 13, 8, 1, "#6a3a18"); P(5, 1, 6, 2, "#b07a44"); break;
      case "safe": P(3, 3, 10, 11, "#4a4f57"); P(4, 4, 8, 9, "#5a616b"); P(9, 8, 3, 3, "#c9a94a"); P(6, 7, 1, 3, "#2b2f35"); break;
      case "rug": P(1, 3, 14, 10, "#b0433a"); P(3, 5, 10, 6, "#d98a5a"); P(6, 7, 4, 2, "#8a2f2a"); break;
      case "coffee": P(3, 2, 10, 13, "#5a5f68"); P(6, 10, 4, 3, "#222"); P(10, 4, 2, 2, "#e14"); P(5, 4, 4, 3, "#3b4048"); break;
      case "lockers": P(2, 2, 12, 13, "#7a8a9a"); P(8, 2, 1, 13, "#59697a"); P(5, 7, 1, 2, "#2b2f35"); P(11, 7, 1, 2, "#2b2f35"); break;
      default: P(4, 4, 8, 8, "#888");
    }
  }

  // ---------- persistence ----------
  function load(n) {
    caseNum = Math.max(0, n | 0);
    C = MURDOKU.generateCase(caseNum);
    lsSet(CURKEY, caseNum);
    const st = lsGet(STATE, {});
    if (st.case === caseNum) { placements = st.placements || {}; crosses = st.crosses || {}; notes = st.notes || {}; secs = st.secs || 0; }
    else { placements = {}; crosses = {}; notes = {}; secs = 0; }
    sel = 0; mode = "place"; won = isSolved(caseNum);
    shell(); drawMap(); refresh(); startTimer();
  }
  const save = () => lsSet(STATE, { case: caseNum, placements, crosses, notes, secs });
  const solvedList = () => lsGet(SOLVED, []);
  const isSolved = (n) => solvedList().includes(n);
  function startTimer() { clearInterval(timer); if (won) return; timer = setInterval(() => { secs++; const el = document.getElementById("md-timer"); if (el) el.textContent = mmss(secs); if (secs % 5 === 0) save(); }, 1000); }

  // ---------- actions ----------
  const tileOwner = (tile) => { for (const s in placements) if (placements[s] === tile) return +s; return -1; };
  function act(tile) {
    if (won) return;
    const t = C.tiles[tile]; if (!t || !t.walkable) return;
    if (mode === "place") {
      const occ = tileOwner(tile); if (occ >= 0 && occ !== sel) delete placements[occ];
      placements[sel] = tile; delete crosses[`${sel}:${tile}`]; delete notes[`${sel}:${tile}`];
      const next = C.suspects.findIndex((_, i) => placements[i] == null); if (next >= 0) sel = next;
    } else if (mode === "cross") { const k = `${sel}:${tile}`; crosses[k] ? delete crosses[k] : (crosses[k] = 1); }
    else if (mode === "notes") { const k = `${sel}:${tile}`; notes[k] ? delete notes[k] : (notes[k] = 1); }
    else if (mode === "erase") {
      const occ = tileOwner(tile); if (occ >= 0) delete placements[occ];
      for (let s = 0; s < C.N; s++) { delete crosses[`${s}:${tile}`]; delete notes[`${s}:${tile}`]; }
    }
    save(); checkWin(); refresh();
  }
  function hint() {
    if (won) return;
    const wrong = C.suspects.map((_, i) => i).filter((i) => placements[i] !== C.solution[i]);
    if (!wrong.length) return;
    const s = wrong[Math.floor(Math.random() * wrong.length)];
    const occ = tileOwner(C.solution[s]); if (occ >= 0) delete placements[occ];
    placements[s] = C.solution[s]; sel = s; save(); checkWin(); refresh();
  }
  function checkWin() {
    if (won) return;
    for (let i = 0; i < C.N; i++) if (placements[i] !== C.solution[i]) return;
    won = true; clearInterval(timer);
    const list = solvedList(); if (!list.includes(caseNum)) { list.push(caseNum); lsSet(SOLVED, list); }
  }

  // ---------- render ----------
  function shell() {
    root.innerHTML = `
      <div class="md-bar">
        <div class="md-casenav">
          <button class="mini-btn" id="md-prev" ${caseNum <= 0 ? "disabled" : ""}>‹</button>
          <span class="md-caseno">#${caseNum + 1} · ${esc(C.title)}</span>
          <button class="mini-btn" id="md-next">›</button>
        </div>
        <div class="md-bar-r"><span class="md-timer" id="md-timer">${mmss(secs)}</span><button class="mini-btn" id="md-reset" title="Reset this case">↻</button><span class="md-progress">${solvedList().length} solved</span></div>
      </div>
      <p class="md-briefline">${esc(C.brief)}</p>

      <div class="mdm-stage">
        <div class="mdm-wrap" id="md-wrap" style="aspect-ratio:${C.W}/${C.H}">
          <canvas class="mdm-canvas" id="md-canvas"></canvas>
          <div class="mdm-overlay" id="md-overlay"></div>
          <div class="mdm-labels" id="md-labels"></div>
        </div>
      </div>

      <div class="mdm-toolbar" id="md-toolbar">
        ${toolBtn("notes", "✎", "Notes")}${toolBtn("cross", "✕", "Crosses")}${toolBtn("place", "✓", "Place")}${toolBtn("erase", "⌫", "Erase")}
        <button class="mdm-tool mdm-hint" id="md-hint"><span>💡</span>Hint</button>
      </div>
      <div class="mdm-tray" id="md-tray"></div>

      <div class="md-cols mdm-lower">
        <section class="panel md-clues"><h2>Clues</h2><ol>${C.clues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
          <p class="md-hint">Each area covers several tiles. Pick a suspect, read the clues, and <b>Place</b> them on the exact tile — <b>Crosses</b> rule tiles out, <b>Notes</b> pencil in a maybe.</p></section>
        <section class="panel mdm-status" id="md-status"></section>
      </div>

      <div class="mdm-labels-src" hidden>${C.zones.map((z) => `${z.label.x},${z.label.y},${esc(z.name)}`).join("|")}</div>`;

    // zone labels positioned over the map
    const lab = document.getElementById("md-labels");
    lab.innerHTML = C.zones.map((z) => `<span class="mdm-zlabel" style="left:${(z.label.x + 0.5) / C.W * 100}%;top:${(z.label.y + 0.5) / C.H * 100}%">${esc(z.name)}</span>`).join("");

    document.getElementById("md-toolbar").querySelectorAll("[data-tool]").forEach((b) => b.onclick = () => { mode = b.dataset.tool; refresh(); });
    document.getElementById("md-hint").onclick = hint;
    document.getElementById("md-prev").onclick = () => load(caseNum - 1);
    document.getElementById("md-next").onclick = () => load(caseNum + 1);
    document.getElementById("md-reset").onclick = () => { if (confirm("Reset this case's board?")) { placements = {}; crosses = {}; notes = {}; secs = 0; won = false; save(); shell(); drawMap(); refresh(); startTimer(); } };
  }

  function refresh() {
    // overlay tiles
    const ov = document.getElementById("md-overlay"); if (!ov) return;
    let html = "";
    for (const t of C.tiles) {
      if (!t.walkable) continue;
      const tile = t.y * C.W + t.x;
      const owner = tileOwner(tile);
      const crossed = owner < 0 && crosses[`${sel}:${tile}`];
      const noteHere = []; for (let s = 0; s < C.N; s++) if (notes[`${s}:${tile}`] && placements[s] == null) noteHere.push(s);
      const style = `left:${t.x / C.W * 100}%;top:${t.y / C.H * 100}%;width:${100 / C.W}%;height:${100 / C.H}%`;
      let inner = "";
      if (owner >= 0) inner = `<img class="mdm-av" src="${avatar(C.suspects[owner].name)}" alt="${esc(C.suspects[owner].name)}" style="border-color:${C.suspects[owner].color}" referrerpolicy="no-referrer">`;
      else {
        if (noteHere.length) inner += `<span class="mdm-note">${noteHere.map((s) => `<i style="color:${C.suspects[s].color}">${esc(C.suspects[s].name[0])}</i>`).join("")}</span>`;
        if (crossed) inner += `<span class="mdm-x">✕</span>`;
      }
      html += `<button class="mdm-tile walk${owner >= 0 ? " has" : ""}" data-tile="${tile}" style="${style}">${inner}</button>`;
    }
    ov.innerHTML = html;
    ov.querySelectorAll(".mdm-tile").forEach((b) => b.onclick = () => act(+b.dataset.tile));

    // tray
    const tray = document.getElementById("md-tray");
    tray.innerHTML = C.suspects.map((s, i) => {
      const placed = placements[i] != null;
      return `<button class="mdm-sus${i === sel ? " on" : ""}${placed ? " placed" : ""}" data-s="${i}" title="${esc(s.name)}" style="--c:${s.color}">
        <img src="${avatar(s.name)}" alt="${esc(s.name)}" referrerpolicy="no-referrer"><span>${esc(s.name)}</span>${placed ? '<span class="mdm-dot">✓</span>' : ""}</button>`;
    }).join("");
    tray.querySelectorAll("[data-s]").forEach((b) => b.onclick = () => { sel = +b.dataset.s; refresh(); });

    // toolbar active
    document.querySelectorAll("#md-toolbar [data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === mode));

    // status
    const placedN = Object.keys(placements).length;
    document.getElementById("md-status").innerHTML = `<h2>Investigation</h2>
      <p class="mdm-count">${placedN} / ${C.N} placed</p>
      ${won ? `<p class="md-verdict ok">🎉 Case solved in ${mmss(secs)}! Everyone is on the right tile.</p><button class="btn" id="md-nextcase">Next case ▸</button>`
        : `<p class="mdm-note-line">Place all ${C.N} suspects on their exact tile to close the case.</p>`}`;
    const nc = document.getElementById("md-nextcase"); if (nc) nc.onclick = () => load(caseNum + 1);
  }

  const toolBtn = (id, icon, label) => `<button class="mdm-tool" data-tool="${id}"><span>${icon}</span>${label}</button>`;

  if (window.MURDOKU) load(START); else root.innerHTML = `<p class="tool-note">Couldn't load the case engine.</p>`;
})();
