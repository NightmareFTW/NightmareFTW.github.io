/* One-off diagnostic: dump the "Free Games Info!!!" Steam group RSS feed
   raw, to see whether/how it mentions Deponia (reported missing from the
   site's Steam free-game notifications despite being a real, live Steam
   free-to-keep promo through Aug 20). Not part of the scheduled pipeline —
   safe to delete once the root cause is found. */
const GROUP = "freegamesinfoo";
const RSS_URL = `https://steamcommunity.com/groups/${GROUP}/rss/`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NightmareFTW-bot";

async function main() {
  const res = await fetch(RSS_URL, { headers: { "User-Agent": UA } });
  const xml = await res.text();
  console.log("status:", res.status, "length:", xml.length);
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  console.log("item count:", items.length);
  for (const m of items) {
    const block = m[1];
    const title = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
    const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || "";
    const appids = [...new Set([...block.matchAll(/store\.steampowered\.com\/app\/(\d+)/gi)].map((x) => x[1]))];
    console.log(`\n--- ${pubDate} ---`);
    console.log("title:", title.replace(/<!\[CDATA\[|\]\]>/g, "").slice(0, 200));
    console.log("appids found:", appids);
    if (/deponia/i.test(block)) console.log("*** MENTIONS DEPONIA ***", block.slice(0, 2000));
  }

  // Also try Steam's appdetails for Deponia's known appid (214340) directly.
  try {
    const r = await fetch("https://store.steampowered.com/api/appdetails?appids=214340&cc=us&l=en", { headers: { "User-Agent": UA } });
    const j = await r.json();
    console.log("\n--- appdetails 214340 (Deponia) ---");
    console.log(JSON.stringify(j).slice(0, 1500));
  } catch (e) { console.log("appdetails fetch failed:", e.message); }
}

main().catch((e) => { console.error(e); process.exit(1); });
