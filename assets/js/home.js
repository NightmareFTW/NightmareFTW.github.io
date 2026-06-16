/* Renders the game grid on the home page from GAMES (data.js). */
(function () {
  const grid = document.getElementById("game-grid");
  const countEl = document.getElementById("game-count");
  if (!grid) return;

  countEl.textContent = `${GAMES.length} games`;

  grid.innerHTML = GAMES.map((game) => {
    const liveTools = game.tools.filter((t) => t.available).length;
    const hasTools = liveTools > 0;
    const href = hasTools ? `games/${game.id}/index.html` : null;
    const tag = hasTools
      ? `<span class="tool-badge">${liveTools} tool${liveTools > 1 ? "s" : ""}</span>`
      : `<span class="soon-badge">soon</span>`;

    const banner = `<div class="game-banner" style="background:${game.color}"><img src="${game.banner}" alt="${game.name}" loading="lazy"></div>`;
    const inner = `
      ${banner}
      <div class="game-card-body">
        <h3>${game.name}</h3>
        <p>${game.blurb}</p>
        <div class="game-meta">
          <span>${game.tools.length || "no"} tool${game.tools.length === 1 ? "" : "s"}</span>
          ${tag}
        </div>
      </div>`;

    if (href) {
      return `<a class="game-card" href="${href}" style="--glow:${game.glow}">${inner}</a>`;
    }
    return `<div class="game-card disabled" style="--glow:${game.glow}">${inner}</div>`;
  }).join("");
})();
