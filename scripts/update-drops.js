/* Warframe drop-table builder (run locally and by GitHub Action).
   Fetches WFCD's parsed copy of DE's official drop tables and flattens it into
   a compact data/warframe/drops.json the site can load quickly.

   Source of truth: DE official drop tables
   (https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html)
   parsed and hosted as JSON by WFCD (https://drops.warframestat.us).

   Node 18+ (global fetch), no dependencies. Compact row schema:
   [ item, rarityIndex, chance, type ("R"|"M"), source, planet, tier ] */

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "data", "warframe", "drops.json");
const RELICS = "https://drops.warframestat.us/data/relics.json";
const MISSIONS = "https://drops.warframestat.us/data/missionRewards.json";
const OFFICIAL = "https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html";

const RARITIES = ["Common", "Uncommon", "Rare", "Legendary"];
const ri = (r) => { const i = RARITIES.indexOf(r); return i < 0 ? RARITIES.push(r) - 1 : i; };

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "NightmareFTW-bot" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function run() {
  const rows = [];

  // ---- Relics (Intact state only) ----
  const relics = (await getJson(RELICS)).relics || [];
  for (const r of relics) {
    if (r.state !== "Intact") continue;
    const src = `${r.tier} ${r.relicName}`;
    for (const rw of r.rewards || []) {
      rows.push([rw.itemName, ri(rw.rarity), rw.chance, "R", src, "", r.tier]);
    }
  }

  // ---- Mission rewards (per planet/node, rotations flattened) ----
  const missions = (await getJson(MISSIONS)).missionRewards || {};
  for (const [planet, nodes] of Object.entries(missions)) {
    for (const [node, info] of Object.entries(nodes)) {
      const rw = info.rewards;
      if (!rw) continue;
      if (Array.isArray(rw)) {
        for (const x of rw) rows.push([x.itemName, ri(x.rarity), x.chance, "M", node, planet, ""]);
      } else {
        for (const [rot, list] of Object.entries(rw)) {
          const src = `${node} · Rot ${rot}`;
          for (const x of list) rows.push([x.itemName, ri(x.rarity), x.chance, "M", src, planet, ""]);
        }
      }
    }
  }

  const out = {
    updated: new Date().toISOString(),
    source: OFFICIAL,
    via: "drops.warframestat.us (WFCD)",
    rarities: RARITIES,
    rows,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`Wrote ${rows.length} drop rows -> ${OUT} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`);
}

run().catch((e) => require("./lib/keep")(OUT, e));
