/* Murdoku — case engine (pure, no DOM).
   A spatial deduction game: place each suspect in the store area where they
   were, using the clues. The store is a fixed 3×3 grid of named areas (each with
   a fixture). Every case seats N distinct suspects in N areas and generates a
   minimised clue set with exactly one solution. Case #N is seeded by N so
   progress is stable. Original content. Runs in the browser and in Node. */
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
  // 3×3 store. x = column (0..2), y = row (0..2). `item` is what you're "beside".
  const AREAS = [
    { name: "the Storage Room", emoji: "📦", item: "the crates", x: 0, y: 0, zone: "grey" },
    { name: "the Promotional Area", emoji: "🏷️", item: "the display stand", x: 1, y: 0, zone: "green" },
    { name: "the Deli Counter", emoji: "🧀", item: "the deli", x: 2, y: 0, zone: "yellow" },
    { name: "the Flower Stand", emoji: "🌸", item: "the flowers", x: 0, y: 1, zone: "green" },
    { name: "the Bakery", emoji: "🥖", item: "the fresh bread", x: 1, y: 1, zone: "yellow" },
    { name: "the Produce Section", emoji: "🍎", item: "the apples", x: 2, y: 1, zone: "green" },
    { name: "the Staff Room", emoji: "☕", item: "the lockers", x: 0, y: 2, zone: "grey" },
    { name: "the Office", emoji: "🗄️", item: "the safe", x: 1, y: 2, zone: "grey" },
    { name: "the Checkout", emoji: "🛒", item: "the tills", x: 2, y: 2, zone: "yellow" },
  ];
  const M = AREAS.length;
  const adj = AREAS.map((a) => AREAS.map((b) => (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1 ? 1 : 0)));
  const isCorner = (i) => (AREAS[i].x !== 1 && AREAS[i].y !== 1);
  const TITLES = ["The Purchase No One Made", "A Scandal in Aisle Three", "The Vanishing Trolley", "Whodunit at Closing Time",
    "The Case of the Missing Receipt", "Trouble at the Deli", "The Five O'Clock Alibi", "The Spilled Secret"];
  const CRIMES = ["a priceless bottle of wine vanished from the shelves", "the till came up short by a small fortune",
    "a threatening note was left for the manager", "the prize hamper was swapped for a fake", "someone tampered with the freezer"];

  function mulberry32(a) {
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const shuffle = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // all injections of N suspects into M areas (arrays of length N of area indices)
  function injections(N) {
    const res = [], cur = [], used = new Array(M).fill(false);
    (function go(k) { if (k === N) { res.push(cur.slice()); return; } for (let a = 0; a < M; a++) if (!used[a]) { used[a] = true; cur[k] = a; go(k + 1); used[a] = false; } })(0);
    return res;
  }
  function holds(c, asg) {
    if (c.t === "pos") return asg[c.s] === c.a;
    if (c.t === "neg") return asg[c.s] !== c.a;
    if (c.t === "corner") return isCorner(asg[c.s]);
    if (c.t === "beside") return adj[asg[c.s]][c.f] === 1;
    if (c.t === "next") return adj[asg[c.s]][asg[c.o]] === 1;
    return true;
  }
  function count(clues, all) { let n = 0, sol = null; for (const asg of all) { let ok = true; for (const c of clues) if (!holds(c, asg)) { ok = false; break; } if (ok) { n++; sol = asg; if (n > 1) return { n }; } } return { n, sol }; }

  function generateCase(num) {
    const rng = mulberry32(((num + 1) * 2654435761) >>> 0);
    const N = 5;
    const suspects = shuffle(SUSPECTS, rng).slice(0, N);
    const areasChosen = shuffle(Array.from({ length: M }, (_, i) => i), rng).slice(0, N);
    const truth = shuffle(areasChosen, rng); // truth[s] = area index of suspect s
    const all = injections(N);

    // candidate clues from the truth
    const cand = [];
    for (let s = 0; s < N; s++) {
      const a = truth[s];
      cand.push({ t: "pos", s, a });
      if (isCorner(a)) cand.push({ t: "corner", s });
      for (let b = 0; b < M; b++) if (b !== a) cand.push({ t: "neg", s, a: b });
      for (let f = 0; f < M; f++) if (adj[a][f]) cand.push({ t: "beside", s, f });
      for (let o = 0; o < N; o++) if (o !== s && adj[a][truth[o]]) cand.push({ t: "next", s, o });
    }
    const shuffled = shuffle(cand, rng);
    let givens = [];
    for (const c of shuffled) { givens.push(c); if (count(givens, all).n === 1) break; }
    for (let i = givens.length - 1; i >= 0; i--) { const test = givens.slice(0, i).concat(givens.slice(i + 1)); if (count(test, all).n === 1) givens = test; }

    return {
      num, N, areas: AREAS, adj, suspects,
      title: TITLES[Math.floor(rng() * TITLES.length)],
      brief: `Closing time at the store, and ${CRIMES[Math.floor(rng() * CRIMES.length)]}. ${N} people were still inside. From the clues, work out exactly where each of them was.`,
      clues: shuffle(givens, rng).map((c) => clueText(c, suspects)),
      solution: truth, // solution[suspectIndex] = area index
    };
  }

  function clueText(c, S) {
    const s = (i) => S[i].name, A = AREAS;
    if (c.t === "pos") return pick([`${s(c.s)} was in ${A[c.a].name}.`, `${s(c.s)} spent the evening in ${A[c.a].name}.`], c);
    if (c.t === "neg") return pick([`${s(c.s)} was never in ${A[c.a].name}.`, `${s(c.s)} was nowhere near ${A[c.a].name}.`], c);
    if (c.t === "corner") return `${s(c.s)} was tucked away in a corner of the store.`;
    if (c.t === "beside") return pick([`${s(c.s)} was right beside ${A[c.f].item}.`, `${s(c.s)} could reach out and touch ${A[c.f].item}.`], c);
    return pick([`${s(c.s)} was standing next to ${s(c.o)}.`, `${s(c.s)} and ${s(c.o)} were side by side.`], c);
  }
  const pick = (arr, c) => arr[((c.s || 0) + (c.a || c.f || c.o || 0)) % arr.length];

  const API = { generateCase, SUSPECTS, AREAS, _injections: injections, _count: count };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.MURDOKU = API;
})(typeof window !== "undefined" ? window : globalThis);
