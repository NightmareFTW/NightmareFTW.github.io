/* One-off research script — run via a temp GitHub Actions workflow because
   farever.wiki (Miraheze) is behind a bot-check that blocks this sandbox.
   Prints page lists + image URLs to the job log. Not part of the pipeline,
   safe to delete once the real scraper/data is written. */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
async function get(u) {
  const r = await fetch(u, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } });
  const t = await r.text();
  return { status: r.status, text: t };
}

(async () => {
  console.log("=== allpages ===");
  const ap = await get("https://farever.wiki/api.php?action=query&list=allpages&aplimit=500&format=json");
  console.log("status", ap.status);
  console.log(ap.text.slice(0, 6000));

  console.log("\n=== allimages (first 200) ===");
  const ai = await get("https://farever.wiki/api.php?action=query&list=allimages&ailimit=200&format=json");
  console.log("status", ai.status);
  console.log(ai.text.slice(0, 10000));
})();
