/* Marvel Snap — card database scraper.
   Pulls every released card (art, cost, power, ability, pool, archetype tags)
   from marvelsnapzone.com's public card API into data/marvel-snap/cards.json.
   Powers the Card Database, Deck Builder and Deck Search. Daily GitHub Action.
   Node 18+, curl. Card art is hotlinked from marvelsnapzone's CDN. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const URL = "https://marvelsnapzone.com/getinfo/?searchtype=cards&searchcardstype=all";
const OUT = path.join(__dirname, "..", "data", "marvel-snap", "cards.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const getJson = (url) => JSON.parse(execSync(`curl -sL -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 48 * 1024 * 1024 }));
const decode = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&#039;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();

function run() {
  const data = getJson(URL);
  const raw = (data.success && data.success.cards) || [];
  if (!raw.length) throw new Error("no cards returned — keeping previous file");

  const cards = raw.filter((c) => c.status === "released" && c.name && c.art).map((c) => ({
    name: decode(c.name),
    cost: c.cost,
    power: c.power,
    ability: decode(c.ability),
    type: c.type || "Character",
    art: c.art,
    pool: c.source || "",
    defid: c.carddefid || "",
    url: c.url || "",
    tags: Array.isArray(c.tags) ? c.tags.map((t) => t.tag).filter(Boolean) : [],
  }));

  cards.sort((a, b) => (a.cost - b.cost) || a.name.localeCompare(b.name));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://marvelsnapzone.com/cards/", count: cards.length, cards }));
  console.log(`Wrote ${cards.length} cards.`);
  const byPool = {}; for (const c of cards) byPool[c.pool || "?"] = (byPool[c.pool || "?"] || 0) + 1;
  console.log(Object.entries(byPool).map(([p, n]) => `  ${p}: ${n}`).join("\n"));
}
try { run(); } catch (e) { console.error(e.message); process.exit(1); }
