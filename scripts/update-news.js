/* News updater (run locally and by .github/workflows/update-news.yml).

   Two sources per game, merged and sorted newest-first:
   1. Steam developer posts (ISteamNews API) — official announcements with the
      FULL post body (converted from Steam's BBCode to HTML) and its image.
   2. Google News headlines — resolved to the publisher's real URL, then
      enriched with an OpenGraph summary/image plus a best-effort article body.

   Writes data/news/<game>.json, read same-origin by the site.
   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "data", "news");
const PER_SOURCE = 12;        // headlines per source before merge
const KEEP = 18;              // items kept per game after merge
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NightmareFTW-bot";

const QUERIES = {
  phasmophobia: "Phasmophobia game",
  "outlast-trials": "The Outlast Trials game",
  ffxiv: "Final Fantasy XIV",
  epic7: "Epic Seven game",
  nte: "Neverness to Everness game",
  warframe: "Warframe game",
  "dreamlight-valley": "Disney Dreamlight Valley",
  "cyberpunk-2077": "Cyberpunk 2077 game",
  "god-of-war-ragnarok": "God of War Ragnarok game",
  "expedition-33": "Clair Obscur Expedition 33 game",
  "elden-ring": "Elden Ring game",
  "honkai-star-rail": "Honkai Star Rail game",
  demonologist: "Demonologist game",
  "far-far-west": "Far Far West game",
};

// Steam appids for the games that publish dev news on Steam (Epic Seven is
// mobile/Stove-only, so it has no Steam feed).
const STEAM_APPIDS = {
  phasmophobia: 739630,
  "outlast-trials": 1304930,
  ffxiv: 39210,
  warframe: 230410,
  "dreamlight-valley": 1401590,
  nte: 4508340,
  "cyberpunk-2077": 1091500,
  "god-of-war-ragnarok": 2322010,
  "expedition-33": 1903340,
  "elden-ring": 1245620,
  demonologist: 1929610,
  "far-far-west": 3124540,
};

// ---- text helpers -----------------------------------------------------------
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
// Decode named + numeric (&#039; , &#x27;) HTML entities.
const decodeEntities = (s = "") => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCp(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => safeCp(parseInt(n, 10)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, e) => NAMED[e] || "");
const safeCp = (n) => { try { return String.fromCodePoint(n); } catch { return ""; } };
const decode = (s = "") => decodeEntities(s).replace(/\s+/g, " ").trim();
const stripTags = (s = "") => decode(s.replace(/<[^>]+>/g, " "));
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, "")) : "";
};

// Fetch with a hard timeout so one slow request can't stall the run.
async function fetchT(url, opts = {}, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal, headers: { "User-Agent": UA, ...(opts.headers || {}) } }); }
  finally { clearTimeout(t); }
}

// ---- Steam BBCode -> HTML ----------------------------------------------------
const STEAM_IMG = "https://clan.cloudflare.steamstatic.com/images";
function bbcodeToHtml(src = "") {
  let s = src.replace(/\{STEAM_CLAN_IMAGE\}/g, STEAM_IMG);
  s = s.replace(/\[img\][\s]*([^\[\]]+?)[\s]*\[\/img\]/gi, (_, u) => `<img src="${u.trim()}" loading="lazy" alt="">`);
  s = s.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>');
  s = s.replace(/\[h([1-3])\]([\s\S]*?)\[\/h\1\]/gi, (_, n, t) => `<h${Math.min(4, +n + 1)}>${t}</h${Math.min(4, +n + 1)}>`);
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
       .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
       .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  s = s.replace(/\[list[^\]]*\]/gi, "<ul>").replace(/\[\/list\]/gi, "</ul>").replace(/\[\*\]/gi, "<li>");
  s = s.replace(/\[quote[^\]]*\]([\s\S]*?)\[\/quote\]/gi, "<blockquote>$1</blockquote>");
  s = s.replace(/\[p[^\]]*\]([\s\S]*?)\[\/p\]/gi, "<p>$1</p>").replace(/\[p[^\]]*\]/gi, "<p>");
  s = s.replace(/\[\/?[a-z][^\]]*\]/gi, "");          // drop any remaining tags
  s = s.replace(/&amp;quot;/g, '"').replace(/&amp;/g, "&");
  return s.trim();
}

// ---- Google News URL resolution ---------------------------------------------
async function resolveGN(id) {
  try {
    const art = await (await fetchT(`https://news.google.com/rss/articles/${id}`)).text();
    const sg = (art.match(/data-n-a-sg="([^"]+)"/) || [])[1];
    const ts = (art.match(/data-n-a-ts="([^"]+)"/) || [])[1];
    if (!sg || !ts) return "";
    const inner = JSON.stringify(["garturlreq", [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, Number(ts), sg]);
    const payload = JSON.stringify([[["Fbv4je", inner, null, "generic"]]]);
    const res = await fetchT("https://news.google.com/_/DotsSplashUi/data/batchexecute",
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: "f.req=" + encodeURIComponent(payload) });
    const txt = await res.text();
    const i = txt.indexOf("garturlres");
    if (i < 0) return "";
    const m = txt.slice(i).match(/"(https?:\/\/[^"]+?)"/);
    if (!m) return "";
    return m[1].replace(/\\u003d/g, "=").replace(/\\u0026/g, "&").replace(/\\\//g, "/").replace(/\\+$/, "");
  } catch { return ""; }
}

// OpenGraph + readable article body from a publisher page.
async function articleMeta(url) {
  try {
    const html = await (await fetchT(url, { redirect: "follow" })).text();
    const meta = (...names) => {
      for (const n of names) {
        const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]+content=["']([^"']*)["']`, "i");
        const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${n}["']`, "i");
        const v = (html.match(re1) || html.match(re2) || [])[1];
        if (v) return decode(v);
      }
      return "";
    };
    let image = meta("og:image", "twitter:image", "twitter:image:src");
    if (image && image.startsWith("//")) image = "https:" + image;
    // Body: prefer <article>, else <main>, else whole doc; keep substantial <p>.
    const scope = (html.match(/<article[\s\S]*?<\/article>/i) || [])[0]
      || (html.match(/<main[\s\S]*?<\/main>/i) || [])[0] || html;
    const paras = [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripTags(m[1]))
      .filter((t) => t.length > 45 && !/^(advertisement|sign up|subscribe|share this)/i.test(t));
    const seen = new Set();
    const body = paras.filter((p) => (seen.has(p) ? false : seen.add(p))).slice(0, 14);
    return {
      summary: meta("og:description", "twitter:description", "description"),
      image,
      published: meta("article:published_time", "og:updated_time"),
      content: body.length ? body.map((p) => `<p>${p}</p>`).join("") : "",
    };
  } catch { return { summary: "", image: "", published: "", content: "" }; }
}

// ---- sources ----------------------------------------------------------------
async function steamNews(appid) {
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=${PER_SOURCE}&maxlength=0&feeds=steam_community_announcements&format=json`;
  const j = await (await fetchT(url)).json();
  const items = (j.appnews && j.appnews.newsitems) || [];
  return items.map((it) => {
    const content = bbcodeToHtml(it.contents || "");
    const image = (content.match(/<img[^>]+src="([^"]+)"/) || [])[1] || "";
    return {
      title: decode(it.title),
      source: "Steam",
      date: new Date(it.date * 1000).toISOString(),
      url: `https://store.steampowered.com/news/app/${appid}/view/${it.gid}`,
      summary: stripTags(content).slice(0, 240),
      image,
      content,
    };
  });
}

async function googleNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await (await fetchT(url)).text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, PER_SOURCE).map((m) => {
    const b = m[1];
    let title = tag(b, "title");
    const source = tag(b, "source");
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const gnLink = tag(b, "link");
    const gnId = (gnLink.match(/\/articles\/([^?]+)/) || [])[1] || "";
    return { title, gnLink, gnId, source, date: tag(b, "pubDate") };
  }).filter((it) => it.title && it.gnLink);

  // Resolve + enrich with limited concurrency.
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const it = items[i++];
      const real = it.gnId ? await resolveGN(it.gnId) : "";
      const meta = real ? await articleMeta(real) : { summary: "", image: "", published: "", content: "" };
      it.url = real || it.gnLink;
      it.summary = meta.summary || "";
      it.image = meta.image || "";
      it.content = meta.content || "";
      if (meta.published) it.date = it.date || meta.published;
      it.date = new Date(it.date || Date.now()).toISOString();
      delete it.gnId; delete it.gnLink;
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, items.length) }, worker));
  return items;
}

// Drop near-duplicate titles across the two sources (Steam wins, it has full text).
const normTitle = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [game, query] of Object.entries(QUERIES)) {
    try {
      const [steam, google] = await Promise.all([
        STEAM_APPIDS[game] ? steamNews(STEAM_APPIDS[game]).catch(() => []) : Promise.resolve([]),
        googleNews(query).catch(() => []),
      ]);
      const seen = new Set();
      const items = [...steam, ...google]
        .filter((it) => it.title && it.url && (seen.has(normTitle(it.title)) ? false : seen.add(normTitle(it.title))))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, KEEP);
      const out = { game, query, updated: new Date().toISOString(), items };
      fs.writeFileSync(path.join(OUT_DIR, `${game}.json`), JSON.stringify(out));
      console.log(`[${game}] ${items.length} (steam ${steam.length}, google ${google.length}) · ${items.filter((x) => x.image).length} img · ${items.filter((x) => x.content).length} full`);
    } catch (e) {
      console.warn(`[${game}] failed:`, e.message);
    }
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
