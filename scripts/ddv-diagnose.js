/* One-off diagnostic: fetch a few Dreamlight Valley Wiki pages through the
   same curl-based fetcher the scrapers use, and print structural markers so
   we can see why parsing is returning zero results (run via GitHub Actions,
   since the wiki is unreachable from some sandboxes). Not part of the
   scheduled pipeline — safe to delete once the scrapers are fixed. */
const { getText } = require("./lib/http");

const PAGES = [
  "https://dreamlightvalleywiki.com/Furniture",
  "https://dreamlightvalleywiki.com/Companions",
  "https://dreamlightvalleywiki.com/Critters",
  "https://dreamlightvalleywiki.com/Ingredients",
];

for (const url of PAGES) {
  const html = getText(url);
  console.log(`\n\n========== ${url} ==========`);
  console.log("length:", html.length);
  console.log("has gallerybox:", html.includes("gallerybox"));
  console.log("has <table:", html.includes("<table"));
  console.log("has cf-mitigated / Just a moment:", /cf-mitigated|Just a moment|Checking your browser/i.test(html));
  console.log("has <h2:", (html.match(/<h2/g) || []).length, " <h3:", (html.match(/<h3/g) || []).length);
  console.log("title tag:", (html.match(/<title>([^<]*)<\/title>/) || [])[1]);
  console.log("--- first 1500 chars ---");
  console.log(html.slice(0, 1500));
  console.log("--- middle snippet around first <h2 or <table (whichever first) ---");
  const idx = (() => {
    const a = html.indexOf("<h2");
    const b = html.indexOf("<table");
    if (a === -1) return b;
    if (b === -1) return a;
    return Math.min(a, b);
  })();
  if (idx >= 0) console.log(html.slice(idx, idx + 2000));
}
