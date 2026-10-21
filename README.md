<div align="center">

<img src="https://arditceno.github.io/Neuro-Cognitive-Information-Design/assets/logo.png" alt="NCID" height="96" />

# Neuro-Cognitive Information Design

**How does layout change what the mind understands? An eye-tracking and biometric study across 12 professions and 3 levels of expertise.**

[![Deploy](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/deploy-pages.yml)
[![CI](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/ci.yml/badge.svg)](https://github.com/ArditCeno/Neuro-Cognitive-Information-Design/actions/workflows/ci.yml)

[![Live site](https://img.shields.io/badge/Live-arditceno.github.io%2FNeuro--Cognitive--Information--Design-55BF5D?style=for-the-badge&logo=githubpages&logoColor=white)](https://arditceno.github.io/Neuro-Cognitive-Information-Design/)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Google Apps Script](https://img.shields.io/badge/Apps_Script-4285F4?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![Supabase](https://img.shields.io/badge/Supabase_(optional)-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-Proprietary-FF6E42?style=flat-square)](LICENSE)

</div>

---

## Gallery

<table>
  <tr>
    <td width="50%"><img src="assets/screenshots/landing.jpg" alt="Landing page" width="100%" /></td>
    <td width="50%"><img src="assets/screenshots/registration.png" alt="Participant details" width="100%" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Landing page</sub></td>
    <td align="center"><sub>Participant registration</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="assets/screenshots/setup.png" alt="Device setup" width="100%" /></td>
    <td width="50%"><img src="assets/screenshots/reading.png" alt="Reading screen with diagram" width="100%" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Camera setup and calibration</sub></td>
    <td align="center"><sub>Reading task (structured vs. compressed)</sub></td>
  </tr>
  <tr>
    <td colspan="2"><img src="assets/screenshots/admin.png" alt="Research dashboard" width="100%" /></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><sub>Researcher dashboard: 12 professions, A vs. B per module, live delivery</sub></td>
  </tr>
</table>

---

## The study in one paragraph

Each participant picks a profession and an expertise level, then reads the **same content in two layouts**: a **structured** version (clear hierarchy, generous spacing) and a **compressed** version (denser page). While they read, the study records **where they look** and **how well they understand**. No video is recorded or stored.

**Measured:** fixation duration (ms), saccadic regressions, time to first fixation (ms), comprehension accuracy (%), reading and task time (s), NASA-TLX workload, plus blink rate and head orientation (exploratory).

**Design:** within-subjects, **counterbalanced A/B** (four sequences), a **separate quiz for each format**, and **NASA-TLX after every module**.

## The 12 professions

Law · Medicine · Nursing · Electrical engineering · Software · Biology · Chemistry · Pedagogy · Finance · Business · Culinary · Biotechnology

Each profession has **3 levels** (beginner, intermediate, advanced) and **3 modules**, giving **108 modules** in both **A and B**, in **EN and AL**, with **648 quiz items**.

## How a session works

```
Consent → Participant details → Camera + calibration → Read three modules (A/B)
        → Quiz per format → NASA-TLX → one report emailed to the researcher
```

The camera is **required** for eye tracking. The study runs in the browser, on desktop or phone (Chrome, Edge or Safari), and needs about **10–15 minutes**.

---

## Quick start (local)

```bash
npx serve .
```

Open `http://localhost:3000/`. The camera needs `http://` or `https://`, not a local file.

- `study.html?mock=1` — simulated run (no webcam), useful for development
- `study.html?calib=1` — calibration only, shows the measured accuracy in pixels
- `admin.html?demo=1` — dashboard preview with sample data (no login, no real data)

## Researcher dashboard

Open `/admin.html` and sign in with the owner email, a password, and a **6-digit code sent by email**. The dashboard reads the sessions from the mailbox and shows:

- **5 stat cards** — records, participants, completed tests, average comprehension, professions at target
- **12 profession cards** (2 columns) with progress rings, participants, average comprehension, **calibration accuracy**, and a **mini A-vs-B chart** per module
- **Detail drawer** — full A-vs-B chart, session table with calibration accuracy, and each participant's answers, NASA-TLX and biometrics
- search by name / ID, CSV export, and a labelled **demo mode**

## Email delivery

Every finished session is emailed to `arditceno82@gmail.com` as an HTML table — **one email per participant, at the end** — using a free **Google Apps Script**. No server is required.

The email includes **name and surname, ID, profession, expertise, age**, session data, results per level and version, NASA-TLX, biometrics, and every answer.

Setup: paste [`email-setup/Code.gs`](email-setup/Code.gs) into a new Apps Script project, set `ADMIN_PASSWORD` (and optionally a `TOKEN` script property), then **Deploy → Web app → Execute as Me → Anyone**. Copy the `/exec` URL into `js/config.js` (`storage.submission.fallbackUrl`). Full steps: [`DEPLOY.md`](DEPLOY.md).

> Gmail requires a one-time authorization for `GmailApp` (used by the dashboard). Run `readMailbox` once in the editor and **Allow** the Gmail permission, then deploy a new version.

## Conference materials

For **KShSN-UT 2026** (University of Tirana):

- Hub (all materials in one link): https://arditceno.github.io/Neuro-Cognitive-Information-Design/conference/
- Extended abstract (A4, 2 pages), poster (A1) and a 10-slide deck (16:9), all with a **Download PDF** button.

## Data and privacy

The study runs in **email mode**: each finished session is emailed to the researcher; nothing is stored in a database by default. No video is stored, only gaze coordinates and timings linked to an anonymous ID. An optional name travels separately from the research payload. See [privacy.html](privacy.html) and [terms.html](terms.html).

An optional server path (Supabase + Edge Function with owner-only reads) is included for later use: apply [`supabase/security.sql`](supabase/security.sql) and deploy `supabase/functions/submit` (see [`DEPLOY.md`](DEPLOY.md)).

## Project layout

```
index.html                landing page (Home)
study.html                participant test (consent → reading → quiz → report)
study-info.html           what to expect, requirements, FAQ
admin.html                researcher dashboard (email + password + code)
privacy.html terms.html   legal pages
about.html methodology.html fields.html contact.html   public pages

materials/    216 documents (108 modules × A/B × EN/AL)
assets/
  diagrams/   108 on-topic SVG diagrams (one per module)
  photos/     5 approved real photos + CREDITS.md
  screenshots/ README gallery images
js/           application, eye-tracking, storage, report, visuals, admin
css/          landing, header, main, materials, admin
mediapipe/    FaceMesh assets for WebGazer
vendor/       heatmap.js, jsPDF, emailjs (local copies)
supabase/     security.sql + functions/submit (optional server path)
analysis/     Python: metrics, stats, figures, ncid_admin.py
email-setup/  Google Apps Script: submissions + admin API
conference/   abstract, poster, slides (print-ready)
scripts/      generators, screenshot capture and tests
```

## Docs and tests

- [`DEPLOY.md`](DEPLOY.md) — one-time backend setup and verification
- [`SECURITY.md`](SECURITY.md) — 20-point hardening checklist
- [`assets/photos/CREDITS.md`](assets/photos/CREDITS.md) — photo licences and authors

```bash
node scripts/test-all.mjs        # structure, materials, diagrams, config
node scripts/test-report.mjs     # end-to-end report with a named participant
node scripts/test-endpoint.mjs   # live Apps Script admin/submission API
node scripts/test-send.mjs desktop   # send a real test submission (or: phone)
node scripts/capture-screenshots.mjs # regenerate the README gallery
```

**Current status:** 2 595 + 88 assertions passing, CI and Pages deploy green.

## Deployment

- **Hosting:** GitHub Pages. The workflow `.github/workflows/deploy-pages.yml` publishes on every push to `main`. In Settings → Pages choose **GitHub Actions** (or a branch deploy of `main` / root). The repository must be **public** on a free account.
- **CI:** `.github/workflows/ci.yml` checks the JavaScript, runs the tests and compiles the Python analysis.
- **No build step** is required.

## Security

1. The Apps Script project holds the admin password and sends the code; the email token lives there too.
2. The dashboard requires the owner email, the password, and a **6-digit code**; codes expire and are rate limited.
3. The browser bundle contains only the publishable Apps Script endpoint — no service keys.
4. Optional server path: run [`supabase/security.sql`](supabase/security.sql) and deploy `supabase/functions/submit` (owner-only reads, per-IP rate limit).

See [`SECURITY.md`](SECURITY.md) for the full checklist and known limits of GitHub Pages.

## Analysis (Python)

```bash
python -m pip install -r analysis/requirements.txt
python analysis/fetch_supabase.py --output analysis/raw
python analysis/clean.py --input analysis/raw --output analysis/data/processed

# email-mode admin report (searchable by name / ID)
python analysis/ncid_admin.py --user arditceno82@gmail.com --find "Ardit"
```

---

<div align="center">

**Copyright 2026 Ardit Ceno. All rights reserved.** · [arditceno1@gmail.com](mailto:arditceno1@gmail.com) · [LinkedIn](https://www.linkedin.com/in/ardit-ceno-a674b5307/)

</div>
