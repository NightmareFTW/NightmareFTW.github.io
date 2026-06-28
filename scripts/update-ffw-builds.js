/* Far Far West — build scraper.
   Pulls the community build list from farfarwest.wikily.gg/build-planner (the
   structured data embedded in the Next.js RSC payload) into
   data/far-far-west/builds.json. Grouped by weapon and sorted top-rated in the
   tool. Run locally + by a GitHub Action. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const URL = "https://farfarwest.wikily.gg/build-planner";
const OUT = path.join(__dirname, "..", "data", "far-far-west", "builds.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const getHtml = (url) => execSync(`curl -sL -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

function extractBuilds(html) {
  const scripts = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)];
  for (const s of scripts) {
    if (!/\\"builds\\":/.test(s[1])) continue;
    const rsc = JSON.parse(s[1]);                 // unescape JS string literal
    const body = rsc.slice(rsc.indexOf(":") + 1); // strip the "1f:" chunk id
    try {
      const arr = JSON.parse(body);
      const node = arr.find((x) => x && typeof x === "object" && Array.isArray(x.builds));
      if (node) return node.builds;
    } catch { /* try next script */ }
  }
  return null;
}

const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

function run() {
  const raw = extractBuilds(getHtml(URL));
  if (!raw || !raw.length) throw new Error("no builds parsed — keeping previous file");

  const builds = raw
    .filter((b) => b.primaryLabel && b.isPublic !== false)
    .map((b) => ({
      id: b.id,
      name: clean(b.name) || "Untitled build",
      desc: clean(b.description).slice(0, 220),
      author: clean(b.authorLabel),
      weapon: { label: b.primaryLabel, icon: b.primaryIcon || "" },
      secondary: b.secondaryLabel ? { label: b.secondaryLabel, icon: b.secondaryIcon || "" } : null,
      grenade: b.grenadeLabel ? { label: b.grenadeLabel, icon: b.grenadeIcon || "" } : null,
      spells: (b.spellLabels || []).map((label, i) => ({ label, icon: (b.spellIcons || [])[i] || "", school: (b.spellSchools || [])[i] || "" })),
      hero: b.heroLabel ? { label: b.heroLabel, icon: b.heroIcon || b.heroRender || "" } : null,
      mount: b.mountLabel ? { label: b.mountLabel } : null,
      level: b.peakLevel || null,
      prestige: !!b.hasPrestige,
      gold: b.goldCost || 0,
      souls: b.soulsCost || 0,
      jokers: b.jokerCount || 0,
      upvotes: b.upvotes || 0,
      score: typeof b.voteScore === "number" ? b.voteScore : (b.upvotes || 0) - (b.downvotes || 0),
      url: `${URL}/${b.id}`,
    }));

  // Sort top-rated first; weapon grouping/order is decided in the tool.
  builds.sort((a, b) => b.score - a.score || b.upvotes - a.upvotes);

  const weapons = {};
  for (const b of builds) weapons[b.weapon.label] = (weapons[b.weapon.label] || 0) + 1;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: URL, count: builds.length, builds }));
  console.log(`Wrote ${builds.length} builds.`);
  Object.entries(weapons).sort((a, b) => b[1] - a[1]).forEach(([w, n]) => console.log(`  ${w}: ${n}`));
}
try { run(); } catch (e) { console.error(e.message); process.exit(1); }
