/* Murdoku — case engine (pure, no DOM). Murder + Sudoku.
   Floor plan of named rooms (varied sizes). Walls are thin lines on tile edges.
   Rules: every suspect stood on one floor tile; no two share a row or a column
   (placing one rules out its row + column). Furniture is blocked; the bench is
   occupiable. Suspects are shown in alphabetical order; avatars match each name's
   gender. Text is EN or PT-PT (pre-1990 spelling) via localStorage "nftw:lang".
   Cases seeded by number; clue sets minimised to one solution. Browser + Node. */
(function (global) {
  "use strict";
  const L = (typeof localStorage !== "undefined" && localStorage.getItem("nftw:lang") === "pt") ? "pt" : "en";

  // Suspects are always named A, B, C … in order; the victim's name starts with V.
  const ALPHA = [
    { name: "Alice", color: "#e05a4a", g: "f" }, { name: "Benjamin", color: "#6c8cff", g: "m" },
    { name: "Charlotte", color: "#e8c84a", g: "f" }, { name: "Daniel", color: "#d98cc0", g: "m" },
    { name: "Eleanor", color: "#5bc8e8", g: "f" }, { name: "Frederick", color: "#5bd6a0", g: "m" },
    { name: "Grace", color: "#b18cff", g: "f" }, { name: "Harold", color: "#ff8a3d", g: "m" },
    { name: "Isabelle", color: "#4db6ac", g: "f" }, { name: "Jacob", color: "#f06292", g: "m" },
    { name: "Katherine", color: "#9ccc65", g: "f" }, { name: "Louis", color: "#a1887f", g: "m" },
  ];
  const VICTIMS = [
    { name: "Victor", g: "m" }, { name: "Vivian", g: "f" }, { name: "Vincent", g: "m" },
    { name: "Vera", g: "f" }, { name: "Violet", g: "f" },
  ];
  const FIX = {
    crate: "the crates", banner: "the promo stand", cheese: "the deli counter",
    flowers: "the flowers", plant: "the potted plant", apples: "the apples",
    coffee: "the coffee machine", bread: "the fresh bread", desk: "the desk",
    safe: "the safe", till: "the tills", tv: "the TV", bench: "the bench",
  };
  const FIXPT = {
    crate: { art: "os", noun: "caixotes" }, banner: { art: "o", noun: "expositor promocional" },
    cheese: { art: "o", noun: "balcão da charcutaria" }, flowers: { art: "as", noun: "flores" },
    plant: { art: "a", noun: "planta em vaso" }, apples: { art: "as", noun: "maçãs" },
    coffee: { art: "a", noun: "máquina de café" }, bread: { art: "o", noun: "pão fresco" },
    desk: { art: "a", noun: "secretária" }, safe: { art: "o", noun: "cofre" },
    till: { art: "as", noun: "caixas registadoras" }, tv: { art: "a", noun: "televisão" }, bench: { art: "o", noun: "banco" },
  };
  const DE = { o: "do", a: "da", os: "dos", as: "das" };
  const EM = { o: "no", a: "na", os: "nos", as: "nas" };

  // ---- floor plan (rooms tile the interior; every tile belongs to a named room) ----
  const W = 12, H = 12, TS = 32;   // 32px tiles ⇒ room for detailed, legible object art
  const idx = (x, y) => y * W + x;
  const ROOMS = [
    { name: "Storage Room", pt: "Armazém", art: "o", color: "grey", x: 1, y: 1, w: 3, h: 3 },
    { name: "Promotional Area", pt: "Área Promocional", art: "a", color: "green", x: 4, y: 1, w: 4, h: 2 },
    { name: "Deli Counter", pt: "Charcutaria", art: "a", color: "yellow", x: 8, y: 1, w: 3, h: 4 },
    { name: "Produce Section", pt: "Secção de Frescos", art: "a", color: "green", x: 4, y: 3, w: 4, h: 3 },
    { name: "Flower Stand", pt: "Banca das Flores", art: "a", color: "green", x: 1, y: 4, w: 3, h: 3 },
    { name: "Office", pt: "Escritório", art: "o", color: "grey", x: 4, y: 6, w: 4, h: 3 },
    { name: "Staff Room", pt: "Sala do Pessoal", art: "a", color: "grey", x: 1, y: 7, w: 3, h: 2 },
    { name: "Bakery", pt: "Padaria", art: "a", color: "yellow", x: 1, y: 9, w: 3, h: 2 },
    { name: "Loading Bay", pt: "Cais de Carga", art: "o", color: "grey", x: 4, y: 9, w: 4, h: 2 },
    { name: "Checkout", pt: "Caixas", art: "as", color: "yellow", x: 8, y: 6, w: 3, h: 5 },
  ];
  const FURN = [
    ["crate", 1, 1], ["crate", 3, 3], ["tv", 4, 1], ["banner", 6, 1],
    ["cheese", 8, 1], ["cheese", 9, 1], ["cheese", 10, 1],
    ["apples", 5, 3], ["apples", 6, 3], ["flowers", 1, 4], ["plant", 3, 6],
    ["desk", 4, 6], ["safe", 6, 8], ["coffee", 1, 7],
    ["bread", 1, 9], ["bread", 3, 10], ["crate", 5, 9], ["crate", 7, 10],
    ["till", 8, 6], ["till", 9, 6], ["till", 10, 6],
  ];
  const BENCH = [[2, 8], [3, 8]];                 // 2-tile bench in the Staff Room (occupiable)
  const RUGS = [[5, 7]];                          // rug in the Office (occupiable)
  const VOID = [[8, 5], [9, 5], [10, 5]];
  const WINDOWS = [[5, 1, "T"], [9, 1, "T"], [10, 7, "R"], [10, 9, "R"], [1, 5, "L"], [1, 10, "L"]];

  function buildMap() {
    const roomAt = (x, y) => ROOMS.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    const furnAt = {}; FURN.forEach(([k, x, y]) => (furnAt[idx(x, y)] = k));
    const benchSet = new Set(BENCH.map(([x, y]) => idx(x, y)));
    const rugSet = new Set(RUGS.map(([x, y]) => idx(x, y)));
    const voidSet = new Set(VOID.map(([x, y]) => idx(x, y)));
    const tiles = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y);
      const interior = x >= 1 && x <= W - 2 && y >= 1 && y <= H - 2 && !voidSet.has(i);
      let type = "void", room = -1;
      if (interior) { room = roomAt(x, y); type = furnAt[i] ? "furn" : (benchSet.has(i) ? "bench" : (rugSet.has(i) ? "rug" : "floor")); }
      tiles[i] = { x, y, room, type, fixture: furnAt[i] || null, walkable: (type === "floor" || type === "bench" || type === "rug") };
    }
    // room label anchored to the bottom-centre of each room so it doesn't cover objects
    ROOMS.forEach((r) => (r.label = { x: r.x + (r.w - 1) / 2, y: r.y + r.h - 1 }));
    return tiles;
  }

  function context(tiles) {
    const walk = [], roomCells = [];
    for (const t of tiles) if (t.walkable) { walk.push(idx(t.x, t.y)); if (t.room >= 0) roomCells.push(idx(t.x, t.y)); }
    const beside = {};                              // "ao lado" = orthogonally adjacent, SAME division only
    for (const t of tiles) if (t.fixture) {
      const s = beside[t.fixture] || (beside[t.fixture] = new Set());
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = t.x + dx, ny = t.y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
        const n = tiles[idx(nx, ny)];
        if (n.walkable && n.room === t.room) s.add(idx(nx, ny));
      });
    }
    const benchSet = new Set(BENCH.map(([x, y]) => idx(x, y)));
    const rugSet = new Set(RUGS.map(([x, y]) => idx(x, y)));
    const windowFront = new Set();                  // walkable cells that sit against a window
    for (const w of WINDOWS) { const i = idx(w[0], w[1]); if (tiles[i] && tiles[i].walkable) windowFront.add(i); }
    // cells describable by an authentic clue (beside object / occupiable / window)
    const describable = new Set();
    for (const k in beside) beside[k].forEach((t) => describable.add(t));
    benchSet.forEach((t) => describable.add(t)); rugSet.forEach((t) => describable.add(t)); windowFront.forEach((t) => describable.add(t));
    return { tiles, walk, roomCells, beside, benchSet, rugSet, windowFront, describable };
  }

  const rowPh = { 2: ["at the back of", "at the front of"], 3: ["at the back of", "in the middle of", "at the front of"], 4: ["at the very back of", "towards the back of", "towards the front of", "at the very front of"], 5: ["at the very back of", "near the back of", "in the middle of", "near the front of", "at the very front of"] };
  const colPh = { 2: ["on the left of", "on the right of"], 3: ["on the left of", "in the centre of", "on the right of"], 4: ["on the far left of", "left of centre in", "right of centre in", "on the far right of"] };
  const rowPt = { 2: ["ao fundo", "à frente"], 3: ["ao fundo", "no meio", "à frente"], 4: ["mesmo ao fundo", "mais atrás", "mais à frente", "mesmo à frente"], 5: ["mesmo ao fundo", "mais atrás", "no meio", "mais à frente", "mesmo à frente"] };
  const colPt = { 2: ["do lado esquerdo", "do lado direito"], 3: ["do lado esquerdo", "no centro", "do lado direito"], 4: ["na extrema esquerda", "à esquerda", "à direita", "na extrema direita"] };

  function holds(c, tile, ctx) {
    const T = ctx.tiles[tile], R = ROOMS[T.room];
    if (c.t === "inroom") return T.room === c.z;
    if (c.t === "negroom") return T.room !== c.z;
    if (c.t === "beside") return ctx.beside[c.k] && ctx.beside[c.k].has(tile);
    if (c.t === "bench") return ctx.benchSet.has(tile);
    if (c.t === "rug") return ctx.rugSet.has(tile);
    if (c.t === "window") return ctx.windowFront.has(tile);
    if (c.t === "row") return T.room === c.z && (T.y - R.y) === c.v;
    if (c.t === "col") return T.room === c.z && (T.x - R.x) === c.v;
    return true;
  }

  function count(clues, ctx, N) {
    const cand = [];
    for (let s = 0; s < N; s++) {
      const list = ctx.walk.filter((tile) => clues.every((c) => c.s !== s || holds(c, tile, ctx)));
      if (!list.length) return { n: 0 };
      cand.push(list);
    }
    const order = Array.from({ length: N }, (_, s) => s).sort((a, b) => cand[a].length - cand[b].length);
    const usedR = new Set(), usedC = new Set(), usedT = new Set();
    let n = 0;
    (function go(k) {
      if (n > 1) return;
      if (k === N) { n++; return; }
      const s = order[k];
      for (const tile of cand[s]) {
        const T = ctx.tiles[tile];
        if (usedT.has(tile) || usedR.has(T.y) || usedC.has(T.x)) continue;
        usedT.add(tile); usedR.add(T.y); usedC.add(T.x);
        go(k + 1);
        usedT.delete(tile); usedR.delete(T.y); usedC.delete(T.x);
        if (n > 1) return;
      }
    })(0);
    return { n };
  }

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const shuffle = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Place the victim + exactly one suspect (the culprit) together in a room, and
  // the other suspects in OTHER rooms — all on distinct rows & columns (rook rule).
  function pickCrimePositions(ctx, NS, rng) {
    // prefer object-describable cells so authentic clues can pin them (position clues stay rare)
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
    positions[NS] = vc; // victim is the last entity
    return { positions, culprit };
  }
  function pickAnyRook(ctx, M, rng) {
    const pool = shuffle(ctx.roomCells, rng), chosen = [], rows = new Set(), cols = new Set();
    for (const t of pool) { const T = ctx.tiles[t]; if (rows.has(T.y) || cols.has(T.x)) continue; chosen.push(t); rows.add(T.y); cols.add(T.x); if (chosen.length === M) return chosen; }
    return null;
  }

  // Authentic Murdoku clues (object-relative / occupiable / window / room) are
  // "flavour" and kept; the position-in-room clues are a last-resort fallback so
  // they only appear when the object clues can't pin the cell on their own.
  function candidateClues(truth, ctx, N) {
    const flavour = [], pinRoom = [], pinPos = [];
    for (let s = 0; s < N; s++) {
      const tile = truth[s], T = ctx.tiles[tile], R = ROOMS[T.room];
      for (const k in ctx.beside) if (ctx.beside[k].has(tile)) flavour.push({ t: "beside", s, k });
      if (ctx.benchSet.has(tile)) flavour.push({ t: "bench", s });
      if (ctx.rugSet.has(tile)) flavour.push({ t: "rug", s });
      if (ctx.windowFront.has(tile)) flavour.push({ t: "window", s });
      pinRoom.push({ t: "inroom", s, z: T.room });
      if (rowPh[R.h]) pinPos.push({ t: "row", s, z: T.room, v: T.y - R.y });
      if (colPh[R.w]) pinPos.push({ t: "col", s, z: T.room, v: T.x - R.x });
    }
    return { flavour, pinRoom, pinPos };
  }

  const TITLES = ["The Purchase No One Made", "A Scandal in Aisle Three", "The Vanishing Trolley", "Whodunit at Closing Time", "The Missing Receipt", "Trouble at the Deli", "The Five O'Clock Alibi", "The Spilled Secret"];
  const TITLESPT = ["A Compra Que Ninguém Fez", "Um Escândalo no Corredor Três", "O Carrinho Desaparecido", "Mistério à Hora de Fecho", "O Recibo Desaparecido", "Problemas na Charcutaria", "O Álibi das Cinco", "O Segredo Revelado"];
  const CRIMES = ["a priceless bottle of wine vanished from the shelves", "the till came up short by a small fortune", "a threatening note was left for the manager", "the prize hamper was swapped for a fake", "someone tampered with the freezer"];
  const CRIMESPT = ["desapareceu uma garrafa de vinho valiosíssima das prateleiras", "a caixa ficou a faltar uma pequena fortuna", "foi deixado um bilhete ameaçador ao gerente", "o cabaz do prémio foi trocado por um falso", "alguém mexeu no congelador"];

  function generateCase(num) {
    const rng = mulberry32(((num + 1) * 2654435761) >>> 0);
    const tiles = buildMap();
    const ctx = context(tiles);
    const NS = 5; // suspects (alphabetical, always the same A–E roster)
    const suspects = ALPHA.slice(0, NS).map((s) => ({ name: s.name, color: s.color, g: s.g }));
    const v = VICTIMS[Math.floor(rng() * VICTIMS.length)];
    const victim = { name: v.name, color: "#9aa0a8", g: v.g, isVictim: true };
    const people = suspects.concat([victim]);   // index NS = victim
    const M = people.length;                     // 6 placeable people
    let place = null;
    for (let a = 0; a < 300 && !place; a++) place = pickCrimePositions(ctx, NS, rng);
    if (!place) place = { positions: pickAnyRook(ctx, M, rng) || ctx.roomCells.slice(0, M), culprit: 0 };
    const truth = place.positions;
    const { flavour, pinRoom, pinPos } = candidateClues(truth, ctx, M);
    let givens = shuffle(flavour, rng).concat(shuffle(pinRoom, rng)).concat(shuffle(pinPos, rng));
    for (let i = givens.length - 1; i >= 0; i--) {
      const test = givens.slice(0, i).concat(givens.slice(i + 1));
      if (count(test, ctx, M).n === 1) givens = test;
    }
    const ci = Math.floor(rng() * CRIMES.length);
    const brief = L === "pt"
      ? `Hora de fecho, e ${CRIMESPT[ci]}. ${victim.name} foi encontrad${victim.g === "f" ? "a" : "o"} sem vida. Estavam ${NS} pessoas lá dentro — e não havia duas na mesma linha ou coluna. Descobre onde estava cada uma; o culpado é quem ficou sozinho com a vítima.`
      : `Closing time, and ${CRIMES[ci]}. ${victim.name} was found dead. ${NS} people were still inside — and no two shared a row or column. Work out where everyone stood; the culprit is whoever was alone with the victim.`;
    return {
      num, N: M, suspectCount: NS, victimIdx: NS, culprit: place.culprit,
      W, H, TS, tiles, rooms: ROOMS, walkable: ctx.walk, windows: WINDOWS, lang: L,
      suspects: people,
      title: (L === "pt" ? TITLESPT : TITLES)[num % TITLES.length],
      brief,
      clues: shuffle(givens, rng).map((c) => (L === "pt" ? clueTextPt : clueText)(c, people)),
      solution: truth,
    };
  }

  function clueText(c, S) {
    const nm = (i) => S[i].name, rn = (z) => ROOMS[z].name, R = (z) => ROOMS[z];
    if (c.t === "inroom") return pick([`${nm(c.s)} was in the ${rn(c.z)}.`, `${nm(c.s)} spent closing in the ${rn(c.z)}.`], c);
    if (c.t === "negroom") return `${nm(c.s)} was never near the ${rn(c.z)}.`;
    if (c.t === "beside") return pick([`${nm(c.s)} was right beside ${FIX[c.k]}.`, `${nm(c.s)} was next to ${FIX[c.k]}.`], c);
    if (c.t === "bench") return `${nm(c.s)} was sitting on the bench.`;
    if (c.t === "rug") return `${nm(c.s)} was standing on the rug.`;
    if (c.t === "window") return `${nm(c.s)} was standing in front of a window.`;
    if (c.t === "row") return `${nm(c.s)} was ${rowPh[R(c.z).h][c.v]} the ${rn(c.z)}.`;
    if (c.t === "col") return `${nm(c.s)} was ${colPh[R(c.z).w][c.v]} the ${rn(c.z)}.`;
    return "";
  }
  function clueTextPt(c, S) {
    const nm = (i) => S[i].name, R = (z) => ROOMS[z], rn = (z) => ROOMS[z].pt, de = (z) => DE[ROOMS[z].art], em = (z) => EM[ROOMS[z].art];
    if (c.t === "inroom") return pick([`${nm(c.s)} estava ${em(c.z)} ${rn(c.z)}.`, `${nm(c.s)} passou o fecho ${em(c.z)} ${rn(c.z)}.`], c);
    if (c.t === "negroom") return `${nm(c.s)} nunca esteve perto ${de(c.z)} ${rn(c.z)}.`;
    if (c.t === "beside") { const f = FIXPT[c.k]; return `${nm(c.s)} estava ao lado ${DE[f.art]} ${f.noun}.`; }
    if (c.t === "bench") return `${nm(c.s)} estava sentad${S[c.s].g === "f" ? "a" : "o"} no banco.`;
    if (c.t === "rug") return `${nm(c.s)} estava em cima do tapete.`;
    if (c.t === "window") return `${nm(c.s)} estava em frente a uma janela.`;
    if (c.t === "row") return `${nm(c.s)} estava ${rowPt[R(c.z).h][c.v]} ${de(c.z)} ${rn(c.z)}.`;
    if (c.t === "col") return `${nm(c.s)} estava ${colPt[R(c.z).w][c.v]} ${de(c.z)} ${rn(c.z)}.`;
    return "";
  }
  const pick = (arr, c) => arr[((c.s || 0) + (c.z || 0) + (c.v || 0) + (c.k ? c.k.length : 0)) % arr.length];

  const API = { generateCase, ALPHA, VICTIMS, FIX, ROOMS, W, H, TS, _count: count, _buildMap: buildMap, _context: context };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.MURDOKU = API;
})(typeof window !== "undefined" ? window : globalThis);
