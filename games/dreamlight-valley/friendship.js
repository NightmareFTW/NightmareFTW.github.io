/* Disney Dreamlight Valley — Friendship Tracker
   Track each villager's friendship level (0–10), saved per device. Characters
   are tagged by where they come from (base game / DLC). Face images load from
   assets/img/ddv; missing ones fall back to a coloured initial.

   Note: in DDV the daily "favourite" gifts rotate per villager and reset at
   5:00 AM local — there is no public feed for them, so they're not listed here.
   Check the in-game Collections menu for today's favourites. */

const DLC = { RIFT: "A Rift in Time", VALE: "Storybook Vale", WISH: "Wishblossom Mountains" };

const VILLAGERS = [
  // Base game
  ...["Mickey Mouse", "Minnie Mouse", "Goofy", "Donald Duck", "Daisy Duck",
    "Scrooge McDuck", "Merlin", "WALL•E", "Elsa", "Anna", "Kristoff", "Olaf",
    "Moana", "Maui", "Ariel", "Ursula", "Prince Eric", "Stitch", "Buzz Lightyear",
    "Woody", "Mother Gothel", "Belle", "The Beast", "Mirabel", "Remy", "Scar",
    "Simba", "Nala", "Vanellope", "Mulan", "Mike Wazowski", "Sulley",
    "The Fairy Godmother", "Jack Skellington", "Tiana", "Bruni, the Fire Spirit",
    "Pocahontas", "Hercules"].map((n) => ({ name: n, dlc: null })),
  // A Rift in Time (Eternity Isle)
  ...["EVE", "Gaston", "Rapunzel", "Jafar", "Oswald", "The Forgotten"].map((n) => ({ name: n, dlc: DLC.RIFT })),
  // Storybook Vale
  ...["Aurora", "Maleficent", "Merida", "Hades", "Flynn Rider"].map((n) => ({ name: n, dlc: DLC.VALE })),
  // Wishblossom Mountains
  ...["Snow White", "Tinker Bell", "Tigger", "Cruella De Vil"].map((n) => ({ name: n, dlc: DLC.WISH })),
];

const MAX = 10;
const KEY = "nftw:ddv:friendship";
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dlcClass = (d) => ({ [DLC.RIFT]: "dlc-rift", [DLC.VALE]: "dlc-vale", [DLC.WISH]: "dlc-wish" }[d] || "");

let levels = {};
try { levels = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { levels = {}; }
const save = () => localStorage.setItem(KEY, JSON.stringify(levels));
const lvl = (n) => Math.min(Math.max(levels[n] || 0, 0), MAX);

// Assignable in-game activities (Roles) for each villager.
const ROLES = ["Gardening", "Fishing", "Mining", "Digging", "Foraging"];
const RKEY = "nftw:ddv:roles";
let roles = {};
try { roles = JSON.parse(localStorage.getItem(RKEY)) || {}; } catch { roles = {}; }
const saveRoles = () => localStorage.setItem(RKEY, JSON.stringify(roles));

let dlcFilter = "all";
let activityFilter = "all";
const grid = document.getElementById("fr-grid");
const summary = document.getElementById("fr-summary");

function renderSummary() {
  const total = VILLAGERS.reduce((s, v) => s + lvl(v.name), 0);
  const maxed = VILLAGERS.filter((v) => lvl(v.name) === MAX).length;
  summary.textContent = `${VILLAGERS.length} characters · ${maxed} maxed · ${total}/${VILLAGERS.length * MAX} total levels`;
}

function set(name, n) {
  levels[name] = Math.min(Math.max(n, 0), MAX);
  save();
  const card = grid.querySelector(`[data-v="${CSS.escape(name)}"]`);
  card.querySelector(".fr-lvl").textContent = lvl(name);
  card.querySelector(".fr-fill").style.width = `${(lvl(name) / MAX) * 100}%`;
  card.classList.toggle("fr-max", lvl(name) === MAX);
  renderSummary();
}

function render() {
  const list = VILLAGERS.filter((v) => {
    const dlcOk = dlcFilter === "all" ? true : dlcFilter === "base" ? !v.dlc : v.dlc === dlcFilter;
    const actOk = activityFilter === "all" ? true
      : activityFilter === "none" ? !roles[v.name] : roles[v.name] === activityFilter;
    return dlcOk && actOk;
  });

  grid.innerHTML = list.map((v) => {
    const tag = v.dlc ? `<span class="fr-dlc ${dlcClass(v.dlc)}">${v.dlc}</span>` : "";
    const opts = ['<option value="">— activity —</option>']
      .concat(ROLES.map((r) => `<option value="${r}" ${roles[v.name] === r ? "selected" : ""}>${r}</option>`)).join("");
    return `<div class="fr-card ${lvl(v.name) === MAX ? "fr-max" : ""}" data-v="${v.name}">
      <div class="fr-portrait" style="background:${"#6a4fb3"}">
        <span class="fr-initial">${v.name[0]}</span>
        <img src="../../assets/img/ddv/${slug(v.name)}.png" alt="" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="fr-info">
        <div class="fr-head"><span class="fr-name">${v.name}</span><span class="fr-lvl">${lvl(v.name)}</span></div>
        ${tag}
        <div class="fr-bar"><div class="fr-fill" style="width:${(lvl(v.name) / MAX) * 100}%"></div></div>
        <div class="fr-btns">
          <button class="mini-btn" data-act="dec">−</button>
          <button class="mini-btn" data-act="inc">+</button>
          <button class="mini-btn" data-act="max">max</button>
        </div>
        <select class="fr-role">${opts}</select>
      </div>
    </div>`;
  }).join("");

  grid.querySelectorAll(".fr-card").forEach((card) => {
    const v = card.dataset.v;
    card.querySelector('[data-act="dec"]').addEventListener("click", () => set(v, lvl(v) - 1));
    card.querySelector('[data-act="inc"]').addEventListener("click", () => set(v, lvl(v) + 1));
    card.querySelector('[data-act="max"]').addEventListener("click", () => set(v, MAX));
    card.querySelector(".fr-role").addEventListener("change", (e) => {
      if (e.target.value) roles[v] = e.target.value; else delete roles[v];
      saveRoles();
      if (activityFilter !== "all") render();
    });
  });
}

document.querySelectorAll(".fr-filter").forEach((b) =>
  b.addEventListener("click", () => {
    dlcFilter = b.dataset.dlc;
    document.querySelectorAll(".fr-filter").forEach((x) => x.classList.toggle("active", x === b));
    render();
  }));

document.querySelectorAll(".fr-act-filter").forEach((b) =>
  b.addEventListener("click", () => {
    activityFilter = b.dataset.act;
    document.querySelectorAll(".fr-act-filter").forEach((x) => x.classList.toggle("active", x === b));
    render();
  }));

document.getElementById("fr-reset").addEventListener("click", () => {
  levels = {}; save(); render(); renderSummary();
});

render();
renderSummary();
