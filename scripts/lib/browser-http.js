/* Headless-browser fetcher for sources that block plain HTTP clients with a
   Cloudflare JS challenge ("Just a moment…") that even curl can't pass —
   confirmed for demonologist.fandom.com, theotherside-game.fandom.com and
   prydwen.gg, which started doing this at some point after their scrapers
   were first written (curl worked for all three when those were written).

   This is the one part of the scraper pipeline that genuinely needs
   Playwright, which isn't installed in CI (this repo is otherwise
   zero-dependency) — require('playwright') is done lazily inside
   getHtml() so a GitHub Actions run without it just gets a clean
   rejection, which the caller's existing try/catch + lib/keep already
   turns into "keep previous data, exit 0", same as it does today. Meant to
   be run out-of-band (this session, or a scheduled one) against these
   specific sources, not by the GitHub Action itself. */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

let contextPromise = null;
function getContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const { chromium } = require("playwright");
      const args = process.env.HTTPS_PROXY
        ? [`--proxy-server=${process.env.HTTPS_PROXY}`, "--proxy-bypass-list=localhost,127.0.0.1", "--ignore-certificate-errors"]
        : [];
      const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, args });
      return browser.newContext({ userAgent: UA });
    })();
  }
  return contextPromise;
}

// Returns the rendered page's HTML once the Cloudflare interstitial (if any)
// has cleared. Reuses one browser context across calls so the clearance
// cookie from the first request lets later ones to the same site skip the
// challenge — much faster than relaunching per request.
async function getHtml(url, { waitMs = 2500, challengeWaitMs = 6000 } = {}) {
  const ctx = await getContext();
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (await page.title().then((t) => /just a moment/i.test(t)).catch(() => false)) {
      await page.waitForFunction(() => !/just a moment/i.test(document.title), { timeout: challengeWaitMs }).catch(() => {});
    }
    await page.waitForTimeout(waitMs);
    return await page.content();
  } finally {
    await page.close();
  }
}

async function close() {
  if (!contextPromise) return;
  const ctx = await contextPromise;
  await ctx.browser()?.close();
}

module.exports = { getHtml, close };
