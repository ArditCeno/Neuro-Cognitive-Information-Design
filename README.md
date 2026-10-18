<div align="center">

<img src="https://arditceno.github.io/Neuro-Cognitive-Information-Design/assets/logo.png" alt="NCID" height="90" />

# Neuro-Cognitive Information Design

**An eye-tracking and biometric study of document readability across 12 professions and 3 expertise levels.*

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
for a simulated run, or `?calib=1` to run only the camera calibration and read
the measured accuracy (use this to test a phone).

## Docs and tests

- [`DEPLOY.md`](DEPLOY.md) - one-time backend setup and end-to-end verification
- [`SECURITY.md`](SECURITY.md) - 20-point hardening checklist
- Tests: `node scripts/test-all.mjs`, `node scripts/test-report.mjs`,
  `node scripts/test-endpoint.mjs` (live Apps Script admin/submission API)
- Admin (email mode, Python): `python analysis/ncid_admin.py` reads the mailbox
  and builds a searchable report by name / ID (`--find "Ardit"`)

## The researcher panel

Open the Admin tab and sign in with the owner email, a password and a 6-digit
code sent by email. It reads the sessions from the mailbox and shows:

- a summary per profession, with each participant's answers
- a **profession diagram**: pick a profession to compare average comprehension
  per module (A vs B)
- a **map**: X = tests completed, Y = average comprehension (%), one point per profession
- full session view: node map, hashmap and the raw JSON
- search by name / ID and CSV export

## Email the results as a table

Every finished session is emailed to `arditceno82@gmail.com` as an HTML table,
using a free **Google Apps Script** (no third-party account). The browser posts
straight to the Apps Script web app; no server is required. Each session is
emailed once, at the end.

The email contains **Name and surname, ID, Profession, Expertise, Age**, the
session data, the results per level and version, NASA-TLX, biometrics, and every
answer.

Setup: open https://script.google.com and paste [`email-setup/Code.gs`](email-setup/Code.gs).
Add a Script property `TOKEN` (the value the study sends) and set the admin
password, then **Deploy, Web app, Execute as Me, access Anyone**. Copy the URL
ending in `/exec` into `js/config.js` (`storage.submission.fallbackUrl`). Full
steps: [`DEPLOY.md`](DEPLOY.md).

## Data and privacy

The study runs in **email mode**: each finished session is emailed to the
researcher; nothing is stored in a database by default. No video is stored, only
gaze coordinates and timings linked to an anonymous ID. An optional name travels
separately from the research payload. See [privacy.html](privacy.html) and
[terms.html](terms.html).

An optional server path (Supabase + Edge Function with owner-only reads) is
included for later use: apply [`supabase/security.sql`](supabase/security.sql)
and deploy `supabase/functions/submit` (see [`DEPLOY.md`](DEPLOY.md)).

## Project layout

```
index.html              one-page site: Home, Test and Admin tabs
study.html              participant test
study-info.html         what to expect, requirements, FAQ, share/QR
admin.html              researcher panel (email + password + code)
privacy.html terms.html legal pages
materials/    216 A/B documents (108 modules, EN + AL)
assets/       logo, hero, 108 diagrams (assets/diagrams), figures
js/           application, config, eye-tracking, storage, visuals, report
css/          landing, header, main, materials
mediapipe/    FaceMesh assets for WebGazer
vendor/       heatmap.js, jsPDF, supabase-js (local copies)
supabase/     security.sql + functions/submit (optional server write path)
analysis/     Python: metrics, stats, figures and ncid_admin.py (admin report)
email-setup/  Google Apps Script: submissions + admin login + data
scripts/      generators and tests (gen-diagrams, test-all, test-endpoint)
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

Admin report from the mailbox (email mode):

```bash
python analysis/ncid_admin.py --user arditceno82@gmail.com --find "Ardit"
```

---

<div align="center">

**Copyright 2026 Ardit Ceno. All rights reserved.** · [arditceno82@gmail.com](mailto:arditceno82@gmail.com) · [LinkedIn](https://www.linkedin.com/in/ardit-ceno-a674b5307/)

</div>

## Security (required before sharing the link)

1. In the Apps Script project, add Script property `TOKEN` (the value the study
   sends) and set the admin password, then **Deploy, Web app** (Execute as Me,
   access Anyone). Copy the `/exec` URL into `js/config.js`.
2. The admin panel requires the owner email, the password and a 6-digit code sent
   by email; codes expire and are rate limited.
3. Optional server path: run [`supabase/security.sql`](supabase/security.sql) and
   deploy `supabase/functions/submit` (owner-only reads, per-IP rate limit).

Notes:
- The Apps Script URL and token live in the client `js/config.js` (email mode);
  keep `ADMIN_PASSWORD` only inside the Apps Script project.
- No research database is used in email mode; nothing is stored on a server.
- The legal pages are [privacy.html](privacy.html) and [terms.html](terms.html).

## Diagrams (108)
Each module shows one accurate, on-topic SVG diagram in `assets/diagrams/`, so
every A/B document has exactly one image. Regenerate with:
```bash
node scripts/gen-diagrams.mjs
git add -A && git commit -m "Update diagrams" && git push
```
The script writes `assets/diagrams/<field>_<level>_mN.svg` and injects it into
the matching module (A and B, EN and AL).
