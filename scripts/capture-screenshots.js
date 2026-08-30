/* One-off: (re)capture the README's documentation screenshots against a
   local static server, run from a GitHub Actions runner because this
   sandbox's own egress proxy is flaky with some image CDNs when accessed
   via headless Chromium (curl to the exact same URL succeeds every time —
   confirmed reproducible with img.game8.co and steamstatic.com). Not part
   of the scheduled pipeline — safe to delete once screenshots are fixed. */
const { chromium } = require("playwright");
const path = require("path");

const BASE = process.env.BASE_URL || "http://127.0.0.1:8080";
const OUT = path.join(__dirname, "..", "assets", "screenshots");

async function waitForImages(page, { timeout = 30000, retries = 3 } = {}) {
  await page.evaluate(() => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => img.removeAttribute("loading"));
  });
  await page.evaluate(async () => {
    const step = 400;
    const max = document.body.scrollHeight;
    for (let y = 0; y <= max; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
    window.scrollTo(0, 0);
  });
  for (let attempt = 0; attempt <= retries; attempt++) {
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll("img[src]")].filter((i) => i.src && !i.src.startsWith("data:"));
      return imgs.every((i) => i.complete);
    }, { timeout }).catch(() => {});
    const failed = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll("img[src]")].filter((i) => i.src && !i.src.startsWith("data:"));
      const bad = imgs.filter((i) => i.complete && i.naturalWidth === 0);
      bad.forEach((i) => { const s = i.src; i.src = ""; i.src = s; });
      return bad.length;
    });
    if (!failed) break;
    console.log(`  retry ${attempt + 1}/${retries}: reloading ${failed} failed image(s)…`);
    await page.waitForTimeout(1000 * (attempt + 1));
  }
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img[src]")].filter((i) => i.src && !i.src.startsWith("data:"));
    return imgs.filter((i) => i.complete && i.naturalWidth === 0).length;
  });
}

async function shot(page, url, file, { beforeShot } = {}) {
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(500);
  if (beforeShot) await beforeShot(page);
  const stillBad = await waitForImages(page);
  await page.screenshot({ path: path.join(OUT, file) });
  console.log(`captured ${file}${stillBad ? ` — WARNING: ${stillBad} broken image(s)` : ""}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await shot(page, `${BASE}/index.html`, "home.png");

  await shot(page, `${BASE}/index.html`, "steam-alerts.png", {
    beforeShot: async (p) => { await p.click(".bell-btn"); await p.waitForTimeout(300); },
  });

  await shot(page, `${BASE}/games/honkai-star-rail/meta-builds.html`, "hsr-meta-builds.png");

  await shot(page, `${BASE}/games/honkai-star-rail/warp-calendar.html`, "hsr-warp-calendar.png");

  await shot(page, `${BASE}/games/far-far-west/builds.html`, "ffw-builds.png", {
    beforeShot: async (p) => { await p.click(".ffw-build-btn", { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(400); },
  });

  await shot(page, `${BASE}/games/far-far-west/maps.html`, "ffw-maps.png", {
    beforeShot: async (p) => { await p.click(".fm-all", { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(400); },
  });

  await browser.close();
})();
