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

Open `http://localhost:3000/`. The camera needs `http://` or `https://`, not a
local file. The study runs on any device (desktop, laptop, tablet or phone);
Chrome or Edge are recommended for webcam eye-tracking, and if no camera is
available it falls back to touch / mouse tracking. Add `?mock=1` to `study.html`
for a simulated run.

## Docs and tests

- [`DEPLOY.md`](DEPLOY.md) - one-time backend setup and end-to-end verification
- [`SECURITY.md`](SECURITY.md) - 20-point hardening checklist
- Tests: `node scripts/test-all.mjs` and `node scripts/test-report.mjs`

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

The browser never sees the Apps Script URL: it posts to the Supabase Edge
Function `submit`, which owns the secret, the database insert and the email.

Short version:

1. Open https://script.google.com, **New project**, paste the contents of
   [`email-setup/Code.gs`](email-setup/Code.gs).
2. **Deploy, New deployment, Web app**, Execute as **Me**, access **Anyone**.
3. Project Settings, **Script properties**, add **`TOKEN`** with a long random
   value.
4. Copy the URL that ends with `/exec` and set it on the function:

```bash
supabase functions deploy submit --no-verify-jwt
supabase secrets set APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
supabase secrets set APPS_SCRIPT_TOKEN="the-same-random-token"
```

## Data and privacy

Sessions are stored in **Supabase** (PostgreSQL). No video is stored, only gaze
coordinates and timings, linked to an anonymous ID. An optional name is kept in
a **separate identity table** and never enters the research payload. See
[privacy.html](privacy.html) and [terms.html](terms.html).

Apply the full schema and policies in the Supabase SQL editor:
[`supabase/security.sql`](supabase/security.sql). It creates `sessions`,
`participant_identity`, the `submission_id` dedupe index and the rate-limit
function, and gives read/delete access only to the owner account. Anonymous
clients cannot read or write the tables directly — the Edge Function does the
insert with the service role.

## Project layout

```
index.html              one-page site: Home, Test and Admin tabs
study.html              participant test
study-info.html         what to expect, requirements, FAQ, share/QR
admin.html              researcher panel with live results
privacy.html terms.html legal pages
about / methodology / fields / contact .html   public pages
materials/    A and B documents for each profession and level
assets/       logo, figures, og-image, study-info screenshots
js/           application, config, eye-tracking, storage, visuals, report
css/          landing, header, main, materials
mediapipe/    FaceMesh assets for WebGazer
vendor/       heatmap.js, jsPDF, emailjs, supabase-js (local copies)
supabase/     security.sql + functions/submit (Edge Function write path)
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

## Security (required before sharing the link)

1. In Supabase, SQL editor, run [`supabase/security.sql`](supabase/security.sql).
   It removes all anonymous read/write access and creates the rate-limit helper.
2. Create the owner account: Supabase, Authentication, Users, Add user
   (email `arditceno82@gmail.com` and a password). Only this account can read.
3. Deploy the write path: `supabase functions deploy submit --no-verify-jwt`
   and set `APPS_SCRIPT_URL` / `APPS_SCRIPT_TOKEN` as function secrets.
4. The admin panel requires the owner login (email and password).

Notes:
- No secret is committed: the Apps Script URL and token live only in the Edge
  Function secrets, and the token also in the Apps Script Script Properties.
- The Supabase publishable key in `js/config.js` is client-safe (RLS blocks it).
- The legal pages are [privacy.html](privacy.html) and [terms.html](terms.html);
  participants see requirements and FAQ on [study-info.html](study-info.html).

## Photos (36)
Place the study photos in `assets/photos/` using the exact names listed in
[`assets/photos/README.md`](assets/photos/README.md) (1600x1000, under ~300 KB,
free-licence sources, no sensitive data). Then run:
```bash
node scripts/apply-photos.mjs
git add -A && git commit -m "Add study photos" && git push
```
The script inserts each photo into the matching module (A and B, EN and AL).
