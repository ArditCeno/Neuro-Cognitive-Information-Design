# Security

Neuro-Cognitive Information Design (NCID) is a static, client-side research
study published on GitHub Pages with an optional Supabase backend. This document
lists the 20-point hardening checklist, the status of each item, and how to keep
it that way.

Contact for security issues: **arditceno82@gmail.com**

## Current mode: email-only (direct Apps Script)

The study currently sends every submission straight from the browser to a Google
Apps Script endpoint, which emails the full report to the researcher. There is no
server-side database write, so the researcher panel (`admin.html`) stays empty.

This is a deliberate, documented trade-off chosen for simplicity:

- the Apps Script URL is public and the submission endpoint is **public by
  design**; there is no submission secret in the repository or the page;
- abuse controls are the one-email dedupe markers below and Google Apps
  Script's own MailApp/Gmail quotas; there is **no per-IP rate limiting** in
  this mode;
- duplicate submissions are deduplicated server-side
  (`sent_<submission_id>` and `sent_id_<id_anonim>`).

To upgrade to the hardened model (server write + owner-only DB + rate limiting),
follow the last section of this file.

## Threat model (short)

- Public, unauthenticated participants submit an anonymous session payload.
- The optional participant name is emailed to the researcher; it is not published.
- The site is served as static files from GitHub Pages (no custom server), so
  HTTP response headers cannot be set there; browser-enforced controls are used
  instead and the limits are documented below.

## 20-point checklist

| # | Control | Status | Where |
|---|---------|--------|-------|
| 1 | No secrets in the client bundle | Accepted (email mode) | Apps Script URL + token are in `js/config.js`; see "Current mode" |
| 2 | Server-side write path (Edge Function with service role) | Optional | `supabase/functions/submit/index.ts`; not used in email mode |
| 3 | Row Level Security enabled on every table | Done | `supabase/security.sql` |
| 4 | Owner-only data access by JWT email allowlist | Done | RLS `owner read` / `owner delete` in `supabase/security.sql` |
| 5 | Admin panel requires authentication (email + password + emailed code) | Done | `admin.html`, `js/admin.js`, `email-setup/Code.gs` |
| 6 | Session verified with a short-lived token; codes expire + rate limited | Done | `email-setup/Code.gs` (`adminVerify`, `adminData`) |
| 7 | Per-IP rate limiting on submissions | Not active (email mode) | `check_rate_limit()` activates with the Edge Function |
| 8 | Server-side input validation (id shape, payload size, JSON) | Done | `supabase/functions/submit/index.ts` |
| 9 | Output encoding to prevent stored XSS in the admin | Done | `js/admin.js` (`h()` escape helper) |
| 10 | Content Security Policy (meta) | Done | `<meta http-equiv="Content-Security-Policy">` on all pages |
| 11 | Referrer policy | Done | `<meta name="referrer" content="strict-origin-when-cross-origin">` |
| 12 | Clickjacking protection | Partial | GitHub Pages cannot send `X-Frame-Options`/`frame-ancestors`; see limitations |
| 13 | HTTPS enforced end to end | Done | GitHub Pages forces HTTPS (`arditceno.github.io`) |
| 14 | Personal data isolated (name in a separate owner-only table) | Done | `participant_identity` table; name stripped from `sessions.payload` |
| 15 | Data minimisation (gaze capture off by default) | Done | `includeGaze: false` in `js/config.js` |
| 16 | Idempotent submissions (dedupe on retry) | Done | Apps Script `sent_<submission_id>` + `sent_id_<id_anonim>` markers under `LockService`; Edge `23505` handled as success |
| 17 | Dependencies pinned / vendored locally | Done | `vendor/`, `mediapipe/` shipped with the repo |
| 18 | Errors handled without leaking internals | Done | Edge Function returns generic error codes |
| 19 | Least privilege: service role key never reaches the browser | Done | key only in Supabase function secrets |
| 20 | Documented security posture + disclosure contact | Done | this file |

## What changed in the hardening pass

- **Email delivery.** In the default mode the browser posts directly to the Apps
  Script endpoint (`js/config.js`); the CSP `connect-src` allows both
  `script.google.com` and the `script.googleusercontent.com` redirect target.
  In the optional secure mode the Edge Function holds the token in its secrets.
- **Optional server-side writes.** `supabase/security.sql` removes the
  `anon insert` / `pilot read` policies; when the Edge Function is deployed it
  inserts with the service role and only the owner account can read.
- **Admin panel is locked.** The login card is shown first; the panel stays
  hidden until a valid Supabase session whose email matches
  `CONFIG.adminEmail` is present. The previous `?login=0` bypass was removed.
- **Stored-XSS fixes.** Every value rendered into the admin via `innerHTML` is
  now escaped.
- **CSP + referrer policy** added to `index.html`, `study.html`, `admin.html`,
  `privacy.html`, `terms.html`.
- **Rate limiting** table + `check_rate_limit()` function added to the schema.

## Known limitations (GitHub Pages)

GitHub Pages serves static files and cannot send custom HTTP response headers.
Therefore:

- `X-Frame-Options` and CSP `frame-ancestors` cannot be set (the `<meta>` CSP
  ignores `frame-ancestors`). Clickjacking protection is therefore partial.
- `Strict-Transport-Security` (HSTS) is not sent, though GitHub Pages does
  redirect HTTP to HTTPS.

To get real response headers, put the site behind a small reverse proxy or CDN
(e.g. Cloudflare) that injects them. Until then, the `<meta>` CSP still blocks
external script origins, `object`/`embed`, and form posts to other origins.

## Optional upgrade: secure server-side mode (requires the Supabase account)

```bash
# 1. Apply the schema (SQL editor or CLI)
#    paste supabase/security.sql and run it

# 2. Set the function secrets
supabase secrets set \
  APPS_SCRIPT_URL="https://script.google.com/macros/s/<id>/exec" \
  APPS_SCRIPT_TOKEN="optional-non-empty-value"   # Code.gs ignores it; the Edge fn only checks it exists

# 3. Deploy the write path
supabase functions deploy submit --no-verify-jwt
```

After deploying, submit one test session and confirm it appears in the admin
panel (logged in) and arrives by email. Then re-run `node scripts/test-all.mjs`.

## Reporting

Email **arditceno82@gmail.com**. Please do not open a public issue for
security-sensitive reports.

A machine-readable contact is published at
`/.well-known/security.txt` (with a root fallback at `/security.txt`, because the
GitHub Pages artifact uploader skips dot-folders). Expiry: 2027-10-30.

## Repository hardening (enabled)

- `main` is protected: force pushes and deletions are blocked, and the CI checks
  **Web (JS syntax)** and **Python (analysis)** must pass before a pull request
  can merge. Admin enforcement is on.
- Secret scanning and push protection are enabled.
- Dependabot alerts and automated security fixes are enabled; GitHub Actions
  versions are updated weekly.
- Workflows run with least privilege (`contents: read`) and do not persist git
  credentials in the checkout.
- The tokenless submission migration (no shared token, no database key in the
  repository) is staged on the `security/remove-secrets` branch. It is merged
  only after the tokenless Apps Script version is live; until then `main` keeps
  the legacy token so participants can submit.
- The admin password lives only in Script Properties.
