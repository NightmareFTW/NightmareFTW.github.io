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
   - data/vampire-survivors/weapons.json — every real equip-and-level
     weapon (~375: base, evolved, and union — NOT Arcanas/Darkanas, which
     the wiki also tags Category:Weapons because their page embeds an
     internal weapon infobox, but which get their own file below), with
     its stats and the full evolution graph (evolvesFrom/evolvesInto, each
     edge carrying whatever else the step also needs — a passive item, or
     a second weapon for a union, and a `recipeId` so a weapon fused from
     several inputs at once can be told apart from several unrelated
     weapons that each just happen to evolve into the same target). The
     graph is built by inverting each evolution/union page's own
     `requires1..N` infobox fields (the authoritative recipe, always on the
     resulting weapon's page) rather than trusting the source weapon's
     forward-pointing `evolution`/`union` fields, which are only consulted
     as a fallback for the rare page that never got its `requires` filled in.
   - data/vampire-survivors/arcanas.json — every Arcana and Darkana (a
     game-rule modifier, not a weapon), tagged `kind: "arcana"|"darkana"`.
   - data/vampire-survivors/passives.json — every passive item (accessory).
   - data/vampire-survivors/enemies.json — every enemy. A page's title
     sometimes carries a wiki-added disambiguator ("Avatar Infernas
     (enemy)") when the plain name collides with a character or another
     enemy — see cleanEnemyName's comment.

   Run by .github/workflows/update-vampire-survivors.yml (daily). Node 18+,
   curl. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const curatedGuides = require("./data/vs-curated-guides");
const stepsPt = require("./data/vs-steps-pt");

// Every non-default character without its own hand-curated guide gets the
// same single-phase presentation instead of the old flat checklist — a
// "How to Unlock" phase built from the (already translated) steps, with the
// trailing purchase-price sentence ("Once unlocked, X can be purchased for
// N...") pulled out into a note instead of sitting in the checklist as a
// non-actionable "step" next to genuine actions. Needs the EN/PT step arrays
// to already line up (see the stepsPt merge in run()) — if a re-scrape ever
// drifts out of sync with the hand-translated file, this returns null and
// the character falls back to the old flat English checklist rather than
// risk a broken or English-only guide.
function autoGuide(c) {
  if (!c.stepsPt || typeof c.unlockShortPt !== "string" || !c.steps.length) return null;
  const isPriceLine = (s) => /purchas/i.test(s);
  const lastIsPrice = c.steps.length > 1 && isPriceLine(c.steps[c.steps.length - 1]);
  const bodyEn = lastIsPrice ? c.steps.slice(0, -1) : c.steps;
  const bodyPt = lastIsPrice ? c.stepsPt.slice(0, -1) : c.stepsPt;
  if (!bodyEn.length) return null; // the whole thing was one fused action+price sentence — nothing left to check off
  const noteEn = lastIsPrice ? c.steps[c.steps.length - 1] : undefined;
  const notePt = lastIsPrice ? c.stepsPt[c.stepsPt.length - 1] : undefined;
  return {
    en: { objective: `Unlock ${c.name}`, dlc: c.dlcName, phases: [{ icon: "🔓", title: "How to Unlock", items: bodyEn.map((text) => ({ text })), note: noteEn }] },
    pt: { objective: `Desbloquear ${c.name}`, dlc: c.dlcName, phases: [{ icon: "🔓", title: "Como Desbloquear", items: bodyPt.map((text) => ({ text })), note: notePt }] },
  };
}

const API = "https://vampire.survivors.wiki/api.php";
const OUT_DIR = path.join(__dirname, "..", "data", "vampire-survivors");
const OUT_CHARS = path.join(OUT_DIR, "characters.json");
const OUT_ACH = path.join(OUT_DIR, "achievements.json");
const OUT_WEAPONS = path.join(OUT_DIR, "weapons.json");
const OUT_ARCANAS = path.join(OUT_DIR, "arcanas.json");
const OUT_PASSIVES = path.join(OUT_DIR, "passives.json");
const OUT_ENEMIES = path.join(OUT_DIR, "enemies.json");
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

// A category listing always includes the category's own root page (same
// name as the category) and sometimes a nested subcategory ("Category:X")
// alongside the real member pages — filter both out, plus any subpage
// ("Page/something").
function fetchCategoryTitles(categoryName) {
  const data = getJson(`${API}?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(categoryName)}&cmlimit=500&format=json`);
  return ((data && data.query && data.query.categorymembers) || [])
    .map((m) => m.title)
    .filter((t) => t !== categoryName && !t.startsWith("Category:") && !t.includes("/"));
}
// Fetches every title's wikitext, batched, then retries whatever a 50-wide
// batch query dropped (a MediaWiki title-normalization quirk with
// punctuation) one at a time so a real page is never silently missing.
function fetchWikitextsWithRetry(titles, label) {
  const wikitexts = fetchWikitextBatch(titles, { redirects: true });
  const missing = titles.filter((t) => !wikitexts[t]);
  if (missing.length) {
    console.log(`retrying ${missing.length} ${label} titles individually: ${missing.join(", ")}`);
    for (const t of missing) {
      const single = fetchWikitextBatch([t], { redirects: true });
      if (single[t]) wikitexts[t] = single[t];
      sleep(200);
    }
  }
  return wikitexts;
}

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
function parseInfobox(wt, key = "{{Infobox Character") {
  const block = balancedTemplate(wt, key);
  if (!block) return null;
  const inner = block.slice(key.length, -2);
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

// ---- Weapons ----------------------------------------------------------------
// Stats worth surfacing, in display order. Infobox keys are already
// lowercased by parseInfobox; a stat's "at max level" figure (when the wiki
// tracks one) lives under the same key prefixed "max-".
const WEAPON_STAT_KEYS = [
  ["damage", "Damage"], ["area", "Area"], ["speed", "Speed"], ["duration", "Duration"],
  ["amount", "Amount"], ["pierce", "Pierce"], ["cooldown", "Cooldown"], ["interval", "Interval"],
  ["delay", "Delay"], ["knockback", "Knockback"], ["pool", "Pool Limit"], ["chance", "Chance"],
  ["critmul", "Crit Multiplier"], ["hit-wall", "Hits Walls"],
];

function parseWeapon(title, wt) {
  const info = parseInfobox(wt, "{{Infobox Weapon");
  if (!info) return null;
  const type = (info.type || "Normal").trim();
  const tier = /^evolution$/i.test(type) ? "evolution" : /^union$/i.test(type) ? "union" : "base";
  // The authoritative recipe: every requirement (weapon or item) needed to
  // produce THIS weapon, always declared on the resulting weapon's own page
  // — see buildWeaponGraph for why this direction is trusted over the
  // source weapon's forward-pointing `evolution`/`union` fields.
  const requires = [1, 2, 3, 4].map((i) => info[`requires${i}`]).filter(Boolean).map((s) => stripWiki(s).trim()).filter(Boolean);
  const evoName = info.evolution ? stripWiki(info.evolution).trim() : null;
  const evoItem = info["evolution-item"] ? stripWiki(info["evolution-item"]).trim() : null;
  const unionName = info.union ? stripWiki(info.union).trim() : null;
  const unionItem = info["union-item"] ? stripWiki(info["union-item"]).trim() : null;

  const block = balancedTemplate(wt, "{{Infobox Weapon");
  const afterInfobox = block ? wt.slice(wt.indexOf(block) + block.length) : wt;
  const introMatch = afterInfobox.match(/^([\s\S]*?)(?=\n==[^=]|\n\{\{WeaponNav|\n\[\[Category|$)/);
  const description = stripWiki(introMatch ? introMatch[1] : afterInfobox);

  const stats = WEAPON_STAT_KEYS
    .map(([key, label]) => ({ key, label, raw: info[key] != null ? stripWiki(info[key]).trim() : null, rawMax: info[`max-${key}`] ? stripWiki(info[`max-${key}`]).trim() : null }))
    .filter((s) => s.raw && s.raw !== "-" && s.raw !== "N/A")
    .map((s) => ({ key: s.key, label: s.label, base: s.raw, max: s.rawMax || null }));
  const effects = info.effects ? stripWiki(info.effects).trim() : "";
  // Older pages don't declare `sprite`/`icon` filenames explicitly, but the
  // wiki's own image-naming convention (confirmed via the pageimages API)
  // is reliable enough to guess and then just try resolving — same
  // fallback-by-guessing approach the character scraper already relies on.
  const images = [info.sprite, `Sprite-${title}.png`, info.icon, `Icon-${title}.png`].map(fileOf).filter(Boolean);
  const name = title.trim();
  return {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    dlcCode: (info.dlc || "").trim().toLowerCase(),
    type,
    tier,
    caption: info.caption ? stripWiki(info.caption).trim() : "",
    description,
    stats,
    effects,
    images,
    icon: null,
    _requires: requires,
    _evolution: evoName ? { name: evoName, item: evoItem } : null,
    _union: unionName ? { name: unionName, item: unionItem } : null,
  };
}

// Builds the evolution graph by inverting each page's own `requires1..N` —
// the resulting weapon's page always lists everything needed to make it
// (one base weapon + a passive item for a normal evolution, or two weapons
// for a union), so that's the authoritative recipe. A `requires` entry that
// matches another known weapon becomes a real evolvesFrom/evolvesInto edge;
// one that doesn't (a passive item — those live on the wiki under a
// separate infobox and never appear here) is kept only as plain-text
// "extras" context alongside the edge, since items don't get their own page.
// The source weapon's forward `evolution`/`union` fields are only consulted
// afterwards, to fill in the rare edge whose target page never got its own
// `requires` filled in — most weapons already have the edge from the first
// pass, so this second pass is a no-op for them.
function buildWeaponGraph(weapons) {
  const byName = new Map(weapons.map((w) => [w.name, w]));
  for (const w of weapons) { w.evolvesFrom = []; w.evolvesInto = []; }
  // Every edge carries a `recipeId` so a page with several parents can tell
  // a real multi-part recipe (all of them needed at once — a union, or an
  // evolution needing several items) from a handful of unrelated
  // alternative paths that all just happen to lead to the same weapon (e.g.
  // Penshin Fatcha's six interchangeable starting tuna forms, each of which
  // independently "evolves into" it with nothing to do with the others).
  // requires1..N entries share one recipeId because they always come from
  // the very same array; a page discovered only via the forward-pointing
  // fallback below gets a recipeId unique to that single edge instead.
  const addEdge = (parent, child, extras, recipeId) => {
    if (!parent.evolvesInto.some((e) => e.slug === child.slug)) parent.evolvesInto.push({ name: child.name, slug: child.slug, extras, recipeId });
    if (!child.evolvesFrom.some((e) => e.slug === parent.slug)) child.evolvesFrom.push({ name: parent.name, slug: parent.slug, extras, recipeId });
  };
  for (const w of weapons) {
    const resolved = w._requires.map((name) => ({ name, weapon: byName.get(name) || null }));
    resolved.forEach((r, i) => {
      if (!r.weapon) return;
      const extras = resolved.filter((_, j) => j !== i).map((x) => ({ name: x.name, slug: x.weapon ? x.weapon.slug : null }));
      addEdge(r.weapon, w, extras, `req:${w.slug}`);
    });
  }
  for (const w of weapons) {
    for (const fwd of [w._evolution, w._union]) {
      if (!fwd) continue;
      const target = byName.get(fwd.name);
      if (!target || w.evolvesInto.some((e) => e.slug === target.slug)) continue;
      const itemWeapon = fwd.item ? byName.get(fwd.item) : null;
      addEdge(w, target, fwd.item ? [{ name: fwd.item, slug: itemWeapon ? itemWeapon.slug : null }] : [], `fwd:${w.slug}>${target.slug}`);
    }
  }
  for (const w of weapons) { delete w._requires; delete w._evolution; delete w._union; }
}

// ---- Arcanas & Darkanas -------------------------------------------------
// Both use the same {{Infobox Arcana}} template (a Darkana just sets
// |type=Darkana instead of |type=Arcana) — often nested inside a
// {{Multi infobox}} alongside a *second*, internal {{Infobox Weapon}} that
// represents the arcana's attack under the hood. That nested weapon
// infobox is exactly why these pages used to leak into Category:Weapons'
// scrape (see the exclusion in the weapons block below) — an arcana is a
// game-rule modifier, not something you equip and level up.
function parseArcanaLike(title, wt, kind) {
  const info = parseInfobox(wt, "{{Infobox Arcana");
  if (!info) return null;
  const name = title.trim();
  const affects = [...(info.affects || "").matchAll(/\{\{(?:Sprite|slink)\|([^|}]+)/g)].map((m) => stripWiki(m[1]).trim()).filter(Boolean);
  return {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    kind,
    dlcCode: (info.dlc || "").trim().toLowerCase(),
    description: info.description ? stripWiki(info.description).trim() : "",
    unlock: info.unlock ? stripWiki(info.unlock).trim() : "",
    notes: info.notes ? stripWiki(info.notes).trim() : "",
    affects,
    images: [info.icon, info.image, `Icon-${title}.png`, `Sprite-${title}.png`].map(fileOf).filter(Boolean),
    icon: null,
  };
}

// ---- Passive items --------------------------------------------------------
function parsePassive(title, wt) {
  const info = parseInfobox(wt, "{{Infobox Passive item");
  if (!info) return null;
  const name = title.trim();
  return {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    dlcCode: (info.dlc || "").trim().toLowerCase(),
    description: info.description ? stripWiki(info.description).trim() : "",
    stat: info.stat ? stripWiki(info.stat).trim() : "",
    rarity: info.rarity ? stripWiki(info.rarity).trim() : "",
    maxLevel: info["max-level"] ? stripWiki(info["max-level"]).trim() : "",
    perLevel: info["per-level"] ? stripWiki(info["per-level"]).trim() : "",
    stacking: info.stacking ? stripWiki(info.stacking).trim() : "",
    maxEffect: info["max-effect"] ? stripWiki(info["max-effect"]).trim() : "",
    images: [info.icon, info.sprite, `Icon-${title}.png`, `Sprite-${title}.png`].map(fileOf).filter(Boolean),
    icon: null,
  };
}

// ---- Enemies ----------------------------------------------------------------
// A page's title occasionally carries a disambiguator the wiki itself added
// because the plain name collides with something else — "Avatar Infernas
// (enemy)" vs the playable character "Avatar Infernas", or "Death (boss)".
// Strip only that exact, meaningless-on-its-own suffix for the display
// name; a more descriptive disambiguator (e.g. "Succubus (Ode to
// Castlevania enemy)", used when two *enemies* share a name) is left
// alone since it's carrying real information. The slug is always derived
// from the full raw title regardless, so it stays unique either way.
function cleanEnemyName(title) {
  return /\((?:enemy|boss)\)$/i.test(title) ? title.replace(/\s*\((?:enemy|boss)\)\s*$/i, "").trim() : title.trim();
}
function enemyIntro(wt) {
  const block = balancedTemplate(wt, "{{Infobox Bestiary");
  const after = block ? wt.slice(wt.indexOf(block) + block.length) : wt;
  const m = after.match(/^([\s\S]*?)(?=\n==[^=]|\n\[\[Category|$)/);
  return stripWiki(m ? m[1] : after).trim();
}
function parseEnemy(title, wt) {
  const info = parseInfobox(wt, "{{Infobox Bestiary");
  if (!info) return null;
  return {
    name: cleanEnemyName(title),
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    dlcCode: (info.dlc || "").trim().toLowerCase(),
    theme: info.theme ? stripWiki(info.theme).trim() : "",
    stages: info.stages ? stripWiki(info.stages).trim() : "",
    skills: info.skills ? stripWiki(info.skills).trim() : "",
    resistances: info.resistances ? stripWiki(info.resistances).trim() : "",
    notes: info.notes ? stripWiki(info.notes).trim() : "",
    health: info.health ? stripWiki(info.health).trim() : "",
    damage: info.damage ? stripWiki(info.damage).trim() : "",
    movespeed: info.movespeed ? stripWiki(info.movespeed).trim() : "",
    description: enemyIntro(wt),
    images: [info.image, `Sprite-${title}.png`].map(fileOf).filter(Boolean),
    icon: null,
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

  // ---- Arcanas & Darkanas -----------------------------------------------------
  // Fetched before Weapons so their titles can be excluded from that
  // category's scrape below — see parseArcanaLike's comment for why they'd
  // otherwise leak in as fake weapons.
  const arcanaTitles = fetchCategoryTitles("Arcanas");
  const darkanaTitles = fetchCategoryTitles("Darkanas");
  const arcanaWikitexts = fetchWikitextsWithRetry([...arcanaTitles, ...darkanaTitles], "arcana");
  const arcanas = [];
  for (const title of arcanaTitles) { const wt = arcanaWikitexts[title]; const a = wt && parseArcanaLike(title, wt, "arcana"); if (a) arcanas.push(a); }
  for (const title of darkanaTitles) { const wt = arcanaWikitexts[title]; const a = wt && parseArcanaLike(title, wt, "darkana"); if (a) arcanas.push(a); }
  const arcanaImgMap = fetchImageUrls(arcanas.flatMap((a) => a.images));
  for (const a of arcanas) {
    a.icon = a.images.map((f) => arcanaImgMap[f]).find(Boolean) || null;
    delete a.images;
    a.dlcName = a.dlcCode ? dlcMap[a.dlcCode] || a.dlcCode : "Base Game";
  }
  arcanas.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind.localeCompare(b.kind)));
  fs.writeFileSync(OUT_ARCANAS, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://vampire.survivors.wiki/w/Arcanas",
    count: arcanas.length,
    arcanas,
  }));
  console.log(`vampire-survivors arcanas: ${arcanas.filter((a) => a.kind === "arcana").length} arcanas, ${arcanas.filter((a) => a.kind === "darkana").length} darkanas.`);

  // ---- Passive items ----------------------------------------------------------
  const passiveTitles = fetchCategoryTitles("Passive items");
  const passiveWikitexts = fetchWikitextsWithRetry(passiveTitles, "passive item");
  const passives = [];
  for (const title of passiveTitles) { const wt = passiveWikitexts[title]; const p = wt && parsePassive(title, wt); if (p) passives.push(p); }
  const passiveImgMap = fetchImageUrls(passives.flatMap((p) => p.images));
  for (const p of passives) {
    p.icon = p.images.map((f) => passiveImgMap[f]).find(Boolean) || null;
    delete p.images;
    p.dlcName = p.dlcCode ? dlcMap[p.dlcCode] || p.dlcCode : "Base Game";
  }
  passives.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(OUT_PASSIVES, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://vampire.survivors.wiki/w/Passive_items",
    count: passives.length,
    passives,
  }));
  console.log(`vampire-survivors passive items: ${passives.length}.`);

  // ---- Enemies ------------------------------------------------------------
  const enemyTitles = fetchCategoryTitles("Enemies");
  const enemyWikitexts = fetchWikitextsWithRetry(enemyTitles, "enemy");
  const enemies = [];
  for (const title of enemyTitles) { const wt = enemyWikitexts[title]; const e = wt && parseEnemy(title, wt); if (e) enemies.push(e); }
  const enemyImgMap = fetchImageUrls(enemies.flatMap((e) => e.images));
  for (const e of enemies) {
    e.icon = e.images.map((f) => enemyImgMap[f]).find(Boolean) || null;
    delete e.images;
    e.dlcName = e.dlcCode ? dlcMap[e.dlcCode] || e.dlcCode : "Base Game";
  }
  enemies.sort((a, b) => (a.dlcName === b.dlcName ? a.name.localeCompare(b.name) : (a.dlcName === "Base Game" ? -1 : b.dlcName === "Base Game" ? 1 : a.dlcName.localeCompare(b.dlcName))));
  fs.writeFileSync(OUT_ENEMIES, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://vampire.survivors.wiki/w/Enemies",
    count: enemies.length,
    dlcs: [...new Set(enemies.map((e) => e.dlcName))],
    enemies,
  }));
  console.log(`vampire-survivors enemies: ${enemies.length}.`);

  // ---- Weapons ----------------------------------------------------------------
  const excludeFromWeapons = new Set([...arcanaTitles, ...darkanaTitles]);
  const wTitles = fetchCategoryTitles("Weapons").filter((t) => !excludeFromWeapons.has(t));
  console.log(`weapon pages to fetch: ${wTitles.length}`);

  const wWikitexts = fetchWikitextsWithRetry(wTitles, "weapon");
  const weapons = [];
  for (const title of wTitles) {
    const wt = wWikitexts[title];
    if (!wt) continue;
    const w = parseWeapon(title, wt);
    if (w) weapons.push(w);
  }
  const wImgMap = fetchImageUrls(weapons.flatMap((w) => w.images));
  for (const w of weapons) {
    w.icon = w.images.map((f) => wImgMap[f]).find(Boolean) || null;
    delete w.images;
    w.dlcName = w.dlcCode ? dlcMap[w.dlcCode] || w.dlcCode : "Base Game";
  }
  buildWeaponGraph(weapons);
  weapons.sort((a, b) => (a.dlcName === b.dlcName ? a.name.localeCompare(b.name) : (a.dlcName === "Base Game" ? -1 : b.dlcName === "Base Game" ? 1 : a.dlcName.localeCompare(b.dlcName))));

  fs.writeFileSync(OUT_WEAPONS, JSON.stringify({
    updated: new Date().toISOString(),
    source: "https://vampire.survivors.wiki/w/Weapons",
    count: weapons.length,
    dlcs: [...new Set(weapons.map((w) => w.dlcName))],
    weapons,
  }));
  console.log(`vampire-survivors weapons: ${weapons.length} (${weapons.filter((w) => w.tier === "evolution").length} evolutions, ${weapons.filter((w) => w.tier === "union").length} unions).`);

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
    // Hand-translated PT-PT copy of the wiki's own (English) unlockShort/steps
    // text — see scripts/data/vs-steps-pt.js. Only applied when the steps
    // count still matches what we just scraped, since checklist IDs are
    // positional: if the wiki's own text changes shape on a re-scrape, keep
    // showing the (still-correct) English original rather than risk a
    // mismatched translation scrambling a viewer's saved progress.
    const pt = stepsPt[c.slug];
    if (pt) {
      if (typeof pt.unlockShort === "string") c.unlockShortPt = pt.unlockShort;
      if (Array.isArray(pt.steps) && pt.steps.length === c.steps.length) c.stepsPt = pt.steps;
    }
    // Everyone else without a hand-curated guide (i.e. not Chaos-tier
    // complex) still gets the same phased-guide presentation instead of the
    // old flat checklist — see autoGuide's own comment above.
    if (!c.isDefault && !c.guide) {
      const auto = autoGuide(c);
      if (auto) c.guide = auto;
    }
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

try { run(); } catch (e) { require("./lib/keep")([OUT_CHARS, OUT_ACH, OUT_WEAPONS, OUT_ARCANAS, OUT_PASSIVES, OUT_ENEMIES], e); }
