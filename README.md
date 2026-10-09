# Neuro-Cognitive Information Design (NCID)

> Measuring digital readability with **eye-tracking and biometrics** — across
> **Law, Finance, Business, Health and Software** — using only a webcam.

A browser-based A/B study that replaces subjective judgement ("I like this
layout") with objective biometric evidence: gaze fixations, regressions,
time-to-first-fixation, task time and comprehension accuracy.

**Proprietary — Copyright (c) 2026 Ardit Ceno. All rights reserved.** See [LICENSE](LICENSE).

---

## At a glance

| | |
|---|---|
| **Design** | Within-subjects · each participant reads **both A and B** of the same facts |
| **Coverage** | 5 fields × 2 versions = 10 materials · 3 of 5 modules per session |
| **Hypotheses** | H1 fixations/regressions · H2 speed/accuracy · H3 memory retention |
| **Stack** | Static front-end (HTML/CSS/JS) · Spring Boot backend · Supabase · Python analysis |
| **Privacy** | No video stored · anonymous ID only · GDPR (EU region) |
| **Deploy** | GitHub Pages (front-end) · Render/Docker (backend) |

## Contents
1. [Overview](#1-overview)
2. [Quick start](#2-quick-start)
3. [Architecture](#3-architecture)
4. [Project structure](#4-project-structure)
5. [Study design](#5-study-design)
6. [Configuration](#6-configuration)
7. [Data model](#7-data-model)
8. [Privacy & GDPR](#8-privacy--gdpr)
9. [Deploy the front-end (GitHub Pages)](#9-deploy-the-front-end-github-pages)
10. [Backend & data collection](#10-backend--data-collection)
11. [Admin dashboard](#11-admin-dashboard)
12. [Analysis (Python)](#12-analysis-python)
13. [Roles](#13-roles)
14. [Risk register](#14-risk-register)
15. [Development](#15-development)

---

## 1. Overview

For each field, two versions of the **same information** are created — only the
presentation changes:

| Field | Version A (traditional) | Version B (optimised) | Key question |
|-------|-------------------------|------------------------|--------------|
| Law | 6-line sentences, Latin terms | Plain Language + headings | Fewer fixations & re-reads? |
| Finance | Dense P&L number table | Data-storytelling chart + KPIs | Anomalies spotted faster? |
| Business | Two-page long-text report | Executive summary cards + bullets | Higher retention? |
| Health | Unstructured clinical chart | SOAP / colour-coded triage | Faster critical decision? |
| Software | Deeply nested `if/else` | Guard clauses | Fewer eye regressions? |

## 2. Quick start

```bash
# serve the site locally (camera needs http:// or https://, not file://)
npx serve .            # or: python -m http.server 8080
```

| Page | URL |
|------|-----|
| Landing | `http://localhost:3000/` |
| Participant test | `http://localhost:3000/study.html` |
| Admin dashboard | `http://localhost:3000/admin.html` |

Use **Chrome or Edge** (best WebGazer + MediaPipe support). Append `?mock=1` to
`study.html` to run the whole flow with a **simulated gaze trace** (no webcam) —
ideal to validate the pipeline and the Python analysis.

## 3. Architecture

| Layer | Responsibility |
|-------|----------------|
| **Participant app** | jsPsych (timeline, quiz), WebGazer.js (gaze `x, y`), MediaPipe Face Mesh (blink rate, head pose), A/B stimuli in HTML |
| **Data collection** | Timestamped logger, local buffer against loss (localStorage), anonymous ID, JSON export |
| **Backend (optional)** | Spring Boot API (`/backend`) → Supabase (PostgreSQL); encrypted storage; quality stats (`/api/stats`) |
| **Analysis** | Python: 01 cleaning · 02 metrics & AOI · 03 statistics · 04 figures & heatmap |

**Tools:** WebGazer.js · MediaPipe Face Mesh · jsPsych · Heatmap.js · Spring Boot ·
Supabase (PostgreSQL) · Python (pandas, scipy, statsmodels) · OSF / G\*Power /
NASA-TLX · MouseView.js (plan B).

## 4. Project structure

```
index.html                 Home (full-bleed hero, EN/AL)
about.html                 About — premise, value, quote
methodology.html           Methodology — A/B, hypotheses, metrics, flow
fields.html                Fields — the five fields (A vs B)
contact.html               Contact — author, email, license
study.html                 Participant test app
admin.html                 Researcher dashboard
assets/logo.png            Logo used in the header + favicon (transparent PNG)
assets/hero.jpg            Full-bleed hero photo
css/landing.css            Landing / shared page styles
css/main.css, materials.css   Participant app + stimulus document styles
js/site.js                 Shared header (active link) + footer + language switch
js/config.js               5 field protocols, quiz items, study parameters, CDN
js/i18n.js                 Albanian / English strings
js/app.js                  Flow controller (registration → calibration → modules → save)
js/calibration.js          9-point calibration + accuracy
js/eyetracking.js          WebGazer + mock + mouse modes, gaze sampling
js/mouseview.js            Plan-B mouse-tracking
js/biometrics.js           MediaPipe blink rate + head pose (exploratory)
js/aoi.js                  Fixation / regression / TTFF engine
js/stimuli.js              Material loader + AOI extraction ([data-aoi])
js/runner.js               Quiz + NASA-TLX (jsPsych primary, DOM fallback)
js/schema.js               UML class-model export assembler + readability
js/storage.js              Local buffer, JSON export, backend/Supabase adapters
js/heatmap.js              Heatmap.js researcher view
js/research.js             Content-parity + AOI inspector + quality dashboard
materials/                 20 files: 5 fields × A/B × AL/EN
data/session.schema.json   Export JSON schema
backend/                   Spring Boot API (Java 17) → Supabase/PostgreSQL
analysis/                  Python pipeline (see analysis/README.md)
render.yaml                One-click backend hosting blueprint
.github/workflows/         GitHub Actions (deploy to Pages)
LICENSE                    Proprietary license
```

## 5. Study design

```
[1 Consent] → [2 Calibrate 9 points] → [3 Read A & B + eye-tracking]
   → [4 Quiz + NASA-TLX] (×3 modules) → [5 Save anonymous JSON + debrief]
```

- **Counterbalancing:** each participant reads both versions; presentation order
  is balanced across sessions (Latin-square style).
- **Quality control:** if calibration error ≥ **150 px**, the 9-point routine
  repeats automatically (`calibrationMaxAttempts`); if it still fails, the
  session switches to **MouseView.js** mouse-tracking (plan B) and is flagged.
- **Metrics:** Fixation Duration (ms) · Saccadic Regressions · Time-to-First-
  Fixation (ms) · Accuracy Score (%) · Task Completion Time (s) · Reading Time (s)
  · NASA-TLX · blink rate & head pose *(exploratory)*.

## 6. Configuration

Study parameters live in [`js/config.js`](js/config.js):

```js
modulesPerSession: 3      // rotated from 5 fields
design: "within"          // each participant reads both A and B
quizPerDoc: 8             // 8–10 items per field
nasaTlx: "perModule"      // NASA-TLX after each module
useJsPsych: true          // jsPsych v7 primary, DOM auto-fallback
calibrationThresholdPx: 150
calibrationMaxAttempts: 2
mouseFallback: true       // switch to MouseView.js if calibration fails
```

Private values (backend / Supabase keys) go in **`js/config.local.js`**
(gitignored) — see `js/config.local.example.js`.

## 7. Data model

`Participant → Session → Modules → Trials → Responses / QuizItems / GazeSamples`.
See [`data/session.schema.json`](data/session.schema.json).

Two files per session:
- `session_<ID>.json` — summary (participant, session, modules, metrics, quiz)
- `gaze_<ID>.json` — raw `gaze_sample { t_ms, x, y, dx, dy, blink, head_pose }`

## 8. Privacy & GDPR

- **No video is stored** — only gaze coordinates `(x, y, t)` and aggregate biometrics.
- **Anonymous ID only**; the exported dataset never contains names or emails.
- Local-first by default; the backend / Supabase (EU region) is opt-in.
- Participants may **withdraw at any time** (clears the local buffer); admins can
  delete a session (`DELETE /api/sessions/{id}`).
- Secrets and participant data are **gitignored** — never committed.

## 9. Deploy the front-end (GitHub Pages)

1. Push to `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
   publishes on every push. Live URL:
   `https://<user>.github.io/Neuro-Cognitive-Information-Design/`.

## 10. Backend & data collection

To collect sessions over the internet, run the **Spring Boot backend** against
**Supabase Postgres** and give its URL to the front-end as a secret.

**1 · Supabase** (EU region) — run:
```sql
create table sessions (
  id         uuid primary key default gen_random_uuid(),
  id_anonim  text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);
alter table sessions enable row level security;
create policy "anon insert" on sessions for insert to anon with check (true);
```

**2 · Backend** — deploy `/backend` (Docker / Render / Railway, see
[`backend/README.md`](backend/README.md)) with env vars `SUPABASE_DB_URL`,
`SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`, `NCID_ADMIN_TOKEN`,
`NCID_ALLOWED_ORIGINS`.

**3 · Front-end secret** — add repository secret **`BACKEND_URL`** (Settings →
Secrets and variables → Actions). The deploy workflow injects it into
`js/config.local.js` at build time; secrets never enter the repository.

*Alternatives:* direct **`SUPABASE_URL` + `SUPABASE_ANON_KEY`** (REST) or
**`SUBMISSION_URL`** (any JSON endpoint).

## 11. Admin dashboard

Open **`admin.html`**. Enter the backend URL and the `X-Admin-Token`; the token
is kept only in the current tab (sessionStorage). Features: session-quality
stats (`/api/stats`), paginated/searchable table, full-session JSON view, CSV
export, and delete (GDPR withdrawal).

## 12. Analysis (Python)

See [`analysis/README.md`](analysis/README.md). Pipeline:
`fetch_supabase.py → clean.py → metrics.py → stats.py → figures.py`.

```bash
export DATABASE_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres"
python analysis/fetch_supabase.py --output analysis/raw
```

## 13. Roles

- **Participant** — consent, calibrate, read A/B, quiz + NASA-TLX.
- **Researcher** — create A/B stimuli + AOI, content-parity review, analyse, publish.
- **Field experts** — review content parity per field.
- **Ethics committee** — ethics approval + pre-registration.

## 14. Risk register

| Risk | Prob. | Impact | Mitigation |
|------|-------|--------|------------|
| Low WebGazer accuracy | High | High | AOI measurement; primary metrics are time & accuracy; MouseView.js plan B |
| Calibration failure | Medium | High | Clear instructions, automatic re-calibration, 20–30% recruitment buffer |
| Too few participants | Medium | High | Within-subjects, early recruitment, balanced module rotation |
| Compromised A/B parity | Medium | High | Same facts, length/readability control, expert review |
| Overstated claims | Medium | Medium | "Indicator" wording, NASA-TLX, declared limitations |
| Ethics delay / data loss | Medium | High | Ethics submission week 2; local buffer + daily backup |

## 15. Development

```bash
node --check js/<file>.js     # syntax check
```

Validate a full run in **mock mode** (`study.html?mock=1`) before collecting real
data.

---

**Contact:** arditceno1@gmail.com · **LinkedIn:** [ardit-ceno](https://www.linkedin.com/in/ardit-ceno-a674b5307/) · **License:** proprietary, © 2026 Ardit Ceno.
