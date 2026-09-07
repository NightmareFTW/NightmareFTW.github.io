/* Vampire Survivors — single Character page.
   Deep-link: character.html?slug=lamball. Shows full info plus the
   step-by-step unlock guide; any other character or achievement named in
   that guide becomes a link to its own page (achievements don't have a
   dedicated page each, so they link into the checklist and scroll/highlight
   the matching row instead). */

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY_UNLOCKED = "nftw:vs:unlocked";
const KEY_STEPS = "nftw:vs:steps";

let unlocked = new Set(JSON.parse(localStorage.getItem(KEY_UNLOCKED) || "[]"));
let stepsDone = new Set(JSON.parse(localStorage.getItem(KEY_STEPS) || "[]"));
const saveUnlocked = () => localStorage.setItem(KEY_UNLOCKED, JSON.stringify([...unlocked]));
const saveSteps = () => localStorage.setItem(KEY_STEPS, JSON.stringify([...stepsDone]));

const root = document.getElementById("vs-root");

// Any other character/achievement/weapon/enemy name mentioned in a guide
// becomes a link — or, when the same name belongs to more than one of
// them (e.g. the enemy "Avatar Infernas" and the character of the same
// name), a small popup letting the reader pick which page they meant. See
// assets/js/vs-xref.js for the shared index/popup this builds on.
//
// Characters, weapons and enemies are added unconditionally, but an
// achievement is only added when nothing else already claims its name —
// most achievements are simply named after the character/weapon they
// unlock, so that pairing is the expected 1:1 norm, not a real ambiguity
// worth interrupting the reader over. Without this, almost every name in
// a long guide (e.g. Chaos's) would wrongly pop up a picker.
function buildXrefEntities(characters, achievements, weapons, enemies) {
  const entities = [];
  for (const c of characters) entities.push({ name: c.name, type: "character", href: `character.html?slug=${encodeURIComponent(c.slug)}` });
  for (const w of weapons) entities.push({ name: w.name, type: "weapon", href: `weapon.html?slug=${encodeURIComponent(w.slug)}` });
  for (const e of enemies) entities.push({ name: e.name, type: "enemy", href: `enemy.html?slug=${encodeURIComponent(e.slug)}` });
  const claimed = new Set(entities.map((e) => e.name));
  for (const a of achievements) if (!claimed.has(a.name)) entities.push({ name: a.name, type: "achievement", href: `achievements.html?highlight=${encodeURIComponent(a.name)}` });
  return entities;
}

// A curated guide (unlike every other character's plain scraped `steps`) is
// small and hand-authored, so it carries its own {en, pt} copies instead of
// going through assets/js/i18n.js's generic text-node translator — that
// translator can't reliably handle text pieced together from linkify()'s
// injected <a> tags. Pick the copy matching the site's current language
// before anything else touches c.guide, so the rest of this file can keep
// treating it as one flat guide object.
function pickGuideLang(guide) {
  if (!guide || !guide.en) return guide; // already a flat, single-language guide
  const lang = localStorage.getItem("nftw:lang") || "en";
  return guide[lang] || guide.en;
}

// Every other character's `unlockShort`/`steps` are the wiki's own scraped
// (English) text; scripts/data/vs-steps-pt.js carries a hand-translated PT-PT
// copy, merged onto the character record as unlockShortPt/stepsPt by
// update-vampire-survivors.js. Swap them in before render() so the rest of
// this file can keep treating c.unlockShort/c.steps as the only copy — same
// trick as pickGuideLang above. stepsPt is only ever set when it already has
// the same length as steps, so checkbox ids (positional on the steps array
// index) stay stable across a language switch.
function pickStepsLang(c) {
  if ((localStorage.getItem("nftw:lang") || "en") !== "pt") return;
  if (c.unlockShortPt) c.unlockShort = c.unlockShortPt;
  if (c.stepsPt) c.steps = c.stepsPt;
}

// A character's weapon field is usually one name, but a few dual-wielding
// characters list several separated by "; " (e.g. "Peachone; Ebony
// Wings") — link whichever of them resolve to a real weapon page, and
// leave the rest (or the whole thing, for a character with none matched)
// as plain text rather than risk a dead link.
function weaponChipHtml(label, value, weaponMap) {
  if (!value || value === "No") return "";
  const linked = value.split(/;\s*/).map((s) => s.trim()).filter(Boolean).map((name) => {
    const slug = weaponMap.get(name);
    return slug ? `<a class="vs-xref" href="weapon.html?slug=${encodeURIComponent(slug)}">${esc(name)}</a>` : esc(name);
  }).join(", ");
  return `<span class="ev-chip">${esc(label)}: <b>${linked}</b></span>`;
}

function stepId(c, suffix) { return `${c.slug}::${suffix}`; }

// A curated guide (see scripts/data/vs-curated-guides.js) organizes a long
// unlock chain into phases, each split into groups of checkable leaf items
// that may carry nested, non-checkable explanatory bullets (children). This
// walks that tree and returns every leaf item with a stable id built from
// its phase/group/item position — matches how the scraper merges the guide
// in, so ids stay stable across re-scrapes as long as the curated file's
// item order doesn't change.
function collectLeafItems(guide) {
  const out = [];
  guide.phases.forEach((phase, pIdx) => {
    const groups = phase.groups || [{ items: phase.items || [] }];
    groups.forEach((group, gIdx) => {
      (group.items || []).forEach((item, iIdx) => out.push({ id: `g${pIdx}-${gIdx}-${iIdx}`, item }));
    });
  });
  return out;
}

function allStepIds(c) {
  if (c.guide && c.guide.phases) return collectLeafItems(c.guide).map((l) => l.id);
  if (c.steps) return c.steps.map((_, i) => i);
  return [];
}

function applyUnlockedFrom(c) {
  if (c.isDefault) return;
  const ids = allStepIds(c);
  if (!ids.length) return;
  if (ids.every((id) => stepsDone.has(stepId(c, id))) && !unlocked.has(c.slug)) { unlocked.add(c.slug); saveUnlocked(); }
}

// Refresh progress counters in place instead of a full re-render, so ticking
// a box in a 90-item guide doesn't reset scroll position.
function refreshCounts(c) {
  const totalEl = document.getElementById("vs-total-count");
  if (c.guide && c.guide.phases) {
    const leaves = collectLeafItems(c.guide);
    const done = leaves.filter((l) => stepsDone.has(stepId(c, l.id))).length;
    if (totalEl) totalEl.textContent = `${done}/${leaves.length} steps done in total.`;
    c.guide.phases.forEach((phase, pIdx) => {
      const groups = phase.groups || [{ items: phase.items || [] }];
      const ids = [];
      groups.forEach((g, gIdx) => (g.items || []).forEach((_, iIdx) => ids.push(`g${pIdx}-${gIdx}-${iIdx}`)));
      const phaseDone = ids.filter((id) => stepsDone.has(stepId(c, id))).length;
      const el = document.getElementById(`vs-phase-count-${pIdx}`);
      if (el) el.textContent = `${phaseDone}/${ids.length}`;
    });
  } else if (totalEl && c.steps) {
    const done = c.steps.filter((_, i) => stepsDone.has(stepId(c, i))).length;
    totalEl.textContent = `${done}/${c.steps.length} steps done. Named characters and achievements link to their own page.`;
  }
}

// Renders a nested, non-checkable explanatory bullet (a guide item's
// `children`) — either a plain string or a {text, children} node that can
// nest further, e.g. Shanoa's "Evoluir: Iron Ball + Armor / Alucard Spear +
// Wings" pair of options.
function renderNodes(nodes, linkify, excludeName) {
  if (!nodes || !nodes.length) return "";
  return `<ul class="vs-sub-list">${nodes.map((n) => {
    if (typeof n === "string") return `<li>${linkify(n, excludeName)}</li>`;
    return `<li>${linkify(n.text, excludeName)}${renderNodes(n.children, linkify, excludeName)}</li>`;
  }).join("")}</ul>`;
}

function renderGuideItem(c, item, id, linkify) {
  const checked = stepsDone.has(stepId(c, id));
  return `<label class="ms-item vs-guide-item ${checked ? "done" : ""}" data-sid="${esc(id)}">
    <input type="checkbox" class="vs-step-check" data-sid="${esc(id)}" ${checked ? "checked" : ""}>
    <span class="ms-item-body">
      <span class="ms-item-text">${item.kind === "progression" ? '<span class="vs-kind-tag">relic</span> ' : ""}${linkify(item.text, c.name)}</span>
      ${renderNodes(item.children, linkify, c.name)}
    </span>
  </label>`;
}

function renderPhase(c, phase, pIdx, linkify) {
  const groups = phase.groups || [{ items: phase.items || [] }];
  const total = groups.reduce((n, g) => n + (g.items || []).length, 0);
  const done = groups.reduce((n, g, gIdx) => n + (g.items || []).filter((_, iIdx) => stepsDone.has(stepId(c, `g${pIdx}-${gIdx}-${iIdx}`))).length, 0);
  return `
    <section class="ms-section vs-phase">
      <div class="ms-sec-head">
        <h3>${phase.icon ? `<span class="vs-phase-icon">${esc(phase.icon)}</span> ` : ""}${esc(phase.title)}</h3>
        <span class="ms-sec-count" id="vs-phase-count-${pIdx}">${done}/${total}</span>
      </div>
      ${phase.intro ? `<p class="tool-note">${linkify(phase.intro, c.name)}</p>` : ""}
      ${groups.map((g, gIdx) => `
        ${g.title ? `<h4 class="vs-group-title">${esc(g.title)}</h4>` : ""}
        <div class="ms-items">${(g.items || []).map((item, iIdx) => renderGuideItem(c, item, `g${pIdx}-${gIdx}-${iIdx}`, linkify)).join("")}</div>
      `).join("")}
      ${phase.note ? `<p class="pw-build-note">${linkify(phase.note, c.name)}</p>` : ""}
    </section>`;
}

function renderPhasedGuide(c, linkify) {
  const guide = c.guide;
  const leaves = collectLeafItems(guide);
  const doneTotal = leaves.filter((l) => stepsDone.has(stepId(c, l.id))).length;
  const isUnlocked = unlocked.has(c.slug);
  return `
    <label class="vs-mark vs-mark-main"><input type="checkbox" id="mark-unlocked" ${isUnlocked ? "checked" : ""}> Mark as unlocked</label>
    <p class="pw-build-note">
      ${guide.dlc ? `<b>DLC:</b> ${esc(guide.dlc)}. ` : ""}
      ${guide.rule ? `<b>Rule:</b> ${linkify(guide.rule, c.name)}` : ""}
    </p>
    ${c.unlockShort ? `<p class="tool-note" style="font-style:italic">"${linkify(c.unlockShort, c.name)}"</p>` : ""}
    <p class="tool-note" id="vs-total-count" style="margin:6px 0 14px">${doneTotal}/${leaves.length} steps done in total.</p>
    ${guide.phases.map((phase, pIdx) => renderPhase(c, phase, pIdx, linkify)).join("")}
  `;
}

function render(c, linkify, weaponMap) {
  document.title = `${c.name} · Vampire Survivors · NightmareFTW`;
  document.getElementById("bc-char").textContent = c.name;
  const isUnlocked = c.isDefault || unlocked.has(c.slug);
  const haveSteps = c.steps && c.steps.length && !c.isDefault;
  const stepsHave = haveSteps ? c.steps.filter((_, i) => stepsDone.has(stepId(c, i))).length : 0;

  root.innerHTML = `
    <div class="pw-detail-head">
      <span class="pw-detail-img"><img src="${esc(c.icon || "")}" alt="" referrerpolicy="no-referrer" onerror="this.closest('.pw-detail-img').classList.add('no-img')"></span>
      <div class="pw-detail-title">
        <h1>${esc(c.name)}</h1>
        <div class="pw-detail-chips">
          <span class="ev-chip">${esc(c.dlcName)}</span>
          ${c.secret ? '<span class="ev-chip confirmed">Secret</span>' : ""}
          ${c.isDefault ? '<span class="ev-chip">Default</span>' : c.cost ? `<span class="ev-chip">${esc(c.cost)}g</span>` : ""}
          ${weaponChipHtml("Weapon", c.weapon, weaponMap)}
          ${weaponChipHtml("Hidden weapon", c.hiddenWeapon, weaponMap)}
          ${isUnlocked ? '<span class="ev-chip confirmed">Unlocked</span>' : ""}
        </div>
      </div>
    </div>

    ${c.description ? `<p class="pw-desc">${esc(c.description)}</p>` : ""}

    <section class="panel">
      <h2>How to Unlock</h2>
      ${c.isDefault
        ? `<p class="tool-note">Available from the very start — no unlock needed.</p>`
        : c.guide && c.guide.phases
          ? renderPhasedGuide(c, linkify)
          : `<label class="vs-mark vs-mark-main"><input type="checkbox" id="mark-unlocked" ${isUnlocked ? "checked" : ""}> Mark as unlocked</label>
             ${c.unlockShort ? `<p class="pw-build-note"><b>Summary:</b> ${linkify(c.unlockShort, c.name)}</p>` : ""}
             ${haveSteps ? `
               <p class="tool-note" id="vs-total-count" style="margin-top:14px">${stepsHave}/${c.steps.length} steps done. Named characters and achievements link to their own page.</p>
               <div class="ms-items">${c.steps.map((s, i) => `
                 <label class="ms-item ${stepsDone.has(stepId(c, i)) ? "done" : ""}" data-sid="${i}">
                   <input type="checkbox" class="vs-step-check" data-sid="${i}" ${stepsDone.has(stepId(c, i)) ? "checked" : ""}>
                   <span class="ms-item-body"><span class="ms-item-text">${linkify(s, c.name)}</span></span>
                 </label>`).join("")}</div>` : ""}`}
    </section>

    <p class="tool-note"><a class="mini-btn" href="characters.html">← Back to the database</a> <a class="mini-btn" href="achievements.html">Achievements checklist →</a></p>
  `;

  const markCb = document.getElementById("mark-unlocked");
  if (markCb) markCb.addEventListener("change", () => {
    if (markCb.checked) unlocked.add(c.slug); else unlocked.delete(c.slug);
    saveUnlocked();
  });
  root.querySelectorAll(".vs-step-check").forEach((cb) => cb.addEventListener("change", () => {
    const id = stepId(c, cb.dataset.sid);
    if (cb.checked) stepsDone.add(id); else stepsDone.delete(id);
    saveSteps();
    cb.closest(".ms-item").classList.toggle("done", cb.checked);
    refreshCounts(c);
    applyUnlockedFrom(c);
    if (markCb) markCb.checked = c.isDefault || unlocked.has(c.slug);
  }));
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [charsData, achData, weaponsData, enemiesData] = await Promise.all([
      fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/achievements.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/weapons.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/enemies.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const c = charsData.characters.find((x) => x.slug === slug);
    if (!c) { root.innerHTML = `<p class="tool-note">Character not found. <a class="mini-btn" href="characters.html">Back to the database →</a></p>`; return; }
    c.guide = pickGuideLang(c.guide);
    pickStepsLang(c);
    const weaponMap = new Map(weaponsData.weapons.map((w) => [w.name, w.slug]));
    const xrefIndex = VSXref.buildXrefIndex(buildXrefEntities(charsData.characters, achData.achievements, weaponsData.weapons, enemiesData.enemies));
    VSXref.initXrefPopup(xrefIndex);
    const linkify = (text, excludeName) => VSXref.linkify(text, xrefIndex, excludeName);
    render(c, linkify, weaponMap);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load character data.</p>`;
  }
})();
