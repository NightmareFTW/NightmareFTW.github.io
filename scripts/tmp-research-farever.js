const { chromium } = require("playwright");

const TYPES = ["Sword", "Axe", "Mace", "Spear", "Shield", "Daggers", "Bow", "Fists", "Thrown", "Staff", "Book", "Halos", "Scepter", "Crescent", "CaptureNet"];

async function bgUrls(page) {
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll("*").forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.match(/url\("([^"]+)"\)/);
      if (m) out.push(m[1]);
    });
    return [...new Set(out)];
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const result = {};

  for (const type of TYPES) {
    try {
      await page.goto(`https://www.fareverdb.com/items?type=${type}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800);
      const link = await page.$('a[href*="/items/"]');
      if (!link) { console.log(type, "-> no item found"); continue; }
      const href = await link.getAttribute("href");
      await page.goto("https://www.fareverdb.com" + href, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800);
      const bgs = await bgUrls(page);
      const atlas = bgs.find((u) => /atlas_weapon/i.test(u)) || bgs.find((u) => /cdn\.fareverdb\.com\/UI\/icons/i.test(u));
      result[type] = { detail: href, atlas: atlas || null, allCdnBgs: bgs.filter((u) => u.includes("cdn.fareverdb.com")) };
      console.log(type, "->", JSON.stringify(result[type]));
    } catch (e) {
      console.log(type, "-> ERROR", e.message);
    }
  }

  console.log("=== FULL RESULT ===");
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
