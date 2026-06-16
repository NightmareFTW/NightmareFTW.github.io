/* Renders a game detail page. Reads <body data-game="id">. Tool hrefs in
   data.js are relative to the site root, so we strip the leading "games/<id>/". */
(function () {
  const id = document.body.dataset.game;
  const game = GAMES.find((g) => g.id === id);
  if (!game) return;

  document.title = `${game.name} · NightmareFTW`;
  document.getElementById("bc-game").textContent = game.name;

  document.getElementById("game-hero").innerHTML = `
    <div class="game-icon" style="background:${game.color}">${game.icon}</div>
    <div>
      <h1>${game.name}</h1>
      <p>${game.blurb}</p>
    </div>`;

  const grid = document.getElementById("tool-grid");
  if (!game.tools.length) {
    grid.innerHTML = `<p style="color:var(--muted)">No tools yet — coming soon.</p>`;
    return;
  }

  const localHref = (href) => href.replace(`games/${game.id}/`, "");

  grid.innerHTML = game.tools.map((tool) => {
    const inner = `
      <span class="tool-type">${tool.type}</span>
      <h3>${tool.name}</h3>
      <p>${tool.desc}</p>`;
    if (tool.available) {
      return `<a class="tool-card" href="${localHref(tool.href)}">${inner}</a>`;
    }
    return `<div class="tool-card disabled">${inner}<p style="margin-top:10px"><span class="soon-badge">soon</span></p></div>`;
  }).join("");
})();
