/* Murdoku — UI (Murder + Sudoku) on a <canvas> floor plan. Place a suspect and
   their whole row + column are ruled out (auto ✕) — one per row and per column.
   Deduce each exact tile from the clue cards, then accuse. A Main Menu picks the
   Chapter and case; difficulty rises across the chapter and jumps between them.
   Every board (even finished ones) is kept exactly as the player left it under
   "nftw:murdoku:*", which syncs to the signed-in account. Avatars are DiceBear. */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const SOLVED = "nftw:murdoku:solved", CURKEY = "nftw:murdoku:case", BOARDS = "nftw:murdoku:boards";
  const L = (localStorage.getItem("nftw:lang") === "pt") ? "pt" : "en";

  // DiceBear "adventurer": strong gender signal — men short hair + facial hair +
  // male hair colours, no earrings; women long hair, no facial hair.
  const F_HAIR = ["long02", "long04", "long07", "long10", "long15", "long20"];
  const M_HAIR = ["short01", "short03", "short05", "short08", "short11", "short15"];
  const M_HCOL = ["0e0e0e", "562306", "ac6511", "b9a05f", "cb6820"];
  const SEED = { Patricia: "Patricia2" };            // per-name overrides for stray faces
  const avatar = (name, g) => {
    const seed = SEED[name] || name;
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    const hair = (g === "f" ? F_HAIR : M_HAIR)[h % 6];
    const hcol = g === "f" ? "" : `&hairColor=${M_HCOL[h % 5]}`;
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&radius=50&hair=${hair}&hairProbability=100${hcol}&facialHairProbability=${g === "f" ? 0 : 70}&earringsProbability=${g === "f" ? 35 : 0}`;
  };
  const mmss = (s) => `${String((s / 60) | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const T = L === "pt" ? {
    notes: "Notas", crosses: "Cruzes", place: "Colocar", erase: "Apagar", hint: "Dica",
    clues: "Pistas", investigation: "Investigação", reset: "Repor este caso", menu: "‹ Menu",
    help: "Cada <b>linha</b> e cada <b>coluna</b> têm exactamente uma pessoa — colocar alguém elimina a linha e a coluna inteiras. Ninguém fica em cima de mesas, televisões, plantas, estantes ou caixas; cadeiras, tapetes e camas podem ser ocupados. Coloca os suspeitos pelas pistas, a vítima na <b>última célula restante</b>, e acusa quem ficou sozinho com ela.",
    placedOf: (n, N) => `${n} / ${N} colocados`, nextCase: "Próximo caso ▸",
    placeAll: (N) => `Coloca os ${N - 1} suspeitos pelas pistas e a vítima na última célula restante.`,
    notAllCorrect: "Estão todos colocados, mas as posições ainda não batem certo. Revê as pistas.",
    accuseTitle: "Todos no sítio! Quem é o culpado?", accuseHelp: "Foi quem ficou sozinho(a) na sala da vítima.",
    wrongAccuse: (name) => `${name} não estava sozinho(a) com a vítima. Tenta outra vez.`,
    solvedCulprit: (t, name, g) => `🎉 Resolvido em ${t}! ${name} ficou sozinh${g === "f" ? "a" : "o"} com a vítima — é ${g === "f" ? "a culpada" : "o culpado"}.`,
    resetConfirm: "Repor o tabuleiro deste caso?", victimLabel: "A Vítima", diff: "Dif.",
    menuSub: "Um enigma de lógica: parte Sudoku, parte investigação. Segue as pistas, descobre onde estava cada um e desmascara o culpado.",
    howTitle: "Como se joga", chapter: "Capítulo", solvedOf: (a, b) => `${a}/${b}`, locked: "Bloqueado",
    continue: "Continuar", play: "Jogar ▸", chooseCase: "Escolhe um caso",
    how: [
      "Cada <b>linha</b> e cada <b>coluna</b> do mapa têm <b>uma só pessoa</b>. Colocar alguém elimina a linha e a coluna dessa pessoa.",
      "Lê as <b>pistas</b> de cada suspeito e deduz a célula exacta onde estava.",
      "A <b>vítima</b> não tem pistas — fica na única célula que sobra no fim.",
      "Quem ficou <b>sozinho</b> na sala da vítima é o <b>culpado</b>. Acusa-o para resolver o caso.",
    ],
    chapterLocked: "Termina o capítulo anterior para desbloquear.",
    loadErr: "Não foi possível carregar o motor de casos.",
  } : {
    notes: "Notes", crosses: "Crosses", place: "Place", erase: "Erase", hint: "Hint",
    clues: "Clues", investigation: "Investigation", reset: "Reset this case", menu: "‹ Menu",
    help: "Every <b>row</b> and every <b>column</b> holds exactly one person — placing someone rules out their whole row and column. Nobody can stand on tables, TVs, plants, bookcases or boxes; chairs, rugs and beds can be occupied. Place the suspects from the clues, the victim in the <b>last remaining cell</b>, and accuse whoever is alone with them.",
    placedOf: (n, N) => `${n} / ${N} placed`, nextCase: "Next case ▸",
    placeAll: (N) => `Place the ${N - 1} suspects from the clues, then the victim in the last remaining cell.`,
    notAllCorrect: "Everyone's down, but the positions don't all check out yet. Re-read the clues.",
    accuseTitle: "Everyone's placed! Who's the culprit?", accuseHelp: "It's whoever was alone in the victim's room.",
    wrongAccuse: (name) => `${name} wasn't alone with the victim. Try again.`,
    solvedCulprit: (t, name, g) => `🎉 Solved in ${t}! ${name} was alone with the victim — the culprit.`,
    resetConfirm: "Reset this case's board?", victimLabel: "The Victim", diff: "Diff.",
    menuSub: "A logic puzzle: part Sudoku, part detective work. Follow the clues, work out where everyone stood, and unmask the culprit.",
    howTitle: "How to play", chapter: "Chapter", solvedOf: (a, b) => `${a}/${b}`, locked: "Locked",
    continue: "Continue", play: "Play ▸", chooseCase: "Choose a case",
    how: [
      "Every <b>row</b> and <b>column</b> of the map holds <b>exactly one person</b>. Placing someone rules out their row and column.",
      "Read each suspect's <b>clues</b> and deduce the exact cell they stood on.",
      "The <b>victim</b> has no clues — they're in the one cell left at the end.",
      "Whoever was <b>alone</b> in the victim's room is the <b>culprit</b>. Accuse them to solve the case.",
    ],
    chapterLocked: "Finish the previous chapter to unlock.",
    loadErr: "Couldn't load the case engine.",
  };

  const root = document.getElementById("md-root");
  const CPC = window.MURDOKU ? MURDOKU.CASES_PER_CHAPTER : 25;
  const NCH = window.MURDOKU ? MURDOKU.CHAPTERS_DEFINED : 1;
  let C = null, caseNum = 0, sel = 0, mode = "place", view = "menu", menuChapter = 0;
  let placements = {}, crosses = {}, notes = {}, secs = 0, timer = null, won = false, accuseMsg = "";

  // ---------- progress / unlocks ----------
  const solvedList = () => lsGet(SOLVED, []);
  const caseSolved = (n) => solvedList().includes(n);
  const solvedInChapter = (ch) => { let c = 0; for (let m = 0; m < CPC; m++) if (caseSolved(ch * CPC + m)) c++; return c; };
  const chapterSolved = (ch) => solvedInChapter(ch) === CPC;
  const chapterUnlocked = (ch) => ch === 0 || chapterSolved(ch - 1);
  const caseUnlocked = (n) => { const ch = Math.floor(n / CPC), m = n % CPC; return chapterUnlocked(ch) && (m === 0 || caseSolved(n - 1)); };

  // ---------- board persistence (kept even after solving; syncs to account) ----------
  const allBoards = () => lsGet(BOARDS, {});
  function saveBoard() { const all = allBoards(); all[caseNum] = { p: placements, c: crosses, n: notes, s: secs, w: won }; lsSet(BOARDS, all); }
  function restoreBoard(n) { const b = allBoards()[n]; if (b) { placements = b.p || {}; crosses = b.c || {}; notes = b.n || {}; secs = b.s || 0; won = !!b.w; } else { placements = {}; crosses = {}; notes = {}; secs = 0; won = false; } }

  // ================= MAIN MENU =================
  function renderMenu() {
    view = "menu"; clearInterval(timer);
    const last = lsGet(CURKEY, 0) | 0;
    let tabs = "";
    for (let ch = 0; ch < NCH; ch++) {
      const info = MURDOKU.chapterInfo(ch), unl = chapterUnlocked(ch);
      tabs += `<button class="mdk-chtab${ch === menuChapter ? " on" : ""}${unl ? "" : " locked"}" data-ch="${ch}" ${unl ? "" : "disabled"} title="${unl ? "" : esc(T.chapterLocked)}">
        <span class="mdk-chn">${T.chapter} ${ch + 1}</span>
        <span class="mdk-cht">${esc(L === "pt" ? info.titlePt : info.titleEn)}</span>
        <span class="mdk-chp">${unl ? T.solvedOf(solvedInChapter(ch), CPC) : "🔒"}</span></button>`;
    }
    let grid = "";
    for (let m = 0; m < CPC; m++) {
      const num = menuChapter * CPC + m, meta = MURDOKU.caseMeta(num), unl = caseUnlocked(num), done = caseSolved(num);
      grid += `<button class="mdk-case${done ? " done" : ""}${unl ? "" : " locked"}" data-num="${num}" ${unl ? "" : "disabled"}>
        <span class="mdk-cnum">${m + 1}</span>
        <span class="mdk-cdiff">${T.diff} ${meta.difficulty.toFixed(1)}</span>
        <span class="mdk-cmark">${done ? "✓" : unl ? "" : "🔒"}</span></button>`;
    }
    root.innerHTML = `
      <div class="mdk-menu">
        <p class="mdk-menusub">${esc(T.menuSub)}</p>
        <section class="panel mdk-how"><h2>${T.howTitle}</h2><ol>${T.how.map((h) => `<li>${h}</li>`).join("")}</ol></section>
        <div class="mdk-chtabs">${tabs}</div>
        <div class="mdk-caserow"><h2>${T.chapter} ${menuChapter + 1} · <span class="mdk-chtitle">${esc(L === "pt" ? MURDOKU.chapterInfo(menuChapter).titlePt : MURDOKU.chapterInfo(menuChapter).titleEn)}</span></h2>
          ${caseUnlocked(last) ? `<button class="btn mdk-continue" data-num="${last}">${T.continue} · #${last + 1}</button>` : ""}</div>
        <div class="mdk-grid">${grid}</div>
      </div>`;
    root.querySelectorAll(".mdk-chtab:not(.locked)").forEach((b) => b.onclick = () => { menuChapter = +b.dataset.ch; renderMenu(); });
    root.querySelectorAll(".mdk-case:not(.locked)").forEach((b) => b.onclick = () => load(+b.dataset.num));
    const cont = root.querySelector(".mdk-continue"); if (cont) cont.onclick = () => load(+cont.dataset.num);
  }

  // ---------- pixel-art tileset ----------
  const ZTINT = { green: "#b7e0a5", yellow: "#f2df84", grey: "#d2d2db", blue: "#bcd8e8", tan: "#e6d6b8", pink: "#f0c8d8", purple: "#d3c2e8" };
  function drawMap() {
    const cv = document.getElementById("md-canvas"); if (!cv) return;
    const TS = C.TS, W = C.W, H = C.H;
    cv.width = W * TS; cv.height = H * TS;
    const g = cv.getContext("2d");
    const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    for (const t of C.tiles) {
      const px = t.x * TS, py = t.y * TS;
      if (t.type === "void") continue;
      const base = t.room >= 0 ? ZTINT[C.rooms[t.room].color] : "#e9dcc2";
      r(px, py, TS, TS, base);
      if ((t.x + t.y) % 2 === 0) { g.fillStyle = "rgba(0,0,0,.04)"; g.fillRect(px, py, TS, TS); }
      g.fillStyle = "rgba(0,0,0,.06)"; g.fillRect(px, py + TS - 1, TS, 1); g.fillRect(px + TS - 1, py, 1, TS);
    }
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
  const objSprite = (key) => `/assets/img/murdoku/${key}.png?v=7`;
  function fixtureLayer() {
    const fx = document.getElementById("md-fix"); if (!fx) return;
    let html = "";
    for (const [bx, by] of (C.beds || [])) {
      const style = `left:${bx / C.W * 100}%;top:${by / C.H * 100}%;width:${200 / C.W}%;height:${100 / C.H}%`;
      html += `<span class="mdm-fx ai occ" style="${style}"><img src="${objSprite("bed")}" alt="" referrerpolicy="no-referrer"></span>`;
    }
    for (const t of C.tiles) {
      const key = t.occ || t.fixture;
      if (!key || key === "bed") continue;
      const occ = !!t.occ;
      const style = `left:${t.x / C.W * 100}%;top:${t.y / C.H * 100}%;width:${100 / C.W}%;height:${100 / C.H}%`;
      html += `<span class="mdm-fx ai${occ ? " occ" : ""}" style="${style}"><img src="${objSprite(key)}" alt="" referrerpolicy="no-referrer"></span>`;
    }
    fx.innerHTML = html;
  }

  // ---------- load a case ----------
  function load(n) {
    n = Math.max(0, n | 0);
    if (!caseUnlocked(n)) return renderMenu();
    view = "game"; caseNum = n; C = MURDOKU.generateCase(n); lsSet(CURKEY, n);
    restoreBoard(n);
    sel = 0; mode = "place"; if (!won) won = false; accuseMsg = "";
    const next = C.suspects.findIndex((_, i) => placements[i] == null); if (next >= 0) sel = next;
    shell(); drawMap(); fixtureLayer(); refresh(); startTimer();
  }
  function startTimer() { clearInterval(timer); if (won) return; timer = setInterval(() => { secs++; const el = document.getElementById("md-timer"); if (el) el.textContent = mmss(secs); if (secs % 5 === 0) saveBoard(); }, 1000); }

  // ---------- rook logic ----------
  const tileOwner = (tile) => { for (const s in placements) if (placements[s] === tile) return +s; return -1; };
  function blockedBy(tile, exclude) {
    const T2 = C.tiles[tile];
    for (const s in placements) { if (+s === exclude) continue; const P = C.tiles[placements[s]]; if (placements[s] === tile || P.y === T2.y || P.x === T2.x) return true; }
    return false;
  }
  function act(tile) {
    if (won) return;
    const t = C.tiles[tile]; if (!t || !t.walkable) return;
    if (mode === "place") {
      if (blockedBy(tile, sel)) return;
      placements[sel] = tile; delete crosses[`${sel}:${tile}`]; delete notes[`${sel}:${tile}`];
      const next = C.suspects.findIndex((_, i) => placements[i] == null); if (next >= 0) sel = next;
    } else if (mode === "cross") { const k = `${sel}:${tile}`; crosses[k] ? delete crosses[k] : (crosses[k] = 1); }
    else if (mode === "notes") { const k = `${sel}:${tile}`; notes[k] ? delete notes[k] : (notes[k] = 1); }
    else if (mode === "erase") { const occ = tileOwner(tile); if (occ >= 0) delete placements[occ]; for (let s = 0; s < C.N; s++) { delete crosses[`${s}:${tile}`]; delete notes[`${s}:${tile}`]; } }
    saveBoard(); refresh();
  }
  function hint() {
    if (won) return;
    const wrong = C.suspects.map((_, i) => i).filter((i) => placements[i] !== C.solution[i]);
    if (!wrong.length) return;
    const s = wrong[Math.floor(Math.random() * wrong.length)], cell = C.solution[s], T2 = C.tiles[cell];
    for (const o in placements) { const P = C.tiles[placements[o]]; if (+o !== s && (placements[o] === cell || P.y === T2.y || P.x === T2.x)) delete placements[o]; }
    placements[s] = cell; sel = s; saveBoard(); refresh();
  }
  const allCorrect = () => { for (let i = 0; i < C.N; i++) if (placements[i] !== C.solution[i]) return false; return true; };
  function accuse(i) {
    if (won || !allCorrect()) return;
    if (i === C.culprit) { won = true; accuseMsg = ""; clearInterval(timer); const list = solvedList(); if (!list.includes(caseNum)) { list.push(caseNum); lsSet(SOLVED, list); } saveBoard(); }
    else accuseMsg = T.wrongAccuse(C.suspects[i].name);
    refresh();
  }

  // ---------- game shell (map left, clues right) ----------
  function shell() {
    root.innerHTML = `
      <div class="md-bar">
        <div class="md-casenav">
          <button class="mini-btn" id="md-menu" title="${T.menu}">${T.menu}</button>
          <button class="mini-btn" id="md-prev" ${caseNum <= 0 || !caseUnlocked(caseNum - 1) ? "disabled" : ""}>‹</button>
          <span class="md-caseno">#${caseNum + 1} · ${esc(C.title)}</span>
          <button class="mini-btn" id="md-next" ${caseUnlocked(caseNum + 1) ? "" : "disabled"}>›</button>
        </div>
        <div class="md-bar-r"><span class="md-diff">${T.diff} ${C.difficulty.toFixed(1)}</span><span class="md-timer" id="md-timer">${mmss(secs)}</span><button class="mini-btn" id="md-reset" title="${T.reset}">↻</button></div>
      </div>
      <p class="md-briefline">${esc(C.brief)}</p>

      <div class="md-game">
        <div class="md-left">
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
        </div>
        <div class="md-right">
          <section class="panel md-clues"><h2>${T.clues}</h2>
            <div class="mdm-cards">${C.clues.map((c) => { const p = C.suspects[c.s]; return `
              <div class="mdm-card${c.victim ? " vic" : ""}">
                <div class="mdm-polaroid"><img src="${avatar(p.name, p.g)}" alt="${esc(p.name)}" referrerpolicy="no-referrer">${c.victim ? '<span class="mdm-cardx">✕</span>' : ""}<div class="mdm-cardname">${esc(p.name)}</div></div>
                <div class="mdm-pill">${c.victim ? `<b class="mdm-viclabel">${T.victimLabel}</b><br>` : ""}${md(c.text)}</div>
              </div>`; }).join("")}</div>
            <p class="md-hint">${T.help}</p></section>
          <section class="panel mdm-status" id="md-status"></section>
        </div>
      </div>`;

    const lab = document.getElementById("md-labels");
    let coords = "";
    for (let x = 1; x <= C.W - 2; x++) coords += `<span class="mdm-coord" style="left:${(x + 0.5) / C.W * 100}%;top:${0.5 / C.H * 100}%">${x}</span>`;
    for (let y = 1; y <= C.H - 2; y++) coords += `<span class="mdm-coord" style="left:${0.5 / C.W * 100}%;top:${(y + 0.5) / C.H * 100}%">${y}</span>`;
    lab.innerHTML = coords + C.rooms.map((z) => `<span class="mdm-zlabel" style="left:${(z.label.x + 0.5) / C.W * 100}%;top:${(z.label.y + 0.5) / C.H * 100}%">${esc(L === "pt" ? z.pt : z.name)}</span>`).join("");

    document.getElementById("md-toolbar").querySelectorAll("[data-tool]").forEach((b) => b.onclick = () => { mode = b.dataset.tool; refresh(); });
    document.getElementById("md-hint").onclick = hint;
    document.getElementById("md-menu").onclick = renderMenu;
    document.getElementById("md-prev").onclick = () => load(caseNum - 1);
    document.getElementById("md-next").onclick = () => load(caseNum + 1);
    document.getElementById("md-reset").onclick = () => { if (confirm(T.resetConfirm)) { placements = {}; crosses = {}; notes = {}; secs = 0; won = false; saveBoard(); shell(); drawMap(); fixtureLayer(); refresh(); startTimer(); } };
  }

  function refresh() {
    const ov = document.getElementById("md-overlay"); if (!ov) return;
    const eRows = new Set(), eCols = new Set();
    for (const s in placements) { const T2 = C.tiles[placements[s]]; eRows.add(T2.y); eCols.add(T2.x); }
    let html = "";
    for (const t of C.tiles) {
      if (!t.walkable) continue;
      const tile = t.y * C.W + t.x, owner = tileOwner(tile);
      const style = `left:${t.x / C.W * 100}%;top:${t.y / C.H * 100}%;width:${100 / C.W}%;height:${100 / C.H}%`;
      let inner = "", cls = "mdm-tile walk";
      if (owner >= 0) inner = `<img class="mdm-av${owner === C.victimIdx ? " vic" : ""}" src="${avatar(C.suspects[owner].name, C.suspects[owner].g)}" alt="${esc(C.suspects[owner].name)}" style="border-color:${C.suspects[owner].color}" referrerpolicy="no-referrer">${owner === C.victimIdx ? '<span class="mdm-vic-tile">☠</span>' : ""}`;
      else {
        const autoX = eRows.has(t.y) || eCols.has(t.x), userX = crosses[`${sel}:${tile}`];
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
    } else if (placedN === C.N) { sh += `<p class="mdm-note-line">${T.notAllCorrect}</p>`; }
    else { sh += `<p class="mdm-note-line">${T.placeAll(C.N)}</p>`; }
    document.getElementById("md-status").innerHTML = sh;
    document.querySelectorAll(".mdm-accuse-b").forEach((b) => b.onclick = () => accuse(+b.dataset.acc));
    const nc = document.getElementById("md-nextcase"); if (nc) nc.onclick = () => (caseUnlocked(caseNum + 1) ? load(caseNum + 1) : renderMenu());
  }

  const toolBtn = (id, icon, label) => `<button class="mdm-tool" data-tool="${id}"><span>${icon}</span>${label}</button>`;

  // ---------- boot ----------
  if (!window.MURDOKU) { root.innerHTML = `<p class="tool-note">${T.loadErr}</p>`; return; }
  const qCase = new URLSearchParams(location.search).get("case");
  if (qCase !== null && caseUnlocked(qCase | 0)) { menuChapter = Math.floor((qCase | 0) / CPC); load(qCase | 0); }
  else { menuChapter = Math.min(Math.floor((lsGet(CURKEY, 0) | 0) / CPC), NCH - 1); if (menuChapter < 0) menuChapter = 0; renderMenu(); }
})();
