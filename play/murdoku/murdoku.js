/* Murdoku — tile UI (Murder + Sudoku). Irregular pixel-art store on a <canvas>.
   Place a suspect and their whole row + column are ruled out (auto ✕) — only one
   suspect per row and per column. Suspects can't stand on furniture, but the
   bench is occupiable. Deduce each exact tile from the spatial clues. Avatars are
   DiceBear. Board + progress persist under "nftw:murdoku:*" (syncs to account). */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const SOLVED = "nftw:murdoku:solved", CURKEY = "nftw:murdoku:case", STATE = "nftw:murdoku:state";
  const L = (localStorage.getItem("nftw:lang") === "pt") ? "pt" : "en";
  // DiceBear "adventurer": bias hair length + facial hair so the avatar reads as the name's gender
  const F_HAIR = ["long02", "long04", "long07", "long10", "long15", "long20"];
  const M_HAIR = ["short01", "short03", "short05", "short08", "short11", "short15"];
  const avatar = (name, g) => {
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    const hair = (g === "f" ? F_HAIR : M_HAIR)[h % 6];
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&radius=50&hair=${hair}&hairProbability=100&facialHairProbability=${g === "f" ? 0 : 40}`;
  };
  const mmss = (s) => `${String((s / 60) | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const T = L === "pt" ? {
    notes: "Notas", crosses: "Cruzes", place: "Colocar", erase: "Apagar", hint: "Dica",
    clues: "Pistas", investigation: "Investigação", reset: "Repor este caso",
    help: "Coloca as 6 pessoas (5 suspeitos + a vítima) pelas pistas. Ao colocar alguém, elimina-se toda a <b>linha e coluna</b> — só um por linha e por coluna. Ninguém fica em cima de mobília (o banco conta). O culpado é quem ficou sozinho na sala da vítima.",
    placedOf: (n, N) => `${n} / ${N} colocados`, nextCase: "Próximo caso ▸",
    placeAll: (N) => `Coloca as ${N} pessoas — ${N - 1} suspeitos e a vítima — uma por linha e por coluna.`,
    notAllCorrect: "Estão todos colocados, mas as posições ainda não batem certo. Revê as pistas.",
    accuseTitle: "Todos no sítio! Quem é o culpado?", accuseHelp: "Foi quem ficou sozinho(a) na sala da vítima.",
    wrongAccuse: (name) => `${name} não estava sozinho(a) com a vítima. Tenta outra vez.`,
    solvedCulprit: (t, name, g) => `🎉 Resolvido em ${t}! ${name} ficou sozinh${g === "f" ? "a" : "o"} com a vítima — é ${g === "f" ? "a culpada" : "o culpado"}.`,
    solvedCount: (n) => `${n} resolvidos`, resetConfirm: "Repor o tabuleiro deste caso?",
    loadErr: "Não foi possível carregar o motor de casos.",
  } : {
    notes: "Notes", crosses: "Crosses", place: "Place", erase: "Erase", hint: "Hint",
    clues: "Clues", investigation: "Investigation", reset: "Reset this case",
    help: "Place all 6 people (5 suspects + the victim) from the clues. Placing someone rules out their whole <b>row &amp; column</b> — one per row and per column. Nobody stands on furniture (the bench is fine). The culprit is whoever was alone in the victim's room.",
    placedOf: (n, N) => `${n} / ${N} placed`, nextCase: "Next case ▸",
    placeAll: (N) => `Place all ${N} people — ${N - 1} suspects and the victim — one per row and column.`,
    notAllCorrect: "Everyone's down, but the positions don't all check out yet. Re-read the clues.",
    accuseTitle: "Everyone's placed! Who's the culprit?", accuseHelp: "It's whoever was alone in the victim's room.",
    wrongAccuse: (name) => `${name} wasn't alone with the victim. Try again.`,
    solvedCulprit: (t, name, g) => `🎉 Solved in ${t}! ${name} was alone with the victim — the culprit.`,
    solvedCount: (n) => `${n} solved`, resetConfirm: "Reset this case's board?",
    loadErr: "Couldn't load the case engine.",
  };

  const root = document.getElementById("md-root");
  let C = null, caseNum = 0, sel = 0, mode = "place";
  let placements = {}, crosses = {}, notes = {}, secs = 0, timer = null, won = false, accuseMsg = "";
  const START = (new URLSearchParams(location.search).get("case") | 0) || lsGet(CURKEY, 0) || 0;

  // ---------- pixel-art tileset ----------
  const ZTINT = { green: "#b7e0a5", yellow: "#f2df84", grey: "#d2d2db" };
  function drawMap() {
    const cv = document.getElementById("md-canvas"); if (!cv) return;
    const TS = C.TS, W = C.W, H = C.H;
    cv.width = W * TS; cv.height = H * TS;
    const g = cv.getContext("2d");
    const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // 1) floors + furniture (the whole plan is floor; walls come next as lines)
    for (const t of C.tiles) {
      const px = t.x * TS, py = t.y * TS;
      if (t.type === "void") continue;
      const base = t.room >= 0 ? ZTINT[C.rooms[t.room].color] : "#e9dcc2";
      r(px, py, TS, TS, base);
      if ((t.x + t.y) % 2 === 0) { g.fillStyle = "rgba(0,0,0,.045)"; g.fillRect(px, py, TS, TS); }
      g.fillStyle = "rgba(0,0,0,.07)"; g.fillRect(px, py + TS - 1, TS, 1); g.fillRect(px + TS - 1, py, 1, TS); // faint grid
      if (t.type === "bench") drawFixture(r, px, py, "bench");
      else if (t.fixture) drawFixture(r, px, py, t.fixture);
    }
    // 2) walls = thin lines on edges where the region changes (rooms + outer shell)
    const winSet = new Set((C.windows || []).map(([x, y, s]) => x + "," + y + "," + s));
    const reg = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return "V"; const t = C.tiles[y * W + x]; return t.type === "void" ? "V" : t.room; };
    const DIRS = [[0, -1, "T"], [0, 1, "B"], [-1, 0, "L"], [1, 0, "R"]];
    for (const t of C.tiles) {
      if (t.type === "void") continue;
      for (const [dx, dy, side] of DIRS) {
        if (reg(t.x + dx, t.y + dy) === t.room) continue;   // same room → no wall
        if (winSet.has(t.x + "," + t.y + "," + side)) edgeWindow(g, t.x, t.y, side);
        else { const outer = reg(t.x + dx, t.y + dy) === "V"; edgeLine(g, t.x, t.y, side, outer ? 2 : 1, outer ? "#463c30" : "#6b5f4c"); }
      }
    }
  }
  function edgeLine(g, x, y, side, lw, col) {
    const TS = C.TS, px = x * TS, py = y * TS; g.fillStyle = col;
    if (side === "T") g.fillRect(px, py, TS, lw);
    else if (side === "B") g.fillRect(px, py + TS - lw, TS, lw);
    else if (side === "L") g.fillRect(px, py, lw, TS);
    else g.fillRect(px + TS - lw, py, lw, TS);
  }
  function edgeWindow(g, x, y, side) {
    const TS = C.TS, px = x * TS, py = y * TS, FR = "#463c30", GL = "#a9d4e6", SK = "#cdeaf5";
    const b = (X, Y, w, h, c) => { g.fillStyle = c; g.fillRect(X, Y, w, h); };
    if (side === "T" || side === "B") { const yy = side === "T" ? py : py + TS - 3;
      b(px, yy, TS, 3, FR); b(px + 3, yy, TS - 6, 2, GL); b(px + 3, yy, TS - 6, 1, SK); b(px + Math.floor(TS / 2), yy, 1, 3, FR);
    } else { const xx = side === "L" ? px : px + TS - 3;
      b(xx, py, 3, TS, FR); b(xx, py + 3, 2, TS - 6, GL); b(xx, py + 3, 1, TS - 6, SK); b(xx, py + Math.floor(TS / 2), 3, 1, FR);
    }
  }
  function drawFixture(r, px, py, key) {
    const P = (x, y, w, h, c) => r(px + x, py + y, w, h, c);
    switch (key) {
      case "apples": P(0, 9, 16, 7, "#7a5030"); P(0, 8, 16, 2, "#946039"); P(2, 3, 4, 4, "#d33"); P(7, 2, 4, 4, "#e14"); P(11, 4, 4, 4, "#c22"); P(4, 2, 1, 2, "#4a3"); P(9, 1, 1, 2, "#4a3"); break;
      case "bread": P(0, 10, 16, 6, "#8a5a3c"); P(2, 5, 5, 6, "#d9a24a"); P(9, 5, 5, 6, "#c98f3e"); P(2, 5, 5, 2, "#e8bd6c"); break;
      case "cheese": P(0, 9, 16, 7, "#cfc0a0"); P(0, 6, 16, 3, "rgba(150,220,230,.5)"); P(3, 10, 5, 4, "#f2c94c"); P(9, 10, 4, 4, "#e0b23a"); break;
      case "flowers": P(4, 10, 8, 6, "#a5673a"); P(6, 4, 1, 6, "#3a8a3a"); P(9, 4, 1, 6, "#3a8a3a"); P(3, 2, 4, 4, "#e76fa1"); P(8, 1, 4, 4, "#f2a0c0"); P(6, 4, 4, 3, "#e05a90"); break;
      case "plant": P(5, 10, 6, 6, "#b06a3a"); P(3, 2, 10, 9, "#3f9a4f"); P(5, 4, 6, 4, "#2f7a3f"); P(7, 1, 2, 3, "#4fb35f"); break;
      case "banner": P(7, 6, 2, 10, "#8a8a8a"); P(2, 1, 12, 7, "#e0483a"); P(4, 3, 8, 1, "#fff"); P(4, 5, 6, 1, "#fff"); break;
      case "till": P(2, 8, 12, 8, "#9aa0a8"); P(4, 2, 8, 6, "#2b3550"); P(5, 3, 6, 2, "#5bd6a0"); P(0, 14, 16, 2, "#555"); break;
      case "coffee": P(3, 2, 10, 13, "#5a5f68"); P(6, 10, 4, 3, "#222"); P(10, 4, 2, 2, "#e14"); P(5, 4, 4, 3, "#3b4048"); break;
      case "crate": P(2, 3, 12, 12, "#a06a3a"); P(2, 6, 12, 1, "#7a4e28"); P(2, 10, 12, 1, "#7a4e28"); P(7, 3, 1, 12, "#7a4e28"); break;
      case "safe": P(3, 3, 10, 11, "#4a4f57"); P(4, 4, 8, 9, "#5a616b"); P(9, 8, 3, 3, "#c9a94a"); P(6, 7, 1, 3, "#2b2f35"); break;
      case "desk": P(1, 5, 14, 2, "#a06a3a"); P(2, 7, 12, 8, "#8a5a3c"); P(3, 9, 4, 4, "#6f4a28"); P(9, 9, 4, 4, "#6f4a28"); break;
      case "tv": P(2, 2, 12, 9, "#222"); P(3, 3, 10, 7, "#3a6ea5"); P(4, 4, 4, 2, "#6ea0d8"); P(7, 11, 2, 2, "#444"); P(5, 13, 6, 1, "#333"); break;
      case "bench": P(2, 4, 12, 2, "#8a5a3c"); P(2, 7, 12, 3, "#a06a3a"); P(3, 10, 2, 3, "#6f4a28"); P(11, 10, 2, 3, "#6f4a28"); break;
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
    sel = 0; mode = "place"; won = isSolved(caseNum); accuseMsg = "";
    shell(); drawMap(); refresh(); startTimer();
  }
  const save = () => lsSet(STATE, { case: caseNum, placements, crosses, notes, secs });
  const solvedList = () => lsGet(SOLVED, []);
  const isSolved = (n) => solvedList().includes(n);
  function startTimer() { clearInterval(timer); if (won) return; timer = setInterval(() => { secs++; const el = document.getElementById("md-timer"); if (el) el.textContent = mmss(secs); if (secs % 5 === 0) save(); }, 1000); }

  // ---------- rook logic ----------
  const tileOwner = (tile) => { for (const s in placements) if (placements[s] === tile) return +s; return -1; };
  // row/col blocked by a suspect OTHER than `exclude`
  function blockedBy(tile, exclude) {
    const T = C.tiles[tile];
    for (const s in placements) {
      if (+s === exclude) continue;
      const P = C.tiles[placements[s]];
      if (placements[s] === tile || P.y === T.y || P.x === T.x) return true;
    }
    return false;
  }
  function act(tile) {
    if (won) return;
    const t = C.tiles[tile]; if (!t || !t.walkable) return;
    if (mode === "place") {
      if (blockedBy(tile, sel)) return;               // its row/column is already taken
      placements[sel] = tile; delete crosses[`${sel}:${tile}`]; delete notes[`${sel}:${tile}`];
      const next = C.suspects.findIndex((_, i) => placements[i] == null); if (next >= 0) sel = next;
    } else if (mode === "cross") { const k = `${sel}:${tile}`; crosses[k] ? delete crosses[k] : (crosses[k] = 1); }
    else if (mode === "notes") { const k = `${sel}:${tile}`; notes[k] ? delete notes[k] : (notes[k] = 1); }
    else if (mode === "erase") {
      const occ = tileOwner(tile); if (occ >= 0) delete placements[occ];
      for (let s = 0; s < C.N; s++) { delete crosses[`${s}:${tile}`]; delete notes[`${s}:${tile}`]; }
    }
    save(); refresh();
  }
  function hint() {
    if (won) return;
    const wrong = C.suspects.map((_, i) => i).filter((i) => placements[i] !== C.solution[i]);
    if (!wrong.length) return;
    const s = wrong[Math.floor(Math.random() * wrong.length)];
    const cell = C.solution[s], T = C.tiles[cell];
    for (const o in placements) { const P = C.tiles[placements[o]]; if (+o !== s && (placements[o] === cell || P.y === T.y || P.x === T.x)) delete placements[o]; }
    placements[s] = cell; sel = s; save(); checkWin(); refresh();
  }
  const allCorrect = () => { for (let i = 0; i < C.N; i++) if (placements[i] !== C.solution[i]) return false; return true; };
  function accuse(i) {
    if (won || !allCorrect()) return;
    if (i === C.culprit) {
      won = true; accuseMsg = ""; clearInterval(timer);
      const list = solvedList(); if (!list.includes(caseNum)) { list.push(caseNum); lsSet(SOLVED, list); }
    } else accuseMsg = T.wrongAccuse(C.suspects[i].name);
    refresh();
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
        <div class="md-bar-r"><span class="md-timer" id="md-timer">${mmss(secs)}</span><button class="mini-btn" id="md-reset" title="${T.reset}">↻</button><span class="md-progress">${T.solvedCount(solvedList().length)}</span></div>
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
        ${toolBtn("notes", "✎", T.notes)}${toolBtn("cross", "✕", T.crosses)}${toolBtn("place", "✓", T.place)}${toolBtn("erase", "⌫", T.erase)}
        <button class="mdm-tool mdm-hint" id="md-hint"><span>💡</span>${T.hint}</button>
      </div>
      <div class="mdm-tray" id="md-tray"></div>

      <div class="md-cols mdm-lower">
        <section class="panel md-clues"><h2>${T.clues}</h2><ol>${C.clues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
          <p class="md-hint">${T.help}</p></section>
        <section class="panel mdm-status" id="md-status"></section>
      </div>`;

    const lab = document.getElementById("md-labels");
    lab.innerHTML = C.rooms.map((z) => `<span class="mdm-zlabel" style="left:${(z.label.x + 0.5) / C.W * 100}%;top:${(z.label.y + 0.5) / C.H * 100}%">${esc(L === "pt" ? z.pt : z.name)}</span>`).join("");

    document.getElementById("md-toolbar").querySelectorAll("[data-tool]").forEach((b) => b.onclick = () => { mode = b.dataset.tool; refresh(); });
    document.getElementById("md-hint").onclick = hint;
    document.getElementById("md-prev").onclick = () => load(caseNum - 1);
    document.getElementById("md-next").onclick = () => load(caseNum + 1);
    document.getElementById("md-reset").onclick = () => { if (confirm(T.resetConfirm)) { placements = {}; crosses = {}; notes = {}; secs = 0; won = false; save(); shell(); drawMap(); refresh(); startTimer(); } };
  }

  function refresh() {
    const ov = document.getElementById("md-overlay"); if (!ov) return;
    // rows/cols eliminated by the current placements (the Sudoku rule, visualised)
    const eRows = new Set(), eCols = new Set();
    for (const s in placements) { const T = C.tiles[placements[s]]; eRows.add(T.y); eCols.add(T.x); }
    let html = "";
    for (const t of C.tiles) {
      if (!t.walkable) continue;
      const tile = t.y * C.W + t.x, owner = tileOwner(tile);
      const style = `left:${t.x / C.W * 100}%;top:${t.y / C.H * 100}%;width:${100 / C.W}%;height:${100 / C.H}%`;
      let inner = "", cls = "mdm-tile walk";
      if (owner >= 0) inner = `<img class="mdm-av${owner === C.victimIdx ? " vic" : ""}" src="${avatar(C.suspects[owner].name, C.suspects[owner].g)}" alt="${esc(C.suspects[owner].name)}" style="border-color:${C.suspects[owner].color}" referrerpolicy="no-referrer">${owner === C.victimIdx ? '<span class="mdm-vic-tile">☠</span>' : ""}`;
      else {
        const autoX = eRows.has(t.y) || eCols.has(t.x);
        const userX = crosses[`${sel}:${tile}`];
        const noteHere = []; for (let s = 0; s < C.N; s++) if (notes[`${s}:${tile}`] && placements[s] == null) noteHere.push(s);
        if (noteHere.length) inner += `<span class="mdm-note">${noteHere.map((s) => `<i style="color:${C.suspects[s].color}">${esc(C.suspects[s].name[0])}</i>`).join("")}</span>`;
        if (userX) inner += `<span class="mdm-x">✕</span>`;
        else if (autoX) { inner += `<span class="mdm-x auto">✕</span>`; cls += " elim"; }
      }
      html += `<button class="${cls}" data-tile="${tile}" style="${style}">${inner}</button>`;
    }
    ov.innerHTML = html;
    ov.querySelectorAll(".mdm-tile").forEach((b) => b.onclick = () => act(+b.dataset.tile));

    const tray = document.getElementById("md-tray");
    tray.innerHTML = C.suspects.map((s, i) => {
      const placed = placements[i] != null;
      return `<button class="mdm-sus${i === sel ? " on" : ""}${placed ? " placed" : ""}${i === C.victimIdx ? " victim" : ""}" data-s="${i}" title="${esc(s.name)}" style="--c:${s.color}">
        <img src="${avatar(s.name, s.g)}" alt="${esc(s.name)}" referrerpolicy="no-referrer"><span>${esc(s.name)}</span>${i === C.victimIdx ? '<span class="mdm-vic">☠</span>' : ""}${placed ? '<span class="mdm-dot">✓</span>' : ""}</button>`;
    }).join("");
    tray.querySelectorAll("[data-s]").forEach((b) => b.onclick = () => { sel = +b.dataset.s; refresh(); });

    document.querySelectorAll("#md-toolbar [data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === mode));

    const placedN = Object.keys(placements).length;
    let sh = `<h2>${T.investigation}</h2><p class="mdm-count">${T.placedOf(placedN, C.N)}</p>`;
    if (won) {
      const cul = C.suspects[C.culprit];
      sh += `<p class="md-verdict ok">${T.solvedCulprit(mmss(secs), cul.name, cul.g)}</p><button class="btn" id="md-nextcase">${T.nextCase}</button>`;
    } else if (allCorrect()) {
      sh += `<p class="mdm-accuse-t">${T.accuseTitle}</p><p class="mdm-note-line">${T.accuseHelp}</p>
        <div class="mdm-accuse">${C.suspects.slice(0, C.suspectCount).map((su, i) => `<button class="mdm-accuse-b" data-acc="${i}" title="${esc(su.name)}" style="--c:${su.color}"><img src="${avatar(su.name, su.g)}" referrerpolicy="no-referrer"><span>${esc(su.name)}</span></button>`).join("")}</div>
        ${accuseMsg ? `<p class="mdm-wrong">${esc(accuseMsg)}</p>` : ""}`;
    } else if (placedN === C.N) {
      sh += `<p class="mdm-note-line">${T.notAllCorrect}</p>`;
    } else {
      sh += `<p class="mdm-note-line">${T.placeAll(C.N)}</p>`;
    }
    document.getElementById("md-status").innerHTML = sh;
    document.querySelectorAll(".mdm-accuse-b").forEach((b) => b.onclick = () => accuse(+b.dataset.acc));
    const nc = document.getElementById("md-nextcase"); if (nc) nc.onclick = () => load(caseNum + 1);
  }

  const toolBtn = (id, icon, label) => `<button class="mdm-tool" data-tool="${id}"><span>${icon}</span>${label}</button>`;

  if (window.MURDOKU) load(START); else root.innerHTML = `<p class="tool-note">${T.loadErr}</p>`;
})();
