/* Murdoku — case engine (pure, no DOM). Murder + Sudoku, house edition.
   A house floor plan of named rooms (varied sizes). Walls are thin lines on tile
   edges. Rules: every person stood on one floor tile; no two share a row or a
   column (placing one rules out its row + column). Furniture is blocked (table,
   TV, plant, bookcase, box); chairs, rugs and beds are occupiable. Suspects are
   named alphabetically from A; the victim's name starts with V and shares a room
   with exactly one suspect — the culprit. EN or PT-PT (pre-1990 spelling) via
   localStorage "nftw:lang". Cases seeded by number; clues minimised to one
   solution. Object art is cropped from the reference book. Browser + Node. */
(function (global) {
  "use strict";
  const L = (typeof localStorage !== "undefined" && localStorage.getItem("nftw:lang") === "pt") ? "pt" : "en";

  const ALPHA = [ // pink/purple rings stay on female suspects so nothing reads ambiguous
    { name: "Alice", color: "#e05a4a", g: "f" }, { name: "Benjamin", color: "#6c8cff", g: "m" },
    { name: "Charlotte", color: "#e8c84a", g: "f" }, { name: "Daniel", color: "#4db6ac", g: "m" },
    { name: "Eleanor", color: "#5bc8e8", g: "f" }, { name: "Frederick", color: "#5bd6a0", g: "m" },
    { name: "Grace", color: "#d98cc0", g: "f" }, { name: "Harold", color: "#ff8a3d", g: "m" },
    { name: "Isabelle", color: "#b18cff", g: "f" }, { name: "Jacob", color: "#9ccc65", g: "m" },
    { name: "Katherine", color: "#f06292", g: "f" }, { name: "Louis", color: "#a1887f", g: "m" },
  ];
  const VICTIMS = [
    { name: "Victor", g: "m" }, { name: "Vivian", g: "f" }, { name: "Vincent", g: "m" },
    { name: "Vera", g: "f" }, { name: "Violet", g: "f" },
  ];
  // objects (match the book). blocked: table/tv/plant/bookshelf/box; occupiable: chair/rug/bed.
  // Clues use the book's indefinite phrasing: "ao lado de uma televisão" / "next to a TV".
  const FIX = { table: "a table", tv: "a TV", plant: "a plant", bookshelf: "a bookcase", box: "a box", chair: "a chair", rug: "a rug", bed: "a bed" };
  const FIXPT = { table: "de uma mesa", tv: "de uma televisão", plant: "de uma planta", bookshelf: "de uma estante", box: "de uma caixa", chair: "de uma cadeira", rug: "de um tapete", bed: "de uma cama" };
  const EM = { o: "no", a: "na", os: "nos", as: "nas" };

  // Like the book: the interior grid is N×N where N = number of people (6), so
  // every row and every column holds exactly one person — which is what lets the
  // victim be found in "the last remaining cell" with no clues of their own.
  const W = 8, H = 8, TS = 32; // 6×6 interior + 1-tile border
  const idx = (x, y) => y * W + x;
  const ROOMS = [
    { name: "Master Bedroom", pt: "Quarto Principal", art: "o", color: "blue", x: 1, y: 1, w: 2, h: 2 },
    { name: "Kitchen", pt: "Cozinha", art: "a", color: "tan", x: 3, y: 1, w: 2, h: 2 },
    { name: "Living Room", pt: "Sala de Estar", art: "a", color: "green", x: 5, y: 1, w: 2, h: 3 },
    { name: "Bathroom", pt: "Casa de Banho", art: "a", color: "grey", x: 1, y: 3, w: 2, h: 2 },
    { name: "Guest Room", pt: "Quarto de Hóspedes", art: "o", color: "pink", x: 3, y: 3, w: 2, h: 2 },
    { name: "Office", pt: "Escritório", art: "o", color: "yellow", x: 5, y: 4, w: 2, h: 3 },
    { name: "Dining Room", pt: "Sala de Jantar", art: "a", color: "tan", x: 1, y: 5, w: 2, h: 2 },
    { name: "Garden", pt: "Quintal", art: "o", color: "green", x: 3, y: 5, w: 2, h: 2 },
  ];
  const FURN = [ // blocked: table, tv, plant, bookshelf, box
    ["table", 4, 1], ["tv", 6, 1], ["plant", 5, 3], ["plant", 1, 4],
    ["bookshelf", 6, 4], ["table", 1, 6], ["box", 3, 6], ["plant", 4, 6],
  ];
  // Beds span TWO horizontal cells (like the book); a person occupies one of them.
  const BEDS = [[1, 1], [3, 3]]; // each covers (x,y) and (x+1,y)
  const OCC = [ // other occupiable objects (walkable): chair, rug
    ["chair", 6, 2], ["rug", 2, 3], ["rug", 5, 5], ["chair", 2, 5],
  ];
  const VOID = [];
  const WINDOWS = [[2, 1, "T"], [5, 1, "T"], [1, 3, "L"], [6, 5, "R"]];

  function buildMap() {
    const roomAt = (x, y) => ROOMS.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    const furnAt = {}; FURN.forEach(([k, x, y]) => (furnAt[idx(x, y)] = k));
    const occAt = {}; OCC.forEach(([k, x, y]) => (occAt[idx(x, y)] = k));
    BEDS.forEach(([x, y]) => { occAt[idx(x, y)] = "bed"; occAt[idx(x + 1, y)] = "bed"; });
    const voidSet = new Set(VOID.map(([x, y]) => idx(x, y)));
    const tiles = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y);
      const interior = x >= 1 && x <= W - 2 && y >= 1 && y <= H - 2 && !voidSet.has(i);
      let type = "void", room = -1;
      if (interior) { room = roomAt(x, y); type = furnAt[i] ? "furn" : (occAt[i] ? "occ" : "floor"); }
      tiles[i] = { x, y, room, type, fixture: furnAt[i] || null, occ: occAt[i] || null, walkable: (type === "floor" || type === "occ") };
    }
    ROOMS.forEach((r) => (r.label = { x: r.x + (r.w - 1) / 2, y: r.y + r.h - 1 }));
    return tiles;
  }

  function context(tiles) {
    const walk = [], roomCells = [];
    for (const t of tiles) if (t.walkable) { walk.push(idx(t.x, t.y)); if (t.room >= 0) roomCells.push(idx(t.x, t.y)); }
    const beside = {};                              // "ao lado" of an object — adjacent, SAME room
    for (const t of tiles) { const k = t.fixture || t.occ; if (!k) continue;
      const s = beside[k] || (beside[k] = new Set());
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = t.x + dx, ny = t.y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
        const n = tiles[idx(nx, ny)]; if (n.walkable && n.room === t.room) s.add(idx(nx, ny));
      });
    }
    const occ = {};                                 // occupiable cells by kind (chair/rug/bed)
    for (const t of tiles) if (t.occ) (occ[t.occ] || (occ[t.occ] = new Set())).add(idx(t.x, t.y));
    const windowFront = new Set();
    for (const w of WINDOWS) { const i = idx(w[0], w[1]); if (tiles[i] && tiles[i].walkable) windowFront.add(i); }
    const describable = new Set();
    for (const k in beside) beside[k].forEach((t) => describable.add(t));
    for (const k in occ) occ[k].forEach((t) => describable.add(t));
    windowFront.forEach((t) => describable.add(t));
    return { tiles, walk, roomCells, beside, occ, windowFront, describable };
  }

  function holds(c, tile, ctx) {
    const T = ctx.tiles[tile];
    if (c.t === "inroom") return T.room === c.z;
    if (c.t === "negroom") return T.room !== c.z;
    if (c.t === "beside") return ctx.beside[c.k] && ctx.beside[c.k].has(tile);
    if (c.t === "occ") return ctx.occ[c.k] && ctx.occ[c.k].has(tile);
    if (c.t === "window") return ctx.windowFront.has(tile);
    if (c.t === "arow") return T.y === c.v;   // only ever the top/bottom row ("linha de cima/baixo")
    if (c.t === "acol") return T.x === c.v;   // only ever the leftmost/rightmost column
    return true;
  }

  // Solver. Clue kinds beyond the unary ones:
  //  comp  {s,o,dir} — s was north/south/east/west of person o (book: "a leste da Eloise")
  //  with  {s,o}     — s shared a room with suspect o
  //  alone {s}       — s was the only person in their room
  //  only  {s,k}     — s was the only person on that object kind (chair/rug/bed/window)
  function count(clues, ctx, N) {
    const cand = [];
    for (let s = 0; s < N; s++) {
      const list = ctx.walk.filter((tile) => clues.every((c) => {
        if (c.s !== s) return true;
        if (c.t === "comp" || c.t === "with" || c.t === "alone") return true;
        if (c.t === "only") return c.k === "window" ? ctx.windowFront.has(tile) : !!(ctx.occ[c.k] && ctx.occ[c.k].has(tile));
        return holds(c, tile, ctx);
      }));
      if (!list.length) return { n: 0 };
      cand.push(list);
    }
    const bins = clues.filter((c) => c.t === "comp" || c.t === "with");
    const posts = clues.filter((c) => c.t === "alone" || c.t === "only");
    const order = Array.from({ length: N }, (_, s) => s).sort((a, b) => cand[a].length - cand[b].length);
    const usedR = new Set(), usedC = new Set(), usedT = new Set();
    const asg = new Array(N).fill(-1);
    const T = (t) => ctx.tiles[t];
    const binOK = (c) => {
      const a = asg[c.s], b = asg[c.o];
      if (a < 0 || b < 0) return true;
      if (c.t === "with") return T(a).room === T(b).room;
      if (c.dir === "N") return T(a).y < T(b).y;
      if (c.dir === "S") return T(a).y > T(b).y;
      if (c.dir === "E") return T(a).x > T(b).x;
      return T(a).x < T(b).x;
    };
    let n = 0;
    (function go(k) {
      if (n > 1) return;
      if (k === N) {
        for (const c of posts) {
          if (c.t === "alone") { const r = T(asg[c.s]).room; for (let i = 0; i < N; i++) if (i !== c.s && T(asg[i]).room === r) return; }
          else for (let i = 0; i < N; i++) { if (i === c.s) continue; const on = c.k === "window" ? ctx.windowFront.has(asg[i]) : !!(ctx.occ[c.k] && ctx.occ[c.k].has(asg[i])); if (on) return; }
        }
        n++; return;
      }
      const s = order[k];
      for (const tile of cand[s]) {
        const t = T(tile);
        if (usedT.has(tile) || usedR.has(t.y) || usedC.has(t.x)) continue;
        asg[s] = tile;
        let ok = true;
        for (const c of bins) if ((c.s === s || c.o === s) && !binOK(c)) { ok = false; break; }
        if (ok) { usedT.add(tile); usedR.add(t.y); usedC.add(t.x); go(k + 1); usedT.delete(tile); usedR.delete(t.y); usedC.delete(t.x); }
        asg[s] = -1;
        if (n > 1) return;
      }
    })(0);
    return { n };
  }

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const shuffle = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function pickCrimePositions(ctx, NS, rng) {
    const descFirst = (arr) => shuffle(arr, rng).sort((a, b) => (ctx.describable.has(b) ? 1 : 0) - (ctx.describable.has(a) ? 1 : 0));
    const big = [];
    for (let i = 0; i < ROOMS.length; i++) if (ROOMS[i].w >= 2 && ROOMS[i].h >= 2) big.push(i);
    const cr = big[Math.floor(rng() * big.length)];
    const crCells = descFirst(ctx.roomCells.filter((t) => ctx.tiles[t].room === cr));
    let vc = -1, cc = -1;
    outer: for (let i = 0; i < crCells.length; i++) for (let j = i + 1; j < crCells.length; j++) {
      const A = ctx.tiles[crCells[i]], B = ctx.tiles[crCells[j]];
      if (A.y !== B.y && A.x !== B.x) { vc = crCells[i]; cc = crCells[j]; break outer; }
    }
    if (cc < 0) return null;
    const rows = new Set([ctx.tiles[vc].y, ctx.tiles[cc].y]), cols = new Set([ctx.tiles[vc].x, ctx.tiles[cc].x]);
    const four = [];
    for (const t of descFirst(ctx.roomCells.filter((t) => ctx.tiles[t].room !== cr))) {
      const T = ctx.tiles[t];
      if (rows.has(T.y) || cols.has(T.x)) continue;
      rows.add(T.y); cols.add(T.x); four.push(t);
      if (four.length === NS - 1) break;
    }
    if (four.length < NS - 1) return null;
    const culprit = Math.floor(rng() * NS);
    const positions = new Array(NS + 1);
    positions[culprit] = cc;
    let fi = 0;
    for (let s = 0; s < NS; s++) if (s !== culprit) positions[s] = four[fi++];
    positions[NS] = vc;
    return { positions, culprit };
  }
  function pickAnyRook(ctx, M, rng) {
    const pool = shuffle(ctx.roomCells, rng), chosen = [], rows = new Set(), cols = new Set();
    for (const t of pool) { const T = ctx.tiles[t]; if (rows.has(T.y) || cols.has(T.x)) continue; chosen.push(t); rows.add(T.y); cols.add(T.x); if (chosen.length === M) return chosen; }
    return null;
  }

  // Candidate clues in the book's exact vocabulary (from its suspect cards):
  // beside object / on an occupiable / in front of a window / in a room /
  // "sozinho(a)" / "a única pessoa ..." / compass of another suspect /
  // "com X" (shared room) / top-bottom row and left-right column extremes.
  // Numeric "linha 6"-style clues do NOT exist in the book and are only a
  // last-resort fallback added by generateCase when nothing else pins a case.
  function candidateClues(truth, ctx, NS, M, rng) {
    const flavour = [], pinRoom = [];
    const P = (i) => ctx.tiles[truth[i]];
    const roomOcc = {}; for (let i = 0; i < M; i++) (roomOcc[P(i).room] = roomOcc[P(i).room] || []).push(i);
    const kindCount = {}; for (let i = 0; i < M; i++) { const k = P(i).occ; if (k) kindCount[k] = (kindCount[k] || 0) + 1; if (ctx.windowFront.has(truth[i])) kindCount.window = (kindCount.window || 0) + 1; }
    for (let s = 0; s < NS; s++) {
      const tile = truth[s], t = ctx.tiles[tile];
      for (const k in ctx.beside) if (ctx.beside[k].has(tile)) flavour.push({ t: "beside", s, k });
      if (t.occ) { flavour.push({ t: "occ", s, k: t.occ }); if (kindCount[t.occ] === 1) flavour.push({ t: "only", s, k: t.occ }); }
      if (ctx.windowFront.has(tile)) { flavour.push({ t: "window", s }); if (kindCount.window === 1) flavour.push({ t: "only", s, k: "window" }); }
      if (roomOcc[t.room].length === 1) flavour.push({ t: "alone", s });
      const comps = [];
      for (let o = 0; o < NS; o++) {
        if (o === s) continue;
        comps.push({ t: "comp", s, o, dir: t.y < P(o).y ? "N" : "S" });
        comps.push({ t: "comp", s, o, dir: t.x > P(o).x ? "E" : "W" });
      }
      shuffle(comps, rng).slice(0, 3).forEach((c) => flavour.push(c));
      for (let o = s + 1; o < NS; o++) if (P(o).room === t.room) flavour.push({ t: "with", s, o });
      if (t.y === 1) flavour.push({ t: "arow", s, v: 1 });
      if (t.y === H - 2) flavour.push({ t: "arow", s, v: H - 2 });
      if (t.x === 1) flavour.push({ t: "acol", s, v: 1 });
      if (t.x === W - 2) flavour.push({ t: "acol", s, v: W - 2 });
      pinRoom.push({ t: "inroom", s, z: t.room });
    }
    return { flavour, pinRoom };
  }

  const TITLES = ["The Purchase No One Made", "A Scandal in the Study", "The Vanishing Heirloom", "Whodunit After Dark", "The Missing Will", "Trouble in the Attic", "The Five O'Clock Alibi", "The Spilled Secret"];
  const TITLESPT = ["O Crime de Ontem à Noite", "Um Escândalo no Escritório", "A Herança Desaparecida", "Mistério ao Anoitecer", "O Testamento Perdido", "Problemas no Sótão", "O Álibi das Cinco", "O Segredo Revelado"];
  const CRIMES = ["a priceless heirloom vanished from the mantel", "a threatening note was left on the table", "the safe was found wide open", "someone had been through the drawers", "a wine glass lay shattered on the floor"];
  const CRIMESPT = ["desapareceu uma relíquia valiosíssima da lareira", "foi deixado um bilhete ameaçador na mesa", "o cofre foi encontrado escancarado", "alguém remexeu nas gavetas", "um copo de vinho apareceu partido no chão"];

  function generateCase(num) {
    const rng = mulberry32(((num + 1) * 2654435761) >>> 0);
    const tiles = buildMap();
    const ctx = context(tiles);
    const NS = 5;
    const suspects = ALPHA.slice(0, NS).map((s) => ({ name: s.name, color: s.color, g: s.g }));
    const v = VICTIMS[Math.floor(rng() * VICTIMS.length)];
    const victim = { name: v.name, color: "#9aa0a8", g: v.g, isVictim: true };
    const people = suspects.concat([victim]);
    const M = people.length;
    // Clues are generated for the SUSPECTS only — the victim gets none (book
    // rule: with 6 people on a 6×6 grid the victim's cell is the last one left).
    // Retry placements until the authentic clue vocabulary alone pins a unique
    // solution; only if that never happens fall back to adding numeric pins.
    let place = null, pools = null;
    for (let a = 0; a < 150 && !pools; a++) {
      const p = pickCrimePositions(ctx, NS, rng);
      if (!p) continue;
      const cc = candidateClues(p.positions, ctx, NS, M, rng);
      if (count(cc.flavour.concat(cc.pinRoom), ctx, M).n === 1) { place = p; pools = cc; }
    }
    if (!pools) {
      place = pickCrimePositions(ctx, NS, rng) || { positions: pickAnyRook(ctx, M, rng) || ctx.roomCells.slice(0, M), culprit: 0 };
      pools = candidateClues(place.positions, ctx, NS, M, rng);
      for (let s = 0; s < NS; s++) { const t = ctx.tiles[place.positions[s]]; pools.pinRoom.push({ t: "arow", s, v: t.y }, { t: "acol", s, v: t.x }); }
    }
    const truth = place.positions;
    let givens = shuffle(pools.flavour, rng).concat(shuffle(pools.pinRoom, rng));
    for (let i = givens.length - 1; i >= 0; i--) {
      const c = givens[i];
      const test = givens.slice(0, i).concat(givens.slice(i + 1));
      if (!test.some((q) => q.s === c.s)) continue;   // like the book, every suspect keeps at least one clue
      if (count(test, ctx, M).n === 1) givens = test;
    }
    // suspect CARDS (book style): portrait + clue bubble. Room goes in its own
    // sentence first, the rest joined with "e" — mirroring the book's cards.
    const frag = L === "pt" ? cluePt : clueEn;
    const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1) + ".";
    const cards = [];
    for (let s = 0; s < NS; s++) {
      const mine = givens.filter((c) => c.s === s);
      const roomF = mine.filter((c) => c.t === "inroom").map((c) => frag(c, people[s], people));
      const restF = mine.filter((c) => c.t !== "inroom").map((c) => frag(c, people[s], people));
      const sents = [];
      if (roomF.length) sents.push(cap(roomF.join(L === "pt" ? " e " : " and ")));
      if (restF.length) sents.push(cap(restF.join(L === "pt" ? " e " : " and ")));
      cards.push({ s, text: sents.join(" ") });
    }
    // the victim's card alternates between the book's two fixed texts
    const vAlt = rng() < 0.5;
    cards.push({ s: NS, victim: true, text: L === "pt"
      ? (vAlt ? "Estava na **última célula restante**." : `Estava sozinh${victim.g === "f" ? "a" : "o"} com o **assassino**.`)
      : (vAlt ? "Was in the **last remaining cell**." : "Was alone with the **killer**.") });
    const ci = Math.floor(rng() * CRIMES.length);
    const brief = L === "pt"
      ? `Noite de crime numa casa, e ${CRIMESPT[ci]}. ${victim.name} foi encontrad${victim.g === "f" ? "a" : "o"} sem vida. Cada linha e cada coluna têm exactamente uma pessoa. Coloca os ${NS} suspeitos pelas pistas; a vítima está na última célula restante, e quem ficou sozinho com ela é o culpado.`
      : `A crime one night at a house, and ${CRIMES[ci]}. ${victim.name} was found dead. Every row and every column holds exactly one person. Place the ${NS} suspects from the clues; the victim lies in the last remaining cell, and whoever is alone with them is the culprit.`;
    return {
      num, N: M, suspectCount: NS, victimIdx: NS, culprit: place.culprit,
      W, H, TS, tiles, rooms: ROOMS, walkable: ctx.walk, windows: WINDOWS, beds: BEDS, lang: L,
      suspects: people,
      title: (L === "pt" ? TITLESPT : TITLES)[num % TITLES.length],
      brief,
      clues: cards,
      solution: truth,
    };
  }

  // clue FRAGMENTS in the book's voice, with the key word bolded like the cards
  // ("Estava **ao lado** de uma mesa.", "Estava a **leste** da Eloise.")
  const DIR_EN = { N: "north", S: "south", E: "east", W: "west" };
  const DIR_PT = { N: "norte", S: "sul", E: "leste", W: "oeste" };
  function clueEn(c, p, S) {
    if (c.t === "inroom") return `was in the **${ROOMS[c.z].name}**`;
    if (c.t === "negroom") return `was not in the **${ROOMS[c.z].name}**`;
    if (c.t === "beside") return `was **next to** ${FIX[c.k]}`;
    if (c.t === "occ") return c.k === "chair" ? "was sitting on a **chair**" : c.k === "bed" ? "was on a **bed**" : "was standing on a **rug**";
    if (c.t === "window") return "was **in front** of a window";
    if (c.t === "comp") return `was **${DIR_EN[c.dir]}** of ${S[c.o].name}`;
    if (c.t === "with") return `was **with** ${S[c.o].name}`;
    if (c.t === "alone") return "was **alone**";
    if (c.t === "only") return c.k === "window" ? "was the only person **in front** of a window" : c.k === "chair" ? "was the only person sitting on a **chair**" : c.k === "bed" ? "was the only person on a **bed**" : "was the only person standing on a **rug**";
    if (c.t === "arow") return c.v === 1 ? "was in the **top row**" : "was in the **bottom row**";
    if (c.t === "acol") return c.v === 1 ? "was in the **leftmost column**" : "was in the **rightmost column**";
    return "";
  }
  function cluePt(c, p, S) {
    const g = p.g === "f" ? "a" : "o";
    const art = (i) => S[i].g === "f" ? "da" : "do";
    if (c.t === "inroom") return `estava ${EM[ROOMS[c.z].art]} **${ROOMS[c.z].pt}**`;
    if (c.t === "negroom") return `não estava ${EM[ROOMS[c.z].art]} **${ROOMS[c.z].pt}**`;
    if (c.t === "beside") return `estava **ao lado** ${FIXPT[c.k]}`;
    if (c.t === "occ") return c.k === "chair" ? `estava sentad${g} numa **cadeira**` : c.k === "bed" ? `estava numa **cama**` : "estava em cima de um **tapete**";
    if (c.t === "window") return "estava **em frente** à janela";
    if (c.t === "comp") return `estava a **${DIR_PT[c.dir]}** ${art(c.o)} ${S[c.o].name}`;
    if (c.t === "with") return `estava **com** ${S[c.o].g === "f" ? "a" : "o"} ${S[c.o].name}`;
    if (c.t === "alone") return `estava **sozinh${g}**`;
    if (c.t === "only") return c.k === "window" ? "era a única pessoa **em frente** à janela" : c.k === "chair" ? `era a única pessoa sentada numa **cadeira**` : c.k === "bed" ? "era a única pessoa numa **cama**" : "era a única pessoa em cima de um **tapete**";
    if (c.t === "arow") return c.v === 1 ? "estava na **linha de cima**" : "estava na **linha de baixo**";
    if (c.t === "acol") return c.v === 1 ? "estava na **coluna mais à esquerda**" : "estava na **coluna mais à direita**";
    return "";
  }

  const API = { generateCase, ALPHA, VICTIMS, FIX, ROOMS, W, H, TS, _count: count, _buildMap: buildMap, _context: context };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.MURDOKU = API;
})(typeof window !== "undefined" ? window : globalThis);
