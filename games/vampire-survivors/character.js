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

// Any other character/achievement name mentioned in a guide becomes a link —
// longest names first, so "Zi'Appunta Belpaese" wins over any shorter name
// that happens to be a substring of it at the same position.
function buildLinkifier(characters, achievements) {
  const entries = [];
  for (const c of characters) entries.push({ name: c.name, href: `character.html?slug=${encodeURIComponent(c.slug)}` });
  for (const a of achievements) entries.push({ name: a.name, href: `achievements.html?highlight=${encodeURIComponent(a.name)}` });
  entries.sort((a, b) => b.name.length - a.name.length);
  const map = new Map(entries.map((e) => [e.name, e.href]));
  const escaped = entries.map((e) => e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = escaped.length ? new RegExp(`\\b(${escaped.join("|")})\\b`, "g") : null;
  return function linkify(text, excludeName) {
    if (!text) return "";
    if (!re) return esc(text);
    re.lastIndex = 0;
    let out = "", last = 0, m;
    while ((m = re.exec(text))) {
      if (m[1] === excludeName) continue;
      out += esc(text.slice(last, m.index)) + `<a href="${map.get(m[1])}">${esc(m[1])}</a>`;
      last = m.index + m[1].length;
    }
    return out + esc(text.slice(last));
  };
}

function stepId(c, i) { return `${c.slug}::${i}`; }

function applyUnlockedFrom(c) {
  if (c.isDefault || !c.steps || !c.steps.length) return;
  if (c.steps.every((_, i) => stepsDone.has(stepId(c, i))) && !unlocked.has(c.slug)) { unlocked.add(c.slug); saveUnlocked(); }
}

function render(c, linkify) {
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
          ${c.weapon && c.weapon !== "No" ? `<span class="ev-chip">Weapon: ${esc(c.weapon)}</span>` : ""}
          ${c.hiddenWeapon ? `<span class="ev-chip">Hidden weapon: ${esc(c.hiddenWeapon)}</span>` : ""}
          ${isUnlocked ? '<span class="ev-chip confirmed">Unlocked</span>' : ""}
        </div>
      </div>
    </div>

    ${c.description ? `<p class="pw-desc">${esc(c.description)}</p>` : ""}

    <section class="panel">
      <h2>How to Unlock</h2>
      ${c.isDefault
        ? `<p class="tool-note">Available from the very start — no unlock needed.</p>`
        : `<label class="vs-mark vs-mark-main"><input type="checkbox" id="mark-unlocked" ${isUnlocked ? "checked" : ""}> Mark as unlocked</label>
           ${c.unlockShort ? `<p class="pw-build-note"><b>Summary:</b> ${linkify(c.unlockShort, c.name)}</p>` : ""}
           ${haveSteps ? `
             <p class="tool-note" style="margin-top:14px">${stepsHave}/${c.steps.length} steps done. Named characters and achievements link to their own page.</p>
             <div class="ms-items">${c.steps.map((s, i) => `
               <label class="ms-item ${stepsDone.has(stepId(c, i)) ? "done" : ""}" data-i="${i}">
                 <input type="checkbox" class="vs-step-check" data-i="${i}" ${stepsDone.has(stepId(c, i)) ? "checked" : ""}>
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
    const id = stepId(c, +cb.dataset.i);
    if (cb.checked) stepsDone.add(id); else stepsDone.delete(id);
    saveSteps();
    cb.closest(".ms-item").classList.toggle("done", cb.checked);
    applyUnlockedFrom(c);
    if (markCb) markCb.checked = c.isDefault || unlocked.has(c.slug);
  }));
}

(async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    const [charsData, achData] = await Promise.all([
      fetch(`../../data/vampire-survivors/characters.json?cb=${Date.now()}`).then((r) => r.json()),
      fetch(`../../data/vampire-survivors/achievements.json?cb=${Date.now()}`).then((r) => r.json()),
    ]);
    const c = charsData.characters.find((x) => x.slug === slug);
    if (!c) { root.innerHTML = `<p class="tool-note">Character not found. <a href="characters.html">Back to the database →</a></p>`; return; }
    const linkify = buildLinkifier(charsData.characters, achData.achievements);
    render(c, linkify);
  } catch (e) {
    root.innerHTML = `<p class="tool-note">Couldn't load character data.</p>`;
  }
})();
