const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://www.fareverdb.com/items?type=Sword", { waitUntil: "networkidle", timeout: 30000 }).catch((e) => console.log("goto err", e.message));
  await page.waitForTimeout(1500);

  const bgImgs = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("*").forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== "none") out.push(bg);
    });
    return [...new Set(out)];
  });
  console.log("=== BG IMAGES ===");
  console.log(JSON.stringify(bgImgs, null, 2));

  const svgUses = await page.evaluate(() => [...document.querySelectorAll("svg use")].map((u) => u.getAttribute("href") || u.getAttribute("xlink:href")));
  console.log("=== SVG USE HREFS ===", JSON.stringify(svgUses));

  // click into a specific item's detail page to check there too
  const link = await page.$('a[href*="/items/"]');
  if (link) {
    const href = await link.getAttribute("href");
    console.log("detail href:", href);
    await page.goto("https://www.fareverdb.com" + href, { waitUntil: "networkidle", timeout: 30000 }).catch((e) => console.log("goto2 err", e.message));
    await page.waitForTimeout(1500);
    const imgs2 = await page.evaluate(() => [...document.querySelectorAll("img")].map((i) => i.src));
    console.log("=== DETAIL PAGE IMG SRCS ===", JSON.stringify(imgs2));
    const bg2 = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("*").forEach((el) => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none") out.push(bg);
      });
      return [...new Set(out)];
    });
    console.log("=== DETAIL PAGE BG IMAGES ===", JSON.stringify(bg2));
  } else {
    console.log("no item detail link found");
  }

  await browser.close();
})();
