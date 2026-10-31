# NCID Worker (D1 + email, R2 optional)

The browser posts one session to this Worker. The Worker:

1. validates and splits the payload;
2. inserts the participant, name, session, modules, trials, answers and TLX into **D1**;
3. stores compressed raw gaze in **D1** (or **R2** when the binding is enabled);
4. calls the existing Google Apps Script endpoint to email the report;
5. retries pending emails every 5 minutes (Cron).

`submission_id` is the primary key, so a double click never creates a second
row or a second email.

## One-time setup

```bash
cd worker
npx wrangler login

npx wrangler d1 create ncid-db
# copy database_id into wrangler.toml (replace REPLACE_WITH_D1_DATABASE_ID)

# Optional (requires R2 enabled + an API token with R2 permission):
# npx wrangler r2 bucket create ncid-gaze

npx wrangler d1 migrations apply ncid-db --local
npx wrangler d1 migrations apply ncid-db --remote

npx wrangler secret put IMPORT_TOKEN
npx wrangler secret put EXPORT_TOKEN
# optional: npx wrangler secret put APPS_SCRIPT_TOKEN

npx wrangler deploy
```

After deploy, copy the `https://ncid-api.ncid-study.workers.dev` URL and set it in
`js/config.js` as `storage.submission.url` **with `/submit` at the end**:

```js
submission: {
  url: "https://ncid-api.ncid-study.workers.dev/submit",
  fallbackUrl: "https://script.google.com/macros/s/.../exec",
  includeGaze: true
}
```

The Apps Script fallback stays as a safety net until the Worker is verified.

## Verify

```bash
curl https://ncid-api.ncid-study.workers.dev/health
```

Expected: `{"ok":true,"service":"ncid-api","version":"1.0.0"}`

## Backfill from the mailbox

Export the existing sessions from the admin panel (or your mailbox) to a JSON
file, then:

```bash
IMPORT_TOKEN=... WORKER_URL=https://ncid-api.ncid-study.workers.dev \
  node scripts/backfill.mjs data/raw/mailbox-sessions.json
```

The importer is idempotent: existing `submission_id` rows are skipped, and
backfilled sessions are marked `email_status='sent'` so no old email is resent.

## Local development

```bash
cp .dev.vars.example .dev.vars
npx wrangler dev
npx wrangler d1 execute ncid-db --local --command "SELECT * FROM v_session_summary;"
```

## Export for local analysis

```bash
node scripts/export_d1.mjs          # -> data/raw/session_*.json
node scripts/export_r2.mjs          # -> data/raw/gaze/*.json.gz
```

Both scripts are read-only and use your local `wrangler` login. Names are
exported separately to `data/private/identity.json` (gitignored) and never enter
the analysis dataset.

## Notes

- D1 stores structured data, the full report JSON and compressed raw gaze by
  default; R2 is optional when the binding is enabled.
- The Worker does not expose a public database endpoint; only `/submit`,
  `/health` and the token-protected `/import`.
- Rate limiting is delegated to Cloudflare (WAF/rate-limit rules) and to the
  one-report-per-participant uniqueness constraint.
