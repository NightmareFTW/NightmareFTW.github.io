/* Clair Obscur: Expedition 33 — Meta Builds.
   Recreates the in-game build screen: a character tab strip, then panels for
   Weapon + Skills, Pictos, Luminas and Attributes, plus playstyle and pros/cons.
   Data: data/expedition-33/builds.json. Vanilla JS, no deps. */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const ATTRS = [
  ["vitality", "Vitality", "#6fcf8a"],
  ["might", "Might", "#ff5b5b"],
  ["agility", "Agility", "#6aa8ff"],
  ["defense", "Defense", "#c9a24b"],
  ["luck", "Luck", "#fcd34d"],
];

let DATA = null, active = 0;
const screen = document.getElementById("ex-screen");

function attrBars(c, max) {
  const focus = new Set((c.attrFocus || []).map((s) => s.toLowerCase()));
  return `<div class="cb-attrs">${ATTRS.map(([k, label, col]) => {
    const v = c.attributes[k] || 0;
    const pct = Math.round((v / max) * 100);
    const isF = focus.has(k);
    return `<div class="cb-attr ${isF ? "is-primary" : ""}">
      <span class="cb-attr-name">${label}${isF ? ' <span class="cb-prim">★</span>' : ""}</span>
      <span class="cb-attr-track"><span class="cb-attr-fill" style="width:${pct}%;background:${col}"></span></span>
      <span class="cb-attr-val" style="color:${col}">${v}</span>
    </div>`;
  }).join("")}</div>`;
}

function buildScreen(c) {
  const max = DATA.attrMax || 99;
  const scales = (c.weapon.scales || []).map((s) => `<span class="ex-chip">${esc(s)}</span>`).join("");
  const skills = (c.skills || []).map((s) => `<li><span class="ex-skill-dot"></span>${esc(s)}</li>`).join("");
  const pictos = (c.pictos || []).map((p) => `
    <div class="ex-picto">
      <span class="ex-picto-ico ${p.img ? "" : "none"}">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.closest('.ex-picto-ico').classList.add('none');this.remove()">` : ""}</span>
      <span class="ex-picto-body">
        <span class="ex-picto-name">${esc(p.name)}</span>
        <span class="ex-picto-effect">${esc(p.effect)}</span>
      </span>
    </div>`).join("");
  const luminas = (c.luminas || []).map((l) => `
    <div class="ex-lumina"><span class="ex-lumina-name">${esc(l.name)}</span><span class="ex-lumina-cost">${esc(l.cost)}</span></div>`).join("");

  return `
    <div class="ex-hero">
      <span class="ex-hero-portrait">${c.portrait ? `<img src="${esc(c.portrait)}" alt="${esc(c.name)}" loading="lazy" onerror="this.remove()">` : ""}</span>
      <div class="ex-hero-text">
        <span class="ex-hero-name">${esc(c.name)}<span class="ex-hero-role">${esc(c.role)}</span></span>
        ${c.teamRole ? `<span class="ex-hero-team"><b>Team role —</b> ${esc(c.teamRole)}</span>` : ""}
      </div>
    </div>
    <p class="cb-summary ex-summary">${esc(c.summary)}</p>
    <div class="ex-grid">
      <section class="ex-panel ex-weapon-panel">
        <h3 class="ex-panel-h">Weapon</h3>
        <div class="ex-weapon">
          <span class="ex-weapon-name">${esc(c.weapon.name)}</span>
          <div class="ex-weapon-meta">
            <span class="ex-wm"><b>Element</b>${esc(c.weapon.element || "—")}</span>
            <span class="ex-wm"><b>Scales</b>${scales || "—"}</span>
          </div>
        </div>
        <h3 class="ex-panel-h ex-skills-h">Skills</h3>
        <ul class="ex-skills">${skills}</ul>
      </section>

      <section class="ex-panel">
        <h3 class="ex-panel-h">Pictos</h3>
        <div class="ex-pictos">${pictos}</div>
      </section>

      <section class="ex-panel">
        <h3 class="ex-panel-h">Luminas</h3>
        <div class="ex-luminas">${luminas}</div>
        <p class="ex-lumina-note">Run these passive effects; numbers are their Lumina point cost.</p>
      </section>

      <section class="ex-panel">
        <h3 class="ex-panel-h">Attributes</h3>
        ${attrBars(c, max)}
        <h3 class="ex-panel-h ex-stats-h">Stats focus</h3>
        <p class="ex-stats">${esc(c.statsFocus || "")}</p>
      </section>
    </div>

    <div class="cb-sec"><h4 class="cb-sec-h">How to play it</h4>
      <ol class="cb-play">${(c.playstyle || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ol></div>
    <div class="cb-procon">
      <div class="cb-pros"><span class="cb-pc-h">Pros</span><ul>${(c.pros || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
      <div class="cb-cons"><span class="cb-pc-h">Cons</span><ul>${(c.cons || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
    </div>`;
}

function renderTabs() {
  const el = document.getElementById("ex-tabs");
  el.innerHTML = DATA.characters.map((c, i) =>
    `<button class="ex-tab ${i === active ? "on" : ""} ${c.core ? "" : "is-flex"}" data-i="${i}">
      <span class="ex-tab-portrait">${c.portrait ? `<img src="${esc(c.portrait)}" alt="" loading="lazy" onerror="this.closest('.ex-tab-portrait').classList.add('none');this.remove()">` : ""}</span>
      <span class="ex-tab-info">
        <span class="ex-tab-name">${esc(c.name)}${c.core ? "" : ' <span class="ex-flex-tag">flex</span>'}</span>
        <span class="ex-tab-role">${esc(c.role)}</span>
      </span>
    </button>`).join("");
  el.querySelectorAll(".ex-tab").forEach((b) => b.addEventListener("click", () => {
    active = +b.dataset.i;
    el.querySelectorAll(".ex-tab").forEach((x) => x.classList.toggle("on", x === b));
    render();
  }));
}

function render() {
  screen.innerHTML = buildScreen(DATA.characters[active]);
}

(async function init() {
  try {
    DATA = await (await fetch(`../../data/expedition-33/builds.json?cb=${Date.now()}`)).json();
    const core = DATA.characters.filter((c) => c.core).length;
    document.getElementById("ex-version").textContent = `Meta team · ${core} core + ${DATA.characters.length - core} flex · ${DATA.version}`;
    const team = document.getElementById("ex-team");
    if (team && DATA.teamNote) team.innerHTML = `<span class="ex-team-h">Team synergy</span>${esc(DATA.teamNote)}`;
    document.getElementById("ex-note").textContent = DATA.note || "";
    renderTabs();
    render();
  } catch (e) {
    screen.innerHTML = `<p class="tool-note">Couldn't load build data.</p>`;
  }
})();
