# Audit and pilot plan

**Status:** prepared; external execution pending.

## 1. Accessibility audit (WCAG 2.2 AA)

Scope: landing, study flow (consent → calibration → quiz → done), study-info,
privacy, admin dashboard.

Checklist:

- [ ] Keyboard-only path through consent, calibration targets, quizzes, TLX, done.
- [ ] Visible focus on every control; no focus traps outside the admin drawer.
- [ ] Screen reader pass (NVDA + VoiceOver) for consent, calibration status,
      quiz questions, NASA-TLX sliders, send status.
- [ ] Contrast ≥ 4.5:1 for body text and ≥ 3:1 for large text/UI.
- [ ] `prefers-reduced-motion`, `prefers-contrast` behavior.
- [ ] Touch targets ≥ 44 px on coarse pointers.
- [ ] Charts have accessible names and a table/text alternative.
- [ ] Language switch updates `lang` and `aria-pressed`.
- [ ] Admin drawer: focus moves in, Tab is trapped, Escape closes, focus returns.
- [ ] No new axe-core critical/serious issues.

Evidence: axe report, screen-reader recordings, issue list with severities.

## 2. Security review

Scope: Worker, D1, R2 (optional), Apps Script, GitHub.

Checklist:

- [ ] No secrets in the repository or git history used by the live system.
- [ ] Branch protection, secret scanning, Dependabot active.
- [ ] Worker CORS allowlist and payload/size limits verified.
- [ ] `/import` and `/export/*` reject missing/incorrect tokens.
- [ ] Admin login uses POST to the Worker; password never in the browser URL.
- [ ] Apps Script rate limits and 6-digit code expiry verified.
- [ ] D1/R2 not publicly addressable; only the Worker writes.
- [ ] SQL injection: every query uses bound parameters.
- [ ] Deletion request path tested (D1 rows + gaze blob/R2 + email copy).
- [ ] Backup/restore test (D1 export, local import).
- [ ] Dependency and action versions reviewed.

Evidence: signed checklist, screenshots of settings, test logs.

## 3. Pilot / usability (5–8 participants)

Tasks:

1. Consent and registration.
2. Camera permission and one calibration pass.
3. Read one module and answer the quiz.
4. Complete NASA-TLX and preference.
5. Finish and confirm the report status.

Measures:

- Task success without help.
- Time on task.
- Calibration success and accuracy (px).
- Drop-off point.
- SUS score.
- Think-aloud notes.

Success criteria:

- ≥ 80% complete without help.
- Calibration success ≥ 80% on laptop.
- No critical confusion in consent or quiz.
- SUS ≥ 70.

## 4. Scientific review

- [ ] Ethics approval recorded (committee, date, reference).
- [ ] OSF pre-registration submitted with the values in `POWER.md`.
- [ ] Analysis plan reviewed by a second researcher.
- [ ] Codebook checked against an exported session.
- [ ] Pilot data excluded from the main analysis.

## 5. Release evidence

- [ ] CI green on `main`.
- [ ] Lighthouse/axe results attached.
- [ ] One test submission → 1 D1 row, 1 email, gaze stored, duplicate blocked.
- [ ] Backfill counts match the mailbox.
- [ ] DOI / citation updated.
