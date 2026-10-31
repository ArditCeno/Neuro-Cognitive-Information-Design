# Low-level design (LLD)

## API

### `POST /submit`

Request:

```json
{
  "submission_id": "uuid or legacy_id",
  "summary": {
    "kind": "session",
    "participant": { "id_anonim": "USR_1", "mosha": 22, "profesioni": "Law", "niveli_i_ekspertizës": "Beginner" },
    "session": { "session_number": 1, "kalibrimi_px": 80, "kohëzgjatja_min": 30, "gjuha": "al", "metoda": "eyetracking" },
    "modules": []
  },
  "identity": { "emri_mbiemer": "Name" },
  "gaze": [{ "t_ms": 0, "x": 1, "y": 2 }]
}
```

Responses:

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"ok":true,"email":"sent"}` | stored and emailed |
| 200 | `{"ok":true,"duplicate":true}` | already stored; no email |
| 200 | `{"ok":true,"email":"pending"}` | stored; email retry queued |
| 400 | `{"ok":false,"error":"..."}` | validation failed |
| 413 | body too large | > 25 MB |
| 500 | database error | safe to retry with same id |

### `POST /import`

`Authorization: Bearer <IMPORT_TOKEN>`.
Body: `{ "sessions": [ ... ] }`. Rows are inserted with
`source='backfill'`, `email_status='sent'`; duplicates are skipped.

### `GET /export/sessions`

`Authorization: Bearer <EXPORT_TOKEN>`. Returns payloads, email/gaze status and
`gaze_key`. Names are **not** included.

### `GET /export/identity`

`Authorization: Bearer <EXPORT_TOKEN>`. Returns `id_anonim`, `full_name`.
Write to `data/private/`, never to the analysis dataset.

### `GET /export/gaze/<key>`

`Authorization: Bearer <EXPORT_TOKEN>`. Streams the gzip object from R2.

### `GET /health`

`{"ok":true,"service":"ncid-api","version":"1.0.0"}`.

## Idempotency algorithm

```
upsert participants(id_anonim)
upsert identity(id_anonim)
INSERT OR IGNORE sessions(submission_id, ...)
if changes == 0:
    return duplicate
insert modules -> module_uid
insert trials -> trial_uid
batch insert responses + module_tlx
if error: deleteSession(submission_id); return 500
store gaze in R2; update gaze_status
send email; update email_status
```

`submission_id` is the primary key; `sessions.id_anonim` is UNIQUE (one report
per participant). The Apps Script `sent_<submission_id>` marker is the second
layer.

## Email retry

- On submission: `email_status='pending'`, `email_attempts=0`.
- Success: `sent`, `email_sent_at=now`.
- Failure: attempts +1; next attempt in 5 min; after 5 attempts → `failed`.
- Cron query: `v_email_queue` equivalent (pending and due).
- Each attempt appends to `email_log`.

## Gaze

- Native WebGazer rate; no upsampling.
- Cap: 250 000 samples per session; body cap 25 MB.
- Stored as gzip JSON in R2: `gaze/<submission_id>.json.gz`.
- D1: `gaze_objects(submission_id, r2_key, sample_count, duration_ms, bytes, sha256, compressed)`.
- If R2 fails, the session is kept and `gaze_status='failed'`.

## Schema

Canonical: [`sql/0001_init.sql`](../sql/0001_init.sql). Wrangler applies it as a
migration from `worker/wrangler.toml` (`migrations_dir = "../sql"`).

Key tables:

| Table | Key | Purpose |
|---|---|---|
| `participants` | `id_anonim` | demographics |
| `identity` | `id_anonim` | name (private) |
| `sessions` | `submission_id` | report + email/gaze status |
| `modules` | `module_uid` | module order, preference |
| `trials` | `trial_uid` | A/B metrics |
| `responses` | `response_uid` | answers |
| `module_tlx` | `module_uid` | NASA-TLX |
| `gaze_objects` | `submission_id` | R2 pointer + metadata |
| `email_log` / `audit_log` / `deletion_log` | — | traceability |

Views: `v_session_summary`, `v_trial_metrics`, `v_accuracy_by_format`,
`v_tlx_by_module`, `v_email_queue`, `v_gaze_summary`, `v_data_quality`.

## Configuration

- `worker/wrangler.toml`: D1 + R2 bindings, `APPS_SCRIPT_URL`, `ALLOWED_ORIGIN`,
  Cron.
- Secrets: `IMPORT_TOKEN`, `EXPORT_TOKEN`, optional `APPS_SCRIPT_TOKEN`.
- Client: `js/config.js` → `storage.submission.url` = Worker `/submit`;
  `includeGaze: true`; Apps Script remains the fallback.

## Testing

- `node scripts/test-worker.mjs` — validation, caps, email parsing, mapping.
- `node scripts/test-all.mjs` — structure/content/idempotency guards.
- Local: `npx wrangler dev`, `npx wrangler d1 execute ncid-db --local`.
- Duplicate: two POSTs with the same `submission_id` → one row, one email.

## Operations

- Daily: `node scripts/export_d1.mjs`, `node scripts/export_r2.mjs`.
- Backup: export + D1 Time Travel (if available).
- Deletion: delete `sessions` (cascade for related rows) + R2 key; log in
  `deletion_log`.
- Monitoring: `wrangler tail`, `email_status='pending'` count, `gaze_status='failed'`.
