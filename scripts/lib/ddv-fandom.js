/* Shared helpers for scraping the Disney Dreamlight Valley Fandom wiki
   (disneydreamlightvalley.fandom.com) via the MediaWiki API.

   dreamlightvalleywiki.com — the previous source for furniture, clothing,
   critters, companions and items — started serving a Cloudflare JS
   challenge to every request (including curl) around July 2026, so none of
   the DDV scrapers could parse anything from it any more. The Fandom
   mirror is a normal MediaWiki install with no bot challenge and an open
   API, and update-starpath.js already used it successfully, so the rest
   of the DDV pipeline moves here too. Node 18+, no deps. */

const { getJson } = require("./http");

const BASE = "https://disneydreamlightvalley.fandom.com";

// Raw wikitext of a page ("" if the page/API call failed).
function wikitext(page) {
  const api = `${BASE}/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`;
  const json = getJson(api);
  return json && json.parse && json.parse.wikitext ? json.parse.wikitext["*"] : "";
}

// Resolve File: page names (e.g. "Art Deco Club Chair.png") to their actual
// image URL, batched 50 per API call. Returns a Map filename -> url (missing
// entries are simply absent, never thrown).
function imageUrls(files) {
  const names = [...new Set(files.filter(Boolean))];
  const map = {};
  for (let i = 0; i < names.length; i += 50) {
    const batch = names.slice(i, i + 50);
    const titles = batch.map((f) => `File:${f}`).join("|");
    const api = `${BASE}/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json&formatversion=2`;
    const json = getJson(api);
    const pages = (json && json.query && json.query.pages) || [];
    for (const p of pages) {
      if (p && p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url) map[p.title.replace(/^File:/, "")] = p.imageinfo[0].url;
    }
  }
  return map;
}

// Strip wiki markup down to readable plain text.
function clean(s) {
  if (!s) return "";
  return String(s)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[\[File:[^\]]*\]\]/gi, "")
    .replace(/\{\{il\|([^|}]+)(?:\|[^}]*)?\}\}/gi, "$1")
    .replace(/\{\{quest\|([^}]*)\}\}/gi, "$1")
    .replace(/\{\{star ?path\|([^}]*)\}\}/gi, "$1")
    .replace(/\{\{(?:icon|token)\|[^}]*\}\}/gi, "")
    .replace(/\{\{(?:starcoin|energy|moonstone)\}\}/gi, "")
    .replace(/\{\{[^{}|]+\|([^{}]*)\}\}/g, "$1") // {{Template|arg}} -> arg (e.g. {{Goofy's Stall|Frosted Heights}})
    .replace(/\{\{([^{}]+)\}\}/g, "$1")           // {{Biome}} -> Biome
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Split wikitext into sections by == or === headings. Returns
// [{heading, body}] (heading is cleaned; the leading chunk before any
// heading has heading "").
function sections(wt) {
  const parts = String(wt || "").split(/(?=^={2,3}[^=\n].*$)/m);
  return parts.map((body) => {
    const hm = body.match(/^={2,3}\s*(.*?)\s*={2,3}\s*$/m);
    return { heading: hm ? clean(hm[1]) : "", body };
  });
}

// Every {| ... |} wikitable found in a chunk of wikitext.
function tables(wt) {
  return String(wt || "").match(/\{\|[\s\S]*?\n\|\}/g) || [];
}

// Parse one wikitable into {headers:[...], rows:[[cellRaw,...],...]}.
// Cell text is NOT wiki-cleaned (callers extract file links / names first,
// then clean()). Resolves rowspan by carrying the value down into the
// following rows at the same column.
function parseTable(tableText) {
  const mkCell = (raw, isHeader) => {
    const attrM = raw.match(/^\s*((?:[a-zA-Z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s|]+)\s*;?\s*)+)\|(?!\|)([\s\S]*)$/);
    const attrs = attrM ? attrM[1] : "";
    const text = (attrM ? attrM[2] : raw).trim();
    const rs = attrs.match(/rowspan\s*=\s*"?(\d+)"?/i);
    return { text, rowspan: rs ? +rs[1] : 1, isHeader };
  };
  const rows = [];
  let cur = null;
  for (const rawLine of String(tableText || "").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("{|")) continue;
    if (line === "|}" || line.startsWith("|}")) break;
    if (line.startsWith("|-")) { if (cur && cur.length) rows.push(cur); cur = []; continue; }
    if (!cur) cur = [];
    if (line.startsWith("!")) { for (const seg of line.slice(1).split("!!")) cur.push(mkCell(seg, true)); continue; }
    if (line.startsWith("|")) { for (const seg of line.slice(1).split("||")) cur.push(mkCell(seg, false)); continue; }
    if (cur.length) cur[cur.length - 1].text += " " + line;
  }
  if (cur && cur.length) rows.push(cur);
  if (!rows.length) return { headers: [], rows: [] };

  let headers = [];
  let dataRows = rows;
  if (rows[0].some((c) => c.isHeader)) { headers = rows[0].map((c) => clean(c.text)); dataRows = rows.slice(1); }

  const width = Math.max(headers.length, ...dataRows.map((r) => r.length), 1);
  const carry = new Array(width).fill(null);
  const out = [];
  for (const r of dataRows) {
    const result = new Array(width).fill("");
    let qi = 0;
    for (let col = 0; col < width; col++) {
      if (carry[col] && carry[col].left > 0) {
        result[col] = carry[col].text;
        carry[col].left--;
        if (carry[col].left === 0) carry[col] = null;
      } else {
        const cell = r[qi++];
        if (!cell) continue;
        result[col] = cell.text;
        if (cell.rowspan > 1) carry[col] = { text: cell.text, left: cell.rowspan - 1 };
      }
    }
    out.push(result);
  }
  return { headers, rows: out };
}

// Extract {file, name} from a cell like "[[File:X.png|x70px]]<br>[[Name]]"
// or "[[File:X.png|x50px]]<br>'''Name'''".
function fileAndName(cellRaw) {
  const s = String(cellRaw || "");
  const file = (s.match(/\[\[File:([^|\]]+)/i) || [])[1] || "";
  const linkNames = [...s.matchAll(/\[\[([^\]|:]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1]);
  const boldName = (s.match(/'''([^']+)'''/) || [])[1];
  const name = clean((linkNames[linkNames.length - 1] || boldName || "").trim());
  return { file: file.trim(), name };
}

// Every "<gallery>...</gallery>" block in a chunk of wikitext, flattened to
// {file, name} entries (one per non-empty gallery line).
function galleries(wt) {
  const items = [];
  const re = /<gallery[^>]*>([\s\S]*?)<\/gallery>/g;
  let gm;
  while ((gm = re.exec(String(wt || "")))) {
    for (const rawLine of gm[1].split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      const fileM = line.match(/^([^|]+\.(?:png|jpe?g|gif))/i);
      if (!fileM) continue;
      const file = fileM[1].trim();
      const linkNames = [...line.matchAll(/\[\[([^\]|:]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1]);
      let name = linkNames.length ? linkNames[linkNames.length - 1] : "";
      if (!name) name = (line.match(/link=([^|]+)/) || [])[1] || "";
      if (!name) name = file.replace(/\.(png|jpe?g|gif)$/i, "");
      items.push({ file, name: clean(name) });
    }
  }
  return items;
}

module.exports = { BASE, wikitext, imageUrls, clean, sections, tables, parseTable, fileAndName, galleries };
