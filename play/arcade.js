/* Play / Arcade — landing. Lists the browser games. Add a game by appending to
   GAMES. Reads per-game progress from localStorage where relevant. Vanilla JS. */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const solved = () => { try { return (JSON.parse(localStorage.getItem("nftw:murdoku:solved")) || []).length; } catch (e) { return 0; } };
  const PT = localStorage.getItem("nftw:lang") === "pt";
  const solvedTag = () => { const n = solved(); return PT ? `${n} ${n === 1 ? "caso resolvido" : "casos resolvidos"}` : `${n} ${n === 1 ? "case solved" : "cases solved"}`; };

  const GAMES = [
    {
      id: "murdoku", name: "Murdoku", emoji: "🕵️", icon: "../assets/img/games/murdoku-icon.png", color: "#e44b4b",
      blurb: "A murder-mystery logic puzzle. Read the clue cards, work the deduction grid and name the culprit. Chapters of endless cases.",
      href: "murdoku/index.html", tag: solvedTag, available: true,
    },
    // ➕ New games go here.
  ];

  document.getElementById("play-grid").innerHTML = GAMES.map((g) => {
    const inner = `
      ${g.icon
        ? `<span class="play-emoji play-icon" style="--c:${g.color || "var(--accent)"}"><img src="${esc(g.icon)}" alt="${esc(g.name)}"></span>`
        : `<span class="play-emoji" style="--c:${g.color || "var(--accent)"}">${g.emoji}</span>`}
      <div class="play-meta">
        <span class="play-name">${esc(g.name)}</span>
        <p class="play-blurb">${esc(g.blurb)}</p>
        <span class="${g.available ? "tool-badge" : "soon-badge"}">${g.available ? esc(g.tag ? g.tag() : "Play") : "soon"}</span>
      </div>`;
    return g.available
      ? `<a class="play-card" href="${esc(g.href)}">${inner}</a>`
      : `<div class="play-card disabled">${inner}</div>`;
  }).join("") + `<div class="play-card play-more"><span class="play-emoji">✨</span><div class="play-meta"><span class="play-name">More coming</span><p class="play-blurb">New browser games get added here over time.</p></div></div>`;
})();
