# Changelog

All notable changes to this project are documented here.

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
