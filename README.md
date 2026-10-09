<div align="center">

# Neuro-Cognitive Information Design

**Measuring digital readability with eye-tracking and biometrics — using only a webcam.**

Law · Finance · Business · Health · Software

</div>

---

**NCID** is a browser-based A/B study. Each participant reads two versions of the
same document — a traditional one (A) and an optimised one (B) — while gaze,
timing and comprehension are measured. It replaces subjective opinion
("I like this layout") with objective evidence.

- **Live:** https://arditceno.github.io/Neuro-Cognitive-Information-Design/
- **Participant test:** `/study.html` · **Admin:** `/admin.html`
- **Stack:** HTML/CSS/JS · jsPsych · WebGazer · MediaPipe · Spring Boot · Supabase · Python
- **License:** proprietary, © 2026 Ardit Ceno

## Quick start

```bash
npx serve .          # camera needs http(s), not file://
```

Open the landing page → **Start Study**. Use **Chrome/Edge**. Append `?mock=1` to
`study.html` to run the flow with a simulated gaze trace (no webcam).

## The study

| Field | A (traditional) | B (optimised) |
|-------|-----------------|----------------|
| Law | Long clauses, Latin terms | Plain Language + headings |
| Finance | Dense P&L table | Chart + KPIs |
| Business | 2-page report | Executive summary cards |
| Health | Unstructured chart | SOAP / triage |
| Software | Nested `if/else` | Guard clauses |

**Flow:** consent → 9-point eye calibration → read A & B (3 of 5 fields,
counterbalanced) → quiz + NASA-TLX → anonymous save.

**Metrics:** fixation duration · saccadic regressions · time-to-first-fixation ·
accuracy · task & reading time · NASA-TLX · blink rate & head pose.

## Structure

```
index/about/methodology/fields/contact.html   public pages
study.html · admin.html                        participant test · researcher dashboard
materials/                                      5 fields × A/B × AL/EN
js/  (app, config, i18n, eye-tracking, aoi, schema, storage …)
css/  (landing, main, materials)
backend/   Spring Boot API → Supabase/PostgreSQL
analysis/  Python: clean → metrics → stats → figures
```

## Privacy

No video is stored — only gaze `(x, y, t)` and aggregate biometrics, tied to an
anonymous ID. Local-first by default; a participant can withdraw at any time.
Secrets and participant data are gitignored.

## Deploy & collect

1. **Pages** — Settings → Pages → Source: **GitHub Actions** (workflow included).
2. **Database** — Supabase (EU) table:
   ```sql
   create table sessions (
     id uuid primary key default gen_random_uuid(),
     id_anonim text not null, payload jsonb not null,
     created_at timestamptz not null default now());
   ```
3. **Backend** — deploy `backend/` (Render/Docker) with `SUPABASE_DB_URL`,
   `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`, `NCID_ADMIN_TOKEN`.
4. **Front-end secret** — add **`BACKEND_URL`** (Actions secrets). The deploy
   workflow injects it at build time; nothing secret is committed.

Details: [`backend/README.md`](backend/README.md) · [`analysis/README.md`](analysis/README.md).

## Analyze

```bash
export DATABASE_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres"
python analysis/fetch_supabase.py --output analysis/raw
python analysis/clean.py && python analysis/metrics.py && python analysis/stats.py
```

---

**Contact** — arditceno1@gmail.com · [LinkedIn](https://www.linkedin.com/in/ardit-ceno-a674b5307/)
