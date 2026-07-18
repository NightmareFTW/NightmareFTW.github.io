/* Ravenswatch — heroes, abilities, talents & magical objects scraper
   (ravenswatch.fandom.com, via the MediaWiki API — the wikitext is far more
   regular than the rendered HTML). Builds data/ravenswatch/data.json:
   - heroes:  each hero's max health, splash art and full ability kit
              (TRAIT / ATTACK / POWER / SPECIAL / DEFENSE / ULTIMATE 1 & 2),
              plus their 26 talents
   - objects: every Magical Object by rarity, with its attribute + set bonus
   Powers the Hero Reference, Talent Database and Magical Objects tools.
   Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "..", "data", "ravenswatch", "data.json");
const API = "https://ravenswatch.fandom.com/api.php";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const get = (url) => {
  try { return execSync(`curl -sL --retry 3 --retry-delay 2 --retry-all-errors --max-time 40 -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); }
  catch { return ""; }
};
const api = (params) => {
  const q = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  try { return JSON.parse(get(`${API}?${q}&format=json`)); } catch { return null; }
};
const wikitext = (page) => {
  const j = api({ action: "parse", page, prop: "wikitext" });
  return (j && j.parse && j.parse.wikitext["*"]) || "";
};

// ---- wikitext -> plain text -------------------------------------------------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const clean = (s) => String(s || "")
  .replace(/^\*+\s*/gm, "\n· ")                    // keep bullet lists readable
  .replace(/\[\[File:[^\]]*\]\]/gi, " ")          // inline icons
  .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2")  // [[target|label]] -> label
  .replace(/\[\[([^\]]*)\]\]/g, "$1")             // [[target]] -> target
  .replace(/'''|''/g, "")                          // bold / italics
  .replace(/<br\s*\/?>/gi, " ")
  .replace(/<[^>]+>/g, "")                         // <font>, <div>, ...
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e) => ENT[e])
  .replace(/�/g, "")                          // the wiki has a few bad bytes
  .replace(/\s+/g, " ")
  .trim();

// First [[File:x]] in a chunk of wikitext — the icon we want to resolve later.
const fileIn = (s) => {
  const m = String(s || "").match(/\[\[File:([^\]|]+)/i);
  return m ? m[1].trim().replace(/_/g, " ") : "";
};

// ---- wikitable parsing ------------------------------------------------------
// Cells are written one per line starting with a single "|"; a cell's content
// runs until the next such line, so effects keep their bullet lists.
function tableRows(tbl) {
  const out = [];
  for (const chunk of tbl.split(/\n\|-/).slice(1)) {
    const lines = chunk.split("\n");
    const cells = [];
    for (const ln of lines) {
      if (/^[|!]\}/.test(ln)) break;
      if (/^\|(?!\|)/.test(ln)) cells.push([ln.replace(/^\|\s*/, "")]);
      else if (/^!/.test(ln)) continue;                 // header line
      else if (cells.length) cells[cells.length - 1].push(ln);
    }
    if (cells.length) out.push(cells.map((c) => c.join("\n")));
  }
  return out;
}
// Header labels, so we can map columns by name (some hero tables omit "Icon").
const tableHeaders = (tbl) => (tbl.match(/^!.*$/gm) || [])
  .map((s) => clean(s.replace(/^!\s*/, "").replace(/^.*?\|\s*(?=[^|]*$)/, "")).replace(/:$/, "").trim())
  .filter(Boolean);

// The section of wikitext under a "== Heading ==", up to the next level-2 heading.
function section(w, rx) {
  const m = w.match(rx);
  if (!m) return "";
  let s = w.slice(m.index + m[0].length);
  const next = s.match(/^==\s*[^=][\s\S]*?==\s*$/m);
  return next ? s.slice(0, next.index) : s;
}

// ---- heroes -----------------------------------------------------------------
const HEAD = /^(={2,5})\s*(.*?)\s*\1\s*$/gm;
const KINDS = /\b(TRAIT|ATTACK|POWER|SPECIAL|DEFENSE|ULTIMATE\s*\d?)\b/i;

function parseAbilities(w) {
  const abil = section(w, /^==\s*'*\s*Abilities\s*'*\s*==\s*$/mi);
  if (!abil) return [];
  const heads = [...abil.matchAll(HEAD)];
  const out = [];
  let group = "", lastMain = "";
  heads.forEach((h, i) => {
    const raw = h[2];
    const level = h[1].length;
    const body = abil.slice(h.index + h[0].length, i + 1 < heads.length ? heads[i + 1].index : abil.length);
    // <font>KIND</font> marks an ability; anything else is a form/school label
    // (Scarlet's Human/Wolf Form, Merlin's spell schools).
    const kindM = raw.match(/<font[^>]*>\s*([^<]+?)\s*<\/font>/i);
    if (!kindM || !KINDS.test(kindM[1])) {
      const label = clean(raw);
      if (label && label.length < 40) group = label;
      return;
    }
    const kind = clean(kindM[1]).toUpperCase();
    // name follows the </font>, after a "-" or ":" separator
    let name = clean(raw.slice(raw.toLowerCase().indexOf("</font>") + 7)).replace(/^[\s\-–:]+/, "");
    const unlock = (name.match(/\[([^\]]*Unlocks?[^\]]*)\]/i) || [])[1] || "";
    name = name.replace(/\[[^\]]*\]/g, "").replace(/[\s:–-]+$/, "").trim();
    const effects = [];
    for (const ln of body.split("\n")) {
      const m = ln.match(/^(\*+)\s*(.+)$/);
      if (!m) continue;
      const text = clean(m[2]);
      if (text) effects.push({ text, sub: m[1].length > 1 });
    }
    // Merlin's spells are level-4 headings nested under the ability that casts
    // them, so a sub-ability is grouped by its parent rather than a form label.
    const sub = level > 3;
    if (!sub) lastMain = name;
    if (name) out.push({ kind, name, icon: fileIn(raw), unlock, group: sub ? lastMain : group, sub, effects });
  });
  return out;
}

function parseTalents(w) {
  const sec = section(w, /^==\s*'*\s*TALENTS\s*'*\s*==\s*$/mi);
  const tbl = (sec.match(/\{\|[\s\S]*?\n\|\}/) || [])[0] || "";
  if (!tbl) return [];
  const hdr = tableHeaders(tbl).map((h) => h.toLowerCase());
  const col = (want, fallback) => {
    const i = hdr.findIndex((h) => h.includes(want));
    return i >= 0 ? i : fallback;
  };
  // hero tables come in 5-column (no icon) and 6-column (icon first) flavours
  const hasIcon = hdr.some((h) => h.includes("icon"));
  const cName = col("name", hasIcon ? 1 : 0);
  const cType = col("upgrade", cName + 1);
  const cUnlock = col("unlocked", cName + 2);
  const cEffect = col("effect", cName + 3);
  const cRarity = col("rarity", cName + 4);
  const out = [];
  for (const cells of tableRows(tbl)) {
    const name = clean(cells[cName]);
    if (!name) continue;
    out.push({
      name,
      icon: hasIcon ? fileIn(cells[0]) : "",
      type: clean(cells[cType]),
      unlock: clean(cells[cUnlock]),
      effect: clean(cells[cEffect]),
      perRarity: clean(cells[cRarity]),
    });
  }
  return out;
}

// ---- build directions -------------------------------------------------------
// The wiki's own New Player Guidance says: "Early talent choices will give you a
// build direction; try to choose later talents that share keywords with what you
// already have." The game writes those keywords in caps inside talent text, so
// grouping a hero's 26 talents by shared keyword yields the build paths their
// pool actually supports. Nothing here is a hand-made meta claim.
const SLOT_WORDS = new Set([
  // ability slots and generic words — references, not build themes
  "TRAIT", "ATTACK", "ATTACKS", "POWER", "POWERS", "SPECIAL", "DEFENSE", "ULTIMATE",
  "DMG", "HP", "MAX", "AND", "THE", "FOR", "YOU", "WITH", "ALL", "NOT", "CAN", "ARE",
  "HAS", "PER", "AOE", "NEW", "ONE", "TWO", "OUT", "GET", "USE", "ITS", "WHEN", "EACH",
]);
// multi-word keywords have to be matched before their first word is consumed;
// longest first so "COMBO POINTS" wins over "COMBO POINT".
const PHRASES = ["ATTACK SPEED", "MOVEMENT SPEED", "COMBO POINTS", "COMBO POINT",
  "SING STANCE", "CRIT CHANCE", "CRIT DAMAGE"];

// DUMMIES/DUMMY and COMBO POINTS/COMBO POINT are one theme, so fold plurals in.
const singular = (k) => k.endsWith("IES") ? k.slice(0, -3) + "Y"
  : /[^AEIOUS]ES$/.test(k) ? k.slice(0, -2)
    : k.endsWith("S") && !k.endsWith("SS") && k.length > 3 ? k.slice(0, -1) : k;

function themesFor(talents) {
  const hits = {}; // normalised key -> { forms: {surface: n}, talents: Set }
  for (const t of talents) {
    const seen = new Set();
    let rest = `${t.effect} ${t.perRarity}`;
    for (const p of PHRASES) {
      if (rest.includes(p)) { seen.add(p); rest = rest.split(p).join(" "); }
    }
    for (const m of rest.matchAll(/\b([A-Z]{3,})\b/g)) {
      if (!SLOT_WORDS.has(m[1])) seen.add(m[1]);
    }
    for (const surface of seen) {
      const key = singular(surface);
      const h = hits[key] || (hits[key] = { forms: {}, talents: new Set() });
      h.forms[surface] = (h.forms[surface] || 0) + 1;
      h.talents.add(t.name);
    }
  }
  const isStarter = (n) => { const t = talents.find((x) => x.name === n); return !!t && /starting/i.test(t.type); };
  // a theme needs at least 3 talents to be a real direction rather than a one-off
  return Object.entries(hits)
    .filter(([, h]) => h.talents.size >= 3)
    .sort((a, b) => b[1].talents.size - a[1].talents.size)
    .map(([, h]) => {
      // label with whichever spelling the game uses most
      const keyword = Object.entries(h.forms).sort((a, b) => b[1] - a[1])[0][0];
      const names = [...h.talents];
      return { keyword, talents: names, starters: names.filter(isStarter) };
    });
}

function parseHero(title) {
  const w = wikitext(title);
  if (!w) return null;
  const abilities = parseAbilities(w);
  const talents = parseTalents(w);
  if (!abilities.length && !talents.length) return null;
  // "Scarlet, The Red Hood" -> name "Scarlet", title "The Red Hood"
  const [name, epithet] = title.includes(",") ? title.split(",").map((s) => s.trim()) : [title, ""];
  return {
    name,
    title: epithet,
    page: title,
    hp: Number((w.match(/with\s+(\d+)\s+Maximum Health/i) || [])[1]) || null,
    art: (w.match(/\|\s*image\s*=\s*([^\n|}]+)/i) || [])[1] ? (w.match(/\|\s*image\s*=\s*([^\n|}]+)/i)[1]).trim().replace(/_/g, " ") : "",
    abilities,
    talents,
    themes: themesFor(talents),
  };
}

// ---- magical objects --------------------------------------------------------
function parseObjects() {
  const w = wikitext("Magical Objects");
  const out = [];
  for (const tbl of w.match(/\{\|[\s\S]*?\n\|\}/g) || []) {
    const rarity = (tbl.match(/List of ([A-Za-z]+) Magical Objects/i) || [])[1];
    if (!rarity) continue;
    for (const cells of tableRows(tbl)) {
      if (cells.length < 4) continue;
      const name = clean(cells[1]);
      if (!name) continue;
      // the attribute cell holds the effect bullets and then "Set Bonus: ..."
      const attr = clean(cells[3]);
      const cut = attr.search(/Set Bonus\s*:/i);
      out.push({
        name,
        rarity,
        type: clean(cells[2]),
        icon: fileIn(cells[0]),
        effect: (cut >= 0 ? attr.slice(0, cut) : attr).replace(/^·\s*/, "").trim(),
        setBonus: cut >= 0 ? attr.slice(cut).replace(/^Set Bonus\s*:\s*/i, "").trim() : "",
      });
    }
  }
  return out;
}

// ---- image URLs -------------------------------------------------------------
// Resolve every "File:x" we collected to a real URL in batches of 50.
function resolveImages(names) {
  const map = {};
  const list = [...new Set(names.filter(Boolean))];
  for (let i = 0; i < list.length; i += 50) {
    const batch = list.slice(i, i + 50);
    const j = api({ action: "query", titles: batch.map((n) => "File:" + n).join("|"), prop: "imageinfo", iiprop: "url" });
    const pages = (j && j.query && j.query.pages) || {};
    for (const k in pages) {
      const p = pages[k];
      const url = p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url;
      if (url) map[p.title.replace(/^File:/, "")] = url.split("/revision/")[0];
    }
    sleep(200);
  }
  return map;
}
// Fandom serves scaled copies from the same path — keep the payload small.
const scaled = (url, px) => (url ? `${url}/revision/latest/scale-to-width-down/${px}` : "");

function run() {
  const cats = api({ action: "query", list: "categorymembers", cmtitle: "Category:Heroes", cmlimit: 100 });
  const titles = (((cats || {}).query || {}).categorymembers || []).map((m) => m.title);
  if (!titles.length) throw new Error("no heroes listed — keeping previous file");

  const heroes = [];
  for (const t of titles) {
    const h = parseHero(t);
    if (h) { heroes.push(h); console.log(`${h.name.padEnd(14)} ${h.abilities.length} abilities · ${h.talents.length} talents · ${h.hp || "?"} HP`); }
    else console.log(`${t}: skipped (nothing parsed)`);
    sleep(250);
  }
  if (heroes.length < 5) throw new Error("too few heroes parsed — keeping previous file");

  const objects = parseObjects();
  console.log(`\nMagical Objects: ${objects.length}`);
  if (!objects.length) throw new Error("no magical objects parsed — keeping previous file");

  // one pass to turn every File: reference into a URL
  const files = [];
  heroes.forEach((h) => {
    files.push(h.art);
    h.abilities.forEach((a) => files.push(a.icon));
    h.talents.forEach((t) => files.push(t.icon));
  });
  objects.forEach((o) => files.push(o.icon));
  const img = resolveImages(files);
  heroes.forEach((h) => {
    h.art = scaled(img[h.art], 480);
    h.abilities.forEach((a) => { a.icon = scaled(img[a.icon], 64); });
    h.talents.forEach((t) => { t.icon = scaled(img[t.icon], 64); });
  });
  objects.forEach((o) => { o.icon = scaled(img[o.icon], 96); });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://ravenswatch.fandom.com/",
    heroes, objects,
  }));
  const talents = heroes.reduce((n, h) => n + h.talents.length, 0);
  console.log(`\nWrote ${heroes.length} heroes, ${talents} talents, ${objects.length} magical objects.`);
}
try { run(); } catch (e) { require("./lib/keep")(OUT, e); }
