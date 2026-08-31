/* Vampire Survivors — Characters + Achievements scraper.

   Source: vampire.survivors.wiki (a wiki.gg MediaWiki instance, not Fandom —
   Fandom bot-blocks non-browser requests). Plain MediaWiki API, no headless
   browser: page wikitext via action=query&prop=revisions, image URLs via a
   batched action=query&prop=imageinfo. The DLC code→name table is read
   straight from the wiki's own Lua data module (Module:DLCBadge/Data) rather
   than hand-maintained here, so a new DLC's code resolves automatically.

   Writes:
   - data/vampire-survivors/characters.json — every character (~225): DLC,
     whether it's a secret/hidden character, gold cost, starting weapon,
     the short unlock blurb, and — when the wiki has a longer "Unlocking"
     writeup — that text split into checkable steps (mechanically split by
     sentence, not hand-curated; simple one-line unlocks just get one step).
   - data/vampire-survivors/achievements.json — every achievement (in-game
     "Unlocks"), grouped by DLC/version, with the wiki's own full
     description even for achievements Steam itself hides until earned.

   Run by .github/workflows/update-vampire-survivors.yml (daily). Node 18+,
   curl. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const curatedGuides = require("./data/vs-curated-guides");

const API = "https://vampire.survivors.wiki/api.php";
const OUT_DIR = path.join(__dirname, "..", "data", "vampire-survivors");
const OUT_CHARS = path.join(OUT_DIR, "characters.json");
const OUT_ACH = path.join(OUT_DIR, "achievements.json");
const IMG_BASE = "https://vampire.survivors.wiki/images";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function getJson(url) {
  try {
    const out = execFileSync("curl", ["-sL", "--retry", "3", "--retry-delay", "2", "--retry-all-errors", "--max-time", "40", "-A", UA, url], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(out);
  } catch { return null; }
}
const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

// ---- wikitext -> plain text -------------------------------------------------
const STRUCTURAL_TEMPLATES = new Set(["unlocktop", "unlockbottom", "uh", "ul", "external", "hascalculator", "reflist", "references"]);
function templateText(name, args) {
  const lname = name.trim().toLowerCase();
  if (STRUCTURAL_TEMPLATES.has(lname)) return "";
  if (lname === "vs") return "Vampire Survivors";
  const named = {};
  const positional = [];
  for (const a of args) {
    const eq = a.indexOf("=");
    if (eq > 0 && /^[\w ]+$/.test(a.slice(0, eq))) named[a.slice(0, eq).trim().toLowerCase()] = a.slice(eq + 1).trim();
    else positional.push(a.trim());
  }
  if (lname === "slink" || lname === "stat" || lname === "w" || lname === "cost") return named.txt || positional[0] || "";
  return named.txt || positional[positional.length - 1] || positional[0] || "";
}
function stripWiki(s) {
  if (!s) return "";
  for (let i = 0; i < 6; i++) {
    const next = s.replace(/\{\{([^{}]*)\}\}/g, (_, inner) => {
      const parts = inner.split("|");
      return templateText(parts[0], parts.slice(1));
    });
    if (next === s) break;
    s = next;
  }
  s = s.replace(/\[\[\s*(?:File|Image):[^\]]*\]\]/gi, "");
  s = s.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1");
  s = s.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
  s = s.replace(/<br\s*\/?>/gi, ". ").replace(/<[^>]+>/g, "");
  s = s.replace(/'''''|'''|''/g, "");
  s = s.replace(/\.\s*\.+/g, ".").replace(/\s+\./g, ".");
  return s.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

// ---- MediaWiki plumbing ----------------------------------------------------
function fetchWikitextBatch(titles, { redirects = false } = {}) {
  const out = {};
  for (const group of chunk(titles, 50)) {
    const url = `${API}?action=query&titles=${encodeURIComponent(group.join("|"))}${redirects ? "&redirects=1" : ""}&prop=revisions&rvprop=content&rvslots=main&format=json`;
    const data = getJson(url);
    const pages = (data && data.query && data.query.pages) || {};
    // With redirects=1, a redirect's *source* title only appears in
    // data.query.redirects (mapping from->to) — map it back onto the
    // resolved page's content so callers can still look it up by the
    // original title they asked for.
    const byTitle = {};
    for (const p of Object.values(pages)) {
      const wt = p.revisions && p.revisions[0] && p.revisions[0].slots.main["*"];
      if (wt) byTitle[p.title] = wt;
    }
    for (const [title, wt] of Object.entries(byTitle)) out[title] = wt;
    for (const r of (data && data.query && data.query.redirects) || []) {
      if (byTitle[r.to]) out[r.from] = byTitle[r.to];
    }
    sleep(300);
  }
  return out;
}
function fetchImageUrls(filenames) {
  const out = {};
  const uniq = [...new Set(filenames.filter(Boolean))];
  for (const group of chunk(uniq, 50)) {
    const titles = group.map((f) => `File:${f}`);
    const url = `${API}?action=query&titles=${encodeURIComponent(titles.join("|"))}&prop=imageinfo&iiprop=url&format=json`;
    const data = getJson(url);
    const pages = (data && data.query && data.query.pages) || {};
    for (const p of Object.values(pages)) {
      const info = p.imageinfo && p.imageinfo[0];
      if (info && info.url) out[p.title.replace(/^File:/, "")] = info.url;
    }
    sleep(300);
  }
  return out;
}
// Older infobox revisions wrap the filename as [[File:X.png]]; several of the
// newest (Ante Chamber-era) character pages just write the bare filename —
// handle both, or icons for those characters silently come up empty.
function fileOf(s) {
  if (!s) return null;
  const m = s.match(/File:([^|\]]+)/);
  if (m) return m[1].trim();
  const bare = s.trim();
  return /\.(png|jpe?g|gif|webp)$/i.test(bare) ? bare : null;
}

// ---- DLC code -> name, straight from the wiki's own Lua data --------------
function fetchDlcMap() {
  const wt = fetchWikitextBatch(["Module:DLCBadge/Data"])["Module:DLCBadge/Data"] || "";
  const map = {};
  for (const m of wt.matchAll(/(\w+)\s*=\s*\{\s*sprite\s*=\s*'[^']*'\s*,\s*page\s*=\s*'([^']+)'/g)) map[m[1]] = m[2];
  return map;
}

// ---- Achievements -----------------------------------------------------------
function parseAchievements(wt) {
  const sections = wt.split(/\n===\s*(.+?)\s*===\n/);
  const out = [];
  for (let i = 1; i < sections.length; i += 2) {
    const group = sections[i];
    const content = sections[i + 1] || "";
    const tables = content.match(/\{\|[\s\S]*?\n\|\}/g) || [];
    for (const table of tables) {
      for (const row of table.split(/\n\|-/).slice(1)) {
        const lines = row.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|") && !l.startsWith("|}"));
        if (lines.length < 4) continue;
        const cells = lines.map((l) => l.replace(/^\|/, "").trim());
        const hasIcon = /File:/.test(cells[0]);
        const [iconCell, nameCell, descCell, unlocksCell, notesCell] = hasIcon ? cells : [null, ...cells];
        out.push({
          group,
          icon: iconCell ? fileOf(iconCell) : null,
          name: stripWiki(nameCell),
          description: stripWiki(descCell),
          unlocks: stripWiki(unlocksCell),
          notes: stripWiki(notesCell || ""),
        });
      }
    }
  }
  return out.filter((a) => a.name);
}

// ---- Characters -------------------------------------------------------------
function balancedTemplate(s, fromKey) {
  const p = s.indexOf(fromKey); if (p < 0) return null;
  let depth = 0;
  for (let j = p; j < s.length - 1; j++) {
    if (s[j] === "{" && s[j + 1] === "{") { depth++; j++; }
    else if (s[j] === "}" && s[j + 1] === "}") { depth--; j++; if (!depth) return s.slice(p, j + 1); }
  }
  return null;
}
function parseInfobox(wt) {
  const block = balancedTemplate(wt, "{{Infobox Character");
  if (!block) return null;
  const inner = block.slice("{{Infobox Character".length, -2);
  const fields = {};
  for (const part of inner.split(/\n\|/).slice(1)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    fields[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim();
  }
  return fields;
}
// A handful of Unlocking sections (e.g. Fake Trio's) embed a MediaWiki
// table of parallel objectives instead of a bullet list — stripWiki doesn't
// touch `{|...|}` syntax, so left alone it leaks raw wikitable markup
// ("|Valmanway||Thousand Edge||Million Cut") straight into the mechanical
// step split. Turn each data row into one readable "A → B → C" bullet
// before the rest of the pipeline ever sees it.
function tablesToBullets(s) {
  return s.replace(/\{\|[\s\S]*?\n\|\}/g, (block) => {
    const rows = [];
    for (const line of block.split("\n")) {
      const t = line.trim();
      if (!/^\|[^|}-]/.test(t)) continue;
      const cells = t.slice(1).split("||").map((c) => c.trim()).filter(Boolean);
      if (cells.length > 1) rows.push(cells.join(" → "));
    }
    return rows.map((r) => `* ${r}`).join("\n");
  });
}
function unlockingSection(wt) {
  const m = wt.match(/\n==\s*Unlocking\s*==\n([\s\S]*?)(?=\n==[^=]|\n\[\[Category|$)/);
  return m ? stripWiki(tablesToBullets(m[1])) : "";
}
function toSteps(guideText, shortUnlock) {
  const text = guideText || shortUnlock || "";
  if (!text) return [];
  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  // A line ending in ":" introduces the bullet lines under it (e.g. "The
  // following do NOT need to be unlocked:") — that's context for a single
  // step, not a separate list of requirements, so fold it (and every bullet
  // under it) back into one line instead of offering each as its own step.
  const lines = [];
  let collecting = false;
  for (const raw of rawLines) {
    const isBullet = /^[*-]\s*/.test(raw);
    const line = raw.replace(/^[*-]\s*/, "").trim();
    if (collecting && isBullet) { lines[lines.length - 1] += (lines[lines.length - 1].endsWith(":") ? " " : ", ") + line; continue; }
    lines.push(line);
    collecting = !isBullet && line.endsWith(":");
  }
  // A folded list of plain cardinal directions (e.g. Torino's turn-by-turn
  // maze route) reads as a path, not a set of alternatives — an arrow chain
  // is much clearer than the comma list the fold above produces.
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(.*:)\s*((?:(?:North|South|East|West)\s*,\s*)*(?:North|South|East|West))$/i);
    if (m) lines[i] = `${m[1]} ${m[2].split(/\s*,\s*/).join(" → ")}`;
  }
  const steps = [];
  for (const line of lines) {
    const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter((s) => s.length > 3 && !/^(alternatively|note:|tip:)/i.test(s));
    // A line that's entirely a filtered aside (e.g. just "Alternatively, X
    // can also be unlocked by casting spell Y") has nothing left after the
    // filter above — don't fall back to the raw line in that case, or the
    // filter is defeated. The fallback still applies when the split simply
    // found no sentence boundary in an otherwise-fine short line.
    if (!sentences.length && /^(alternatively|note:|tip:)/i.test(line)) continue;
    steps.push(...(sentences.length ? sentences : [line]));
  }
  return steps.length ? steps : [text];
}

// Multi-skin characters (version1/version2/…) don't consistently put the
// modern default skin first — e.g. Concetta/Pugnala/Christine have
// version1=Legacy, version2=Default, so name1 is the "(Legacy)" variant.
// Find whichever numbered version is actually tagged Default; fall back to
// the plain `name` field, then name1, then the page title.
function pickName(info, title) {
  for (let i = 1; i <= 8; i++) {
    if ((info[`version${i}`] || "").trim().toLowerCase() === "default" && info[`name${i}`]) return info[`name${i}`].trim();
  }
  return (info.name || info.name1 || title).trim();
}

function parseCharacter(title, wt) {
  const info = parseInfobox(wt);
  if (!info) return null;
  // Same Default-version preference as the name: put the Default skin's
  // image first so it wins the icon pick, then fall back to any other art.
  let defaultImage = null;
  for (let i = 1; i <= 8; i++) {
    if ((info[`version${i}`] || "").trim().toLowerCase() === "default" && info[`image${i}`]) { defaultImage = info[`image${i}`]; break; }
  }
  const images = [defaultImage, info.image1, info.image2, info.image].map(fileOf).filter(Boolean);
  const secret = /^y/i.test(info.secret || "");
  const isDefault = /^default$/i.test((info.unlock || "").trim());
  const guide = unlockingSection(wt);
  const name = pickName(info, title);
  return {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    dlcCode: (info.dlc || "").trim().toLowerCase(),
    weapon: info.weapon || info.weapon1 || "",
    hiddenWeapon: info["hidden weapon"] || "",
    description: stripWiki(info.description || ""),
    secret,
    isDefault,
    cost: Number(info.cost) || 0,
    unlockShort: stripWiki(info.unlock || ""),
    unlockGuide: guide,
    steps: isDefault ? [] : toSteps(guide, stripWiki(info.unlock || "")),
    images,
    icon: null, // filled in after batched imageinfo lookup
  };
}

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dlcMap = fetchDlcMap();
  console.log("DLC map:", dlcMap);

  // ---- Achievements ---------------------------------------------------------
  const achWt = fetchWikitextBatch(["Achievements"])["Achievements"];
  if (!achWt) throw new Error("couldn't fetch Achievements page — keeping previous data");
  const achievements = parseAchievements(achWt);
  const achIconMap = fetchImageUrls(achievements.map((a) => a.icon));
  for (const a of achievements) { a.icon = a.icon ? achIconMap[a.icon] || null : null; }
  fs.writeFileSync(OUT_ACH, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://vampire.survivors.wiki/w/Achievements",
    count: achievements.length,
    groups: [...new Set(achievements.map((a) => a.group))],
    achievements,
  }));
  console.log(`vampire-survivors achievements: ${achievements.length}.`);

  // ---- Characters -------------------------------------------------------------
  const catUrl = `${API}?action=query&list=categorymembers&cmtitle=Category:Characters&cmlimit=500&format=json`;
  const cat = getJson(catUrl);
  const titles = ((cat && cat.query && cat.query.categorymembers) || [])
    .map((m) => m.title)
    .filter((t) => t !== "Characters" && !t.includes("/"));
  console.log(`character pages to fetch: ${titles.length}`);

  const wikitexts = fetchWikitextBatch(titles, { redirects: true });
  // A handful of titles reliably don't come back from a 50-wide batch query
  // (MediaWiki title-normalization quirk with punctuation like periods or
  // quotes) even though the page exists — retry those individually rather
  // than silently dropping real characters.
  const missing = titles.filter((t) => !wikitexts[t]);
  if (missing.length) {
    console.log(`retrying ${missing.length} titles individually: ${missing.join(", ")}`);
    for (const t of missing) {
      const single = fetchWikitextBatch([t], { redirects: true });
      if (single[t]) wikitexts[t] = single[t];
      sleep(200);
    }
  }
  const characters = [];
  for (const title of titles) {
    const wt = wikitexts[title];
    if (!wt) continue;
    const c = parseCharacter(title, wt);
    if (c) characters.push(c);
  }

  const allImages = characters.flatMap((c) => c.images);
  const imgMap = fetchImageUrls(allImages);
  for (const c of characters) {
    c.icon = c.images.map((f) => imgMap[f]).find(Boolean) || null;
    delete c.images;
    c.dlcName = c.dlcCode ? dlcMap[c.dlcCode] || c.dlcCode : "Base Game";
    // A handful of characters (e.g. Chaos) have a real unlock condition too
    // long/interlinked for the mechanical `steps` split above to read
    // sensibly — those get a hand-curated phased guide instead, merged in
    // by slug so it survives this scraper's own re-runs.
    if (curatedGuides[c.slug]) c.guide = curatedGuides[c.slug];
  }
  characters.sort((a, b) => (a.dlcName === b.dlcName ? a.name.localeCompare(b.name) : (a.dlcName === "Base Game" ? -1 : b.dlcName === "Base Game" ? 1 : a.dlcName.localeCompare(b.dlcName))));

  fs.writeFileSync(OUT_CHARS, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://vampire.survivors.wiki/w/Characters",
    count: characters.length,
    dlcs: [...new Set(characters.map((c) => c.dlcName))],
    characters,
  }));
  console.log(`vampire-survivors characters: ${characters.length} (${characters.filter((c) => c.secret).length} secret, ${characters.filter((c) => c.isDefault).length} default).`);
}

try { run(); } catch (e) { require("./lib/keep")([OUT_CHARS, OUT_ACH], e); }
