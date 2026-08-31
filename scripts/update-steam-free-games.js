/* Steam free-game promo alerts (run locally and by
   .github/workflows/update-steam-free-games.yml).

   Source: the "Free Games Info!!!" Steam group's public announcements RSS
   (https://steamcommunity.com/groups/freegamesinfoo) — a community group
   dedicated to posting normally-paid Steam games that are temporarily free to
   claim (giveaways, 100%-off promos, keys from other storefronts, etc).

   The RSS feed is freeform human-written posts, not a structured API, so we
   don't trust its formatting too closely: we regex-scan each item for any
   store.steampowered.com/app/<id> link, then verify every candidate against
   Steam's own public appdetails API. That's the real filter — it also
   self-corrects false positives from the regex scan (an unrelated or garbage
   appid just fails validation and gets dropped).

   Filter: trust the group's own curation (it exists specifically to track
   "normally-paid game, temporarily free" promos) rather than Steam's live
   is_free flag — during an official "free to keep" giveaway (like Deponia,
   Aug 2026) Valve flips the app's own is_free to true for the claim window,
   which is indistinguishable from a permanently-free F2P title in the API
   response. Relying on it would silently drop exactly the promos we want.
   "[ENDED]"/"[EXPIRED]" post titles are what retract an entry instead (see
   below) — that's a much more reliable per-item signal than a price flag.

   The RSS window only holds the most recent handful of posts, so results are
   merged with the previous data/steam-free-games.json and pruned by age
   (KEEP_DAYS) rather than recomputed from scratch each run — otherwise an
   item would vanish the moment it scrolls out of the feed, not when the
   promo actually ends.

   Writes data/steam-free-games.json, read same-origin by the site.
   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "data");
const OUT_FILE = path.join(OUT_DIR, "steam-free-games.json");
const GROUP = "freegamesinfoo";
const RSS_URL = `https://steamcommunity.com/groups/${GROUP}/rss/`;
const APPDETAILS_DELAY_MS = 350;   // be polite to Steam's store API
const KEEP_DAYS = 14;              // most free-game promos run days, not weeks
const MAX_ITEMS = 30;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NightmareFTW-bot";

async function fetchT(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal, headers: { "User-Agent": UA, ...(opts.headers || {}) } }); }
  finally { clearTimeout(t); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- text helpers (same lenient approach as update-news.js) -----------------
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
const decodeEntities = (s = "") => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCp(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => safeCp(parseInt(n, 10)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, e) => NAMED[e] || "");
const safeCp = (n) => { try { return String.fromCodePoint(n); } catch { return ""; } };
const decode = (s = "") => decodeEntities(s).replace(/\s+/g, " ").trim();
// Decode entities BEFORE stripping tags — otherwise an entity-encoded tag
// (e.g. "&lt;script&gt;") has no raw "<"/">" to be caught by the stripper and
// only turns into a real tag once decoded, right after the filter ran.
const stripTags = (s = "") => decodeEntities(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, "")) : "";
};

// Best-effort "claim it before this date" extraction from the post's own
// freeform text (e.g. "Free to keep when you get it before 20 Aug"). Kept as
// the raw matched phrase rather than a parsed Date — the source has no fixed
// format/locale/year, and a wrong guess is worse than showing nothing.
function deadlineHint(text) {
  const m = String(text || "").match(/\b(?:before|until|by)\s+((?:\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}|[A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?)(?:,?\s*\d{4})?)/i);
  return m ? m[1].trim() : "";
}

// ---- RSS -> candidate appids --------------------------------------------------
async function fetchGroupPosts() {
  const xml = await (await fetchT(RSS_URL)).text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const posts = [];
  for (const m of items) {
    const block = m[1];
    const title = tag(block, "title");
    const link = tag(block, "link");
    const pubDate = tag(block, "pubDate");
    const description = tag(block, "description");
    const date = new Date(pubDate || Date.now()).toISOString();
    // Any Steam store app link mentioned anywhere in the post (title, link or
    // description) is a candidate — the appdetails check below is what
    // actually validates it, so we can afford to be permissive here.
    const appids = [...new Set([...block.matchAll(/store\.steampowered\.com\/app\/(\d+)/gi)].map((x) => Number(x[1])))].slice(0, 5);
    if (!appids.length) continue;
    posts.push({ title: stripTags(title), sourceUrl: link, postedAt: date, appids, deadline: deadlineHint(description) || deadlineHint(title) });
  }
  return posts;
}

// ---- appdetails validation ----------------------------------------------------
async function appDetails(appid) {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=en`;
    const j = await (await fetchT(url)).json();
    const entry = j && j[appid];
    if (!entry || !entry.success || !entry.data) return null;
    return entry.data;
  } catch { return null; }
}

// A "free to keep" grant doesn't always zero out price_overview.final the way
// a normal sale does — a Steam quirk seen live on real promos (e.g. Microsoft
// Flight Simulator's "Themes Reimagined": final stayed at the full 999 cents
// while discount_percent read 100 and final_formatted read "Free"). Checking
// final alone would misclassify that as ended, so treat any of these three as
// "still free": zero final, a 100% discount, or an explicit "Free" label. No
// price_overview at all means a genuine always-free F2P title, which never
// "ends" via this check (KEEP_DAYS/an [ENDED] repost handle that instead).
function isCurrentlyFree(data) {
  const price = data.price_overview;
  if (!price) return true;
  return price.final === 0 || price.discount_percent === 100 || price.final_formatted === "Free";
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let previous = { updated: null, items: [] };
  try { previous = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch { /* first run */ }
  const byAppid = new Map((previous.items || []).map((it) => [it.appid, it]));

  // The group re-posts (or edits) an entry with an "[ENDED]"/"[EXPIRED]" title
  // once a promo is over — that's a much more reliable signal than any time
  // window, so it both blocks adding an already-ended promo and retracts one
  // we'd previously listed as active. Posts are newest-first, so the first
  // time we see a given appid in this run is the one that wins.
  const posts = await fetchGroupPosts();
  const seenAppids = new Set();
  for (const post of posts) {
    const ended = /\[(ended|expired)\]/i.test(post.title);
    for (const appid of post.appids) {
      if (seenAppids.has(appid)) continue;   // a newer post already settled this appid
      seenAppids.add(appid);
      if (ended) { byAppid.delete(appid); continue; }
      await sleep(APPDETAILS_DELAY_MS);
      const data = await appDetails(appid);
      if (!data) continue;   // not a real Steam app — bad/garbage appid
      // The group doesn't reliably repost an "[ENDED]" retraction, and its
      // RSS window can hold a post for well over a week — re-validate the
      // promo is still actually free every time we see it, not just once.
      if (!isCurrentlyFree(data)) { byAppid.delete(appid); continue; }
      const price = data.price_overview;
      byAppid.set(appid, {
        appid,
        name: data.name || post.title,
        image: data.header_image || "",
        url: `https://store.steampowered.com/app/${appid}/`,
        normalPrice: price ? price.initial_formatted || price.final_formatted || "" : "",
        deadline: post.deadline || "",
        postedAt: post.postedAt,
        sourceTitle: post.title,
        sourceUrl: post.sourceUrl,
      });
    }
  }

  // The RSS window only holds a handful of posts, so a promo can outlive the
  // "[ENDED]" repost we'd otherwise rely on to retract it (it can scroll out
  // before we ever see it). Re-check every carried-over item this run didn't
  // already touch — isCurrentlyFree going false is unambiguous proof the
  // promo ended (unlike is_free, this can't be confused with the app having
  // been free all along, since a real F2P title has no price_overview at all).
  for (const [appid, it] of [...byAppid]) {
    if (seenAppids.has(appid)) continue;
    await sleep(APPDETAILS_DELAY_MS);
    const data = await appDetails(appid);
    if (!data) continue;   // couldn't verify (network/region) — leave it, KEEP_DAYS is the fallback
    if (!isCurrentlyFree(data)) { byAppid.delete(appid); continue; }
    const price = data.price_overview;
    if (price) byAppid.set(appid, { ...it, name: data.name || it.name, image: data.header_image || it.image, normalPrice: price.initial_formatted || price.final_formatted || it.normalPrice });
  }

  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  const items = [...byAppid.values()]
    .filter((it) => new Date(it.postedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .slice(0, MAX_ITEMS);

  const out = { updated: new Date().toISOString(), source: `https://steamcommunity.com/groups/${GROUP}`, items };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out));
  console.log(`steam-free-games: ${items.length} active (from ${posts.length} recent posts, ${seenAppids.size} candidate appids checked)`);
}

run().catch((e) => require("./lib/keep")(OUT_FILE, e));
