/* Disney Dreamlight Valley — Friendship Tracker
   Track each villager's friendship level (0–10), saved per device. In DDV the
   three "favourite" gifts rotate daily, so there's no fixed gift list — instead
   this focuses on tracking levels plus how to gain friendship fastest. */

const VILLAGERS = [
  "Aladdin", "Anna", "Ariel", "Belle", "Bruni, the Fire Spirit", "Buzz Lightyear",
  "Daisy", "Donald Duck", "Elsa", "EVE", "Gaston", "Goofy", "Jack Skellington",
  "Kristoff", "Maui", "Merlin", "Mickey Mouse", "Mike Wazowski", "Minnie Mouse",
  "Moana", "Mother Gothel", "Nala", "Oswald", "Prince Eric", "Rapunzel", "Remy",
  "Scar", "Scrooge McDuck", "Simba", "Stitch", "Sulley", "The Beast",
  "The Fairy Godmother", "The Forgotten", "Tiana", "Ursula", "Vanellope",
  "WALL•E", "Woody",
];
const MAX = 10;
const KEY = "nftw:ddv:friendship";

let levels = {};
try { levels = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { levels = {}; }
const save = () => localStorage.setItem(KEY, JSON.stringify(levels));
const lvl = (v) => Math.min(Math.max(levels[v] || 0, 0), MAX);

const grid = document.getElementById("fr-grid");
const summary = document.getElementById("fr-summary");

function renderSummary() {
  const total = VILLAGERS.reduce((s, v) => s + lvl(v), 0);
  const maxed = VILLAGERS.filter((v) => lvl(v) === MAX).length;
  summary.textContent = `${maxed}/${VILLAGERS.length} maxed · ${total}/${VILLAGERS.length * MAX} total levels`;
}

function set(v, n) {
  levels[v] = Math.min(Math.max(n, 0), MAX);
  save();
  const card = grid.querySelector(`[data-v="${CSS.escape(v)}"]`);
  card.querySelector(".fr-lvl").textContent = lvl(v);
  card.querySelector(".fr-fill").style.width = `${(lvl(v) / MAX) * 100}%`;
  card.classList.toggle("fr-max", lvl(v) === MAX);
  renderSummary();
}

grid.innerHTML = VILLAGERS.map((v) => `
  <div class="fr-card ${lvl(v) === MAX ? "fr-max" : ""}" data-v="${v}">
    <div class="fr-head"><span class="fr-name">${v}</span><span class="fr-lvl">${lvl(v)}</span></div>
    <div class="fr-bar"><div class="fr-fill" style="width:${(lvl(v) / MAX) * 100}%"></div></div>
    <div class="fr-btns">
      <button class="mini-btn" data-act="dec">−</button>
      <button class="mini-btn" data-act="inc">+</button>
      <button class="mini-btn" data-act="max">max</button>
    </div>
  </div>`).join("");

grid.querySelectorAll(".fr-card").forEach((card) => {
  const v = card.dataset.v;
  card.querySelector('[data-act="dec"]').addEventListener("click", () => set(v, lvl(v) - 1));
  card.querySelector('[data-act="inc"]').addEventListener("click", () => set(v, lvl(v) + 1));
  card.querySelector('[data-act="max"]').addEventListener("click", () => set(v, MAX));
});

document.getElementById("fr-reset").addEventListener("click", () => {
  levels = {}; save();
  grid.querySelectorAll(".fr-card").forEach((card) => {
    card.querySelector(".fr-lvl").textContent = "0";
    card.querySelector(".fr-fill").style.width = "0%";
    card.classList.remove("fr-max");
  });
  renderSummary();
});

renderSummary();
