# Changelog

All notable changes to this project are documented here.

## [1.2.0] - 2026-07-30

### Added

- Convert dates/times on the events page (`?page=events`), covering the "Event
  Duration" and "Schedule" lines and similar prose mentions of ET times, using a
  regex-based matcher rather than a fixed selector.

### Known limitations

- Recurring schedule text with no explicit date (e.g. "Friday 1:00 PM ET to
  Monday 10:00 PM ET") is left unconverted, since there's no date to resolve
  EDT vs. EST from.

## [1.1.0] - 2026-07-30

### Changed

- Converted TW times are now rendered as a badge (green background, white text)
  instead of plain inline text, for all three conversion points (live clock,
  event end time, siege times).

## [1.0.0] - 2026-07-30

### Added

- Initial release.
- Convert the homepage "Time Now" ET clock to Taiwan time, updated live.
- Convert the active event's "Ends ..." countdown end time to Taiwan time using the
  countdown's Unix timestamp.
- Convert "Next Siege" / "Next Classic Siege" castle times to Taiwan time, including
  date rollover across midnight.
- Correct EDT/EST (daylight saving) handling via IANA timezone rules.
- In-place text replacement with original ET text preserved in a hover tooltip.
