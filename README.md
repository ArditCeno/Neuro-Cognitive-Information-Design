<div align="center">

<img src="https://arditceno.github.io/Neuro-Cognitive-Information-Design/assets/logo.png" alt="NCID" height="90" />

# Neuro-Cognitive Information Design

**An eye-tracking and biometric study of document readability across law, finance, business, health and software.*

[![Deploy to GitHub Pages](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml)
[![CI](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/ci.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/ci.yml)

[![Live Site](https://img.shields.io/badge/Live-arditceno.github.io%2FNeuro--Cognitive--Information--Design-55BF5D?style=for-the-badge&logo=githubpages&logoColor=white)](https://arditceno.github.io/Neuro-Cognitive-Information-Design/)


[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-Proprietary-FF6E42?style=for-the-badge)](LICENSE)

</div>

---

## The study in one paragraph

Each participant chooses their profession and reads the same documents in two
versions: a traditional one (A) and an optimised one (B), at three difficulty
levels (very easy, medium, hard). While they read, the study records where they
look and how well they understand. No video is recorded.

**Measured:** fixation duration (ms), saccadic regressions, time to first
fixation (ms), comprehension accuracy (%), reading and task time (s), NASA-TLX
workload, and blink rate plus head orientation (exploratory).


## Quick start (local)

```bash
npx serve .
```

Open `http://localhost:3000/`. The camera works on `http` or `https`, not from a
local file. Use Chrome or Edge. Add `?mock=1` to `study.html` for a simulated
gaze run (no webcam).

## The researcher panel

Open the Admin tab. It reads the sessions from Supabase and shows:

- a summary per profession, with each participant's answers
- a **map**: X = tests completed, Y = average comprehension (%), one point per profession
- full session view: node map, hashmap and a gaze **heatmap**
- search by UUID, and CSV export

Results refresh live (Realtime, with a 15 second fallback).

## Email the results as a table

Every registration and every finished session can be emailed to
`arditceno82@gmail.com` as an HTML table, using a free **Google Apps Script**
(no third-party account).

The email contains **Name and surname, ID, Profession, Expertise, Age**, the
results per level and version, and every answer.

Full code and steps: [`email-setup/`](email-setup) (see `Code.gs` and its README).

Short version:

1. Open https://script.google.com, **New project**, paste the contents of
   [`email-setup/Code.gs`](email-setup/Code.gs).
2. **Deploy, New deployment, Web app**, Execute as **Me**, access **Anyone**.
3. Copy the URL that ends with `/exec`.
4. Add it in GitHub as the secret **`SUBMISSION_URL`** (Settings, Secrets and
   variables, Actions). The deploy workflow injects it. For local use, put it in
   `js/config.local.js`.

## Data and privacy

Sessions are stored in **Supabase** (PostgreSQL). No video is stored, only gaze
coordinates and timings, linked to an anonymous ID. See
[privacy.html](privacy.html) and [terms.html](terms.html).

Required Supabase policy (SQL editor):

```sql
alter table sessions enable row level security;

create policy "anon insert" on sessions for insert to anon with check (true);

-- temporary, so the admin panel can read without login (remove later)
create policy "temp read" on sessions for select to anon using (true);
```

## Project layout

```
index.html              one-page site: Home, Test and Admin tabs
study.html              participant test
admin.html              researcher panel with live results
privacy.html terms.html legal pages
about / methodology / fields / contact .html   public pages
materials/    A and B documents for each profession and level
js/           application, config, eye-tracking, storage, visuals, report
css/          landing, header, main, materials
mediapipe/    FaceMesh assets for WebGazer
vendor/       heatmap.js, jsPDF, emailjs, supabase-js (local copies)
backend/      Spring Boot API (optional)
analysis/     Python: fetch, clean, metrics, stats, figures
email-setup/  Google Apps Script to email results
```

## Deployment

- Hosting: GitHub Pages. Publish with `.github/workflows/deploy-pages.yml` on
  every push to `main`. In Settings, Pages, choose **Deploy from a branch**
  (branch `main`, folder `/`) or **GitHub Actions**. On a free account the
  repository must be public.
- Continuous integration: `.github/workflows/ci.yml` checks the JavaScript and
  the Python analysis.
- No build step is required.

## Analysis (Python)

```bash
python -m pip install -r analysis/requirements.txt
python analysis/fetch_supabase.py --output analysis/raw
python analysis/clean.py --input analysis/raw --output analysis/data/processed
```

---

<div align="center">

**Copyright 2026 Ardit Ceno. All rights reserved.** · [arditceno82@gmail.com](mailto:arditceno82@gmail.com) · [LinkedIn](https://www.linkedin.com/in/ardit-ceno-a674b5307/)

</div>
