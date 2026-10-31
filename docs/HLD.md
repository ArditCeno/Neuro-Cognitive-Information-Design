# High-level design (HLD)

## Purpose

Collect eye-tracking study sessions reliably, store them in a free SQL database,
email the full report to the researcher, and export clean data for local
analysis — with one email per participant.

## Context

```
Participant browser
  │  HTTPS (JSON)
  ▼
Cloudflare Worker  ──►  Cloudflare D1 (SQL + compressed gaze)
  │                        │
  ├──► R2 (optional)       └── /export ──► analysis/ (local)
  └──► Google Apps Script (email)
```

Components:

| Component | Role | Cost |
|---|---|---|
| GitHub Pages | Static site (study, admin, docs) | Free |
| Cloudflare Worker | Validation, idempotency, orchestration, CORS, export | Free tier |
| D1 | Structured SQL records, full report JSON, compressed gaze | Free tier |
| R2 | Raw gaze objects (gzip), optional | Free tier |
| Google Apps Script | Email delivery + mailbox admin | Free |
| Local analysis (`analysis/`) | Cleaning, metrics, statistics, figures | Free |

## Data flow

1. Browser finishes a session and POSTs `/submit` with `submission_id`,
   `summary`, `identity` and `gaze`.
2. Worker validates size, identifiers and sample count.
3. Worker upserts `participants` and `identity`, then inserts `sessions` with
   `INSERT OR IGNORE` on `submission_id`.
4. If the insert changed 0 rows → duplicate; no email, no second row.
5. Worker inserts modules, trials, responses and module-level NASA-TLX.
6. Worker gzips the gaze array and stores it in R2 when the binding exists;
   without R2 it stores the compressed blob in D1 (`gaze_objects.data_gz`).
7. Worker calls Apps Script with the clean summary and the name; Apps Script
   emails the report. Its own `sent_<submission_id>` marker is a second guard.
8. On email failure, `email_status='pending'` and a Cron Trigger retries every
   5 minutes (max 5 attempts).
9. Local export reads D1 (`payload_json`, structured views, D1 gaze) and R2
   (gaze) when enabled.

## Trust boundaries

- The browser is untrusted: size caps, identifier checks and duplicate rules run
  in the Worker.
- D1 (and R2 when enabled) are never exposed publicly; the Worker is the only
  write path.
- The export routes require `EXPORT_TOKEN`; the backfill route requires
  `IMPORT_TOKEN`.
- The admin password lives only in Apps Script Script Properties.
- Names are stored in a separate `identity` table; analysis exports exclude them.

## Free-tier limits

| Service | Limit | Study need |
|---|---|---|
| Workers | 100k requests/day | ~1 request/session |
| D1 | 5 GB, 5M reads/day, 100k writes/day | tiny |
| R2 | 10 GB, 1M writes/month | gaze dominates; still small at 120 sessions |
| Apps Script | ~100 emails/day (consumer) | okay if spread over days |

## Failure modes

| Failure | Behaviour |
|---|---|
| Duplicate click / retry | `submission_id` PK → one row, one email |
| Worker 5xx | Client falls back to Apps Script email; later backfill imports the email |
| R2 unavailable | Gaze is stored compressed in D1 (default); no data loss |
| Email fails | Row stays `pending`; Cron retries; Apps Script dedupes |
| D1 insert fails mid-way | Compensating delete; client can retry |

## Non-goals

- Real-time dashboards.
- Multi-tenant access.
- Storing video.
- Paid infrastructure.
