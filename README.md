<div align="center">

# Neuro-Cognitive Information Design

**An eye-tracking and biometric study of document readability across law, finance, business, health and software.**

<br>

[![Deploy to GitHub Pages](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml)
[![CI](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/ci.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/ci.yml)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-Proprietary-FF6E42?style=for-the-badge)](LICENSE)

</div>

---

## Links

Base URL: `https://arditceno.github.io/Neuro-Cognitive-Information-Design/`

## Overview

Each participant picks their profession and reads the same documents in two
versions: a traditional one (A) and an optimised one (B), at three difficulty
levels (very easy, medium, hard). While they read, the study records:

- fixation duration (ms)
- saccadic regressions (re-reads)
- time to first fixation (ms)
- comprehension accuracy (%)
- task and reading time (s)
- NASA-TLX (perceived workload)
- blink rate and head orientation (exploratory)

No video is recorded. Only gaze coordinates and timings are stored, linked to an
anonymous ID.

## Quick start (local)

```bash
npx serve .
```

Open `http://localhost:3000/`. The camera requires `http(s)`, not `file://`.
Use Chrome or Edge. Add `?mock=1` to `study.html` to run with a simulated gaze
trace (no webcam).

## Structure

```
index / about / methodology / fields / contact .html   public pages
study.html                                             participant test
admin.html                                             researcher panel
privacy.html · terms.html                              legal pages
materials/          A/B documents for each profession and level
js/                 app, config, eye-tracking, aoi, schema, storage, visuals
css/                landing, header, main, materials
mediapipe/          FaceMesh assets (WebGazer)
vendor/             heatmap.js, jsPDF, emailjs, supabase-js (local copies)
backend/            Spring Boot API (Java 17) into Supabase or PostgreSQL
analysis/           Python: fetch, clean, metrics, stats, figures
```

## Data collection

- Sessions are stored in **Supabase** (PostgreSQL).
- The admin panel reads them directly, grouped by profession, with a map of
  tests versus comprehension and a gaze heatmap per session.
- Optional: the Spring Boot backend (`backend/`) can be deployed for API access
  and email delivery.

Required Supabase policy (SQL editor):

```sql
alter table sessions enable row level security;

create policy "anon insert" on sessions for insert to anon with check (true);

-- temporary, so the admin panel can read without login (remove later)
create policy "temp read" on sessions for select to anon using (true);
```

## Deployment

- Hosting: GitHub Pages, published automatically by `.github/workflows/deploy-pages.yml`
  on every push to `main` (Settings -> Pages -> Source: GitHub Actions).
- Continuous integration: `.github/workflows/ci.yml` checks the JavaScript and
  the Python analysis.
- No build step is required for the website.

## Analysis (Python)

```bash
python -m pip install -r analysis/requirements.txt
python analysis/fetch_supabase.py --output analysis/raw
python analysis/clean.py --input analysis/raw --output analysis/data/processed
```

## Privacy

No video is stored, only gaze coordinates and timings, tied to an anonymous ID.
See [privacy.html](privacy.html) and [terms.html](terms.html).

---

<div align="center">

**Copyright 2026 Ardit Ceno. All rights reserved.** · [arditceno82@gmail.com](mailto:arditceno82@gmail.com) · [LinkedIn](https://www.linkedin.com/in/ardit-ceno-a674b5307/)

</div>
