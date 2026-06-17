/* News updater (run locally and by .github/workflows/update-news.yml).
   Fetches Google News RSS per game server-side (no browser CORS issues) and
   writes data/news/<game>.json so the site can load news instantly from
   same-origin JSON instead of a flaky client-side CORS proxy.

   Node 18+ (global fetch), no dependencies. */

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "data", "news");

const QUERIES = {
  phasmophobia: "Phasmophobia game",
  "outlast-trials": "The Outlast Trials game",
  ffxiv: "Final Fantasy XIV",
  epic7: "Epic Seven game",
  nte: "Neverness to Everness game",
  warframe: "Warframe game",
};

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };
const decode = (s = "") => s.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (m) => ENTITIES[m]).trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, "")) : "";
};

async function fetchNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 NightmareFTW-bot" } })).text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 15).map((m) => {
    const b = m[1];
    let title = tag(b, "title");
    const source = tag(b, "source");
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    return { title, link: tag(b, "link"), source, date: tag(b, "pubDate") };
  }).filter((it) => it.title && it.link);
  return items;
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [game, query] of Object.entries(QUERIES)) {
    try {
      const items = await fetchNews(query);
      const out = { game, query, updated: new Date().toISOString(), items };
      fs.writeFileSync(path.join(OUT_DIR, `${game}.json`), JSON.stringify(out));
      console.log(`[${game}] ${items.length} headlines.`);
    } catch (e) {
      console.warn(`[${game}] failed:`, e.message);
    }
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
