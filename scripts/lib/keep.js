/* Soft-fail helper for the best-effort data scrapers.

   These scripts refresh cached game data from third-party sites (Game8, wikis,
   community sources). Those sources sometimes rate-limit or bot-challenge the
   GitHub Actions runner IP, so a scrape returns nothing through no fault of our
   code. When that happens we want to KEEP the previous data file and exit green
   — a stale-by-a-day cache is fine, and a red CI run every time an upstream
   hiccups just buries real failures in noise.

   Policy: if we already have a non-empty data file on disk, log the reason and
   exit 0. Only exit 1 when there is no previous data at all (a genuine break
   worth surfacing). Pass the script's output path(s). */
const fs = require("fs");

module.exports = function keep(outPaths, err) {
  console.error(err && err.message ? err.message : String(err));
  const paths = Array.isArray(outPaths) ? outPaths : [outPaths];
  const haveData = paths.some((p) => {
    try {
      if (!fs.existsSync(p)) return false;
      const st = fs.statSync(p);
      return st.isDirectory() ? fs.readdirSync(p).some((f) => /\.json$/.test(f)) : st.size > 2;
    } catch (e) { return false; }
  });
  if (haveData) {
    console.warn("Keeping previous data and exiting 0 (transient upstream failure — not a code bug).");
    process.exit(0);
  }
  console.error("No previous data on disk, so this is a real break — exiting 1.");
  process.exit(1);
};
