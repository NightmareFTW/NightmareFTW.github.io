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
function fetchWikitextBatch(titles) {
  const out = {};
  for (const group of chunk(titles, 50)) {
    const url = `${API}?action=query&titles=${encodeURIComponent(group.join("|"))}&prop=revisions&rvprop=content&rvslots=main&format=json`;
    const data = getJson(url);
    const pages = (data && data.query && data.query.pages) || {};
    for (const p of Object.values(pages)) {
      const wt = p.revisions && p.revisions[0] && p.revisions[0].slots.main["*"];
      if (wt) out[p.title] = wt;
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
const fileOf = (s) => (s && (s.match(/File:([^|\]]+)/) || [])[1]) || null;

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
function unlockingSection(wt) {
  const m = wt.match(/\n==\s*Unlocking\s*==\n([\s\S]*?)(?=\n==[^=]|\n\[\[Category|$)/);
  return m ? stripWiki(m[1]) : "";
}
function toSteps(guideText, shortUnlock) {
  const text = guideText || shortUnlock || "";
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.replace(/^[*-]\s*/, "").trim()).filter(Boolean);
  const steps = [];
  for (const line of lines) {
    const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter((s) => s.length > 3 && !/^(alternatively|note:|tip:)/i.test(s));
    steps.push(...(sentences.length ? sentences : [line]));
  }
  return steps.length ? steps : [text];
}

function parseCharacter(title, wt) {
  const info = parseInfobox(wt);
  if (!info) return null;
  const images = [info.image1, info.image2, info.image].map(fileOf).filter(Boolean);
  const secret = /^y/i.test(info.secret || "");
  const isDefault = /^default$/i.test((info.unlock || "").trim());
  const guide = unlockingSection(wt);
  return {
    name: info.name || info.name1 || title,
    slug: (info.name || info.name1 || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
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

  const wikitexts = fetchWikitextBatch(titles);
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
