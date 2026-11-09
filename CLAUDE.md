# Project notes for Claude

## Warframe data — use WFCD, not scraping

For anything Warframe needs beyond the live worldstate (which already uses
`api.warframestat.us`): Warframe Community Developers (https://github.com/WFCD)
maintains open-source, MIT-licensed, API-sourced datasets — this is the
go-to, not scraping a wiki or another fan site. Notably:
- `warframe-items` — full item data (warframes, weapons, mods, arcanes,
  companions, …) pulled from the game's own API, not scraped pages.
- `warframe-drop-data` — reformatted drop data (where parts/resources come from).
- `warframe-patchlogs` — patch notes as JSON, with per-item lookups (useful
  for surfacing recent balance changes on an item).
- `api.warframestat.us` (already whitelisted in every page's CSP, already
  used by the Worldstate Tracker) is WFCD's own hosted API and also exposes
  item/mod/warframe data directly, as an alternative to vendoring the
  `warframe-items` JSON.

## Shipping a change — two things to update every time, proactively

Whenever you make a change that adds or modifies something on this site, do
both of these as part of that same piece of work — don't wait to be asked,
and don't wait for the user to remind you afterwards:
1. Run `graphify update .` (see the graphify section below) so the
   knowledge graph doesn't go stale.
2. If the change is a new game/tool/significant feature (not every commit
   needs this — see below), add a "What's New" carousel entry.

## "What's New" carousel — do this proactively

Whenever a new game, tool, or otherwise significant feature ships on this
site, add an entry to `SITE_UPDATES` in `assets/js/data.js` as part of that
same piece of work — don't wait to be asked, and don't wait for the user to
remind you afterwards.

Follow the conventions already documented in that array's own comment:
- Newest first, capped at 8 entries: when adding one, delete the oldest
  (last) entry so the list never grows past 8.
- `date` is the actual ship date (check `git log`), not today's date.
- `image` should show the feature itself — a real screenshot of the actual
  page/section (Playwright, cropped to roughly the carousel's aspect ratio,
  3200x480). A game's own banner/key art is only right for an "X joins the
  hub" entry, i.e. when the update IS a game launching on the site, not a
  feature added to a game already there.
- Add a PT translation for the new entry's `title`/`desc` in
  `assets/js/i18n.js` (DICT), matching how every other entry is translated.
- Verify with a Playwright screenshot (EN and PT) before shipping, same as
  any other change on this site.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
