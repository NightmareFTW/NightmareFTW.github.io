/* Warframe — item database scraper, for the Build Creator / Showcase tools.
   Source: WFCD's warframe-items (https://github.com/WFCD/warframe-items,
   MIT-licensed), pulled straight from the game's own API by that project —
   not scraped wiki pages, and not Dreamers-Portal-style community content,
   so this is a normal daily scrape like every other data file here. See
   CLAUDE.md for why WFCD is the go-to for anything Warframe beyond live
   worldstate (which already uses api.warframestat.us, WFCD's own hosted
   API — same org).

   Writes data/warframe/items.json:
   - warframes: stats + abilities + mod polarities for every Warframe (incl.
     Primes) usable as a build's subject.
   - weapons: Primary/Secondary/Melee, trimmed to the stats a build planner
     actually needs (damage, crit, status, fire rate, polarities).
   - companions: Sentinels + Kubrow/Kavat/MOA-type Pets.
   - mods: every equippable mod (Warframe/weapon/companion), trimmed to one
     max-rank effect line instead of the full per-rank table.
   - arcanes: same trim, max-rank effect line only.
   Each item keeps a `slug` (derived from name) so the frontend can link to
   it without re-deriving one, and an `image` (wikia thumbnail — hotlinked
   the same way every other scraper in this repo hotlinks community-hosted
   images). Run by .github/workflows/update-warframe-items.yml. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { getJson } = require("./lib/http");

const BASE = "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json";
const OUT = path.join(__dirname, "..", "data", "warframe", "items.json");

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
// Game text wraps dynamic values in |TOKEN|-style placeholders (filled in-game
// from the player's own mod config) — drop them rather than show raw markup.
const stripTokens = (s) => clean(String(s || "").replace(/\|[A-Z_]+\|/g, "").replace(/<[^>]+>/g, ""));
const lastStat = (levelStats) => {
  const last = (levelStats || [])[(levelStats || []).length - 1];
  return last && last.stats ? last.stats.map(stripTokens).join(" ") : "";
};
const img = (it) => it.wikiaThumbnail || (it.imageName ? `https://cdn.warframestat.us/img/${it.imageName}` : "");

function get(file) {
  const data = getJson(`${BASE}/${file}.json`);
  if (!Array.isArray(data)) throw new Error(`${file}: fetch failed or not an array — keeping previous file`);
  return data;
}

function run() {
  const framesRaw = get("Warframes");
  const weaponFiles = ["Primary", "Secondary", "Melee"];
  const weaponsRaw = weaponFiles.flatMap((f) => get(f));
  const companionsRaw = [...get("Sentinels"), ...get("Pets")];
  const modsRaw = get("Mods");
  const arcanesRaw = get("Arcanes");

  const warframes = framesRaw
    .filter((f) => f.type === "Warframe" && !f.excludeFromCodex)
    .map((f) => ({
      slug: slugify(f.name), name: f.name, isPrime: !!f.isPrime,
      health: f.health, shield: f.shield, armor: f.armor, power: f.power, sprintSpeed: f.sprint ?? f.sprintSpeed,
      masteryReq: f.masteryReq || 0,
      passive: stripTokens(f.passiveDescription),
      abilities: (f.abilities || []).map((a) => ({ name: a.name, desc: stripTokens(a.description) })),
      polarities: f.polarities || [],
      exilusPolarity: f.exilusPolarity || null,
      image: img(f),
    }));

  const WEAPON_CATEGORY = { Primary: "Primary", Secondary: "Secondary", Melee: "Melee" };
  const weapons = weaponsRaw
    .filter((w) => w.name && !w.excludeFromCodex && WEAPON_CATEGORY[w.category])
    .map((w) => ({
      slug: slugify(w.name), name: w.name, category: WEAPON_CATEGORY[w.category], type: w.type || "",
      masteryReq: w.masteryReq || 0,
      totalDamage: w.totalDamage ?? null,
      criticalChance: w.criticalChance ?? null, criticalMultiplier: w.criticalMultiplier ?? null,
      procChance: w.procChance ?? null, fireRate: w.fireRate ?? null,
      magazineSize: w.magazineSize ?? null, reloadTime: w.reloadTime ?? null, multishot: w.multishot ?? null,
      disposition: w.disposition ?? null,
      polarities: w.polarities || [], exilusPolarity: w.exilusPolarity || null,
      image: img(w),
    }));

  const companions = companionsRaw
    .filter((c) => c.name && !c.excludeFromCodex)
    .map((c) => ({
      slug: slugify(c.name), name: c.name, category: c.category === "Sentinels" ? "Sentinel" : "Pet",
      health: c.health ?? null, shield: c.shield ?? null, armor: c.armor ?? null,
      polarities: c.polarities || [],
      image: img(c),
    }));

  // Only equippable gear mods (drops non-mod misc items some files bundle in,
  // e.g. "Additional Mod Config Slot" above, which has no polarity/rarity).
  const mods = modsRaw
    .filter((m) => m.category === "Mods" && m.polarity && m.rarity)
    .map((m) => ({
      slug: slugify(m.name) + "-" + slugify(m.type || ""), name: m.name, type: m.type || "",
      compatName: m.compatName || null, isAugment: !!m.isAugment,
      polarity: m.polarity, rarity: m.rarity,
      baseDrain: m.baseDrain ?? null, fusionLimit: m.fusionLimit ?? null,
      effect: lastStat(m.levelStats),
      image: img(m),
    }));

  const arcanes = arcanesRaw
    .filter((a) => a.name)
    .map((a) => ({
      slug: slugify(a.name), name: a.name, type: a.type || "", rarity: a.rarity || null,
      effect: lastStat(a.levelStats),
      image: img(a),
    }));

  if (!warframes.length || !weapons.length || !mods.length) throw new Error("suspiciously empty result — keeping previous file");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://github.com/WFCD/warframe-items",
    counts: { warframes: warframes.length, weapons: weapons.length, companions: companions.length, mods: mods.length, arcanes: arcanes.length },
    warframes, weapons, companions, mods, arcanes,
  }));
  console.log(`warframes:${warframes.length} weapons:${weapons.length} companions:${companions.length} mods:${mods.length} arcanes:${arcanes.length}`);
}

try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
