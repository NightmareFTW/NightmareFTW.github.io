/* Warframe — Build Showcase. Browses/likes public builds saved via
   builder.js (worker /builds). Cross-references each build's mod/arcane
   slugs against data/warframe/items.json for names/images, since the
   saved `data` blob only stores slugs, not a content snapshot. */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const root = document.getElementById("wf-showcase");
  const WORKER = "https://nftw-auth.nightmareftw.workers.dev";
  const params = new URLSearchParams(location.search);

  let ITEMS = null;
  let category = params.get("category") || "";
  let sort = "newest";

  const bySlug = (list, slug) => (list || []).find((x) => x.slug === slug) || null;
  function subjectImageFor(b) {
    const list = b.category === "warframe" ? ITEMS.warframes : b.category === "weapon" ? ITEMS.weapons : ITEMS.companions;
    return (bySlug(list, (b.subject || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) || {}).image || "";
  }

  async function authedFetch(url, opts = {}) {
    const headers = Object.assign({}, opts.headers);
    if (window.NFTWAuth && window.NFTWAuth.token()) headers.Authorization = `Bearer ${window.NFTWAuth.token()}`;
    return fetch(url, Object.assign({}, opts, { headers }));
  }

  function buildCard(b) {
    const img = subjectImageFor(b);
    return `<a class="wf-build-card" href="builds.html?id=${encodeURIComponent(b.id)}" data-id="${esc(b.id)}">
      <div class="wf-build-card-head">
        ${img ? `<img src="${esc(img)}" alt="">` : ""}
        <div>
          <h3>${esc(b.title)}</h3>
          <p class="wf-build-card-sub">${esc(b.subject)} · ${esc(b.category)}</p>
        </div>
      </div>
      <p class="wf-build-card-meta">
        <span>by ${esc(b.author)}</span>
        <button type="button" class="wf-like-btn" data-like="${esc(b.id)}">♥ <span>${b.likes || 0}</span></button>
      </p>
    </a>`;
  }

  function wireLikeButtons(container) {
    container.querySelectorAll("[data-like]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!window.NFTWAuth || !window.NFTWAuth.token()) { window.NFTWAuth?.open?.("login"); return; }
        const id = btn.dataset.like;
        try {
          const res = await authedFetch(`${WORKER}/builds/${encodeURIComponent(id)}/like`, { method: "POST" });
          const out = await res.json();
          if (res.ok) {
            btn.classList.toggle("wf-liked", !!out.liked);
            btn.querySelector("span").textContent = out.likes;
          }
        } catch (e2) {}
      });
    });
  }

  async function renderList() {
    root.innerHTML = `
      <div class="wf-controls">
        <button type="button" class="wf-tab ${!category ? "active" : ""}" data-cat="">All</button>
        <button type="button" class="wf-tab ${category === "warframe" ? "active" : ""}" data-cat="warframe">Warframes</button>
        <button type="button" class="wf-tab ${category === "weapon" ? "active" : ""}" data-cat="weapon">Weapons</button>
        <button type="button" class="wf-tab ${category === "companion" ? "active" : ""}" data-cat="companion">Companions</button>
        <select id="wf-sort" class="wf-select" style="margin-left:auto">
          <option value="newest" ${sort === "newest" ? "selected" : ""}>Sort: Newest</option>
          <option value="likes" ${sort === "likes" ? "selected" : ""}>Sort: Most liked</option>
        </select>
      </div>
      <div class="wf-build-grid" id="wf-build-grid"><p class="wf-empty">Loading…</p></div>`;

    root.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => { category = b.dataset.cat; renderList(); }));
    document.getElementById("wf-sort").addEventListener("change", (e) => { sort = e.target.value; renderList(); });

    const grid = document.getElementById("wf-build-grid");
    try {
      const qs = new URLSearchParams();
      if (category) qs.set("category", category);
      if (sort === "likes") qs.set("sort", "likes");
      const res = await fetch(`${WORKER}/builds?${qs}`);
      const out = await res.json();
      const builds = out.builds || [];
      grid.innerHTML = builds.length ? builds.map(buildCard).join("") : `<p class="wf-empty">No builds yet — be the first from the <a href="builder.html" style="color:var(--wf-cyan-bright)">Build Creator</a>.</p>`;
      wireLikeButtons(grid);
    } catch (e) {
      grid.innerHTML = `<p class="wf-empty">Couldn't load the showcase right now.</p>`;
    }
  }

  async function renderDetail(id) {
    root.innerHTML = `<p class="wf-empty">Loading…</p>`;
    let b;
    try {
      const res = await fetch(`${WORKER}/builds/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("not found");
      b = await res.json();
    } catch (e) {
      root.innerHTML = `<p class="wf-empty">That build couldn't be found.</p><a class="wf-detail-back" href="builds.html">← Back to showcase</a>`;
      return;
    }
    const data = (() => { try { return JSON.parse(b.data); } catch { return {}; } })();
    const modList = b.category === "warframe" ? ITEMS.mods.filter((m) => m.type === "Warframe Mod") : ITEMS.mods;
    const slotName = (kind, slug) => {
      if (!slug) return null;
      const list = kind === "arcane" ? ITEMS.arcanes : ITEMS.mods;
      return bySlug(list, slug);
    };
    const subjImg = subjectImageFor(b);
    const slotHtml = (item) => item
      ? `<div class="wf-slot" style="cursor:default">${item.image ? `<img src="${esc(item.image)}" alt="">` : `<span class="wf-slot-plus">${esc(item.name[0])}</span>`}<span class="wf-slot-name">${esc(item.name)}</span></div>`
      : `<div class="wf-slot wf-slot-empty" style="cursor:default"><span class="wf-slot-plus">—</span></div>`;

    const mods = (data.mods || []).map((s) => slotName("mod", s));
    const arcanes = (data.arcanes || []).map((s) => slotName("arcane", s));
    const aura = slotName("mod", data.aura);
    const exilus = slotName("mod", data.exilus);
    const isMine = window.NFTWAuth && window.NFTWAuth.token() && window.NFTWAuth.email && b.author === (window.NFTWAuth.email() || "").split("@")[0];

    root.innerHTML = `
      <a class="wf-detail-back" href="builds.html">← Back to showcase</a>
      <section class="wf-panel wf-build-area" style="--wfc: var(--wf-cyan);">
        <div class="wf-corner tl"></div>
        <div class="wf-build-head">
          ${subjImg ? `<img src="${esc(subjImg)}" alt="" class="wf-build-portrait">` : ""}
          <div>
            <h2>${esc(b.title)}</h2>
            <p class="wf-build-card-sub">${esc(b.subject)} · ${esc(b.category)} · by ${esc(b.author)}</p>
          </div>
        </div>
        ${data.notes ? `<p style="margin:0 0 20px; color:var(--wf-muted); font-size:.88rem; line-height:1.5">${esc(data.notes)}</p>` : ""}

        <div class="wf-slot-section">
          <p class="wf-tag" style="color:var(--wf-cyan)">Mods</p>
          <div class="wf-slot-grid">${mods.map(slotHtml).join("")}</div>
        </div>
        ${aura || exilus ? `<div class="wf-slot-section">
          <p class="wf-tag" style="color:var(--wf-amber)">${b.category === "warframe" ? "Aura" : "Exilus"}</p>
          <div class="wf-slot-grid wf-slot-grid-1">${slotHtml(b.category === "warframe" ? aura : exilus)}</div>
        </div>` : ""}
        ${arcanes.length ? `<div class="wf-slot-section">
          <p class="wf-tag" style="color:var(--wf-amber)">Arcanes</p>
          <div class="wf-slot-grid wf-slot-grid-2">${arcanes.map(slotHtml).join("")}</div>
        </div>` : ""}

        <div class="wf-build-actions">
          <button type="button" class="wf-like-btn" data-like="${esc(b.id)}" style="font-size:.9rem">♥ <span>${b.likes || 0}</span></button>
          ${isMine ? `<button type="button" class="wf-redeem-btn" id="wf-delete" style="color:#ff8a8a; border-color:rgba(255,90,90,.4)">Delete build</button>` : ""}
        </div>
      </section>`;
    wireLikeButtons(root);
    document.getElementById("wf-delete")?.addEventListener("click", async () => {
      const pt = localStorage.getItem("nftw:lang") === "pt";
      if (!confirm(pt ? "Eliminar esta build? Isto não pode ser desfeito." : "Delete this build? This can't be undone.")) return;
      const res = await authedFetch(`${WORKER}/builds/${encodeURIComponent(b.id)}`, { method: "DELETE" });
      if (res.ok) location.href = "builds.html";
    });
  }

  (async function init() {
    try {
      ITEMS = await (await fetch(`../../data/warframe/items.json?cb=${Date.now()}`)).json();
    } catch (e) {
      root.innerHTML = `<p class="wf-empty">Couldn't load the item database.</p>`;
      return;
    }
    const id = params.get("id");
    if (id) renderDetail(id); else renderList();
  })();
})();
