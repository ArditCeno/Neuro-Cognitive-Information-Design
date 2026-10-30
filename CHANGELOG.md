# Changelog

All notable changes to the NCID study site and instrument.

## 1.1.0 - 2026-10-30

### One email per participant
- Added a stable `submission_id` created once per session and reused by every retry/resend.
- Removed the blind `no-cors` POST after an iframe timeout (the main duplicate-email path).
- Added a client at-most-once marker; a sent report is never sent again unless opened with `?force=1`.
- Added `LockService` + `sent_<submission_id>` / `sent_id_<id_anonim>` markers to `Code.gs`.
- Added a send-in-flight guard so two clicks can never start two submissions.
- EmailJS is now only used when no primary Apps Script target exists.

### Calibration
- One calibration pass (`1/1`) instead of three automatic attempts.
- Nine high-contrast yellow targets with a dark halo, 44 px touch targets on phones.
- Dots are kept fully inside the panel on narrow screens.
- Live point progress (`x / 9`) and an accessible status region.
- Keyboard support for every target.

### Content and links
- Canonical numbers everywhere: 12 professions, 3 levels, 3 modules, 108 modules, 648 quiz items.
- Unified duration (about 30 minutes) and phone support.
- Added the seven missing professions to the fields page.
- Privacy text now matches the actual email path.
- Absolute `github.io` CTAs replaced with relative links; the deployed domain is unchanged.
- README document count corrected to 432.

### Accessibility and quality
- Skip-to-content link, `aria-current`, `aria-pressed`, `aria-live` send status.
- Link/HTML checker (`scripts/test-links.mjs`) in CI: local links, duplicate ids, image alt, `target=_blank` rel, EN/AL pairing.
- Added `robots.txt`, `sitemap.xml`, and a 404 page.
- Static test count raised to 2 614 + 88 assertions.

## 1.0.0 - 2026-09

- Initial public release: landing, study flow, calibration, quiz, NASA-TLX, report, admin dashboard, conference materials.
