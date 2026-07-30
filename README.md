English | [繁體中文](README.zh-TW.md)

# Lineage 1 Reborn - Taiwan Time

A Tampermonkey userscript that converts the Eastern Time (ET / EST / EDT) displayed on
[lineage1reborn.com](https://lineage1reborn.com/) into Taiwan time (`Asia/Taipei`, UTC+8) — in place,
with no layout changes.

## What it converts

| Where | Site shows | You see |
| --- | --- | --- |
| Header "Time Now" clock | `09:50:36 PM EDT` | `09:50:36 AM TW` (badge) |
| Event countdown end time | `Ends Jul 30, 10:00pm ET` | `Ends Jul 31, 10:00 TW` (badge) |
| Castle "Next Siege" time | `1 Aug 10 AM ET` | `1 Aug 22:00 TW` (badge) |
| Events page (`?page=events`) dates | `Friday, July 24th @ 1:00pm ET` | `Sat Jul 25, 01:00 TW` (badge) |

- Date rollovers are handled correctly (e.g. `1 Aug 3 PM ET` → `2 Aug 03:00 TW`).
- EDT vs. EST (daylight saving) is resolved using IANA timezone rules, not a fixed offset.
- Converted times are shown as a green/white badge in place of the original text.
- Hover over any converted time to see the original ET text in a tooltip.
- Nothing else on the page is modified — no added rows, no layout shift.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
2. On Chrome 138+, open `chrome://extensions`, enable **Developer mode**, then in the
   Tampermonkey extension's details page enable **Allow User Scripts**.
3. Install the script from the raw GitHub URL:

   ```text
   https://raw.githubusercontent.com/edgar0407/lineage1reborn-taiwan-time/main/lineage1reborn-taiwan-time.user.js
   ```

4. Visit [lineage1reborn.com](https://lineage1reborn.com/) — Tampermonkey will prompt for
   site access the first time; allow `lineage1reborn.com`.

Tampermonkey checks the `@version` header against the URL above and offers updates automatically.

## How it works

- The live clock (`[data-home-edt-clock]`) is intercepted via `MutationObserver` each time the
  site updates it, so it stays in sync without fighting the site's own timer.
- The event countdown's end time is computed from the countdown element's `data-target`
  Unix timestamp (exact instant), not by re-parsing the printed text.
- Siege times have no stable selector on the site, so the script matches the known
  `"<day> <month>"` / `"<hour> AM|PM ET"` text pattern in adjacent elements and replaces
  only those text nodes.
- Events page dates/times are found with a regex that looks for a month name, day,
  optional year, and time, anywhere inside a leaf element's text — so it also matches
  the surrounding sentence structure (e.g. `"... - Ends Saturday, May 30 at ... ET"`)
  without needing a fixed template.

See [`docs/SPEC.md`](docs/SPEC.md) for the full specification this script was built against.

## Limitations / known scope

- Verified against the homepage (`/`) and the events page (`?page=events`).
- If lineage1reborn.com changes its DOM structure or wording, the text-pattern matchers
  (siege times, events page dates) may stop finding matches — they fail silently rather
  than showing wrong data.
- On the events page, recurring schedule text with no date (e.g. `"Friday 1:00 PM ET
  to Monday 10:00 PM ET"`) is left unconverted, since there's no date to resolve
  EDT vs. EST from.
- Not affiliated with or endorsed by Lineage 1 Reborn.

## License

MIT — see [LICENSE](LICENSE).
