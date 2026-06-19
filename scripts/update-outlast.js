/* The Outlast Trials — trials & maps scraper.
   From the Outlast Wiki (Fandom MediaWiki API; HTML is bot-blocked but the API
   and image CDN are not) it pulls, per map: the hero screenshot, the floor /
   layout map images, and each trial's environment + step-by-step objectives.
   Curated strategy tips and the interactive-map link are merged in.
   Writes data/outlast-trials/trials.json.  Node 18+, no deps. */

const fs = require("fs");
const path = require("path");

const API = "https://outlast.fandom.com/api.php";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT = path.join(__dirname, "..", "data", "outlast-trials", "trials.json");
const FEX = "https://outlast.fex.dev/maps"; // community interactive maps

const TRIALS = ["Kill the Snitch", "Cleanse the Orphans", "Grind the Bad Apples", "Pervert the Futterman",
  "Vindicate the Guilty", "Kill the Politician", "Pleasure the Prosecutor", "Liquidate the Union",
  "Silence the Idol", "Poison the Medicine", "Despoil the Auction", "Rebirth", "Escape"];
const ENV_ORDER = ["Police Station", "Orphanage", "Fun Park", "Toy Factory", "Courthouse", "Shopping Mall",
  "Downtown", "The Suburbs", "Television Studio", "The Docks", "Resort", "Mansion", "Waste Tunnel"];

// Curated strategy tips (the wiki has no structured tips section).
const GENERAL_TIPS = [
  "Crouch-walk and break line of sight — most Ex-Pop lose you within seconds once they can't see you.",
  "Lockers and under-beds reset a chase, but a Pouncer may be hiding in dark spots — shine your light first.",
  "Loot side rooms for batteries, lockpicks and meds before triggering loud objectives (generators, alarms).",
  "Save your rig for grab-escapes and Prime Asset encounters, not trash mobs.",
  "In co-op, split roles: one handles the noisy objective while the others scout and peel enemies.",
];
const TIPS = {
  "Kill the Snitch": ["The Snitch is pushed to his death — protect the slow, exposed push route.", "Basement generators are loud; clear nearby enemies first or post a watcher.", "The Skinner Man stalks here — keep a locker or window in reach while looting the security room."],
  "Cleanse the Orphans": ["You're defenceless while carrying an orphan — scout and clear the route first.", "Leland Coyle charges with an electrified baton; bait the charge near cover, then break away.", "Use the chapel basement and second floor to shake chases."],
  "Grind the Bad Apples": ["The Root Canal boat ride is the hub — power off the barriers, then push the boat together.", "Sightlines are wide open; hug stalls and rides for cover.", "Group up before the boat push so a hunter can't pick off a straggler."],
  "Pervert the Futterman": ["Machinery noise masks enemy audio — rely on sight and the X-Ray rig.", "Mother Gooseberry's gas lingers; never fight or loot inside it.", "Long trial — bank meds and batteries between objectives."],
  "Vindicate the Guilty": ["Multi-floor — use the lobby and second-floor layouts to plan routes between objectives.", "The scales-of-justice area is a chokepoint; clear it before committing.", "Courtrooms echo — move during ambient noise to mask your steps."],
  "Kill the Politician": ["Big open mall floors — use shops and escalators to break line of sight.", "Track the politician's patrol and isolate him from nearby enemies.", "Mind the long sightlines on the atrium; cross them only when clear."],
  "Pleasure the Prosecutor": ["Street-level with long sightlines — move building to building, off the open road.", "Use alleys and interiors to rotate around patrols.", "Watch for Pushers funnelling you into the open with gas."],
  "Liquidate the Union": ["Spread-out houses — clear each before grabbing objectives.", "Ambushes happen between yards; cross gaps deliberately, not on a sprint.", "Keep an escape house in mind for when a hunter locks on."],
  "Silence the Idol": ["Studio sets are maze-like — learn the loops to lose hunters.", "Stage lighting creates dark pockets where Pouncers lurk; light them up.", "Use prop cover, but don't get cornered on a closed set."],
  "Poison the Medicine": ["Franco 'Il Bambino' bullies tight spaces — keep to looping, vertical routes near the water.", "Don't get cornered against the docks edge.", "Save a rig charge to break his grab and reset the chase."],
  "Despoil the Auction": ["Season 5 trial — Liliya Bogomolova keeps relentless pressure; prioritise objectives over hiding.", "Rotate cover constantly and keep two exits open.", "Bank resources before the auction-floor objectives."],
  "Rebirth": ["Story finale with heavy enemy density — co-ordinate rig usage and don't over-extend.", "Stick together; a downed solo player is hard to revive in the crush.", "Clear a fallback route before each objective."],
  "Escape": ["Linear escape — keep moving, don't stop to fight.", "Use the tunnels' tight turns to shake pursuers.", "Push through as a group so no one is left behind a closing gap."],
};

async function api(params) {
  const u = API + "?" + new URLSearchParams({ format: "json", ...params });
  return await (await fetch(u, { headers: { "User-Agent": UA } })).json();
}
const dewiki = (s = "") => s.replace(/\{\{[\s\S]*?\}\}/g, "").replace(/<ref[\s\S]*?<\/ref>/g, "").replace(/<ref[^>]*\/>/g, "")
  .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/'''?/g, "").replace(/<[^>]+>/g, "").trim();
const field = (w, name) => { const m = w.match(new RegExp("\\|\\s*(?:" + name + ")\\s*=\\s*([\\s\\S]*?)(?:\\n\\s*\\||\\n\\}\\})", "i")); return m ? m[1] : ""; };
const bullets = (s) => dewiki(s).split(/\n?\s*\*+\s*/).map((x) => x.trim()).filter(Boolean);
async function wikitext(title) { const j = await api({ action: "parse", page: title, prop: "wikitext" }); return ((j.parse || {}).wikitext || {})["*"] || ""; }

// Resolve a batch of File: names to CDN URLs.
async function fileUrls(files) {
  const out = {};
  for (let i = 0; i < files.length; i += 20) {
    const j = await api({ action: "query", titles: files.slice(i, i + 20).map((f) => "File:" + f).join("|"), prop: "imageinfo", iiprop: "url" });
    // The API normalizes "File:A_B" -> "File:A B", so key by the underscore form to match our list.
    for (const p of Object.values((j.query || {}).pages || {})) if (p.imageinfo) out[p.title.replace(/^File:/, "").replace(/ /g, "_")] = p.imageinfo[0].url.replace(/\/revision.*$/, "");
  }
  return out;
}
// Floor / layout map images used on an environment page (the top-down maps).
async function mapLayouts(env) {
  const imgs = (((await api({ action: "parse", page: env, prop: "images" })).parse) || {}).images || [];
  const files = imgs.filter((f) => /(_Map\.(png|jpg)$|Floor.*Map|Ground_Floor|Scales.*Map|Lockdown_Map)/i.test(f));
  const urls = await fileUrls(files);
  return files.map((f) => ({ label: f.replace(/\.(png|jpg|jpeg)$/i, "").replace(/_/g, " ").replace(/^.*? - /, ""), img: urls[f] })).filter((x) => x.img);
}

async function run() {
  const byEnv = {};
  for (const t of TRIALS) {
    const w = await wikitext(t);
    if (!w) continue;
    const env = dewiki(field(w, "environment|map|location")).split("\n")[0].trim();
    const lead = w.replace(/\{\{[\s\S]*?\}\}/g, " ").split(/\n==/)[0];
    const intro = dewiki(lead).replace(/==.*?==/g, "").replace(/\s+/g, " ").trim().slice(0, 240);
    const objectives = bullets(field(w, "objectives?")).slice(0, 14);
    if (!env) continue;
    (byEnv[env] = byEnv[env] || []).push({ name: t, intro, objectives, tips: TIPS[t] || [] });
  }

  const hero = {};
  const j = await api({ action: "query", prop: "pageimages", piprop: "original", titles: ENV_ORDER.join("|"), redirects: "1" });
  for (const k in (j.query || {}).pages) { const p = j.query.pages[k]; if (p.original) hero[p.title] = p.original.source.replace(/\/revision.*$/, ""); }

  const maps = [];
  for (const env of ENV_ORDER) {
    if (!byEnv[env] && !hero[env]) continue;
    maps.push({ name: env, img: hero[env] || "", layouts: await mapLayouts(env), trials: byEnv[env] || [], fex: FEX });
  }
  if (!maps.some((m) => m.trials.length)) throw new Error("no trials parsed — keeping previous file");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://outlast.fandom.com", fex: FEX, generalTips: GENERAL_TIPS, maps }, null, 2));
  console.log(`Wrote ${maps.length} maps, ${maps.reduce((n, m) => n + m.trials.length, 0)} trials, ${maps.reduce((n, m) => n + m.layouts.length, 0)} layout images.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
