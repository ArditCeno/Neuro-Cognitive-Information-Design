# Quality report

A transparent, evidence-based scorecard for the NCID study. It is deliberately
conservative: visual craft is not the same as research validity or reliability.

## Current score: 7.9 / 10

| Dimension | Score | Evidence |
|---|---:|---|
| Brand / first impression | 9.0 | Coherent teal/coral identity, hero, typography |
| Landing page | 8.0 | Clear narrative, 12 professions, example A/B |
| Study flow | 8.5 | Consent → setup → calibration → reading → quiz → TLX → report |
| Calibration / mobile | 8.5 | One pass (1/1), 9 targets, 44 px, high contrast, live progress |
| Admin dashboard | 8.0 | Card dashboard, rings, A/B charts, drawer; frozen by request |
| Content consistency | 8.5 | 12 professions, 3 levels, 3 modules, 30 minutes, phone |
| Accessibility (public) | 8.0 | Skip link, focus, ARIA, reduced motion; no external audit yet |
| Accessibility (admin) | 6.0 | Frozen: no focus trap, English only |
| Design system | 5.5 | Multiple CSS passes, `!important`, some dead rules |
| Security | 7.0 | Origin check, no blind retry, server dedupe in code; admin transport frozen |
| Data integrity | 8.5 | Stable submission id, client + server at-most-once, queue dedupe |
| Scientific rigor | 6.0 | Protocol + analysis plan + codebook; no pre-registration/power analysis yet |
| Reproducibility | 7.0 | Static + AOI tests, docs; no pytest/lockfile/DOI |
| Performance | 7.0 | Hero preload, lazy images, faster fixation scan; WebGazer/fonts heavy |
| Documentation | 9.0 | README, PROTOCOL, ANALYSIS_PLAN, CODEBOOK, QUALITY, ACCESSIBILITY |

## What is verified

- `node scripts/test-all.mjs` — structure, materials, config, one-email guards, calibration, content truth.
- `node scripts/test-links.mjs` — local links, duplicate ids, image alt, `target=_blank` rel, EN/AL pairing.
- `node scripts/test-aoi.mjs` — fixation clusters, AOI assignment and dwell.
- `node scripts/test-report.mjs` — end-to-end report shape with a named participant.
- `node scripts/test-endpoint.mjs` — read-only live API probes.
- CI runs the web checks on every push and pull request.

## What still blocks 9.5–10

1. **Server dedupe deploy** — the new `Code.gs` must be pasted into Apps Script and deployed as a new version.
2. **External validation** — a WCAG audit, a security review and a usability pilot have not been run.
3. **Scientific protocol** — pre-registration, ethics approval, power analysis, full NASA-TLX weighting and a codebook are not in the repository.
4. **Admin frozen** — password transport and admin accessibility cannot be improved without changing `admin.js`.
5. **Hosting** — GitHub Pages cannot send HSTS/CSP headers without a custom domain and proxy.

## Why 10 is not self-assigned

A 10/10 requires evidence produced by someone other than the author: an
accessibility auditor, a security reviewer, a pilot sample and a peer reviewer.
Everything inside our control is tracked above; the rest is external validation.
