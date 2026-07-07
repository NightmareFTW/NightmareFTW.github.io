/* Murdoku — tile-grid spatial deduction engine (pure, no DOM).
   The store is a grid of tiles; named AREAS span several tiles each (a mix of
   Sudoku and detective work). Every suspect stood on exactly one walkable tile.
   From spatial clues ("beside the apples", "in the Bakery", "in a corner",
   "next to X") you deduce each person's tile. Each case is seeded by its number
   so Case #N is stable, and its clue set is minimised to exactly one solution.
   Original content. Runs in the browser and in Node. */
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

  // Fixtures = the landmarks clues refer to. `key` is how they're drawn + named.
  const FIX = {
    apples: "the apples", bread: "the fresh bread", cheese: "the deli counter",
    flowers: "the flowers", banner: "the promo stand", tills: "the tills",
    crates: "the crates", barrel: "the barrels", safe: "the safe",
    rug: "the rug", coffee: "the coffee machine", lockers: "the lockers", plant: "the potted plant",
  };
  // Nine store sections. Each is placed into one 3×3 block of the map.
  const THEMES = [
    { name: "Produce Section", color: "green", fixes: ["apples"] },
    { name: "Bakery", color: "yellow", fixes: ["bread"] },
    { name: "Deli Counter", color: "yellow", fixes: ["cheese"] },
    { name: "Flower Stand", color: "green", fixes: ["flowers", "plant"] },
    { name: "Promotional Area", color: "green", fixes: ["banner"] },
    { name: "Checkout", color: "yellow", fixes: ["tills"] },
    { name: "Storage Room", color: "grey", fixes: ["crates", "barrel"] },
    { name: "Office", color: "grey", fixes: ["safe", "rug"] },
    { name: "Staff Room", color: "grey", fixes: ["coffee", "lockers"] },
  ];
  const TITLES = ["The Purchase No One Made", "A Scandal in Aisle Three", "The Vanishing Trolley",
    "Whodunit at Closing Time", "The Missing Receipt", "Trouble at the Deli", "The Five O'Clock Alibi", "The Spilled Secret"];
  const CRIMES = ["a priceless bottle of wine vanished from the shelves", "the till came up short by a small fortune",
    "a threatening note was left for the manager", "the prize hamper was swapped for a fake", "someone tampered with the freezer"];

  function mulberry32(a) {
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const shuffle = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---- map (deterministic per case) ----
  // 3×3 blocks of 3×3 tiles, 1-tile aisles between, 1-tile shelf border.
  const BLOCK = 3, GAP = 1, WALL = 1;
  const STRIDE = BLOCK + GAP;                    // 4
  const INNER = 3 * BLOCK + 2 * GAP;             // 11
  const W = INNER + 2 * WALL, H = INNER + 2 * WALL; // 13×13
  const TS = 16;
  const idx = (x, y) => y * W + x;

  function buildMap(rng) {
    const tiles = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      tiles[idx(x, y)] = { x, y, zone: -1, wall: (x === 0 || y === 0 || x === W - 1 || y === H - 1), fixture: null, walkable: false };

    const themes = shuffle(THEMES, rng);
    const zones = [];
    let z = 0;
    for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) {
      const th = themes[z];
      const x0 = WALL + bx * STRIDE, y0 = WALL + by * STRIDE;
      const cells = [];
      for (let dy = 0; dy < BLOCK; dy++) for (let dx = 0; dx < BLOCK; dx++) {
        const t = tiles[idx(x0 + dx, y0 + dy)]; t.zone = z; t.walkable = true; cells.push(t);
      }
      // place this section's fixtures on distinct cells of the block
      const spots = shuffle(cells, rng);
      th.fixes.forEach((key, i) => { const t = spots[i]; t.fixture = key; t.walkable = false; });
      zones.push({ name: th.name, color: th.color, block: [x0, y0], label: { x: x0 + 1, y: y0 + 1 } });
      z++;
    }
    // aisles (interior, not in a block, not wall) are walkable
    for (let y = WALL; y < H - WALL; y++) for (let x = WALL; x < W - WALL; x++) {
      const t = tiles[idx(x, y)]; if (t.zone === -1 && !t.fixture) t.walkable = true;
    }
    return { tiles, zones };
  }

  // ---- puzzle context derived from a map ----
  function context(map) {
    const { tiles, zones } = map;
    const walk = [];
    for (const t of tiles) if (t.walkable) walk.push(idx(t.x, t.y));
    const nbr = (i) => { const t = tiles[i], o = []; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = t.x + dx, ny = t.y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) o.push(idx(nx, ny)); }); return o; };
    const zoneOf = (i) => tiles[i].zone;
    const beside = {};                    // fixture key -> set of adjacent walkable tiles
    const fixTile = {};                   // fixture key -> its tile
    for (const t of tiles) if (t.fixture) { fixTile[t.fixture] = idx(t.x, t.y); beside[t.fixture] = new Set(nbr(idx(t.x, t.y)).filter((n) => tiles[n].walkable)); }
    const corner = new Set(walk.filter((i) => nbr(i).filter((n) => tiles[n].wall).length >= 2));
    const adjW = {};                      // walkable tile -> set of walkable neighbours
    for (const i of walk) adjW[i] = new Set(nbr(i).filter((n) => tiles[n].walkable));
    return { tiles, zones, walk, zoneOf, beside, fixTile, corner, adjW };
  }

  function holdsUnary(c, tile, ctx) {
    const T = ctx.tiles[tile];
    if (c.t === "pos") return T.zone === c.z;
    if (c.t === "neg") return T.zone !== c.z;
    if (c.t === "beside") return ctx.beside[c.k] && ctx.beside[c.k].has(tile);
    if (c.t === "corner") return ctx.corner.has(tile);
    if (c.t === "vrow") return T.zone === c.z && (T.y - ctx.zones[c.z].block[1]) === c.v;
    if (c.t === "hcol") return T.zone === c.z && (T.x - ctx.zones[c.z].block[0]) === c.v;
    return true; // "next" is binary, handled in search
  }

  // Count solutions (capped at 2) of assigning each suspect to a distinct
  // walkable tile satisfying all clues. Returns {n, sol}.
  function count(clues, ctx, N) {
    const cand = [];
    for (let s = 0; s < N; s++) {
      let list = ctx.walk.filter((tile) => clues.every((c) => c.s !== s || c.t === "next" || holdsUnary(c, tile, ctx)));
      cand.push(list);
      if (list.length === 0) return { n: 0, sol: null };
    }
    const nexts = clues.filter((c) => c.t === "next");
    const order = Array.from({ length: N }, (_, s) => s).sort((a, b) => cand[a].length - cand[b].length);
    const asg = new Array(N).fill(-1);
    const used = new Set();
    let n = 0, sol = null;
    (function go(k) {
      if (n > 1) return;
      if (k === N) { n++; if (n === 1) sol = asg.slice(); return; }
      const s = order[k];
      for (const tile of cand[s]) {
        if (used.has(tile)) continue;
        let ok = true;
        for (const c of nexts) {
          const other = c.s === s ? c.o : c.o === s ? c.s : -1;
          if (other >= 0 && asg[other] >= 0) { if (!ctx.adjW[tile].has(asg[other])) { ok = false; break; } }
        }
        if (!ok) continue;
        asg[s] = tile; used.add(tile); go(k + 1); used.delete(tile); asg[s] = -1;
        if (n > 1) return;
      }
    })(0);
    return { n, sol };
  }

  // Two pools of clues, all true of `truth`:
  //  - flavour: beside a fixture / in a corner / next to someone (kept first)
  //  - pinning: which area + which row/column of that area (pins the exact tile)
  // pinning alone gives a unique solution; flavour is preferred during reduction.
  function candidateClues(truth, ctx, N) {
    const flavour = [], pinning = [];
    for (let s = 0; s < N; s++) {
      const tile = truth[s], T = ctx.tiles[tile], z = T.zone;
      for (const k in ctx.beside) if (ctx.beside[k].has(tile)) flavour.push({ t: "beside", s, k });
      if (ctx.corner.has(tile)) flavour.push({ t: "corner", s });
      for (let o = 0; o < N; o++) if (o !== s && ctx.adjW[tile].has(truth[o]) && o > s) flavour.push({ t: "next", s, o });
      if (z >= 0) {
        pinning.push({ t: "pos", s, z });
        pinning.push({ t: "vrow", s, z, v: T.y - ctx.zones[z].block[1] });
        pinning.push({ t: "hcol", s, z, v: T.x - ctx.zones[z].block[0] });
      }
    }
    return { flavour, pinning };
  }

  function generateCase(num) {
    const rng = mulberry32(((num + 1) * 2654435761) >>> 0);
    const map = buildMap(rng);
    const ctx = context(map);
    const N = 5;
    const suspects = shuffle(SUSPECTS, rng).slice(0, N);

    // Crowd a couple of sections so a bare "in the X" clue can't pin those
    // suspects — you must use fixtures / corners / row-column position (the
    // Sudoku part). The full pinning set is always unique; we then remove clues
    // greedily (pinning first, flavour last) down to a minimal, spatial set.
    const truth = pickPositions(ctx, N, rng) || shuffle(ctx.walk.filter((i) => ctx.zoneOf(i) >= 0), rng).slice(0, N);
    const { flavour, pinning } = candidateClues(truth, ctx, N);
    let givens = shuffle(flavour, rng).concat(shuffle(pinning, rng)); // flavour at front = removed last
    for (let i = givens.length - 1; i >= 0; i--) {
      const test = givens.slice(0, i).concat(givens.slice(i + 1));
      if (count(test, ctx, N).n === 1) givens = test;
    }
    const best = { truth, clues: givens };

    return {
      num, N, W, H, TS,
      tiles: map.tiles, zones: map.zones, walkable: ctx.walk,
      suspects,
      title: TITLES[(num) % TITLES.length],
      brief: `Closing time, and ${CRIMES[Math.floor(rng() * CRIMES.length)]}. ${N} people were still inside. Work out exactly where each of them was standing.`,
      clues: shuffle(best.clues, rng).map((c) => clueText(c, suspects, ctx)),
      solution: best.truth,
      _fixTile: ctx.fixTile,
    };
  }

  // Pick N tiles clustered into a few sections (some sharing a zone), so the
  // puzzle needs within-area deduction. Returns null if it can't place them.
  const PARTITIONS = [[2, 2, 1], [3, 1, 1], [2, 1, 1, 1], [3, 2], [2, 2, 1]];
  function pickPositions(ctx, N, rng) {
    const byZone = {};
    for (const t of ctx.walk) { const z = ctx.zoneOf(t); if (z >= 0) (byZone[z] = byZone[z] || []).push(t); }
    const parts = shuffle(PARTITIONS[Math.floor(rng() * PARTITIONS.length)].slice(), rng);
    const zoneIds = shuffle(Object.keys(byZone).map(Number), rng);
    const chosen = [];
    let zi = 0;
    for (const need of parts) {
      // find a zone with enough distinct, spread-out tiles
      let placed = false;
      for (; zi < zoneIds.length; zi++) {
        const pool = shuffle(byZone[zoneIds[zi]], rng);
        if (pool.length >= need) { for (let k = 0; k < need; k++) chosen.push(pool[k]); zi++; placed = true; break; }
      }
      if (!placed) return null;
    }
    return chosen.length === N ? chosen : null;
  }

  const VROW = ["at the back of", "in the middle of", "at the front of"];
  const HCOL = ["on the left side of", "in the centre of", "on the right side of"];
  function clueText(c, S, ctx) {
    const nm = (i) => S[i].name, zn = (z) => ctx.zones[z].name;
    if (c.t === "pos") return pick([`${nm(c.s)} was somewhere in the ${zn(c.z)}.`, `${nm(c.s)} spent closing in the ${zn(c.z)}.`], c);
    if (c.t === "neg") return pick([`${nm(c.s)} was never near the ${zn(c.z)}.`, `${nm(c.s)} stayed out of the ${zn(c.z)}.`], c);
    if (c.t === "beside") return pick([`${nm(c.s)} was right beside ${FIX[c.k]}.`, `${nm(c.s)} could reach out and touch ${FIX[c.k]}.`], c);
    if (c.t === "corner") return `${nm(c.s)} was tucked into a corner of the store.`;
    if (c.t === "vrow") return `${nm(c.s)} was ${VROW[c.v]} the ${zn(c.z)}.`;
    if (c.t === "hcol") return `${nm(c.s)} was ${HCOL[c.v]} the ${zn(c.z)}.`;
    return pick([`${nm(c.s)} was standing next to ${nm(c.o)}.`, `${nm(c.s)} and ${nm(c.o)} were side by side.`], c);
  }
  const pick = (arr, c) => arr[((c.s || 0) + (c.z || 0) + (c.o || 0) + (c.v || 0) + (c.k ? c.k.length : 0)) % arr.length];

  const API = { generateCase, SUSPECTS, THEMES, FIX, _count: count, _context: context, _buildMap: buildMap, W, H, TS };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.MURDOKU = API;
})(typeof window !== "undefined" ? window : globalThis);
