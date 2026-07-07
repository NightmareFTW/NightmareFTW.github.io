/* Murdoku — spatial game UI. Uses window.MURDOKU (engine.js).
   A colour-coded store map (3×3 areas). Pick a suspect from the tray, then use
   Place / Cross / Erase to work out where everyone was from the clues. Avatars
   come from DiceBear. Progress + board state persist under "nftw:murdoku:*",
   so they save on-device and sync to your account when signed in. */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const SOLVED = "nftw:murdoku:solved", CURKEY = "nftw:murdoku:case", STATE = "nftw:murdoku:state";
  const avatar = (name) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&radius=50`;
  const mmss = (s) => `${String((s / 60) | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const root = document.getElementById("md-root");
  let C = null, caseNum = 0, sel = 0, mode = "place";
  let placements = {}, crosses = {}, secs = 0, timer = null, won = false;

  const START = (new URLSearchParams(location.search).get("case") | 0) || lsGet(CURKEY, 0) || 0;

  function load(n) {
    caseNum = Math.max(0, n | 0);
    C = MURDOKU.generateCase(caseNum);
    lsSet(CURKEY, caseNum);
    const st = lsGet(STATE, {});
    if (st.case === caseNum) { placements = st.placements || {}; crosses = st.crosses || {}; secs = st.secs || 0; }
    else { placements = {}; crosses = {}; secs = 0; }
    sel = 0; mode = "place"; won = isSolved(caseNum);
    render(); startTimer();
  }
  const save = () => lsSet(STATE, { case: caseNum, placements, crosses, secs });
  const solvedList = () => lsGet(SOLVED, []);
  const isSolved = (n) => solvedList().includes(n);
  function startTimer() { clearInterval(timer); if (won) return; timer = setInterval(() => { secs++; const el = document.getElementById("md-timer"); if (el) el.textContent = mmss(secs); if (secs % 5 === 0) save(); }, 1000); }

  function areaAt(a) { for (const s in placements) if (placements[s] === a) return +s; return -1; }

  function place(a) {
    if (won) return;
    if (mode === "place") {
      const occ = areaAt(a); if (occ >= 0 && occ !== sel) delete placements[occ]; // one suspect per area
      placements[sel] = a;
      delete crosses[`${sel}:${a}`];
      const next = C.suspects.findIndex((_, i) => placements[i] == null); if (next >= 0) sel = next;
    } else if (mode === "cross") {
      const k = `${sel}:${a}`; if (crosses[k]) delete crosses[k]; else crosses[k] = 1;
    } else if (mode === "erase") {
      const occ = areaAt(a); if (occ >= 0) delete placements[occ];
      delete crosses[`${sel}:${a}`];
    }
    save(); checkWin(); render();
  }
  function hint() {
    if (won) return;
    const unplaced = C.suspects.map((_, i) => i).filter((i) => placements[i] !== C.solution[i]);
    if (!unplaced.length) return;
    const s = unplaced[Math.floor(Math.random() * unplaced.length)];
    const occ = areaAt(C.solution[s]); if (occ >= 0) delete placements[occ];
    placements[s] = C.solution[s];
    save(); checkWin(); render();
  }
  function checkWin() {
    if (won) return;
    for (let i = 0; i < C.N; i++) if (placements[i] !== C.solution[i]) return;
    won = true; clearInterval(timer);
    const list = solvedList(); if (!list.includes(caseNum)) { list.push(caseNum); lsSet(SOLVED, list); }
  }

  // ---- render ----
  function areaCell(a, i) {
    const su = areaAt(i);
    const crossed = su < 0 && crosses[`${sel}:${i}`];
    const label = a.name.replace(/^the /, "");
    return `<button class="mdm-area zone-${a.zone}${su >= 0 ? " has-sus" : ""}" data-a="${i}">
      <span class="mdm-fixture">${a.emoji}</span>
      <span class="mdm-alabel">${esc(label)}</span>
      ${su >= 0 ? `<img class="mdm-avatar" src="${avatar(C.suspects[su].name)}" alt="${esc(C.suspects[su].name)}" style="border-color:${C.suspects[su].color}" referrerpolicy="no-referrer">` : ""}
      ${crossed ? `<span class="mdm-x">✕</span>` : ""}
    </button>`;
  }
  function trayItem(s, i) {
    const placed = placements[i] != null;
    return `<button class="mdm-sus${i === sel ? " on" : ""}${placed ? " placed" : ""}" data-s="${i}" title="${esc(s.name)}" style="--c:${s.color}">
      <img src="${avatar(s.name)}" alt="${esc(s.name)}" referrerpolicy="no-referrer">
      <span>${esc(s.name)}</span>${placed ? '<span class="mdm-dot">✓</span>' : ""}
    </button>`;
  }
  const tool = (id, icon, label) => `<button class="mdm-tool${mode === id ? " on" : ""}" data-tool="${id}"><span>${icon}</span>${label}</button>`;

  function render() {
    const placedN = Object.keys(placements).length;
    root.innerHTML = `
      <div class="md-bar">
        <div class="md-casenav">
          <button class="mini-btn" id="md-prev" ${caseNum <= 0 ? "disabled" : ""}>‹</button>
          <span class="md-caseno">#${caseNum + 1} · ${esc(C.title)}</span>
          <button class="mini-btn" id="md-next">›</button>
        </div>
        <div class="md-bar-r"><span class="md-timer" id="md-timer">${mmss(secs)}</span><button class="mini-btn" id="md-reset" title="Reset this case">↻</button><span class="md-progress">${solvedList().length} solved</span></div>
      </div>
      <p class="md-briefline">${esc(C.brief)}</p>

      <div class="mdm-map">${C.areas.map((a, i) => areaCell(a, i)).join("")}</div>

      <div class="mdm-toolbar">
        ${tool("place", "✓", "Place")}${tool("cross", "✕", "Cross")}${tool("erase", "⌫", "Erase")}
        <button class="mdm-tool mdm-hint" id="md-hint"><span>💡</span>Hint</button>
      </div>
      <div class="mdm-tray" id="md-tray">${C.suspects.map((s, i) => trayItem(s, i)).join("")}</div>

      <div class="md-cols mdm-lower">
        <section class="panel md-clues"><h2>Clues</h2><ol>${C.clues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
          <p class="md-hint">Pick a suspect, then <b>Place</b> them in an area — or <b>Cross</b> the areas they weren't in. Each area holds one person.</p></section>
        <section class="panel mdm-status">
          <h2>Investigation</h2>
          <p class="mdm-count">${placedN} / ${C.N} placed</p>
          ${won ? `<p class="md-verdict ok">🎉 Case solved${isSolved(caseNum) ? "" : ""} in ${mmss(secs)}! Every suspect is in the right place.</p><button class="btn" id="md-nextcase">Next case ▸</button>`
        : `<p class="mdm-note">Place all ${C.N} suspects correctly to close the case.</p>`}
        </section>
      </div>`;

    root.querySelectorAll(".mdm-area").forEach((b) => b.onclick = () => place(+b.dataset.a));
    root.querySelectorAll("[data-s]").forEach((b) => b.onclick = () => { sel = +b.dataset.s; render(); });
    root.querySelectorAll("[data-tool]").forEach((b) => b.onclick = () => { mode = b.dataset.tool; render(); });
    document.getElementById("md-hint").onclick = hint;
    document.getElementById("md-prev").onclick = () => load(caseNum - 1);
    document.getElementById("md-next").onclick = () => load(caseNum + 1);
    document.getElementById("md-reset").onclick = () => { if (confirm("Reset this case's board?")) { placements = {}; crosses = {}; secs = 0; won = false; save(); render(); startTimer(); } };
    const nc = document.getElementById("md-nextcase"); if (nc) nc.onclick = () => load(caseNum + 1);
  }

  if (window.MURDOKU) load(START); else root.innerHTML = `<p class="tool-note">Couldn't load the case engine.</p>`;
})();
