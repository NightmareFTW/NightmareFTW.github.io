/* Renders the game grid on the home page from GAMES (data.js).
   Features: live search, sorting and grid/list/compact views, plus
   user-pinned games (shown in their own section above the list) and
   drag-to-reorder of the "Default" order. Pins + custom order persist in
   localStorage. */
(function () {
  const grid = document.getElementById("game-grid");
  const pinnedSection = document.getElementById("pinned-section");
  const pinnedGrid = document.getElementById("pinned-grid");
  const pinnedCount = document.getElementById("pinned-count");
  const countEl = document.getElementById("game-count");
  const searchEl = document.getElementById("game-search");
  const sortEl = document.getElementById("game-sort");
  const toggle = document.getElementById("view-toggle");
  const noResults = document.getElementById("no-results");
  if (!grid) return;

  const PIN_KEY = "nftw:pinnedGames";
  const ORDER_KEY = "nftw:gameOrder";

  const PIN_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 3h6l-1 2v5l3 3v2h-5v5l-1 2-1-2v-5H4v-2l3-3V5z" fill="currentColor"/></svg>';
  const allIds = () => GAMES.map((g) => g.id);
  const byId = (id) => GAMES.find((g) => g.id === id);
  const alpha = (ids) => ids.slice().sort((a, b) => byId(a).name.localeCompare(byId(b).name));
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // pinned ids (ordered), filtered to games that still exist
  let pinned = load(PIN_KEY).filter((id) => byId(id));
  // custom "Default" order: saved order (filtered) + any new games appended A-Z;
  // with nothing saved yet the default IS alphabetical.
  function buildOrder() {
    const saved = load(ORDER_KEY).filter((id) => byId(id));
    const missing = alpha(allIds().filter((id) => !saved.includes(id)));
    return saved.length ? saved.concat(missing) : alpha(allIds());
  }
  let order = buildOrder();

  let query = "";
  let sort = "default";
  let view = localStorage.getItem("nftw:homeView") || "grid";

  const liveTools = (g) => g.tools.filter((t) => t.available).length;
  const isPinned = (id) => pinned.includes(id);

  function cardHtml(game, draggable) {
    const lt = liveTools(game);
    const has = lt > 0;
    const href = has ? `games/${game.id}/index.html` : null;
    const tag = has ? `<span class="tool-badge">${lt} tool${lt > 1 ? "s" : ""}</span>` : `<span class="soon-badge">soon</span>`;
    const banner = `<div class="game-banner" style="background:${game.color}"><img src="${game.banner}" alt="${game.name}" loading="lazy"></div>`;
    const controls =
      `<button class="pin-btn ${isPinned(game.id) ? "pinned" : ""}" data-id="${game.id}" title="${isPinned(game.id) ? "Unpin" : "Pin"}" aria-label="${isPinned(game.id) ? "Unpin game" : "Pin game"}">${PIN_SVG}</button>` +
      (draggable ? `<span class="drag-handle" title="Drag to reorder" aria-hidden="true">⠿</span>` : "");
    const inner = `${controls}${banner}
      <div class="game-card-body">
        <h3>${game.name}</h3>
        <p>${game.blurb}</p>
        <div class="game-meta">
          <span>${game.tools.length || "no"} tool${game.tools.length === 1 ? "" : "s"}</span>
          ${tag}
        </div>
      </div>`;
    const cls = `game-card${has ? "" : " disabled"}${draggable ? " is-draggable" : ""}`;
    return href
      ? `<a class="${cls}" href="${href}" style="--glow:${game.glow}" data-id="${game.id}">${inner}</a>`
      : `<div class="${cls}" style="--glow:${game.glow}" data-id="${game.id}">${inner}</div>`;
  }

  function sortList(ids) {
    if (sort === "az") return alpha(ids);
    if (sort === "za") return alpha(ids).reverse();
    if (sort === "tools") return ids.slice().sort((a, b) => liveTools(byId(b)) - liveTools(byId(a)));
    return order.filter((id) => ids.includes(id)); // "default" = custom order
  }

  function render() {
    const matches = (g) => g.name.toLowerCase().includes(query);
    const pinnedIds = pinned.filter((id) => matches(byId(id)));
    const mainIds = sortList(allIds().filter((id) => !isPinned(id) && matches(byId(id))));

    // pinned section (always drag-sortable in its own order)
    pinnedSection.hidden = pinnedIds.length === 0;
    pinnedGrid.className = `game-grid view-${view}`;
    pinnedGrid.innerHTML = pinnedIds.map((id) => cardHtml(byId(id), true)).join("");
    pinnedCount.textContent = `${pinnedIds.length} pinned`;

    // main list (drag-sortable only in Default sort, and not while searching)
    const canDragMain = sort === "default" && !query;
    grid.className = `game-grid view-${view}`;
    grid.innerHTML = mainIds.map((id) => cardHtml(byId(id), canDragMain)).join("");
    noResults.style.display = (pinnedIds.length + mainIds.length) ? "none" : "block";
    countEl.textContent = query
      ? `${mainIds.length + pinnedIds.length} of ${GAMES.length}`
      : `${GAMES.length} games`;

    wireCards(pinnedGrid, () => savePinnedFromDom(pinnedGrid));
    wireCards(grid, canDragMain ? () => saveOrderFromDom(grid) : null);
  }

  // ---- pin toggle + drag reorder wiring ----
  function wireCards(container, onReorder) {
    container.querySelectorAll(".pin-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const id = btn.dataset.id;
        if (isPinned(id)) pinned = pinned.filter((x) => x !== id);
        else pinned = pinned.concat(id);
        save(PIN_KEY, pinned);
        render();
      });
    });
    if (!onReorder) return;
    container.querySelectorAll(".game-card.is-draggable").forEach((card) => {
      const handle = card.querySelector(".drag-handle");
      if (handle) {
        const arm = () => card.setAttribute("draggable", "true");
        handle.addEventListener("mousedown", arm);
        handle.addEventListener("touchstart", arm, { passive: true });
      }
      card.addEventListener("dragstart", (e) => {
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", card.dataset.id); } catch (_) {}
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        card.removeAttribute("draggable");
        container.querySelectorAll(".drag-over-before,.drag-over-after").forEach((x) => x.classList.remove("drag-over-before", "drag-over-after"));
      });
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = container.querySelector(".dragging");
        if (!dragging || card === dragging) return;
        const box = card.getBoundingClientRect();
        const after = e.clientX > box.left + box.width / 2;
        card.classList.toggle("drag-over-after", after);
        card.classList.toggle("drag-over-before", !after);
      });
      card.addEventListener("dragleave", () => card.classList.remove("drag-over-before", "drag-over-after"));
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        const dragging = container.querySelector(".dragging");
        card.classList.remove("drag-over-before", "drag-over-after");
        if (!dragging || card === dragging) return;
        const box = card.getBoundingClientRect();
        if (e.clientX > box.left + box.width / 2) card.after(dragging); else card.before(dragging);
        onReorder();
      });
    });
  }

  function saveOrderFromDom(container) {
    const ids = [...container.querySelectorAll(".game-card")].map((c) => c.dataset.id);
    // keep pinned + filtered-out games in their existing relative spots
    const rest = order.filter((id) => !ids.includes(id));
    order = ids.concat(rest);
    save(ORDER_KEY, order);
  }
  function savePinnedFromDom(container) {
    pinned = [...container.querySelectorAll(".game-card")].map((c) => c.dataset.id);
    save(PIN_KEY, pinned);
  }

  // ---- controls ----
  searchEl.addEventListener("input", () => { query = searchEl.value.trim().toLowerCase(); render(); });
  sortEl.addEventListener("change", () => { sort = sortEl.value; render(); });
  toggle.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      view = b.dataset.view;
      localStorage.setItem("nftw:homeView", view);
      toggle.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    }));
  toggle.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  render();
})();
