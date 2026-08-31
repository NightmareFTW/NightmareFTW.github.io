/* One-off research script — uses Playwright (via a temp GH Actions workflow)
   to see what fareverdb.com actually loads client-side for item icons, since
   it's a Next.js SPA whose initial HTML has no image URLs. Not part of the
   pipeline, safe to delete once the real scraper/data is written. */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const apiHits = [];
  page.on("request", (req) => {
    const u = req.url();
    if (/api|graphql|supabase|\.json/i.test(u) && !/_next\/static/.test(u)) apiHits.push(u);
  });
  page.on("response", async (res) => {
    const u = res.url();
    if (/api|graphql|supabase/i.test(u) && !/_next\/static/.test(u)) {
      try {
        const ct = res.headers()["content-type"] || "";
        if (ct.includes("json")) {
          const body = await res.text();
          console.log("RESPONSE", u, "len=", body.length, body.slice(0, 1500));
        }
      } catch (e) {}
    }
  });

  await page.goto("https://www.fareverdb.com/items?type=Sword", { waitUntil: "networkidle", timeout: 30000 }).catch((e) => console.log("goto err", e.message));
  await page.waitForTimeout(2000);

  const imgs = await page.evaluate(() => [...document.querySelectorAll("img")].map((i) => i.src).filter(Boolean));
  console.log("=== IMG SRCS ===");
  console.log(JSON.stringify([...new Set(imgs)], null, 2));

  console.log("=== NETWORK HITS (api/json-like) ===");
  console.log(JSON.stringify([...new Set(apiHits)], null, 2));

  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log("=== BODY TEXT SAMPLE ===");
  console.log(bodyText);

  await browser.close();
})();
