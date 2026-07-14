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

const ART_BASE = "https://marvelsnapzone.com/wp-content/themes/blocksy-child/assets/media/cards/";
const TEAM_SUFFIX = /(Champion|XMen|WebSlingers|SpiderVerse|GuardiansOfTheGalaxy|BrotherhoodOfMutants|Thunderbolts|Avengers|FirstSteps|MastersOfEvil)$/;
const getJson = (url) => JSON.parse(execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 48 * 1024 * 1024 }));
const decode = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&#039;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const subtitle = (n) => (n.match(/^(.+?)\s+-\s+.+$/) || n.match(/^(.+?)\s+Champion$/) || [])[1] || null;

function run() {
  const data = getJson(URL);
  const raw = (data.success && data.success.cards || []).filter((c) => c.status === "released" && c.name && c.art);
  if (!raw.length) throw new Error("no cards returned — keeping previous file");

  // Marvel Snap Zone adds duplicate "Champion"/team-themed entries (broken art,
  // non-canonical defids). Keep the canonical card; for the few orphans with no
  // canonical twin, strip the subtitle and repair the name, art slug and defid.
  const canon = new Set(raw.filter((c) => !subtitle(decode(c.name))).map((c) => norm(decode(c.name))));
  const cards = [];
  for (const c of raw) {
    const name0 = decode(c.name);
    const base = subtitle(name0);
    if (base && canon.has(norm(base))) continue; // duplicate of a canonical card
    const name = base || name0;
    cards.push({
      name,
      cost: c.cost,
      power: c.power,
      ability: decode(c.ability),
      type: c.type || "Character",
      art: base ? `${ART_BASE}${slugify(name)}.webp?v=965` : c.art,
      pool: c.source || "",
      defid: base ? (c.carddefid || "").replace(TEAM_SUFFIX, "") : (c.carddefid || ""),
      url: c.url || "",
      tags: Array.isArray(c.tags) ? c.tags.map((t) => t.tag).filter(Boolean) : [],
    });
  }

  cards.sort((a, b) => (a.cost - b.cost) || a.name.localeCompare(b.name));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://marvelsnapzone.com/cards/", count: cards.length, cards }));
  console.log(`Wrote ${cards.length} cards.`);
  const byPool = {}; for (const c of cards) byPool[c.pool || "?"] = (byPool[c.pool || "?"] || 0) + 1;
  console.log(Object.entries(byPool).map(([p, n]) => `  ${p}: ${n}`).join("\n"));
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
