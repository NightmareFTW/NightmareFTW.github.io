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
// Community floor plans (Steam guide "Maps for Outlast Trials") for maps the
// wiki has no floor plan for. Loaded into our own pan/zoom viewer.
const STEAM_MAPS = {
  "Toy Factory": [{ label: "Floor Map", img: "https://images.steamusercontent.com/ugc/16419302165167330/4381DCD1ED04F249C8C11D40D8FBCCCD6F3774D6/" }],
};

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
// Clean intros for the two non-standard pages whose wiki leads are messy.
const INTRO_OVERRIDE = {
  "Rebirth": "Rebirth is the final therapy step in The Outlast Trials — the Reagent Release Protocol, where you either become a Reborn agent or attempt to escape.",
  "Escape": "Escape is a temporary Trial in The Outlast Trials where Reagents try to flee the Sinyala Facility through the Waste Tunnel.",
};
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
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Clean, uniform floor-plan layouts only (top-down PNG maps; skip in-game photos).
async function mapLayouts(env) {
  const imgs = (((await api({ action: "parse", page: env, prop: "images" })).parse) || {}).images || [];
  const files = imgs.filter((f) => /\.png$/i.test(f) && /(_Map\.png$|Floor.*Map|Ground_Floor)/i.test(f));
  const urls = await fileUrls(files);
  return files.map((f) => ({ label: f.replace(/\.(png|jpg|jpeg)$/i, "").replace(/_/g, " ").replace(/^.*? - /, ""), img: urls[f] })).filter((x) => x.img);
}

// The list of trials (missions) hosted on an environment, from its "Trials" section.
async function envTrials(env) {
  const w = await wikitext(env);
  const sec = (w.split(/==\s*Trials\s*==/)[1] || "").split(/\n==/)[0];
  return [...new Set([...sec.matchAll(/\[\[([^\]|#]+)/g)].map((m) => m[1].trim())
    .filter((x) => x && !/File:|Category:|Reagents|Rebirth$/.test(x)))];
}

// Scrape one trial/mission: its goal tagline, step objectives and Prime Asset.
async function scrapeTrial(title) {
  const w = await wikitext(title);
  if (!w) return null;
  const prime = dewiki(field(w, "primeasset|prime asset|prime")).split("\n")[0].replace(/\bN\/?A\b/i, "").trim();
  const objectives = bullets(field(w, "objectives?"))
    .filter((o) => !/^[|{]/.test(o) && o.length > 3 && o.toLowerCase() !== title.toLowerCase()).slice(0, 14);
  // Goal: the italicised tagline that opens the Gameplay section.
  const gp = (w.split(/==\s*Gameplay\s*==/)[1] || "").split(/\n==/)[0];
  const tag = gp.match(/''+([^']{8,260}?)''+/);
  let goal = tag ? dewiki(tag[1]).replace(/\s+/g, " ").trim() : "";
  if (!goal) { // fall back to the lead sentence
    const lead = dewiki(w.replace(/\{\{[\s\S]*?\}\}/g, " ").split(/\n==/)[0]).replace(/thumb\|/gi, "").replace(/\|[a-z]+\s*=\s*[^|]*/gi, "").replace(/\b\d+x?\d*px\b/gi, "").replace(/\s+/g, " ").trim();
    const at = lead.indexOf(title); goal = (at >= 0 ? lead.slice(at) : lead).split(/\.(?:\s|$)/)[0].slice(0, 200) + ".";
  }
  if (INTRO_OVERRIDE[title]) goal = INTRO_OVERRIDE[title];
  return { name: title, goal, objectives, prime, tips: TIPS[title] || [] };
}

async function run() {
  const hero = {};
  const hj = await api({ action: "query", prop: "pageimages", piprop: "original", titles: ENV_ORDER.join("|"), redirects: "1" });
  for (const k in (hj.query || {}).pages) { const p = hj.query.pages[k]; if (p.original) hero[p.title] = p.original.source.replace(/\/revision.*$/, ""); }

  const maps = [];
  for (const env of ENV_ORDER) {
    const list = await envTrials(env);
    const trials = [];
    for (const t of list) { const tr = await scrapeTrial(t); if (tr) trials.push(tr); }
    const layouts = await mapLayouts(env);
    // Supplement with community floor plans for maps the wiki has none for.
    for (const sm of STEAM_MAPS[env] || []) if (!layouts.some((l) => l.img === sm.img)) layouts.push(sm);
    // Attach a layout to the trial whose name it matches (so the selector can show it).
    for (const l of layouts) { const tr = trials.find((t) => norm(l.label).includes(norm(t.name)) || norm(t.name).includes(norm(l.label.replace(/ map$/i, "")))); if (tr) l.trial = tr.name; }
    if (!trials.length && !hero[env]) continue;
    maps.push({ name: env, img: hero[env] || "", layouts, trials, fex: FEX });
  }
  if (!maps.some((m) => m.trials.length)) throw new Error("no trials parsed — keeping previous file");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "https://outlast.fandom.com", fex: FEX, generalTips: GENERAL_TIPS, maps }, null, 2));
  console.log(`Wrote ${maps.length} maps, ${maps.reduce((n, m) => n + m.trials.length, 0)} trials, ${maps.reduce((n, m) => n + m.layouts.length, 0)} layouts.`);
}

run().catch((e) => require("./lib/keep")(OUT, e));
