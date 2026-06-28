/* Far Far West — build scraper.
   Pulls the community build list from farfarwest.wikily.gg/build-planner (the
   structured data in the Next.js RSC payload), then enriches each build from its
   detail page with the joker-rarity layout and weapon stats (DPS, damage, mag,
   reload). Writes data/far-far-west/builds.json so the tool can show the full
   build on click. Run locally + by a GitHub Action. Node 18+, curl. */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const URL = "https://farfarwest.wikily.gg/build-planner";
const OUT = path.join(__dirname, "..", "data", "far-far-west", "builds.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const getHtml = (url) => { try { return execSync(`curl -sL -A "${UA}" "${url}"`, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }); } catch { return ""; } };
const sleep = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch {} };
const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

function rscOf(html) {
  let rsc = "";
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) { try { rsc += JSON.parse(m[1]); } catch {} }
  return rsc;
}
function balancedObj(s, fromKey) {
  const p = s.indexOf(fromKey); if (p < 0) return null;
  let i = s.indexOf("{", p), depth = 0;
  for (let j = i; j < s.length; j++) { if (s[j] === "{") depth++; else if (s[j] === "}" && !--depth) { try { return JSON.parse(s.slice(i, j + 1)); } catch { return null; } } }
  return null;
}

function listBuilds(html) {
  const rsc = rscOf(html);
  const p = rsc.indexOf('"builds":[');
  let i = rsc.indexOf("[", p), depth = 0, end = -1;
  for (let j = i; j < rsc.length; j++) { if (rsc[j] === "[") depth++; else if (rsc[j] === "]" && !--depth) { end = j; break; } }
  return JSON.parse(rsc.slice(i, end + 1));
}

// Named jokers per slot + weapon/hero stats from a build's detail page.
const jokerName = (slug) => slug.replace(/^joker-/, "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
function detailOf(html) {
  const rsc = rscOf(html);
  // Rarity composition per slot, plus the actual joker names in document order.
  const rar = balancedObj(rsc, '"jokers":{"primary"');
  const slugs = [...rsc.matchAll(/href":"\/jokers\/(joker-[a-z0-9-]+)"/g)].map((m) => m[1]);
  let jokers = null;
  if (rar && slugs.length) {
    jokers = {}; let k = 0;
    for (const slot of ["primary", "secondary", "hero"]) {
      const n = (rar[slot] || []).length;
      jokers[slot] = slugs.slice(k, k + n).map((s, i) => ({ name: jokerName(s), rarity: rar[slot][i] || "" }));
      k += n;
    }
  }
  const wstats = (key) => {
    const w = balancedObj(rsc, `"${key}":{"label"`);
    return w && w.stats ? { label: w.label, element: w.element || null, dps: w.stats.dps, dmg: w.stats.effectiveDamage, mag: w.stats.effectiveMagazine, reload: w.stats.effectiveReloadTime, fireRate: w.stats.effectiveFireRate } : null;
  };
  const hero = balancedObj(rsc, '"hero":{"hp"');
  return { jokers, stats: { primary: wstats("primary"), secondary: wstats("secondary"), hero: hero || null } };
}

function run() {
  const raw = listBuilds(getHtml(URL));
  if (!raw || !raw.length) throw new Error("no builds parsed — keeping previous file");

  const builds = raw.filter((b) => b.primaryLabel && b.isPublic !== false).map((b) => ({
    id: b.id,
    name: clean(b.name) || "Untitled build",
    desc: clean(b.description).slice(0, 500),
    author: clean(b.authorLabel),
    weapon: { label: b.primaryLabel, icon: b.primaryIcon || "", render: b.primaryRender || "" },
    secondary: b.secondaryLabel ? { label: b.secondaryLabel, icon: b.secondaryIcon || "", render: b.secondaryRender || "" } : null,
    grenade: b.grenadeLabel ? { label: b.grenadeLabel, icon: b.grenadeIcon || "" } : null,
    spells: (b.spellLabels || []).map((label, i) => ({ label, icon: (b.spellIcons || [])[i] || "", school: (b.spellSchools || [])[i] || "" })),
    hero: b.heroLabel ? { label: b.heroLabel, icon: b.heroIcon || "", render: b.heroRender || "" } : null,
    mount: b.mountLabel ? { label: b.mountLabel, render: b.mountRender || "" } : null,
    tags: Array.isArray(b.tags) ? b.tags.slice(0, 8) : [],
    video: b.youtubeUrl || b.twitchUrl || b.videoUrl || "",
    level: b.peakLevel || null,
    prestige: !!b.hasPrestige,
    gold: b.goldCost || 0,
    souls: b.soulsCost || 0,
    jokers: b.jokerCount || 0,
    upvotes: b.upvotes || 0,
    score: typeof b.voteScore === "number" ? b.voteScore : (b.upvotes || 0) - (b.downvotes || 0),
    url: `${URL}/${b.id}`,
  }));
  builds.sort((a, b) => b.score - a.score || b.upvotes - a.upvotes);

  // Enrich each build with detail-page stats + joker layout.
  let enriched = 0;
  for (const b of builds) {
    const d = detailOf(getHtml(`${URL}/${b.id}`));
    if (d.jokers || (d.stats && d.stats.primary)) { b.jokerLayout = d.jokers; b.stats = d.stats; enriched++; }
    sleep(300);
  }

  const weapons = {};
  for (const b of builds) weapons[b.weapon.label] = (weapons[b.weapon.label] || 0) + 1;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: URL, count: builds.length, builds }));
  console.log(`Wrote ${builds.length} builds (${enriched} enriched with stats).`);
  Object.entries(weapons).sort((a, b) => b[1] - a[1]).forEach(([w, n]) => console.log(`  ${w}: ${n}`));
}
try { run(); } catch (e) { console.error(e.message); process.exit(1); }
