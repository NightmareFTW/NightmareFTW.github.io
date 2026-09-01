/* Home page — "What's New" carousel.
   Renders SITE_UPDATES (data.js) as an auto-advancing, swipeable strip of
   cards with a game banner image, replacing the old single-line "New in
   Play" pill. Vanilla JS, no deps — same pattern as the rest of the site.
   Title/desc are plain chrome text and go through i18n.js's normal DOM
   translator like everything else on this page (see its DICT), so this file
   never needs its own language branching. Only the date format is picked
   directly, same as steam-alerts.js, since Intl output isn't part of the DOM
   text nodes i18n.js walks. */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const section = document.getElementById("updates-carousel");
  const track = document.getElementById("uc-track");
  const dotsEl = document.getElementById("uc-dots");
  const prevBtn = document.getElementById("uc-prev");
  const nextBtn = document.getElementById("uc-next");
  if (!section || !track || typeof SITE_UPDATES === "undefined" || !SITE_UPDATES.length) return;

  const lang = (() => { try { return localStorage.getItem("nftw:lang") === "pt" ? "pt" : "en"; } catch (e) { return "en"; } })();
  const fmtDate = (iso) => {
    try { return new Date(iso + "T00:00:00").toLocaleDateString(lang === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "short" }); }
    catch (e) { return iso; }
  };

  let idx = 0;
  let timer = null;
  const AUTO_MS = 6000;

  track.innerHTML = SITE_UPDATES.map((u) => `
    <a class="uc-slide" href="${esc(u.href)}">
      <img class="uc-slide-img" src="${esc(u.image)}" alt="" loading="lazy" onerror="this.style.display='none'">
      <span class="uc-slide-fade"></span>
      <span class="uc-slide-body">
        <span class="uc-slide-date">${esc(fmtDate(u.date))}</span>
        <span class="uc-slide-title">${esc(u.title)}</span>
        <span class="uc-slide-desc">${esc(u.desc)}</span>
      </span>
    </a>`).join("");
  dotsEl.innerHTML = SITE_UPDATES.map((_, i) => `<button type="button" class="uc-dot" data-i="${i}" aria-label="Go to slide ${i + 1}"></button>`).join("");

  const slides = [...track.children];
  const dots = [...dotsEl.children];

  function show(i) {
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle("on", di === idx));
  }
  function next() { show(idx + 1); }
  function prev() { show(idx - 1); }
  function restart() { clearInterval(timer); timer = setInterval(next, AUTO_MS); }

  prevBtn.addEventListener("click", () => { prev(); restart(); });
  nextBtn.addEventListener("click", () => { next(); restart(); });
  dots.forEach((d) => d.addEventListener("click", () => { show(+d.dataset.i); restart(); }));
  section.addEventListener("mouseenter", () => clearInterval(timer));
  section.addEventListener("mouseleave", restart);

  section.hidden = false;
  show(0);
  restart();
})();
