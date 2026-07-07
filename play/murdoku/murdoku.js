/* Murdoku — game UI. Uses window.MURDOKU (engine.js).
   Renders the case brief, clues, a deduction grid (suspects×weapons,
   suspects×locations, weapons×locations) you mark by clicking, and an
   accusation. Progress + the current grid persist under "nftw:murdoku:*",
   so they save on the device and sync to your account when signed in. */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const SOLVED = "nftw:murdoku:solved", CURKEY = "nftw:murdoku:case", MARKS = "nftw:murdoku:marks";

  const root = document.getElementById("md-root");
  let C = null, caseNum = 0, marks = {}, pick = { suspect: null, weapon: null };

  const START = (new URLSearchParams(location.search).get("case") | 0) || lsGet(CURKEY, 0) || 0;

  function load(n) {
    caseNum = Math.max(0, n | 0);
    C = MURDOKU.generateCase(caseNum);
    lsSet(CURKEY, caseNum);
    const saved = lsGet(MARKS, {});
    marks = (saved.case === caseNum && saved.marks) ? saved.marks : {};
    pick = { suspect: null, weapon: null };
    render();
  }
  const saveMarks = () => lsSet(MARKS, { case: caseNum, marks });
  const solvedList = () => lsGet(SOLVED, []);
  const isSolved = (n) => solvedList().includes(n);

  // ---- deduction grid ----
  // grids: sw (suspect rows × weapon cols), sl (suspect × location), wl (weapon × location)
  const NEXT = { "": "yes", yes: "no", no: "" };
  function cell(grid, r, c) {
    const st = marks[`${grid}:${r}:${c}`] || "";
    return `<button class="md-cell md-${st || "blank"}" data-g="${grid}" data-r="${r}" data-c="${c}">${st === "yes" ? "✓" : st === "no" ? "✕" : ""}</button>`;
  }
  function gridBlock(id, rows, cols, title) {
    const head = `<div class="md-gcell md-corner"></div>` + cols.map((x) => `<div class="md-gcell md-h" title="${esc(x.name)}">${x.emoji}</div>`).join("");
    const body = rows.map((rw, r) => `<div class="md-gcell md-h md-rh" title="${esc(rw.name)}">${rw.emoji}</div>` + cols.map((_, c) => cell(id, r, c)).join("")).join("");
    return `<div class="md-grid" style="grid-template-columns:repeat(${cols.length + 1},1fr)"><div class="md-gtitle" style="grid-column:1/-1">${title}</div>${head}${body}</div>`;
  }
  function setCell(grid, r, c) {
    const key = `${grid}:${r}:${c}`;
    const st = NEXT[marks[key] || ""];
    if (st) marks[key] = st; else delete marks[key];
    if (st === "yes") { // auto-eliminate the rest of the row & column in this sub-grid
      const n = grid === "wl" ? C.weapons.length : C.suspects.length;
      const cols = grid === "sw" ? C.weapons.length : C.locations.length;
      for (let i = 0; i < cols; i++) if (i !== +c) marks[`${grid}:${r}:${i}`] = "no";
      for (let i = 0; i < n; i++) if (i !== +r) marks[`${grid}:${i}:${c}`] = "no";
    }
    saveMarks(); renderGrids();
  }

  // ---- render ----
  function chip(kind, i, item) {
    const on = pick[kind] === i;
    return `<button class="md-chip${on ? " on" : ""}" data-pick="${kind}" data-i="${i}">${item.emoji} ${esc(item.name)}</button>`;
  }
  function render() {
    const solved = isSolved(caseNum);
    root.innerHTML = `
      <div class="md-bar">
        <div class="md-casenav">
          <button class="mini-btn" id="md-prev" ${caseNum <= 0 ? "disabled" : ""}>‹ Prev</button>
          <span class="md-caseno">Case&nbsp;#${caseNum + 1}${solved ? ' <span class="md-solvedtag">✓ solved</span>' : ""}</span>
          <button class="mini-btn" id="md-next">Next ›</button>
        </div>
        <span class="md-progress">${solvedList().length} solved</span>
      </div>
      <div class="md-brief"><span class="md-scene">🔎 Crime scene: <b>${esc(C.locations[C.crimeScene].name)}</b></span><p>${esc(C.brief)}</p></div>

      <div class="md-cols">
        <section class="panel md-clues">
          <h2>Clues</h2>
          <ol>${C.clues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
          <p class="md-hint">Tap a grid cell to cycle blank → ✓ → ✕. A ✓ auto-marks the rest of that row &amp; column ✕.</p>
        </section>
        <section class="panel md-board">
          <h2>Deduction grid</h2>
          <div id="md-grids"></div>
        </section>
      </div>

      <section class="panel md-accuse">
        <h2>Make your accusation</h2>
        <p class="md-alabel">The killer was…</p>
        <div class="md-chips" id="md-sus">${C.suspects.map((s, i) => chip("suspect", i, s)).join("")}</div>
        <p class="md-alabel">…using the…</p>
        <div class="md-chips" id="md-wep">${C.weapons.map((w, i) => chip("weapon", i, w)).join("")}</div>
        <div class="md-accuse-row">
          <button class="btn" id="md-go">⚖️ Accuse</button>
          <span class="md-verdict" id="md-verdict"></span>
        </div>
      </section>`;

    renderGrids();
    document.getElementById("md-prev").onclick = () => load(caseNum - 1);
    document.getElementById("md-next").onclick = () => load(caseNum + 1);
    root.querySelectorAll("[data-pick]").forEach((b) => b.onclick = () => { pick[b.dataset.pick] = pick[b.dataset.pick] === +b.dataset.i ? null : +b.dataset.i; render(); });
    document.getElementById("md-go").onclick = accuse;
  }
  function renderGrids() {
    document.getElementById("md-grids").innerHTML =
      gridBlock("sw", C.suspects, C.weapons, "Suspects × Weapons") +
      gridBlock("sl", C.suspects, C.locations, "Suspects × Locations") +
      gridBlock("wl", C.weapons, C.locations, "Weapons × Locations");
    document.querySelectorAll(".md-cell").forEach((b) => b.onclick = () => setCell(b.dataset.g, b.dataset.r, b.dataset.c));
  }
  function accuse() {
    const v = document.getElementById("md-verdict");
    if (pick.suspect == null || pick.weapon == null) { v.textContent = "Pick a suspect and a weapon first."; v.className = "md-verdict warn"; return; }
    if (pick.suspect === C.solution.suspect && pick.weapon === C.solution.weapon) {
      v.innerHTML = `🎉 Case closed! <b>${esc(C.suspects[C.solution.suspect].name)}</b> did it with the <b>${esc(C.weapons[C.solution.weapon].name)}</b> in <b>${esc(C.locations[C.solution.location].name)}</b>.`;
      v.className = "md-verdict ok";
      const list = solvedList(); if (!list.includes(caseNum)) { list.push(caseNum); lsSet(SOLVED, list); }
      document.getElementById("md-go").outerHTML = `<button class="btn" id="md-nextcase">Next case ▸</button>`;
      document.getElementById("md-nextcase").onclick = () => load(caseNum + 1);
    } else {
      v.textContent = "That doesn't fit the evidence. Re-examine the clues.";
      v.className = "md-verdict err";
    }
  }

  if (window.MURDOKU) load(START); else root.innerHTML = `<p class="tool-note">Couldn't load the case engine.</p>`;
})();
