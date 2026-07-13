/* Murdoku — case engine (pure, no DOM). Murder + Sudoku.
   A floor plan of named rooms (varied sizes), generated procedurally per case.
   Rules: every person stood on one floor tile; no two share a row or a column
   (placing one rules out its row + column). Furniture is blocked (table, TV,
   plant, bookcase, box); chairs, rugs and beds are occupiable. The interior grid
   is N×N for N people, so once the suspects are placed the victim's cell is the
   only one left — the victim gets no clues of their own.

   Cases are grouped into CHAPTERS (25 each). Difficulty rises across a chapter
   and jumps at each new chapter (bigger grids, harder clues). Within a chapter a
   thread runs through the cast: each case the victim is a person who was a
   suspect the case before, one newcomer joins, and everyone else carries over —
   so the titles ("A Morte de …") and the maps tell a wordless story. Every new
   chapter is a fresh cast in a new setting.

   EN or PT-PT (pre-1990 spelling) via localStorage "nftw:lang". Seeded by case
   number, clues minimised to a single solution. Object art is cropped from the
   reference book. Runs in the browser and in Node. */
(function (global) {
  "use strict";
  const L = (typeof localStorage !== "undefined" && localStorage.getItem("nftw:lang") === "pt") ? "pt" : "en";

  // ---- object vocabulary (matches the book) --------------------------------
  const FIX = { table: "a table", tv: "a TV", plant: "a plant", bookshelf: "a bookcase", box: "a box", chair: "a chair", rug: "a rug", bed: "a bed" };
  const FIXPT = { table: "de uma mesa", tv: "de uma televisão", plant: "de uma planta", bookshelf: "de uma estante", box: "de uma caixa", chair: "de uma cadeira", rug: "de um tapete", bed: "de uma cama" };
  const EM = { o: "no", a: "na", os: "nos", as: "nas" };
  const BLOCK = ["table", "tv", "plant", "bookshelf", "box"], OCCK = ["chair", "rug"];

  // ---- chapters ------------------------------------------------------------
  const CPC = 25;                                   // cases per chapter
  // gendered ring colours so a face is never dressed in the "wrong" colour
  const MASC = ["#6c8cff", "#4db6ac", "#5bd6a0", "#ff8a3d", "#9ccc65", "#a1887f"];
  const FEM = ["#e05a4a", "#e8c84a", "#5bc8e8", "#d98cc0", "#b18cff", "#f06292"];
  const sp = (s) => s.trim().split(/\s+/);
  const rm = (en, pt, art) => ({ en, pt, art });
  const CHAPTERS = [
    {
      key: "house", titleEn: "The House on Ash Lane", titlePt: "A Casa na Rua das Cinzas",
      palette: ["#bcd8e8", "#e6d6b8", "#b7e0a5", "#d2d2db", "#f0c8d8", "#f2df84", "#d3c2e8"], // warm, homey
      male: sp("James John Robert Michael William David Richard Joseph Thomas Charles Daniel Matthew Anthony Donald Mark Paul"),
      female: sp("Mary Patricia Jennifer Linda Barbara Susan Jessica Sarah Karen Nancy Betty Helen Sandra Donna Carol Ruth"),
      rooms: [
        rm("Master Bedroom", "Quarto Principal", "o"), rm("Kitchen", "Cozinha", "a"), rm("Living Room", "Sala de Estar", "a"),
        rm("Bathroom", "Casa de Banho", "a"), rm("Guest Room", "Quarto de Hóspedes", "o"), rm("Office", "Escritório", "o"),
        rm("Dining Room", "Sala de Jantar", "a"), rm("Pantry", "Despensa", "a"), rm("Hallway", "Corredor", "o"),
        rm("Cellar", "Cave", "a"), rm("Attic", "Sótão", "o"), rm("Laundry", "Lavandaria", "a"),
      ],
    },
    {
      key: "manor", titleEn: "A Death at Blackmoor Manor", titlePt: "Uma Morte na Mansão Blackmoor",
      palette: ["#cdbcd8", "#b3cbac", "#e6cd8b", "#adbfd0", "#dfb5b5", "#c3b6a6", "#a3bfb6"], // moody jewel pastels
      male: sp("Reginald Percival Archibald Montgomery Bartholomew Cornelius Humphrey Sebastian Algernon Bertram Cuthbert Horatio Nigel Rupert Cedric Barnaby"),
      female: sp("Beatrice Genevieve Rosalind Cordelia Millicent Arabella Henrietta Josephine Wilhelmina Gwendolyn Prudence Evangeline Ottoline Philippa Cressida Marguerite"),
      rooms: [
        rm("Ballroom", "Salão de Baile", "o"), rm("Library", "Biblioteca", "a"), rm("Music Room", "Sala de Música", "a"),
        rm("Gallery", "Galeria", "a"), rm("Study", "Estúdio", "o"), rm("Great Hall", "Salão Nobre", "o"),
        rm("Chambers", "Aposentos", "os"), rm("Conservatory", "Jardim de Inverno", "o"), rm("Wine Cellar", "Adega", "a"),
        rm("Smoking Room", "Sala de Fumo", "a"), rm("East Wing", "Ala Este", "a"), rm("West Wing", "Ala Oeste", "a"),
      ],
    },
    {
      key: "hotel", titleEn: "Checkout at the Grand Hotel", titlePt: "Última Noite no Grande Hotel",
      palette: ["#bfe3d4", "#c3dcef", "#efe6cf", "#f2d2d8", "#cfe8dd", "#ece0b8", "#dcd7cf"], // cool, clean, art-deco
      male: sp("Marco Luca Andre Pierre Hans Klaus Diego Rafael Omar Yusuf Kenji Hiroshi Sven Nikolai Andres Mateo"),
      female: sp("Sofia Elena Chiara Amelie Ingrid Freya Camila Lucia Aisha Leila Yuki Sakura Astrid Nadia Valentina Isabela"),
      rooms: [
        rm("Reception", "Recepção", "a"), rm("Royal Suite", "Suite Real", "a"), rm("Restaurant", "Restaurante", "o"),
        rm("Bar", "Bar", "o"), rm("Spa", "Spa", "o"), rm("Gym", "Ginásio", "o"),
        rm("Kitchen", "Cozinha", "a"), rm("Lounge", "Salão", "o"), rm("Casino", "Casino", "o"),
        rm("Laundry", "Lavandaria", "a"), rm("Storage", "Arrecadação", "a"), rm("Office", "Escritório", "o"),
      ],
    },
  ];
  // A chapter's cast: one long interleaved roster. A sliding window of N names is
  // "alive" each case; the person sliding out is that case's victim.
  function buildRoster(ch) {
    const m = ch.male, f = ch.female, out = []; let mi = 0, fi = 0;
    const total = m.length + f.length;
    for (let i = 0; i < total; i++) {
      if (i % 2 === 0 ? mi < m.length : !(fi < f.length)) out.push({ name: m[mi++], g: "m" });
      else out.push({ name: f[fi++], g: "f" });
    }
    return out;
  }

  // ---- PRNG ----------------------------------------------------------------
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const shuffle = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---- procedural map ------------------------------------------------------
  // Split the N×N interior into rectangular rooms; every room ends up at least
  // 2×2 (both dimensions ≥ 2), which keeps a valid crime room available.
  function partition(N, rng, target) {
    let rects = [{ x: 1, y: 1, w: N, h: N }];
    const splittable = (r) => Math.max(r.w, r.h) >= 4;
    let guard = 0;
    while (rects.length < target && guard++ < 200) {
      const cands = rects.filter(splittable);
      if (!cands.length) break;
      cands.sort((a, b) => b.w * b.h - a.w * a.h);
      const r = cands[Math.floor(rng() * Math.min(cands.length, 2))];
      const i = rects.indexOf(r);
      const horiz = r.w >= r.h ? r.w >= 4 : !(r.h >= 4);
      if (horiz) { const cut = 2 + Math.floor(rng() * (r.w - 3)); rects.splice(i, 1, { x: r.x, y: r.y, w: cut, h: r.h }, { x: r.x + cut, y: r.y, w: r.w - cut, h: r.h }); }
      else { const cut = 2 + Math.floor(rng() * (r.h - 3)); rects.splice(i, 1, { x: r.x, y: r.y, w: r.w, h: cut }, { x: r.x, y: r.y + cut, w: r.w, h: r.h - cut }); }
    }
    return rects;
  }

  function makeMap(N, rng, chapter) {
    const W = N + 2, H = N + 2, idx = (x, y) => y * W + x;
    const target = Math.max(5, Math.min(Math.round(N * 1.1), (N >> 1) * (N >> 1)));
    const rooms = partition(N, rng, target);
    const pool = shuffle(chapter.rooms, rng);
    rooms.forEach((r, i) => { const nm = pool[i % pool.length]; r.name = nm.en; r.pt = nm.pt; r.art = nm.art; r.label = { x: r.x + (r.w - 1) / 2, y: r.y + r.h - 1 }; });
    const roomAt = (x, y) => { for (let i = 0; i < rooms.length; i++) { const r = rooms[i]; if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i; } return -1; };
    // colour rooms greedily so neighbours differ
    const adj = rooms.map(() => new Set());
    for (let y = 1; y <= N; y++) for (let x = 1; x <= N; x++) { const a = roomAt(x, y); [[1, 0], [0, 1]].forEach(([dx, dy]) => { const b = roomAt(x + dx, y + dy); if (b >= 0 && b !== a) { adj[a].add(b); adj[b].add(a); } }); }
    const pal = shuffle(chapter.palette, rng);      // per-chapter floor tints (theme colour)
    rooms.forEach((r, i) => { const used = new Set(); adj[i].forEach((j) => { if (rooms[j].tint) used.add(rooms[j].tint); }); r.tint = pal.find((c) => !used.has(c)) || pal[i % pal.length]; });

    // objects
    const cells = []; for (let y = 1; y <= N; y++) for (let x = 1; x <= N; x++) cells.push({ x, y, r: roomAt(x, y) });
    const used = new Set(), furnAt = {}, occAt = {};
    const beds = [], bedTarget = N >= 8 ? 2 : 1;
    for (const c of shuffle(cells, rng)) {
      if (beds.length >= bedTarget) break;
      if (c.x >= N) continue;
      const a = idx(c.x, c.y), b = idx(c.x + 1, c.y);
      if (used.has(a) || used.has(b) || roomAt(c.x + 1, c.y) !== c.r) continue;
      beds.push([c.x, c.y]); used.add(a); used.add(b);
    }
    const rest = shuffle(cells, rng).filter((c) => !used.has(idx(c.x, c.y)));
    let bi = 0;
    const nBlocked = Math.round(N * N * 0.30), nOcc = Math.round(N * N * 0.12);
    for (let k = 0; k < nBlocked && bi < rest.length; k++, bi++) { const c = rest[bi]; furnAt[idx(c.x, c.y)] = BLOCK[Math.floor(rng() * BLOCK.length)]; used.add(idx(c.x, c.y)); }
    for (let k = 0; k < nOcc && bi < rest.length; k++, bi++) { const c = rest[bi]; occAt[idx(c.x, c.y)] = OCCK[Math.floor(rng() * OCCK.length)]; used.add(idx(c.x, c.y)); }
    beds.forEach(([x, y]) => { occAt[idx(x, y)] = "bed"; occAt[idx(x + 1, y)] = "bed"; });

    // windows on the outer shell, against a walkable interior cell
    const border = [];
    for (const c of cells) { if (furnAt[idx(c.x, c.y)]) continue; if (c.y === 1) border.push([c.x, c.y, "T"]); if (c.y === N) border.push([c.x, c.y, "B"]); if (c.x === 1) border.push([c.x, c.y, "L"]); if (c.x === N) border.push([c.x, c.y, "R"]); }
    const windows = shuffle(border, rng).slice(0, Math.max(2, Math.round(N / 2)));

    const tiles = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y), interior = x >= 1 && x <= N && y >= 1 && y <= N;
      let type = "void", room = -1, f = null, o = null;
      if (interior) { room = roomAt(x, y); f = furnAt[i] || null; o = occAt[i] || null; type = f ? "furn" : (o ? "occ" : "floor"); }
      tiles[i] = { x, y, room, type, fixture: f, occ: o, walkable: (type === "floor" || type === "occ") };
    }
    return { W, H, N, TS: 32, rooms, tiles, windows, beds, idx };
  }

  function context(map) {
    const { tiles, W } = map, idx = (x, y) => y * W + x;
    const walk = [], roomCells = [];
    for (const t of tiles) if (t.walkable) { walk.push(idx(t.x, t.y)); if (t.room >= 0) roomCells.push(idx(t.x, t.y)); }
    const beside = {};
    // "ao lado de" a thing = adjacent, same room, and NOT standing on that same
    // kind — otherwise a 2-cell bed makes its own occupant "beside a bed" too.
    for (const t of tiles) { const k = t.fixture || t.occ; if (!k) continue; const s = beside[k] || (beside[k] = new Set()); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = t.x + dx, ny = t.y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= map.H) return; const n = tiles[idx(nx, ny)]; if (n.walkable && n.room === t.room && n.occ !== k) s.add(idx(nx, ny)); }); }
    const occ = {};
    for (const t of tiles) if (t.occ) (occ[t.occ] || (occ[t.occ] = new Set())).add(idx(t.x, t.y));
    const windowFront = new Set();
    for (const w of map.windows) { const i = idx(w[0], w[1]); if (tiles[i] && tiles[i].walkable) windowFront.add(i); }
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
    if (c.t === "arow") return T.y === c.v;
    if (c.t === "acol") return T.x === c.v;
    return true;
  }

  // Solver. Extra clue kinds: comp {s,o,dir} compass of another person; with
  // {s,o} shared room; alone {s} only one in room; only {s,k} sole user of kind.
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
    const usedR = new Set(), usedC = new Set(), usedT = new Set(), asg = new Array(N).fill(-1);
    const TL = (t) => ctx.tiles[t];
    const binOK = (c) => {
      const a = asg[c.s], b = asg[c.o]; if (a < 0 || b < 0) return true;
      if (c.t === "with") return TL(a).room === TL(b).room;
      if (c.dir === "N") return TL(a).y < TL(b).y;
      if (c.dir === "S") return TL(a).y > TL(b).y;
      if (c.dir === "E") return TL(a).x > TL(b).x;
      return TL(a).x < TL(b).x;
    };
    let n = 0;
    (function go(k) {
      if (n > 1) return;
      if (k === N) {
        for (const c of posts) {
          if (c.t === "alone") { const r = TL(asg[c.s]).room; for (let i = 0; i < N; i++) if (i !== c.s && TL(asg[i]).room === r) return; }
          else for (let i = 0; i < N; i++) { if (i === c.s) continue; const on = c.k === "window" ? ctx.windowFront.has(asg[i]) : !!(ctx.occ[c.k] && ctx.occ[c.k].has(asg[i])); if (on) return; }
        }
        n++; return;
      }
      const s = order[k];
      for (const tile of cand[s]) {
        const t = TL(tile);
        if (usedT.has(tile) || usedR.has(t.y) || usedC.has(t.x)) continue;
        asg[s] = tile; let ok = true;
        for (const c of bins) if ((c.s === s || c.o === s) && !binOK(c)) { ok = false; break; }
        if (ok) { usedT.add(tile); usedR.add(t.y); usedC.add(t.x); go(k + 1); usedT.delete(tile); usedR.delete(t.y); usedC.delete(t.x); }
        asg[s] = -1;
        if (n > 1) return;
      }
    })(0);
    return { n };
  }

  function pickCrimePositions(map, ctx, NS, rng) {
    const rooms = map.rooms;
    const descFirst = (arr) => shuffle(arr, rng).sort((a, b) => (ctx.describable.has(b) ? 1 : 0) - (ctx.describable.has(a) ? 1 : 0));
    const big = []; for (let i = 0; i < rooms.length; i++) if (rooms[i].w >= 2 && rooms[i].h >= 2) big.push(i);
    if (!big.length) return null;
    const cr = big[Math.floor(rng() * big.length)];
    const crCells = descFirst(ctx.roomCells.filter((t) => ctx.tiles[t].room === cr));
    let vc = -1, cc = -1;
    outer: for (let i = 0; i < crCells.length; i++) for (let j = i + 1; j < crCells.length; j++) { const A = ctx.tiles[crCells[i]], B = ctx.tiles[crCells[j]]; if (A.y !== B.y && A.x !== B.x) { vc = crCells[i]; cc = crCells[j]; break outer; } }
    if (cc < 0) return null;
    const rows = new Set([ctx.tiles[vc].y, ctx.tiles[cc].y]), cols = new Set([ctx.tiles[vc].x, ctx.tiles[cc].x]), four = [];
    for (const t of descFirst(ctx.roomCells.filter((t) => ctx.tiles[t].room !== cr))) { const T = ctx.tiles[t]; if (rows.has(T.y) || cols.has(T.x)) continue; rows.add(T.y); cols.add(T.x); four.push(t); if (four.length === NS - 1) break; }
    if (four.length < NS - 1) return null;
    const culprit = Math.floor(rng() * NS), positions = new Array(NS + 1);
    positions[culprit] = cc; let fi = 0;
    for (let s = 0; s < NS; s++) if (s !== culprit) positions[s] = four[fi++];
    positions[NS] = vc;
    return { positions, culprit };
  }
  function pickAnyRook(ctx, M, rng) {
    const pool = shuffle(ctx.roomCells, rng), chosen = [], rows = new Set(), cols = new Set();
    for (const t of pool) { const T = ctx.tiles[t]; if (rows.has(T.y) || cols.has(T.x)) continue; chosen.push(t); rows.add(T.y); cols.add(T.x); if (chosen.length === M) return chosen; }
    return null;
  }

  // Candidate clues in the book's vocabulary (see clueEn/cluePt). Only for the
  // suspects — the victim is the leftover cell. arow/acol are only ever the four
  // grid extremes ("linha de cima/baixo", "coluna mais à esquerda/direita").
  function candidateClues(truth, map, ctx, NS, M, rng) {
    const flavour = [], pinRoom = [], P = (i) => ctx.tiles[truth[i]], N = map.N;
    const roomOcc = {}; for (let i = 0; i < M; i++) (roomOcc[P(i).room] = roomOcc[P(i).room] || []).push(i);
    const kindCount = {}; for (let i = 0; i < M; i++) { const k = P(i).occ; if (k) kindCount[k] = (kindCount[k] || 0) + 1; if (ctx.windowFront.has(truth[i])) kindCount.window = (kindCount.window || 0) + 1; }
    for (let s = 0; s < NS; s++) {
      const tile = truth[s], t = ctx.tiles[tile];
      for (const k in ctx.beside) if (ctx.beside[k].has(tile)) flavour.push({ t: "beside", s, k });
      if (t.occ) { flavour.push({ t: "occ", s, k: t.occ }); if (kindCount[t.occ] === 1) flavour.push({ t: "only", s, k: t.occ }); }
      if (ctx.windowFront.has(tile)) { flavour.push({ t: "window", s }); if (kindCount.window === 1) flavour.push({ t: "only", s, k: "window" }); }
      if (roomOcc[t.room].length === 1) flavour.push({ t: "alone", s });
      const comps = [];
      for (let o = 0; o < NS; o++) { if (o === s) continue; comps.push({ t: "comp", s, o, dir: t.y < P(o).y ? "N" : "S" }); comps.push({ t: "comp", s, o, dir: t.x > P(o).x ? "E" : "W" }); }
      shuffle(comps, rng).slice(0, 3).forEach((c) => flavour.push(c));
      for (let o = s + 1; o < NS; o++) if (P(o).room === t.room) flavour.push({ t: "with", s, o });
      if (t.y === 1) flavour.push({ t: "arow", s, v: 1 });
      if (t.y === N) flavour.push({ t: "arow", s, v: N });
      if (t.x === 1) flavour.push({ t: "acol", s, v: 1 });
      if (t.x === N) flavour.push({ t: "acol", s, v: N });
      pinRoom.push({ t: "inroom", s, z: t.room });
    }
    return { flavour, pinRoom };
  }

  const TT_PT = ["A Morte de", "O Fim de", "O Adeus a", "A Última Noite de", "O Enigma de", "O Silêncio de", "O Segredo de"];
  const TT_EN = ["The Death of", "The End of", "Farewell to", "A Last Night for", "The Riddle of", "The Silence of", "The Secret of"];
  const CRIMES = ["a priceless heirloom had vanished", "a threatening note lay on the floor", "a safe was found wide open", "the drawers had been ransacked", "a wine glass lay shattered"];
  const CRIMESPT = ["desaparecera uma relíquia valiosíssima", "havia um bilhete ameaçador no chão", "um cofre foi encontrado escancarado", "as gavetas tinham sido reviradas", "um copo de vinho apareceu partido"];

  function generateCase(num) {
    num = Math.max(0, num | 0);
    const ch = Math.floor(num / CPC), m = num % CPC;
    const chapter = CHAPTERS[ch % CHAPTERS.length];
    const N = Math.min(6 + ch, 8), NS = N - 1;         // people incl. victim / suspects
    const t = CPC > 1 ? m / (CPC - 1) : 0;
    const difficulty = (ch + 1) + Math.round(t * 9) / 10;
    const easy = t < 0.34, hard = t > 0.6;
    const rng = mulberry32(((num + 1) * 2654435761) >>> 0);

    // story cast: sliding window over the chapter roster
    const roster = buildRoster(chapter), win = [];
    for (let i = 0; i < N; i++) win.push(roster[(m + i) % roster.length]);
    let mc = 0, fc = 0;
    const mk = (e, isV) => ({ name: e.name, g: e.g, color: e.g === "f" ? FEM[fc++ % FEM.length] : MASC[mc++ % MASC.length], isVictim: !!isV });
    const suspects = win.slice(1).map((e) => mk(e, false));
    const victim = mk(win[0], true);
    const people = suspects.concat([victim]);

    // build a solvable map with a unique clue set
    let map = null, ctx = null, place = null, pools = null;
    for (let a = 0; a < 80 && !place; a++) {
      const mp = makeMap(N, rng, chapter), cx = context(mp), p = pickCrimePositions(mp, cx, NS, rng);
      if (!p) continue;
      const cc = candidateClues(p.positions, mp, cx, NS, N, rng);
      if (count(cc.flavour.concat(cc.pinRoom), cx, N).n === 1) { map = mp; ctx = cx; place = p; pools = cc; }
    }
    if (!place) {
      map = makeMap(N, rng, chapter); ctx = context(map);
      place = pickCrimePositions(map, ctx, NS, rng) || { positions: pickAnyRook(ctx, N, rng) || ctx.roomCells.slice(0, N), culprit: 0 };
      pools = candidateClues(place.positions, map, ctx, NS, N, rng);
      for (let s = 0; s < NS; s++) { const tt = ctx.tiles[place.positions[s]]; pools.pinRoom.push({ t: "arow", s, v: tt.y }, { t: "acol", s, v: tt.x }); }
    }
    const truth = place.positions;

    // difficulty-biased minimisation: hard cases keep the indirect clues and
    // shed the easy ones; easy cases do the reverse and keep ≥2 clues each.
    const EASY = new Set(["beside", "inroom", "occ", "window"]);
    const arr = shuffle(pools.flavour, rng).concat(shuffle(pools.pinRoom, rng));
    const removalOrder = arr.map((_, i) => i);
    removalOrder.sort((i, j) => { const ei = EASY.has(arr[i].t) ? 1 : 0, ej = EASY.has(arr[j].t) ? 1 : 0; return hard ? ej - ei : easy ? ei - ej : 0; });
    const removed = new Set();
    for (const i of removalOrder) {
      const c = arr[i], test = arr.filter((_, k) => k !== i && !removed.has(k));
      if (!test.some((q) => q.s === c.s)) continue;      // every suspect keeps ≥1 clue
      if (count(test, ctx, N).n === 1) removed.add(i);
    }
    let givens = arr.filter((_, k) => !removed.has(k));
    if (easy) for (let s = 0; s < NS; s++) {
      let c = givens.filter((g) => g.s === s).length;
      if (c >= 2) continue;
      for (const i of removalOrder) { if (!removed.has(i)) continue; const cl = arr[i]; if (cl.s !== s || !EASY.has(cl.t)) continue; givens.push(cl); removed.delete(i); if (++c >= 2) break; }
    }

    // suspect cards (book style): room sentence first, the rest joined with "e"
    const frag = L === "pt" ? cluePt : clueEn, rooms = map.rooms;
    const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1) + ".";
    const cards = [];
    for (let s = 0; s < NS; s++) {
      const mine = givens.filter((c) => c.s === s);
      const roomF = mine.filter((c) => c.t === "inroom").map((c) => frag(c, people[s], people, rooms));
      const restF = mine.filter((c) => c.t !== "inroom").map((c) => frag(c, people[s], people, rooms));
      const sents = [];
      if (roomF.length) sents.push(cap(roomF.join(L === "pt" ? " e " : " and ")));
      if (restF.length) sents.push(cap(restF.join(L === "pt" ? " e " : " and ")));
      cards.push({ s, text: sents.join(" ") });
    }
    const vAlt = rng() < 0.5;
    cards.push({ s: NS, victim: true, text: L === "pt"
      ? (vAlt ? "Estava na **última célula restante**." : `Estava sozinh${victim.g === "f" ? "a" : "o"} com o **assassino**.`)
      : (vAlt ? "Was in the **last remaining cell**." : "Was alone with the **killer**.") });

    const ci = Math.floor(rng() * CRIMES.length);
    const brief = L === "pt"
      ? `${chapter.titlePt} — ${CRIMESPT[ci]}, e ${victim.name} foi encontrad${victim.g === "f" ? "a" : "o"} sem vida. Cada linha e cada coluna têm exactamente uma pessoa. Coloca os ${NS} suspeitos pelas pistas; a vítima está na última célula restante, e quem ficou sozinho com ela é o culpado.`
      : `${chapter.titleEn} — ${CRIMES[ci]}, and ${victim.name} was found dead. Every row and every column holds exactly one person. Place the ${NS} suspects from the clues; the victim lies in the last remaining cell, and whoever is alone with them is the culprit.`;

    return {
      num, chapter: ch, caseInChapter: m, difficulty,
      chapterTitle: L === "pt" ? chapter.titlePt : chapter.titleEn,
      N, suspectCount: NS, victimIdx: NS, culprit: place.culprit,
      W: map.W, H: map.H, TS: map.TS, tiles: map.tiles, rooms, walkable: ctx.walk, windows: map.windows, beds: map.beds, lang: L,
      suspects: people,
      title: (L === "pt" ? TT_PT : TT_EN)[m % 7] + " " + victim.name,
      brief, clues: cards, solution: truth,
    };
  }

  // clue FRAGMENTS in the book's voice, key word bolded like the cards
  const DIR_EN = { N: "north", S: "south", E: "east", W: "west" };
  const DIR_PT = { N: "norte", S: "sul", E: "leste", W: "oeste" };
  function clueEn(c, p, S, R) {
    if (c.t === "inroom") return `was in the **${R[c.z].name}**`;
    if (c.t === "negroom") return `was not in the **${R[c.z].name}**`;
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
  function cluePt(c, p, S, R) {
    const g = p.g === "f" ? "a" : "o", art = (i) => S[i].g === "f" ? "da" : "do";
    if (c.t === "inroom") return `estava ${EM[R[c.z].art]} **${R[c.z].pt}**`;
    if (c.t === "negroom") return `não estava ${EM[R[c.z].art]} **${R[c.z].pt}**`;
    if (c.t === "beside") return `estava **ao lado** ${FIXPT[c.k]}`;
    if (c.t === "occ") return c.k === "chair" ? `estava sentad${g} numa **cadeira**` : c.k === "bed" ? "estava numa **cama**" : "estava em cima de um **tapete**";
    if (c.t === "window") return "estava **em frente** à janela";
    if (c.t === "comp") return `estava a **${DIR_PT[c.dir]}** ${art(c.o)} ${S[c.o].name}`;
    if (c.t === "with") return `estava **com** ${S[c.o].g === "f" ? "a" : "o"} ${S[c.o].name}`;
    if (c.t === "alone") return `estava **sozinh${g}**`;
    if (c.t === "only") return c.k === "window" ? "era a única pessoa **em frente** à janela" : c.k === "chair" ? "era a única pessoa sentada numa **cadeira**" : c.k === "bed" ? "era a única pessoa numa **cama**" : "era a única pessoa em cima de um **tapete**";
    if (c.t === "arow") return c.v === 1 ? "estava na **linha de cima**" : "estava na **linha de baixo**";
    if (c.t === "acol") return c.v === 1 ? "estava na **coluna mais à esquerda**" : "estava na **coluna mais à direita**";
    return "";
  }

  const caseMeta = (num) => {
    num = Math.max(0, num | 0);
    const ch = Math.floor(num / CPC), m = num % CPC, tt = CPC > 1 ? m / (CPC - 1) : 0;
    const chapter = CHAPTERS[ch % CHAPTERS.length], roster = buildRoster(chapter), victim = roster[m % roster.length];
    return { chapter: ch, m, difficulty: (ch + 1) + Math.round(tt * 9) / 10, title: (L === "pt" ? TT_PT : TT_EN)[m % 7] + " " + victim.name };
  };
  const chapterInfo = (ch) => { const c = CHAPTERS[ch % CHAPTERS.length]; return { key: c.key, titleEn: c.titleEn, titlePt: c.titlePt }; };

  const API = { generateCase, caseMeta, chapterInfo, CASES_PER_CHAPTER: CPC, CHAPTERS_DEFINED: CHAPTERS.length, lang: L, _count: count };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.MURDOKU = API;
})(typeof window !== "undefined" ? window : globalThis);
