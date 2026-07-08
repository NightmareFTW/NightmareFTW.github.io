/* Murdoku — case engine (pure, no DOM). Murder + Sudoku.
   The store is an IRREGULAR floor plan: rooms of varied sizes joined by aisles,
   with walls, furniture (blocked) and a bench (2 cells, one is occupiable).
   Rules: every suspect stood on exactly one floor tile; no two share a row or a
   column (placing one rules out its whole row + column). From spatial clues you
   deduce each person's exact tile. Each case is seeded by its number and its
   clue set is minimised to exactly one solution. Runs in browser and Node. */
(function (global) {
  "use strict";

  const SUSPECTS = [
    { name: "Benjamin", color: "#e05a4a" }, { name: "Charlotte", color: "#6c8cff" },
    { name: "Daniel", color: "#e8c84a" }, { name: "Eleanor", color: "#d98cc0" },
    { name: "Frederick", color: "#5bc8e8" }, { name: "Grace", color: "#5bd6a0" },
    { name: "Harold", color: "#b18cff" }, { name: "Isabelle", color: "#ff8a3d" },
    { name: "Marcus", color: "#4db6ac" }, { name: "Priya", color: "#f06292" },
    { name: "Sofia", color: "#9ccc65" }, { name: "Theodore", color: "#a1887f" },
  ];
  const FIX = {
    crate: "the crates", banner: "the promo stand", cheese: "the deli counter",
    flowers: "the flowers", plant: "the potted plant", apples: "the apples",
    coffee: "the coffee machine", bread: "the fresh bread", desk: "the desk",
    safe: "the safe", till: "the tills", tv: "the TV", bench: "the bench",
  };

  // ---- irregular floor plan (varied room sizes) ----
  const W = 12, H = 12, TS = 16;
  const ROOMS = [
    { name: "Storage Room", color: "grey", x: 1, y: 1, w: 3, h: 2 },
    { name: "Promotional Area", color: "green", x: 5, y: 1, w: 3, h: 2 },
    { name: "Deli Counter", color: "yellow", x: 9, y: 1, w: 2, h: 3 },
    { name: "Flower Stand", color: "green", x: 1, y: 4, w: 2, h: 3 },
    { name: "Produce Section", color: "green", x: 4, y: 4, w: 4, h: 2 },
    { name: "Staff Room", color: "grey", x: 9, y: 5, w: 2, h: 2 },
    { name: "Bakery", color: "yellow", x: 1, y: 8, w: 3, h: 3 },
    { name: "Office", color: "grey", x: 5, y: 8, w: 2, h: 3 },
    { name: "Checkout", color: "yellow", x: 8, y: 8, w: 3, h: 2 },
  ];
  const FURN = [
    ["crate", 1, 1], ["crate", 3, 1], ["banner", 6, 1], ["tv", 5, 2],
    ["cheese", 9, 1], ["cheese", 10, 1], ["cheese", 9, 2],
    ["flowers", 1, 4], ["plant", 2, 6], ["apples", 5, 4], ["apples", 6, 4],
    ["coffee", 9, 5], ["bread", 1, 8], ["bread", 3, 8], ["desk", 5, 8], ["safe", 6, 10],
    ["till", 8, 8], ["till", 9, 8], ["till", 10, 8],
  ];
  const BENCH = [[9, 6], [10, 6]]; // 2-tile bench inside Staff Room; occupiable
  // some perimeter walls are windows (optional per map — here to show the style)
  const WINDOWS = [[2, 0], [6, 0], [11, 2], [11, 3], [0, 5], [0, 9]];
  // aisles connect the rooms; footprint = rooms ∪ aisles ⇒ walls hug an irregular outline
  const inAisle = (x, y) =>
    (x === 4 && y >= 1 && y <= 10) || (x === 8 && y >= 1 && y <= 10) ||
    (y === 3 && x >= 1 && x <= 10) || (y === 7 && x >= 1 && x <= 10);
  const idx = (x, y) => y * W + x;

  function buildMap() {
    const roomAt = (x, y) => ROOMS.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    const furnAt = {}; FURN.forEach(([k, x, y]) => (furnAt[idx(x, y)] = k));
    const benchSet = new Set(BENCH.map(([x, y]) => idx(x, y)));
    const foot = (x, y) => (roomAt(x, y) >= 0 || inAisle(x, y));
    const tiles = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y), rm = roomAt(x, y);
      let type = "void";
      if (foot(x, y)) {
        if (furnAt[i]) type = "furn";
        else if (benchSet.has(i)) type = "bench";
        else type = "floor";
      }
      tiles[i] = { x, y, room: rm, type, fixture: furnAt[i] || null,
        walkable: (type === "floor" || type === "bench") };
    }
    // walls: non-footprint tiles touching the footprint (8-dir) ⇒ irregular shell
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = tiles[idx(x, y)]; if (t.type !== "void") continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (tiles[idx(nx, ny)].type !== "void" && tiles[idx(nx, ny)].type !== "wall") { near = true; break; }
      }
      if (near) t.type = "wall";
    }
    for (const [x, y] of WINDOWS) { const t = tiles[idx(x, y)]; if (t && t.type === "wall") t.type = "window"; }
    // room label anchors (centre of each room's floor)
    ROOMS.forEach((r) => (r.label = { x: r.x + (r.w - 1) / 2, y: r.y + (r.h - 1) / 2 }));
    return tiles;
  }

  function context(tiles) {
    const walk = [], roomCells = [];
    for (const t of tiles) if (t.walkable) { walk.push(idx(t.x, t.y)); if (t.room >= 0) roomCells.push(idx(t.x, t.y)); }
    const beside = {}; // fixture key -> set of adjacent walkable tiles
    for (const t of tiles) if (t.fixture) {
      const s = beside[t.fixture] || (beside[t.fixture] = new Set());
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = t.x + dx, ny = t.y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && tiles[idx(nx, ny)].walkable) s.add(idx(nx, ny));
      });
    }
    const benchSet = new Set(BENCH.map(([x, y]) => idx(x, y)));
    return { tiles, walk, roomCells, beside, benchSet };
  }

  const rowPh = { 2: ["at the back of", "at the front of"], 3: ["at the back of", "in the middle of", "at the front of"], 4: ["at the very back of", "towards the back of", "towards the front of", "at the very front of"] };
  const colPh = { 2: ["on the left of", "on the right of"], 3: ["on the left of", "in the centre of", "on the right of"], 4: ["on the far left of", "left of centre in", "right of centre in", "on the far right of"] };

  function holds(c, tile, ctx) {
    const T = ctx.tiles[tile], R = ROOMS[T.room];
    if (c.t === "inroom") return T.room === c.z;
    if (c.t === "negroom") return T.room !== c.z;
    if (c.t === "beside") return ctx.beside[c.k] && ctx.beside[c.k].has(tile);
    if (c.t === "bench") return ctx.benchSet.has(tile);
    if (c.t === "row") return T.room === c.z && (T.y - R.y) === c.v;
    if (c.t === "col") return T.room === c.z && (T.x - R.x) === c.v;
    return true;
  }

  // Count solutions (cap 2) of placing suspects on distinct walkable tiles with
  // NO two sharing a row or column (Sudoku rook rule) and satisfying all clues.
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

  // pick N room-tiles forming a valid rook placement (distinct rows & columns)
  function pickPositions(ctx, N, rng) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const pool = shuffle(ctx.roomCells, rng);
      const chosen = [], rows = new Set(), cols = new Set();
      for (const tile of pool) {
        const T = ctx.tiles[tile];
        if (rows.has(T.y) || cols.has(T.x)) continue;
        chosen.push(tile); rows.add(T.y); cols.add(T.x);
        if (chosen.length === N) return chosen;
      }
    }
    return null;
  }

  function candidateClues(truth, ctx, N) {
    const flavour = [], pin = [];
    for (let s = 0; s < N; s++) {
      const tile = truth[s], T = ctx.tiles[tile], R = ROOMS[T.room];
      for (const k in ctx.beside) if (ctx.beside[k].has(tile)) flavour.push({ t: "beside", s, k });
      if (ctx.benchSet.has(tile)) flavour.push({ t: "bench", s });
      pin.push({ t: "inroom", s, z: T.room });
      if (rowPh[R.h]) pin.push({ t: "row", s, z: T.room, v: T.y - R.y });
      if (colPh[R.w]) pin.push({ t: "col", s, z: T.room, v: T.x - R.x });
    }
    return { flavour, pin };
  }

  const TITLES = ["The Purchase No One Made", "A Scandal in Aisle Three", "The Vanishing Trolley",
    "Whodunit at Closing Time", "The Missing Receipt", "Trouble at the Deli", "The Five O'Clock Alibi", "The Spilled Secret"];
  const CRIMES = ["a priceless bottle of wine vanished from the shelves", "the till came up short by a small fortune",
    "a threatening note was left for the manager", "the prize hamper was swapped for a fake", "someone tampered with the freezer"];

  function generateCase(num) {
    const rng = mulberry32(((num + 1) * 2654435761) >>> 0);
    const tiles = buildMap();
    const ctx = context(tiles);
    const N = 5;
    const suspects = shuffle(SUSPECTS, rng).slice(0, N);
    const truth = pickPositions(ctx, N, rng) || ctx.roomCells.slice(0, N);
    const { flavour, pin } = candidateClues(truth, ctx, N);
    // full set (flavour + pinning) is unique thanks to row+col clues; remove
    // greedily from the back so verbose pinning clues drop before spatial ones.
    let givens = shuffle(flavour, rng).concat(shuffle(pin, rng));
    for (let i = givens.length - 1; i >= 0; i--) {
      const test = givens.slice(0, i).concat(givens.slice(i + 1));
      if (count(test, ctx, N).n === 1) givens = test;
    }
    return {
      num, N, W, H, TS, tiles, rooms: ROOMS, walkable: ctx.walk,
      suspects,
      title: TITLES[num % TITLES.length],
      brief: `Closing time, and ${CRIMES[Math.floor(rng() * CRIMES.length)]}. ${N} people were still inside — and no two were caught on the same aisle row or column. Work out exactly where each of them stood.`,
      clues: shuffle(givens, rng).map((c) => clueText(c, suspects)),
      solution: truth,
    };
  }

  function clueText(c, S) {
    const nm = (i) => S[i].name, rn = (z) => ROOMS[z].name, R = (z) => ROOMS[z];
    if (c.t === "inroom") return pick([`${nm(c.s)} was somewhere in the ${rn(c.z)}.`, `${nm(c.s)} spent closing in the ${rn(c.z)}.`], c);
    if (c.t === "negroom") return `${nm(c.s)} was never near the ${rn(c.z)}.`;
    if (c.t === "beside") return pick([`${nm(c.s)} was right beside ${FIX[c.k]}.`, `${nm(c.s)} could reach out and touch ${FIX[c.k]}.`], c);
    if (c.t === "bench") return `${nm(c.s)} was resting on the bench.`;
    if (c.t === "row") return `${nm(c.s)} was ${rowPh[R(c.z).h][c.v]} the ${rn(c.z)}.`;
    if (c.t === "col") return `${nm(c.s)} was ${colPh[R(c.z).w][c.v]} the ${rn(c.z)}.`;
    return "";
  }
  const pick = (arr, c) => arr[((c.s || 0) + (c.z || 0) + (c.v || 0) + (c.k ? c.k.length : 0)) % arr.length];

  const API = { generateCase, SUSPECTS, FIX, ROOMS, W, H, TS, _count: count, _buildMap: buildMap, _context: context };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.MURDOKU = API;
})(typeof window !== "undefined" ? window : globalThis);
