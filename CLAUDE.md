# Project notes for Claude

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
