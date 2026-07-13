/* Murdoku — tile UI (Murder + Sudoku). Irregular pixel-art store on a <canvas>.
   Place a suspect and their whole row + column are ruled out (auto ✕) — only one
   suspect per row and per column. Suspects can't stand on furniture, but the
   bench is occupiable. Deduce each exact tile from the spatial clues. Avatars are
   DiceBear. Board + progress persist under "nftw:murdoku:*" (syncs to account). */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); // **word** -> bold (clue key words)
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const SOLVED = "nftw:murdoku:solved", CURKEY = "nftw:murdoku:case", STATE = "nftw:murdoku:state";
  const L = (localStorage.getItem("nftw:lang") === "pt") ? "pt" : "en";
  // DiceBear "adventurer": bias hair length + facial hair so the avatar reads as the name's gender
  const F_HAIR = ["long02", "long04", "long07", "long10", "long15", "long20"];
  const M_HAIR = ["short01", "short03", "short05", "short08", "short11", "short15"];
  // some seeds draw a face that reads as the wrong gender — override the seed, keep the name
  const SEED = { Daniel: "Daniel-b" };
  const M_HCOL = ["0e0e0e", "562306", "ac6511", "b9a05f", "cb6820"]; // no pink hair on the men
  const avatar = (name, g) => {
    const seed = SEED[name] || name;
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    const hair = (g === "f" ? F_HAIR : M_HAIR)[h % 6];
    const hcol = g === "f" ? "" : `&hairColor=${M_HCOL[h % 5]}`;
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&radius=50&hair=${hair}&hairProbability=100${hcol}&facialHairProbability=${g === "f" ? 0 : 50}&earringsProbability=${g === "f" ? 40 : 0}`;
  };
  const mmss = (s) => `${String((s / 60) | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const T = L === "pt" ? {
    notes: "Notas", crosses: "Cruzes", place: "Colocar", erase: "Apagar", hint: "Dica",
    clues: "Pistas", investigation: "Investigação", reset: "Repor este caso",
    help: "Cada <b>linha</b> e cada <b>coluna</b> têm exactamente uma pessoa — colocar alguém elimina a linha e a coluna inteiras. Ninguém fica em cima de mesas, televisões, plantas, estantes ou caixas; cadeiras, tapetes e camas podem ser ocupados. Coloca os 5 suspeitos pelas pistas, a vítima na <b>última célula restante</b>, e acusa quem ficou sozinho com ela.",
    placedOf: (n, N) => `${n} / ${N} colocados`, nextCase: "Próximo caso ▸",
    placeAll: (N) => `Coloca os ${N - 1} suspeitos pelas pistas e a vítima na última célula restante.`,
    notAllCorrect: "Estão todos colocados, mas as posições ainda não batem certo. Revê as pistas.",
    accuseTitle: "Todos no sítio! Quem é o culpado?", accuseHelp: "Foi quem ficou sozinho(a) na sala da vítima.",
    wrongAccuse: (name) => `${name} não estava sozinho(a) com a vítima. Tenta outra vez.`,
    solvedCulprit: (t, name, g) => `🎉 Resolvido em ${t}! ${name} ficou sozinh${g === "f" ? "a" : "o"} com a vítima — é ${g === "f" ? "a culpada" : "o culpado"}.`,
    solvedCount: (n) => `${n} resolvidos`, resetConfirm: "Repor o tabuleiro deste caso?",
    victimLabel: "A Vítima",
    loadErr: "Não foi possível carregar o motor de casos.",
  } : {
    notes: "Notes", crosses: "Crosses", place: "Place", erase: "Erase", hint: "Hint",
    clues: "Clues", investigation: "Investigation", reset: "Reset this case",
    help: "Every <b>row</b> and every <b>column</b> holds exactly one person — placing someone rules out their whole row and column. Nobody can stand on tables, TVs, plants, bookcases or boxes; chairs, rugs and beds can be occupied. Place the 5 suspects from the clues, the victim in the <b>last remaining cell</b>, and accuse whoever is alone with them.",
    placedOf: (n, N) => `${n} / ${N} placed`, nextCase: "Next case ▸",
    placeAll: (N) => `Place the ${N - 1} suspects from the clues, then the victim in the last remaining cell.`,
    notAllCorrect: "Everyone's down, but the positions don't all check out yet. Re-read the clues.",
    accuseTitle: "Everyone's placed! Who's the culprit?", accuseHelp: "It's whoever was alone in the victim's room.",
    wrongAccuse: (name) => `${name} wasn't alone with the victim. Try again.`,
    solvedCulprit: (t, name, g) => `🎉 Solved in ${t}! ${name} was alone with the victim — the culprit.`,
    solvedCount: (n) => `${n} solved`, resetConfirm: "Reset this case's board?",
    victimLabel: "The Victim",
    loadErr: "Couldn't load the case engine.",
  };

  const root = document.getElementById("md-root");
  let C = null, caseNum = 0, sel = 0, mode = "place";
  let placements = {}, crosses = {}, notes = {}, secs = 0, timer = null, won = false, accuseMsg = "";
  const START = (new URLSearchParams(location.search).get("case") | 0) || lsGet(CURKEY, 0) || 0;

  // ---------- pixel-art tileset ----------
  const ZTINT = { green: "#b7e0a5", yellow: "#f2df84", grey: "#d2d2db", blue: "#bcd8e8", tan: "#e6d6b8", pink: "#f0c8d8", purple: "#d3c2e8" };
  function drawMap() {
    const cv = document.getElementById("md-canvas"); if (!cv) return;
    const TS = C.TS, W = C.W, H = C.H;
    cv.width = W * TS; cv.height = H * TS;
    const g = cv.getContext("2d");
    const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // 1) floors, then furniture drawn as clean icons on top
    for (const t of C.tiles) {
      const px = t.x * TS, py = t.y * TS;
      if (t.type === "void") continue;
      const base = t.room >= 0 ? ZTINT[C.rooms[t.room].color] : "#e9dcc2";
      r(px, py, TS, TS, base);
      if ((t.x + t.y) % 2 === 0) { g.fillStyle = "rgba(0,0,0,.04)"; g.fillRect(px, py, TS, TS); }
      g.fillStyle = "rgba(0,0,0,.06)"; g.fillRect(px, py + TS - 1, TS, 1); g.fillRect(px + TS - 1, py, 1, TS); // faint grid
    }
    // objects themselves are <img> sprites in the #md-fix layer (see fixtureLayer())
    // 2) walls = thin lines on the edges where the division changes (+ outer shell)
    const winSet = new Set((C.windows || []).map(([x, y, s]) => x + "," + y + "," + s));
    const reg = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return "V"; const t = C.tiles[y * W + x]; return t.type === "void" ? "V" : t.room; };
    const DIRS = [[0, -1, "T"], [0, 1, "B"], [-1, 0, "L"], [1, 0, "R"]];
    for (const t of C.tiles) {
      if (t.type === "void") continue;
      for (const [dx, dy, side] of DIRS) {
        if (reg(t.x + dx, t.y + dy) === t.room) continue;
        if (winSet.has(t.x + "," + t.y + "," + side)) edgeWindow(g, t.x, t.y, side);
        else { const outer = reg(t.x + dx, t.y + dy) === "V"; edgeLine(g, t.x, t.y, side, outer ? 3 : 2, outer ? "#463c30" : "#6b5f4c"); }
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
    const S = C.TS, px = x * S, py = y * S, FR = "#463c30", GL = "#a9d4e6", SK = "#cdeaf5";
    const th = Math.round(S * 0.17), ins = Math.round(S * 0.18);
    const b = (X, Y, w, h, c) => { g.fillStyle = c; g.fillRect(X, Y, w, h); };
    if (side === "T" || side === "B") { const yy = side === "T" ? py : py + S - th;
      b(px, yy, S, th, FR); b(px + ins, yy + 1, S - 2 * ins, th - 2, GL); b(px + ins, yy + 1, S - 2 * ins, 1, SK); b(px + (S >> 1) - 1, yy, 2, th, FR);
    } else { const xx = side === "L" ? px : px + S - th;
      b(xx, py, th, S, FR); b(xx + 1, py + ins, th - 2, S - 2 * ins, GL); b(xx + 1, py + ins, 1, S - 2 * ins, SK); b(xx, py + (S >> 1) - 1, th, 2, FR);
    }
  }
  // ---- object sprites cropped from the reference book, hosted in the repo ----
  const objSprite = (key) => `/assets/img/murdoku/${key}.png?v=7`;
  function fixtureLayer() {
    const fx = document.getElementById("md-fix"); if (!fx) return;
    let html = "";
    // beds span two horizontal cells — draw each once, across both tiles
    for (const [bx, by] of (C.beds || [])) {
      const style = `left:${bx / C.W * 100}%;top:${by / C.H * 100}%;width:${200 / C.W}%;height:${100 / C.H}%`;
      html += `<span class="mdm-fx ai occ" style="${style}"><img src="${objSprite("bed")}" alt="" referrerpolicy="no-referrer"></span>`;
    }
    for (const t of C.tiles) {
      const key = t.occ || t.fixture;
      if (!key || key === "bed") continue;   // bed already drawn as a 2-cell span
      const occ = !!t.occ;
      const style = `left:${t.x / C.W * 100}%;top:${t.y / C.H * 100}%;width:${100 / C.W}%;height:${100 / C.H}%`;
      html += `<span class="mdm-fx ai${occ ? " occ" : ""}" style="${style}"><img src="${objSprite(key)}" alt="" referrerpolicy="no-referrer"></span>`;
    }
    fx.innerHTML = html;
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
    shell(); drawMap(); fixtureLayer(); refresh(); startTimer();
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
          <div class="mdm-fix" id="md-fix"></div>
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
        <section class="panel md-clues"><h2>${T.clues}</h2>
          <div class="mdm-cards">${C.clues.map((c) => { const p = C.suspects[c.s]; return `
            <div class="mdm-card${c.victim ? " vic" : ""}">
              <div class="mdm-polaroid"><img src="${avatar(p.name, p.g)}" alt="${esc(p.name)}" referrerpolicy="no-referrer">${c.victim ? '<span class="mdm-cardx">✕</span>' : ""}<div class="mdm-cardname">${esc(p.name)}</div></div>
              <div class="mdm-pill">${c.victim ? `<b class="mdm-viclabel">${T.victimLabel}</b><br>` : ""}${md(c.text)}</div>
            </div>`; }).join("")}</div>
          <p class="md-hint">${T.help}</p></section>
        <section class="panel mdm-status" id="md-status"></section>
      </div>`;

    const lab = document.getElementById("md-labels");
    let coords = "";
    for (let x = 1; x <= C.W - 2; x++) coords += `<span class="mdm-coord" style="left:${(x + 0.5) / C.W * 100}%;top:${0.5 / C.H * 100}%">${x}</span>`;
    for (let y = 1; y <= C.H - 2; y++) coords += `<span class="mdm-coord" style="left:${0.5 / C.W * 100}%;top:${(y + 0.5) / C.H * 100}%">${y}</span>`;
    lab.innerHTML = coords + C.rooms.map((z) => `<span class="mdm-zlabel" style="left:${(z.label.x + 0.5) / C.W * 100}%;top:${(z.label.y + 0.5) / C.H * 100}%">${esc(L === "pt" ? z.pt : z.name)}</span>`).join("");

    document.getElementById("md-toolbar").querySelectorAll("[data-tool]").forEach((b) => b.onclick = () => { mode = b.dataset.tool; refresh(); });
    document.getElementById("md-hint").onclick = hint;
    document.getElementById("md-prev").onclick = () => load(caseNum - 1);
    document.getElementById("md-next").onclick = () => load(caseNum + 1);
    document.getElementById("md-reset").onclick = () => { if (confirm(T.resetConfirm)) { placements = {}; crosses = {}; notes = {}; secs = 0; won = false; save(); shell(); drawMap(); fixtureLayer(); refresh(); startTimer(); } };
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
