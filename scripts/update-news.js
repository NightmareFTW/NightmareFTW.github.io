/* News updater (run locally and by .github/workflows/update-news.yml).
   Fetches Google News RSS per game server-side (no browser CORS issues), then
   for each headline resolves the real article URL (Google News wraps links in a
   redirect) and pulls OpenGraph metadata — summary + image — so the site can
   show a rich preview page. Writes data/news/<game>.json read same-origin.

   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "data", "news");
const PER_GAME = 12;          // headlines kept (and enriched) per game
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NightmareFTW-bot";

const QUERIES = {
  phasmophobia: "Phasmophobia game",
  "outlast-trials": "The Outlast Trials game",
  ffxiv: "Final Fantasy XIV",
  epic7: "Epic Seven game",
  nte: "Neverness to Everness game",
  warframe: "Warframe game",
  "dreamlight-valley": "Disney Dreamlight Valley",
};

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&#160;": " ", "&nbsp;": " " };
const decode = (s = "") => s.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&#160;|&nbsp;/g, (m) => ENTITIES[m]).trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, "")) : "";
};

// Fetch with a hard timeout so a single slow article can't stall the run.
async function fetchT(url, opts = {}, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal, headers: { "User-Agent": UA, ...(opts.headers || {}) } }); }
  finally { clearTimeout(t); }
}

// Resolve a Google News article id to the publisher's real URL via the same
// batchexecute endpoint the News site uses. Returns "" on any failure.
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

// Pull OpenGraph (+ fallbacks) summary / image / publish time from an article.
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
    return {
      summary: meta("og:description", "twitter:description", "description"),
      image,
      published: meta("article:published_time", "og:updated_time"),
    };
  } catch { return { summary: "", image: "", published: "" }; }
}

async function fetchNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await (await fetchT(url)).text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, PER_GAME).map((m) => {
    const b = m[1];
    let title = tag(b, "title");
    const source = tag(b, "source");
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const gnLink = tag(b, "link");
    const gnId = (gnLink.match(/\/articles\/([^?]+)/) || [])[1] || "";
    return { title, gnLink, gnId, source, date: tag(b, "pubDate") };
  }).filter((it) => it.title && it.gnLink);
}

// Resolve + enrich items with limited concurrency to be polite and fast.
async function enrich(items, concurrency = 5) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const it = items[i++];
      const url = it.gnId ? await resolveGN(it.gnId) : "";
      const meta = url ? await articleMeta(url) : { summary: "", image: "", published: "" };
      it.url = url || it.gnLink;          // real article, or the GN link as fallback
      it.summary = meta.summary || "";
      it.image = meta.image || "";
      if (meta.published) it.date = it.date || meta.published;
      delete it.gnId;
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return items;
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [game, query] of Object.entries(QUERIES)) {
    try {
      const items = await enrich(await fetchNews(query));
      const out = { game, query, updated: new Date().toISOString(), items };
      fs.writeFileSync(path.join(OUT_DIR, `${game}.json`), JSON.stringify(out));
      const withImg = items.filter((x) => x.image).length, withSum = items.filter((x) => x.summary).length;
      console.log(`[${game}] ${items.length} headlines · ${withImg} images · ${withSum} summaries.`);
    } catch (e) {
      console.warn(`[${game}] failed:`, e.message);
    }
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
