/* Shared HTTP fetcher for the scrapers.

   Node's built-in fetch gets a Cloudflare interstitial ("Just a moment...",
   403 with cf-mitigated: challenge) from some of our sources — the Dreamlight
   Valley wiki started doing this in June 2026, which silently broke the whole
   DDV pipeline. The same request through curl is served normally, and curl is
   what every other scraper in this repo already uses, so route everything
   through it.

   Retries and a hard timeout are baked in so one slow upstream can't hang CI.
   Node 18+, needs curl on PATH (present on GitHub runners and Git for Windows). */

const { execFileSync } = require("child_process");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Returns the response body, or "" if the request failed after its retries.
// Uses execFileSync (argv array, no shell) rather than a shell command string
// — url/ua never pass through a shell, so there's nothing for a stray `"`,
// backtick or `$(...)` in either to break out of, no matter where they came
// from (including a scraped/attacker-influenceable value in the future).
function getText(url, { ua = UA, timeout = 40, retries = 3 } = {}) {
  try {
    return execFileSync(
      "curl",
      ["-sL", "--retry", String(retries), "--retry-delay", "2", "--retry-all-errors", "--max-time", String(timeout), "-A", ua, url],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
  } catch (e) {
    return "";
  }
}

// Same, parsed as JSON; null when the request failed or the body isn't JSON.
function getJson(url, opts) {
  const body = getText(url, opts);
  if (!body) return null;
  try { return JSON.parse(body); } catch (e) { return null; }
}

module.exports = { getText, getJson, UA };
