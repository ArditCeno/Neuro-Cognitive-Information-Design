# Deploy and verify

Current architecture: **GitHub Pages → Cloudflare Worker → D1 (SQL + compressed gaze; R2 optional) → Google Apps Script (email)**.
Local analysis exports D1 (and R2 if enabled) to `data/raw/` and reuses `analysis/`.

The old Supabase + Edge Function path is legacy and not required (see the end).

## 1. Apps Script (email sender)

1. https://script.google.com → open the existing project.
2. Replace the code with `email-setup/Code.gs` → **Save**.
3. **Project Settings → Script properties**: set the admin password
   (`ADMIN_PASSWORD`, or run `setupAdminPassword()` once). No submission token is
   used; the endpoint is public and deduplicated.
4. **Deploy → Manage deployments → Edit → Version: New version → Deploy**.
5. Copy the `/exec` URL; it must match `worker/wrangler.toml` (`APPS_SCRIPT_URL`).

> Never hardcode the admin password in `Code.gs` or commit it. If it was ever
> shared or committed, rotate it and deploy a new version.

## 2. Cloudflare Worker + D1 (R2 optional)

```bash
cd worker
npx wrangler login

npx wrangler d1 create ncid-db
# paste database_id into worker/wrangler.toml

# Optional only if R2 is enabled and the token has R2 permission:
# npx wrangler r2 bucket create ncid-gaze

npx wrangler d1 migrations apply ncid-db --remote

npx wrangler secret put IMPORT_TOKEN
npx wrangler secret put EXPORT_TOKEN
# optional, only if Code.gs enforces a TOKEN:
# npx wrangler secret put APPS_SCRIPT_TOKEN

npx wrangler deploy
```

Copy the Worker URL. It looks like
`https://ncid-api.ncid-study.workers.dev`.

## 3. Point the site at the Worker

In `js/config.js` (or the gitignored `js/config.local.js`):

```js
storage: {
  submission: {
    url: "https://ncid-api.ncid-study.workers.dev/submit",
    fallbackUrl: "https://script.google.com/macros/s/.../exec",
    includeGaze: true
  }
}
```

The Apps Script fallback stays as a safety net; if the Worker is down the report
is still emailed and can be backfilled later.

## 4. Verify

```bash
curl https://ncid-api.ncid-study.workers.dev/health
# {"ok":true,"service":"ncid-api","version":"1.0.0"}

curl "https://script.google.com/macros/s/<id>/exec"
# {"ok":true,"service":"ncid","version":"2.0-tokenless"}
```

Submit one test session from `study.html`. Then:

```bash
cd worker
npx wrangler d1 execute ncid-db --remote --command \
  "SELECT submission_id, email_status, gaze_status FROM sessions ORDER BY created_at DESC LIMIT 5;"
```

Expected: one row, `email_status='sent'`, `gaze_status='stored'`.
Send the **same** submission twice: the second must return
`{"ok":true,"duplicate":true}` and must not create a row or email.

## 5. Backfill old sessions

Export the sessions from the admin panel or mailbox to
`data/raw/mailbox-sessions.json`, then:

```bash
cd worker
IMPORT_TOKEN=... WORKER_URL=https://ncid-api.ncid-study.workers.dev \
  node ../scripts/backfill.mjs ../data/raw/mailbox-sessions.json
```

Rows are inserted with `source='backfill'`, `email_status='sent'`; duplicates are
skipped. Verify counts against the mailbox.

## 6. Local analysis export

```bash
WORKER_URL=https://ncid-api.ncid-study.workers.dev EXPORT_TOKEN=... \
  node scripts/export_d1.mjs

WORKER_URL=https://ncid-api.ncid-study.workers.dev EXPORT_TOKEN=... \
  node scripts/export_r2.mjs
```

Analysis payloads: `data/raw/session_*.json` (no names).
Names: `data/private/identity.json` (gitignored, never in the analysis dataset).

## 7. GitHub Pages source

- The repo includes `.nojekyll` for the legacy branch build.
- Recommended: Settings → Pages → **Source = GitHub Actions**; the existing
  `deploy-pages.yml` then becomes the single source of truth.
- Do not keep both a branch build and a workflow build active.

## Legacy: Supabase (optional)

The old Supabase path is not used and can be ignored. If you ever revive it:
apply `supabase/security.sql`, deploy `supabase/functions/submit`, and set the
function secrets. Do not put the service role key in the browser.

## Checklist

- [ ] Apps Script deployed and `/exec` returns `2.0-tokenless`
- [ ] D1 created, migration applied
- [ ] (Optional) R2 bucket created and binding enabled
- [ ] Worker deployed; `/health` returns `1.0.0`
- [ ] `js/config.js` points to `/submit`
- [ ] One test session → 1 DB row, 1 email, gaze stored (D1 or R2)
- [ ] Duplicate submission → `duplicate:true`, no second row/email
- [ ] Backfill counts match the mailbox
- [ ] Export produces `data/raw/session_*.json`
- [ ] Admin login works with the Script Property password
