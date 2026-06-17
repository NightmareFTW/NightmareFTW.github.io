/* Renders the game grid on the home page from GAMES (data.js), with live
   search, sorting and switchable views (grid / list / compact). */
(function () {
  const grid = document.getElementById("game-grid");
  const countEl = document.getElementById("game-count");
  const searchEl = document.getElementById("game-search");
  const sortEl = document.getElementById("game-sort");
  const toggle = document.getElementById("view-toggle");
  const noResults = document.getElementById("no-results");
  if (!grid) return;

  let query = "";
  let sort = "default";
  let view = localStorage.getItem("nftw:homeView") || "grid";

  function liveTools(g) { return g.tools.filter((t) => t.available).length; }

  function cardHtml(game) {
    const lt = liveTools(game);
    const has = lt > 0;
    const href = has ? `games/${game.id}/index.html` : null;
    const tag = has
      ? `<span class="tool-badge">${lt} tool${lt > 1 ? "s" : ""}</span>`
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
    const cls = `game-card${has ? "" : " disabled"}`;
    return href
      ? `<a class="${cls}" href="${href}" style="--glow:${game.glow}">${inner}</a>`
      : `<div class="${cls}" style="--glow:${game.glow}">${inner}</div>`;
  }

  function render() {
    let list = GAMES.filter((g) => g.name.toLowerCase().includes(query));
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "za") list.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "tools") list.sort((a, b) => liveTools(b) - liveTools(a));

    grid.className = `game-grid view-${view}`;
    grid.innerHTML = list.map(cardHtml).join("");
    noResults.style.display = list.length ? "none" : "block";
    countEl.textContent = query
      ? `${list.length} of ${GAMES.length}`
      : `${GAMES.length} games`;
  }

  searchEl.addEventListener("input", () => { query = searchEl.value.trim().toLowerCase(); render(); });
  sortEl.addEventListener("change", () => { sort = sortEl.value; render(); });
  toggle.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      view = b.dataset.view;
      localStorage.setItem("nftw:homeView", view);
      toggle.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    }));

  // restore saved view on the toggle
  toggle.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  render();
})();
