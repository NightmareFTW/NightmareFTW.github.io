/* Murdoku — case engine (pure, no DOM). Murder + Sudoku.
   The store is a floor plan of rooms of varied sizes. Walls are thin LINES on
   the edges between rooms (and around the outside) — the whole area is floor.
   Rules: every suspect stood on exactly one floor tile; no two share a row or a
   column (placing one rules out its whole row + column). Furniture tiles are
   blocked, but the bench is occupiable. From spatial clues you deduce each
   person's exact tile. Cases are seeded by number; clue sets minimised to one
   solution. Runs in browser and Node. */
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

  // ---- floor plan (rooms of varied sizes tile the interior; walls are lines) ----
  const W = 12, H = 12, TS = 16;
  const idx = (x, y) => y * W + x;
  const ROOMS = [
    { name: "Storage Room", color: "grey", x: 1, y: 1, w: 3, h: 3 },
    { name: "Promotional Area", color: "green", x: 4, y: 1, w: 4, h: 2 },
    { name: "Deli Counter", color: "yellow", x: 8, y: 1, w: 3, h: 4 },
    { name: "Produce Section", color: "green", x: 4, y: 3, w: 4, h: 3 },
    { name: "Flower Stand", color: "green", x: 1, y: 4, w: 3, h: 3 },
    { name: "Office", color: "grey", x: 4, y: 6, w: 3, h: 3 },
    { name: "Staff Room", color: "grey", x: 1, y: 7, w: 3, h: 2 },
    { name: "Bakery", color: "yellow", x: 1, y: 9, w: 3, h: 2 },
    { name: "Loading Bay", color: "grey", x: 4, y: 9, w: 4, h: 2 },
    { name: "Checkout", color: "yellow", x: 8, y: 6, w: 3, h: 5 },
  ];
  const FURN = [
    ["crate", 1, 1], ["crate", 3, 3], ["tv", 4, 1], ["banner", 6, 1],
    ["cheese", 8, 1], ["cheese", 9, 1], ["cheese", 10, 1],
    ["apples", 5, 3], ["apples", 6, 3], ["flowers", 1, 4], ["plant", 3, 6],
    ["desk", 4, 6], ["safe", 6, 8], ["coffee", 1, 7],
    ["bread", 1, 9], ["bread", 3, 10], ["crate", 5, 9], ["crate", 7, 10],
    ["till", 8, 6], ["till", 9, 6], ["till", 10, 6],
  ];
  const BENCH = [[2, 8], [3, 8]];                 // 2-tile bench in the Staff Room
  const VOID = [[8, 5], [9, 5], [10, 5]];         // notch on the right ⇒ non-square outline
  const WINDOWS = [[5, 1, "T"], [9, 1, "T"], [10, 7, "R"], [10, 9, "R"], [1, 5, "L"], [1, 10, "L"]];

  function buildMap() {
    const roomAt = (x, y) => ROOMS.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    const furnAt = {}; FURN.forEach(([k, x, y]) => (furnAt[idx(x, y)] = k));
    const benchSet = new Set(BENCH.map(([x, y]) => idx(x, y)));
    const voidSet = new Set(VOID.map(([x, y]) => idx(x, y)));
    const tiles = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y);
      const interior = x >= 1 && x <= W - 2 && y >= 1 && y <= H - 2 && !voidSet.has(i);
      let type = "void", room = -1;
      if (interior) { room = roomAt(x, y); type = furnAt[i] ? "furn" : (benchSet.has(i) ? "bench" : "floor"); }
      tiles[i] = { x, y, room, type, fixture: furnAt[i] || null, walkable: (type === "floor" || type === "bench") };
    }
    ROOMS.forEach((r) => (r.label = { x: r.x + (r.w - 1) / 2, y: r.y + (r.h - 1) / 2 }));
    return tiles;
  }

  function context(tiles) {
    const walk = [], roomCells = [];
    for (const t of tiles) if (t.walkable) { walk.push(idx(t.x, t.y)); if (t.room >= 0) roomCells.push(idx(t.x, t.y)); }
    const beside = {};
    for (const t of tiles) if (t.fixture) {
      const s = beside[t.fixture] || (beside[t.fixture] = new Set());
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = t.x + dx, ny = t.y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && tiles[idx(nx, ny)].walkable) s.add(idx(nx, ny));
      });
    }
    const benchSet = new Set(BENCH.map(([x, y]) => idx(x, y)));
    return { tiles, walk, roomCells, beside, benchSet };
  }

  const rowPh = { 2: ["at the back of", "at the front of"], 3: ["at the back of", "in the middle of", "at the front of"], 4: ["at the very back of", "towards the back of", "towards the front of", "at the very front of"], 5: ["at the very back of", "near the back of", "in the middle of", "near the front of", "at the very front of"] };
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

  // Count solutions (cap 2): distinct walkable tiles, no shared row/column, all clues.
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
    let givens = shuffle(flavour, rng).concat(shuffle(pin, rng));
    for (let i = givens.length - 1; i >= 0; i--) {
      const test = givens.slice(0, i).concat(givens.slice(i + 1));
      if (count(test, ctx, N).n === 1) givens = test;
    }
    return {
      num, N, W, H, TS, tiles, rooms: ROOMS, walkable: ctx.walk, windows: WINDOWS,
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
