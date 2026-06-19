/* Official in-game PT-BR names for Dreamlight Valley items & recipes.
   Source: the game's own localization (LocDB_pt-BR / LocDB_en-US .locbin files,
   matched by string key), exported to data/dreamlight-valley/official-ptbr.json.
   These are the exact names shown in-game, so they take precedence over the
   best-effort translator. Regenerate the JSON from the game files when new
   items ship (see scripts/README or ask). */

const fs = require("fs");
const path = require("path");

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

let MAP = null, NMAP = null;
function load() {
  if (MAP) return;
  MAP = {}; NMAP = {};
  try {
    MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dreamlight-valley", "official-ptbr.json"), "utf8"));
    for (const k in MAP) NMAP[norm(k)] = MAP[k];
  } catch { MAP = {}; NMAP = {}; }
}

// Exact name → official PT-BR, with accent/punctuation- and plural-insensitive
// fallbacks. Returns null when the game has no name for it.
function officialName(en) {
  load();
  if (!en) return null;
  if (MAP[en]) return MAP[en];
  const x = norm(en);
  if (NMAP[x]) return NMAP[x];
  if (x.endsWith("s") && NMAP[x.slice(0, -1)]) return NMAP[x.slice(0, -1)];
  return null;
}

module.exports = { officialName };
