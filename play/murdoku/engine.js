/* Murdoku — case engine (pure, no DOM).
   Generates endless, deterministic, uniquely-solvable murder-deduction cases:
   N suspects each paired with one weapon and one location (a consistent 3-way
   matching); a set of clues is generated and minimised so exactly one matching
   satisfies them. Case #N is always the same puzzle (seeded by N), so progress
   is stable. All content below is original. Works in the browser and in Node. */
(function (global) {
  "use strict";

  // ---- content (the cast, the arsenal, the rooms) ----
  const SUSPECTS = [
    { name: "Countess Vaughn", emoji: "👑", color: "#b18cff" },
    { name: "Dr. Osric Quill", emoji: "🥼", color: "#5bc8e8" },
    { name: "Major Ashford", emoji: "🎖️", color: "#e8c84a" },
    { name: "Vivian Marlowe", emoji: "🎭", color: "#ff5a5a" },
    { name: "Silas Crane", emoji: "🎩", color: "#5bd6a0" },
    { name: "Prof. Isadora Finch", emoji: "🔬", color: "#ff8a3d" },
    { name: "Reverend Blackwood", emoji: "⛪", color: "#9aa0a6" },
    { name: "Colette Devereux", emoji: "💋", color: "#f06292" },
    { name: "Bruno Gallo", emoji: "🥊", color: "#a1887f" },
    { name: "Nadia Sokolov", emoji: "🕶️", color: "#6c8cff" },
    { name: "Captain Hargrove", emoji: "⚓", color: "#4db6ac" },
    { name: "Lady Pemberton", emoji: "💎", color: "#ce93d8" },
  ];
  const WEAPONS = [
    { name: "Candlestick", emoji: "🕯️" }, { name: "Revolver", emoji: "🔫" },
    { name: "Poisoned Wine", emoji: "🍷" }, { name: "Letter Opener", emoji: "🗡️" },
    { name: "Garrote Wire", emoji: "🪢" }, { name: "Heavy Wrench", emoji: "🔧" },
    { name: "Arsenic Tea", emoji: "🫖" }, { name: "Antique Dagger", emoji: "🔪" },
    { name: "Marble Bust", emoji: "🗿" }, { name: "Silk Scarf", emoji: "🧣" },
    { name: "Crossbow", emoji: "🏹" }, { name: "Fire Poker", emoji: "🔥" },
  ];
  const LOCATIONS = [
    { name: "the Library", emoji: "📚" }, { name: "the Greenhouse", emoji: "🌿" },
    { name: "the Ballroom", emoji: "💃" }, { name: "the Wine Cellar", emoji: "🛢️" },
    { name: "the Observatory", emoji: "🔭" }, { name: "the Boathouse", emoji: "⛵" },
    { name: "the Smoking Room", emoji: "🚬" }, { name: "the Conservatory", emoji: "🎹" },
    { name: "the Portrait Gallery", emoji: "🖼️" }, { name: "the Rose Garden", emoji: "🌹" },
    { name: "the Clock Tower", emoji: "🕰️" }, { name: "the Kitchen", emoji: "🍳" },
  ];
  const VICTIMS = [
    "the reclusive millionaire Alastair Crane", "the art dealer Margot Sinclair",
    "the retired judge Cornelius Vane", "the opera singer Delphine Rousseau",
    "the industrialist Rupert Thorne", "the novelist Beatrix Hollow",
    "the diamond heir Julian Ashe", "the ambassador Viktor Reyes",
  ];
  const MANORS = ["Ravenhurst Manor", "Blackmoor Hall", "Thornfield Estate", "Greyloch Castle", "Ashworth House", "Duskvale Grange"];

  // ---- rng (deterministic per case number) ----
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const shuffle = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function permsOf(n) {
    const res = []; const a = Array.from({ length: n }, (_, i) => i);
    (function go(k) { if (k === n) { res.push(a.slice()); return; } for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; go(k + 1); [a[k], a[i]] = [a[i], a[k]]; } })(0);
    return res;
  }

  // A matching is two perms: W[s] = weapon of suspect s, L[s] = location of suspect s.
  function clueHolds(cl, W, L) {
    let paired;
    if (cl.t === "SW") paired = W[cl.a] === cl.b;
    else if (cl.t === "SL") paired = L[cl.a] === cl.b;
    else { paired = false; for (let s = 0; s < W.length; s++) if (W[s] === cl.a && L[s] === cl.b) { paired = true; break; } }
    return cl.yes ? paired : !paired;
  }
  function solutionsFor(clues, perms) {
    let n = 0, fW = null, fL = null;
    for (const W of perms) for (const L of perms) {
      let ok = true; for (const cl of clues) if (!clueHolds(cl, W, L)) { ok = false; break; }
      if (ok) { n++; fW = W; fL = L; if (n > 1) return { count: n }; }
    }
    return { count: n, W: fW, L: fL };
  }

  function generateCase(num) {
    const rng = mulberry32(((num + 1) * 2654435761) >>> 0);
    const N = 4;
    const suspects = shuffle(SUSPECTS, rng).slice(0, N);
    const weapons = shuffle(WEAPONS, rng).slice(0, N);
    const locations = shuffle(LOCATIONS, rng).slice(0, N);
    const Wm = shuffle([0, 1, 2, 3], rng), Lm = shuffle([0, 1, 2, 3], rng); // truth
    const weaponAtSuspect = Wm; // W[s]
    const locAtSuspect = Lm;    // L[s]

    // candidate clues: every true/false atomic fact across the 3 relations
    const cand = [];
    for (let i = 0; i < N; i++) {
      cand.push({ t: "SW", a: i, b: Wm[i], yes: true });
      cand.push({ t: "SL", a: i, b: Lm[i], yes: true });
      cand.push({ t: "WL", a: Wm[i], b: Lm[i], yes: true });
      for (let j = 0; j < N; j++) {
        if (Wm[i] !== j) cand.push({ t: "SW", a: i, b: j, yes: false });
        if (Lm[i] !== j) cand.push({ t: "SL", a: i, b: j, yes: false });
      }
    }
    for (let w = 0; w < N; w++) { const locOfW = Lm[Wm.indexOf(w)]; for (let l = 0; l < N; l++) if (locOfW !== l) cand.push({ t: "WL", a: w, b: l, yes: false }); }

    const perms = permsOf(N);
    const shuffled = shuffle(cand, rng);
    let givens = [];
    for (const c of shuffled) { givens.push(c); if (solutionsFor(givens, perms).count === 1) break; }
    for (let i = givens.length - 1; i >= 0; i--) { const test = givens.slice(0, i).concat(givens.slice(i + 1)); if (solutionsFor(test, perms).count === 1) givens = test; }

    const murderer = Math.floor(rng() * N);
    const solution = { suspect: murderer, weapon: Wm[murderer], location: Lm[murderer] };
    const victim = VICTIMS[Math.floor(rng() * VICTIMS.length)];
    const manor = MANORS[Math.floor(rng() * MANORS.length)];

    return {
      num, suspects, weapons, locations,
      brief: `${victim} has been found dead at ${manor}. The body lay in ${locations[solution.location].name}. Four guests had the means and the motive — read the clues, work the grid, and name the killer and their weapon.`,
      crimeScene: solution.location,
      clues: shuffle(givens, rng).map((c) => clueText(c, suspects, weapons, locations)),
      solution,
    };
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function clueText(c, S, W, L) {
    const s = (i) => S[i].name, w = (i) => W[i].name, l = (i) => L[i].name;
    if (c.t === "SW") return c.yes
      ? pick([`${s(c.a)} was caught clutching the ${w(c.b)}.`, `The ${w(c.b)} belonged to ${s(c.a)}.`], c)
      : pick([`${s(c.a)} would never touch the ${w(c.b)}.`, `${s(c.a)} had no ${w(c.b)} on them.`], c);
    if (c.t === "SL") return c.yes
      ? pick([`${cap(l(c.b))} was where ${s(c.a)} spent the evening.`, `${s(c.a)} was seen in ${l(c.b)}.`], c)
      : pick([`${s(c.a)} never set foot in ${l(c.b)}.`, `${s(c.a)} was nowhere near ${l(c.b)}.`], c);
    return c.yes
      ? pick([`The ${w(c.a)} was discovered in ${l(c.b)}.`, `${cap(l(c.b))} still smelled of the ${w(c.a)}.`], c)
      : pick([`The ${w(c.a)} was definitely not in ${l(c.b)}.`, `No trace of the ${w(c.a)} was found in ${l(c.b)}.`], c);
  }
  const pick = (arr, c) => arr[(c.a + c.b) % arr.length];

  const API = { generateCase, SUSPECTS, WEAPONS, LOCATIONS, _solutionsFor: solutionsFor, _permsOf: permsOf };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.MURDOKU = API;
})(typeof window !== "undefined" ? window : globalThis);
